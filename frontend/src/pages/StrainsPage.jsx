import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Leaf, Plus, Search, TrendingUp, Filter, Database, ExternalLink, Shield, Award, FlaskConical } from 'lucide-react'
import StrainCrossReference from '../components/StrainCrossReference'
import { apiCall, API_ENDPOINTS, API_BASE_URL } from '../config/api'

export default function StrainsPage() {
  const [strains, setStrains] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showAddStrain, setShowAddStrain] = useState(false)
  const [showLabVerification, setShowLabVerification] = useState(false)
  const [selectedStrain, setSelectedStrain] = useState(null)
  const [newStrain, setNewStrain] = useState({
    name: '',
    strain_type: '',
    description: '',
    thc_content: '',
    cbd_content: '',
    flowering_time: '',
    yield_info: ''
  })
  const [labVerification, setLabVerification] = useState({
    lab_name: '',
    lab_test_date: '',
    lab_report_url: '',
    lab_certificate_number: '',
    verified_thc: '',
    verified_cbd: '',
    verified_terpenes: '',
    verification_notes: ''
  })

  useEffect(() => {
    fetchStrains()
  }, [])

  const fetchStrains = async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.STRAINS)
      const data = await response.json()
      if (response.ok) {
        setStrains(data.strains || [])
      }
    } catch (error) {
      console.error('Failed to fetch strains:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddStrain = async () => {
    try {
      console.log('Attempting to create strain:', newStrain);
      console.log('API Base URL:', API_BASE_URL);
      
      const response = await apiCall(API_ENDPOINTS.STRAINS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStrain),
      })
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json()
        console.log('Strain created successfully:', data);
        setStrains(prev => [...prev, data.strain])
        setNewStrain({
          name: '',
          strain_type: '',
          description: '',
          thc_content: '',
          cbd_content: '',
          flowering_time: '',
          yield_info: ''
        })
        setShowAddStrain(false)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Server error:', errorData);
        alert(errorData.error || `Failed to create strain (Status: ${response.status})`)
      }
    } catch (error) {
      console.error('Failed to create strain:', error)
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      alert(`Failed to create strain: ${error.message}`)
    }
  }

  const handleSubmitLabVerification = async () => {
    if (!selectedStrain) return
    
    try {
      const response = await apiCall(`/api/strains/${selectedStrain.id}/submit-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(labVerification),
      })
      
      const data = await response.json()
      if (response.ok) {
        // Update the strain in the list
        setStrains(prev => prev.map(strain => 
          strain.id === selectedStrain.id ? data.strain : strain
        ))
        setLabVerification({
          lab_name: '',
          lab_test_date: '',
          lab_report_url: '',
          lab_certificate_number: '',
          verified_thc: '',
          verified_cbd: '',
          verified_terpenes: '',
          verification_notes: ''
        })
        setShowLabVerification(false)
        setSelectedStrain(null)
        alert('Lab verification submitted successfully!')
      } else {
        alert(data.error || 'Failed to submit verification')
      }
    } catch (error) {
      console.error('Failed to submit verification:', error)
      alert('Failed to submit verification')
    }
  }

  const filteredStrains = strains.filter(strain => {
    const matchesSearch = strain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (strain.description && strain.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = filterType === 'all' || 
                         (strain.strain_type && strain.strain_type.toLowerCase().includes(filterType.toLowerCase()))
    
    return matchesSearch && matchesFilter
  })

  const getTypeColor = (type) => {
    if (!type) return 'bg-gray-100 text-gray-800'
    if (type.includes('sativa')) return 'bg-green-100 text-green-800'
    if (type.includes('indica')) return 'bg-purple-100 text-purple-800'
    return 'bg-blue-100 text-blue-800'
  }

  const getVerificationBadge = (strain) => {
    if (strain.is_lab_tested) {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
          <FlaskConical className="h-3 w-3 mr-1" />
          Lab Tested
        </Badge>
      )
    }
    if (strain.is_verified) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <Shield className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Strain Database</h1>
          </div>
          <p className="text-gray-600">
            Manage your strain collection and explore genetics across all family trees
          </p>
        </div>

        <Tabs defaultValue="database" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="database" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Strain Database</span>
            </TabsTrigger>
            <TabsTrigger value="cross-reference" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Cross-Reference</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-6">
            {/* Controls */}
            <Card>
              <CardContent className="py-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Search strains..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="sativa">Sativa</SelectItem>
                        <SelectItem value="indica">Indica</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Dialog open={showAddStrain} onOpenChange={setShowAddStrain}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Strain
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Add New Strain</DialogTitle>
                        <DialogDescription>
                          Add a new strain to the database for use in family trees.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">Name</Label>
                          <Input
                            id="name"
                            value={newStrain.name}
                            onChange={(e) => setNewStrain(prev => ({ ...prev, name: e.target.value }))}
                            className="col-span-3"
                            placeholder="e.g., Purple Haze"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="type" className="text-right">Type</Label>
                          <Select
                            value={newStrain.strain_type}
                            onValueChange={(value) => setNewStrain(prev => ({ ...prev, strain_type: value }))}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sativa">Sativa</SelectItem>
                              <SelectItem value="indica">Indica</SelectItem>
                              <SelectItem value="sativa-dominant hybrid">Sativa-dominant hybrid</SelectItem>
                              <SelectItem value="indica-dominant hybrid">Indica-dominant hybrid</SelectItem>
                              <SelectItem value="balanced hybrid">Balanced hybrid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="thc" className="text-right">THC %</Label>
                          <Input
                            id="thc"
                            type="number"
                            step="0.1"
                            value={newStrain.thc_content}
                            onChange={(e) => setNewStrain(prev => ({ ...prev, thc_content: e.target.value }))}
                            className="col-span-3"
                            placeholder="e.g., 18.5"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="cbd" className="text-right">CBD %</Label>
                          <Input
                            id="cbd"
                            type="number"
                            step="0.1"
                            value={newStrain.cbd_content}
                            onChange={(e) => setNewStrain(prev => ({ ...prev, cbd_content: e.target.value }))}
                            className="col-span-3"
                            placeholder="e.g., 0.2"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="flowering" className="text-right">Flowering</Label>
                          <Input
                            id="flowering"
                            value={newStrain.flowering_time}
                            onChange={(e) => setNewStrain(prev => ({ ...prev, flowering_time: e.target.value }))}
                            className="col-span-3"
                            placeholder="e.g., 8-9 weeks"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="yield" className="text-right">Yield</Label>
                          <Input
                            id="yield"
                            value={newStrain.yield_info}
                            onChange={(e) => setNewStrain(prev => ({ ...prev, yield_info: e.target.value }))}
                            className="col-span-3"
                            placeholder="e.g., 400-500g/m²"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="description" className="text-right">Description</Label>
                          <Textarea
                            id="description"
                            value={newStrain.description}
                            onChange={(e) => setNewStrain(prev => ({ ...prev, description: e.target.value }))}
                            className="col-span-3"
                            placeholder="Describe the strain characteristics..."
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowAddStrain(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddStrain}>
                          Add Strain
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Lab Verification Dialog */}
            <Dialog open={showLabVerification} onOpenChange={setShowLabVerification}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <FlaskConical className="h-5 w-5 text-emerald-600" />
                    <span>Submit Lab Verification</span>
                  </DialogTitle>
                  <DialogDescription>
                    Submit lab test results for {selectedStrain?.name} to get verified status.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="lab_name" className="text-right">Lab Name *</Label>
                    <Input
                      id="lab_name"
                      value={labVerification.lab_name}
                      onChange={(e) => setLabVerification(prev => ({ ...prev, lab_name: e.target.value }))}
                      className="col-span-3"
                      placeholder="e.g., Green Scientific Labs"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="lab_test_date" className="text-right">Test Date</Label>
                    <Input
                      id="lab_test_date"
                      type="date"
                      value={labVerification.lab_test_date}
                      onChange={(e) => setLabVerification(prev => ({ ...prev, lab_test_date: e.target.value }))}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="lab_certificate_number" className="text-right">Certificate #</Label>
                    <Input
                      id="lab_certificate_number"
                      value={labVerification.lab_certificate_number}
                      onChange={(e) => setLabVerification(prev => ({ ...prev, lab_certificate_number: e.target.value }))}
                      className="col-span-3"
                      placeholder="e.g., GSL-2024-001234"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="lab_report_url" className="text-right">Report URL</Label>
                    <Input
                      id="lab_report_url"
                      type="url"
                      value={labVerification.lab_report_url}
                      onChange={(e) => setLabVerification(prev => ({ ...prev, lab_report_url: e.target.value }))}
                      className="col-span-3"
                      placeholder="https://lab.com/reports/..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="verified_thc">Verified THC %</Label>
                      <Input
                        id="verified_thc"
                        type="number"
                        step="0.01"
                        value={labVerification.verified_thc}
                        onChange={(e) => setLabVerification(prev => ({ ...prev, verified_thc: e.target.value }))}
                        placeholder="e.g., 23.45"
                      />
                    </div>
                    <div>
                      <Label htmlFor="verified_cbd">Verified CBD %</Label>
                      <Input
                        id="verified_cbd"
                        type="number"
                        step="0.01"
                        value={labVerification.verified_cbd}
                        onChange={(e) => setLabVerification(prev => ({ ...prev, verified_cbd: e.target.value }))}
                        placeholder="e.g., 0.15"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="verified_terpenes" className="text-right">Terpenes</Label>
                    <Textarea
                      id="verified_terpenes"
                      value={labVerification.verified_terpenes}
                      onChange={(e) => setLabVerification(prev => ({ ...prev, verified_terpenes: e.target.value }))}
                      className="col-span-3"
                      placeholder="e.g., Myrcene: 1.2%, Limonene: 0.8%"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="verification_notes" className="text-right">Notes</Label>
                    <Textarea
                      id="verification_notes"
                      value={labVerification.verification_notes}
                      onChange={(e) => setLabVerification(prev => ({ ...prev, verification_notes: e.target.value }))}
                      className="col-span-3"
                      placeholder="Additional verification details..."
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowLabVerification(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitLabVerification} className="bg-emerald-600 hover:bg-emerald-700">
                    Submit Verification
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Strain Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStrains.map((strain) => (
                <Card key={strain.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{strain.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          {strain.strain_type && (
                            <Badge className={getTypeColor(strain.strain_type)}>
                              {strain.strain_type}
                            </Badge>
                          )}
                          {getVerificationBadge(strain)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{strain.usage_count || 0}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {strain.description && (
                      <p className="text-gray-600 text-sm mb-4">{strain.description}</p>
                    )}
                    
                    <div className="space-y-2 mb-4">
                      {strain.thc_content && (
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">THC:</span>
                          <span>{strain.thc_content}%</span>
                        </div>
                      )}
                      {strain.cbd_content && (
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">CBD:</span>
                          <span>{strain.cbd_content}%</span>
                        </div>
                      )}
                      {strain.flowering_time && (
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Flowering:</span>
                          <span>{strain.flowering_time}</span>
                        </div>
                      )}
                    </div>

                    {strain.is_lab_tested && (
                      <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <FlaskConical className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-800">Lab Verified</span>
                        </div>
                        {strain.lab_name && (
                          <p className="text-xs text-emerald-700">Tested by: {strain.lab_name}</p>
                        )}
                        {strain.verified_thc && (
                          <p className="text-xs text-emerald-700">Verified THC: {strain.verified_thc}%</p>
                        )}
                        {strain.lab_report_url && (
                          <a 
                            href={strain.lab_report_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center space-x-1 mt-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>View Report</span>
                          </a>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>Added by {strain.creator_username || 'Unknown'}</span>
                      <span>{strain.created_at ? new Date(strain.created_at).toLocaleDateString() : ''}</span>
                    </div>

                    {user && strain.created_by === user.id && !strain.is_lab_tested && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setSelectedStrain(strain)
                          setShowLabVerification(true)
                        }}
                      >
                        <FlaskConical className="h-4 w-4 mr-2" />
                        Submit Lab Verification
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredStrains.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Leaf className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No strains found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? `No strains match "${searchTerm}"` : 'No strains in the database yet'}
                  </p>
                  <Button onClick={() => setShowAddStrain(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Strain
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cross-reference">
            <StrainCrossReference />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

