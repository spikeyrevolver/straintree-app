import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TreePine, Calendar, User, Share2, Download, ExternalLink, Heart, Eye, ArrowLeft } from 'lucide-react'
import FamilyTreeVisualization from '../components/FamilyTreeVisualization'

export default function SharedTreePage() {
  const { shareToken } = useParams()
  const [familyTree, setFamilyTree] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewCount, setViewCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  // Sample shared family tree data
  const sampleSharedTree = {
    id: 1,
    name: 'Sour Diesel Genetics Project',
    description: 'Tracking the genetics and breeding history of Sour Diesel and its crosses. This project aims to document the lineage and create new phenotypes for enhanced potency and unique terpene profiles.',
    owner_username: 'CannaBreeder_Pro',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-03-20T00:00:00Z',
    is_public: true,
    share_token: shareToken,
    view_count: 1247,
    like_count: 89,
    crosses: [
      {
        id: 1,
        parent1_name: 'Sour Diesel',
        parent2_name: 'OG Kush',
        offspring_name: 'Sour OG',
        generation: 1,
        cross_date: '2024-01-15',
        notes: 'Strong diesel aroma with OG structure. Excellent yield and potency.',
        position: { x: 200, y: 100 }
      },
      {
        id: 2,
        parent1_name: 'Sour OG',
        parent2_name: 'Blue Dream',
        offspring_name: 'Sour Dream',
        generation: 2,
        cross_date: '2024-03-20',
        notes: 'Balanced hybrid with fruity undertones. Perfect for daytime use.',
        position: { x: 400, y: 200 }
      },
      {
        id: 3,
        parent1_name: 'Sour Diesel',
        parent2_name: 'White Widow',
        offspring_name: 'Sour Widow',
        generation: 1,
        cross_date: '2024-02-10',
        notes: 'High THC content, strong effects. Dense, resinous buds.',
        position: { x: 200, y: 300 }
      },
      {
        id: 4,
        parent1_name: 'Sour Dream',
        parent2_name: 'Purple Haze',
        offspring_name: 'Purple Sour Dream',
        generation: 3,
        cross_date: '2024-04-05',
        notes: 'Beautiful purple coloration with complex terpene profile.',
        position: { x: 600, y: 300 }
      }
    ],
    breeder_info: {
      experience_years: 8,
      total_projects: 15,
      specialties: ['Sativa hybrids', 'High THC strains', 'Terpene enhancement'],
      location: 'California, USA',
      verified: true
    }
  }

  useEffect(() => {
    // Simulate loading shared family tree
    setTimeout(() => {
      if (shareToken === 'abc123def456') {
        setFamilyTree(sampleSharedTree)
        setViewCount(sampleSharedTree.view_count)
        setLikeCount(sampleSharedTree.like_count)
      } else {
        setError('Family tree not found or no longer shared publicly.')
      }
      setLoading(false)
    }, 1000)
  }, [shareToken])

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount(prev => liked ? prev - 1 : prev + 1)
  }

  const handleShare = () => {
    const shareUrl = window.location.href
    navigator.clipboard.writeText(shareUrl)
    alert('Share link copied to clipboard!')
  }

  const handleExportPDF = () => {
    alert('PDF export is available for registered users. Sign up to unlock this feature!')
  }

  const getStrainCount = () => {
    const strains = new Set()
    familyTree.crosses.forEach(cross => {
      strains.add(cross.parent1_name)
      strains.add(cross.parent2_name)
      strains.add(cross.offspring_name)
    })
    return strains.size
  }

  const getGenerationRange = () => {
    const generations = familyTree.crosses.map(cross => cross.generation)
    return `F1-F${Math.max(...generations)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared family tree...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <TreePine className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tree Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/">
            <Button className="bg-green-600 hover:bg-green-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Homepage
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 text-green-600 hover:text-green-700">
              <TreePine className="h-6 w-6" />
              <span className="font-bold text-lg">StrainTree</span>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Eye className="h-4 w-4" />
                <span>{viewCount.toLocaleString()} views</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Link to="/register">
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  Sign Up Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Family Tree Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <TreePine className="h-8 w-8 text-green-600" />
                <h1 className="text-3xl font-bold text-gray-900">{familyTree.name}</h1>
                {familyTree.breeder_info.verified && (
                  <Badge className="bg-blue-100 text-blue-800">
                    Verified Breeder
                  </Badge>
                )}
              </div>
              
              {familyTree.description && (
                <p className="text-gray-600 text-lg mb-4 max-w-3xl">{familyTree.description}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>Created by {familyTree.owner_username}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Updated {new Date(familyTree.updated_at).toLocaleDateString()}</span>
                </div>
                <span>{familyTree.crosses.length} crosses</span>
                <span>{getStrainCount()} unique strains</span>
                <span>{getGenerationRange()} generations</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant={liked ? "default" : "outline"}
                onClick={handleLike}
                className={liked ? "bg-red-500 hover:bg-red-600" : ""}
              >
                <Heart className={`h-4 w-4 mr-2 ${liked ? 'fill-current' : ''}`} />
                {likeCount}
              </Button>
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Breeder Information */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>Breeder Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">{familyTree.owner_username}</h4>
                  <p className="text-sm text-gray-600">{familyTree.breeder_info.location}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Experience</span>
                    <p className="text-gray-600">{familyTree.breeder_info.experience_years} years</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Projects</span>
                    <p className="text-gray-600">{familyTree.breeder_info.total_projects}</p>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700 text-sm">Specialties</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {familyTree.breeder_info.specialties.map((specialty) => (
                      <Badge key={specialty} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Link to="/register" className="block">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View More Projects
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Family Tree Visualization */}
          <div className="lg:col-span-3">
            <FamilyTreeVisualization
              familyTree={familyTree}
              onAddCross={() => alert('Sign up to create your own family trees!')}
              onShare={handleShare}
              onExportPDF={handleExportPDF}
            />
          </div>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <CardContent className="py-8">
            <div className="text-center max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold mb-2">Create Your Own Family Trees</h3>
              <p className="text-green-100 mb-6">
                Join thousands of breeders tracking their genetics with StrainTree. 
                Build interactive family trees, share your work, and connect with the community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                    Sign Up Free
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500">
          <p className="text-sm">
            Powered by <Link to="/" className="text-green-600 hover:text-green-700 font-medium">StrainTree</Link> - 
            The premier platform for cannabis genetics tracking
          </p>
        </div>
      </div>
    </div>
  )
}

