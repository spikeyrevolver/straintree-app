import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Download, CreditCard, FileText, Star, Zap, Shield, Crown } from 'lucide-react'

export default function PDFExportModal({ isOpen, onClose, familyTree }) {
  const [step, setStep] = useState('plans') // plans, payment, processing, success
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [paymentPlans, setPaymentPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    email: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchPaymentPlans()
    }
  }, [isOpen])

  const fetchPaymentPlans = async () => {
    try {
      const response = await fetch('/api/pdf/plans')
      const data = await response.json()
      if (data.success) {
        setPaymentPlans(Object.entries(data.plans).map(([key, plan]) => ({ ...plan, id: key })))
      }
    } catch (error) {
      console.error('Failed to fetch payment plans:', error)
      setError('Failed to load payment plans')
    }
  }

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan)
    setStep('payment')
  }

  const handlePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      // Create payment intent
      const intentResponse = await fetch('/api/pdf/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_type: selectedPlan.id,
          family_tree_id: familyTree.id
        })
      })

      const intentData = await intentResponse.json()
      if (!intentData.success) {
        throw new Error(intentData.error)
      }

      setStep('processing')

      // Simulate payment processing (in production, use Stripe Elements)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Confirm payment
      const confirmResponse = await fetch('/api/pdf/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_intent_id: intentData.payment_intent.id,
          family_tree_id: familyTree.id,
          plan_type: selectedPlan.id
        })
      })

      const confirmData = await confirmResponse.json()
      if (!confirmData.success) {
        throw new Error(confirmData.error)
      }

      setDownloadUrl(confirmData.download_url)
      setStep('success')

    } catch (error) {
      console.error('Payment failed:', error)
      setError(error.message || 'Payment failed. Please try again.')
      setStep('payment')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank')
    }
  }

  const resetModal = () => {
    setStep('plans')
    setSelectedPlan(null)
    setError(null)
    setDownloadUrl(null)
    setPaymentForm({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      name: '',
      email: ''
    })
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const renderPlansStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Choose Your PDF Export Plan</h3>
        <p className="text-gray-600">Select the plan that best fits your needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentPlans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              plan.id === 'premium' ? 'border-green-500 bg-green-50' : 'hover:border-green-300'
            }`}
            onClick={() => handlePlanSelect(plan)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  {plan.id === 'basic' ? (
                    <FileText className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Crown className="h-5 w-5 text-yellow-600" />
                  )}
                  <span>{plan.name}</span>
                </CardTitle>
                {plan.id === 'premium' && (
                  <Badge className="bg-green-600">Most Popular</Badge>
                )}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-gray-600 ml-1">one-time</span>
                </div>
                
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${
                    plan.id === 'premium' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {plan.id === 'basic' ? 'Get Basic PDF' : 'Get Premium PDF'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500">
        <Shield className="h-4 w-4 inline mr-1" />
        Secure payment processing • 30-day money-back guarantee
      </div>
    </div>
  )

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Complete Your Purchase</h3>
        <p className="text-gray-600">
          {selectedPlan?.name} - ${selectedPlan?.price}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Cardholder Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={paymentForm.name}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={paymentForm.email}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="4242 4242 4242 4242"
                value={paymentForm.cardNumber}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, cardNumber: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                placeholder="MM/YY"
                value={paymentForm.expiryDate}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, expiryDate: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                value={paymentForm.cvv}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, cvv: e.target.value }))}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center">
            <span className="font-medium">Total:</span>
            <span className="text-xl font-bold">${selectedPlan?.price}</span>
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setStep('plans')} className="flex-1">
              Back
            </Button>
            <Button 
              onClick={handlePayment} 
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Processing...' : `Pay $${selectedPlan?.price}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderProcessingStep = () => (
    <div className="text-center space-y-6">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Processing Your Payment</h3>
        <p className="text-gray-600">Please wait while we generate your PDF...</p>
      </div>
    </div>
  )

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
        <p className="text-gray-600">Your PDF has been generated and is ready for download.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Family Tree:</span>
              <span className="font-medium">{familyTree?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Plan:</span>
              <span className="font-medium">{selectedPlan?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Amount Paid:</span>
              <span className="font-medium">${selectedPlan?.price}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-3">
        <Button variant="outline" onClick={handleClose} className="flex-1">
          Close
        </Button>
        <Button onClick={handleDownload} className="flex-1 bg-green-600 hover:bg-green-700">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      <p className="text-sm text-gray-500">
        Download link expires in 24 hours
      </p>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-green-600" />
            <span>Export Family Tree PDF</span>
          </DialogTitle>
          <DialogDescription>
            Generate a professional PDF of your family tree
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {step === 'plans' && renderPlansStep()}
          {step === 'payment' && renderPaymentStep()}
          {step === 'processing' && renderProcessingStep()}
          {step === 'success' && renderSuccessStep()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

