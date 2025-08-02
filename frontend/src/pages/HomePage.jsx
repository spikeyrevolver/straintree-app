import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '../App'
import { 
  Leaf, 
  TreePine, 
  Share2, 
  FileText, 
  Users, 
  Search,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

export default function HomePage() {
  const { user } = useAuth()

  const features = [
    {
      icon: TreePine,
      title: 'Visual Family Trees',
      description: 'Create interactive family trees to track cannabis strain genetics across generations.'
    },
    {
      icon: Search,
      title: 'Strain Database',
      description: 'Access a comprehensive database of cannabis strains with detailed information.'
    },
    {
      icon: Share2,
      title: 'Share & Collaborate',
      description: 'Share your family trees publicly or with specific users for collaboration.'
    },
    {
      icon: FileText,
      title: 'PDF Export',
      description: 'Export your family trees as professional PDF documents for documentation.'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Contribute to the growing database of strain information and genetics.'
    }
  ]

  const benefits = [
    'Track breeding projects across multiple generations',
    'Maintain detailed records of strain characteristics',
    'Cross-reference strains across different family trees',
    'Export professional documentation for compliance',
    'Collaborate with other growers and breeders'
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Leaf className="h-16 w-16 text-green-600" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Track Your Cannabis
              <span className="text-green-600 block">Strain Genetics</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Build comprehensive family trees for your cannabis strains. Track breeding projects, 
              maintain detailed records, and share your genetics with the community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="flex items-center space-x-2">
                    <span>Go to Dashboard</span>
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="flex items-center space-x-2">
                      <span>Get Started Free</span>
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="lg">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Strain Tracking
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional tools for cannabis breeders and growers to document and share their genetics.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <feature.icon className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose StrainTree?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Whether you're a professional breeder or hobbyist grower, StrainTree provides 
                the tools you need to document, track, and share your cannabis genetics.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <div className="text-center">
                <TreePine className="h-24 w-24 text-green-600 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Start Building Today
                </h3>
                <p className="text-gray-600 mb-6">
                  Join thousands of growers already using StrainTree to document their genetics.
                </p>
                {!user && (
                  <Link to="/register">
                    <Button size="lg" className="w-full">
                      Create Free Account
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Track Your Genetics?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Start building your strain family trees today. It's free to get started.
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
                  Sign Up Free
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

