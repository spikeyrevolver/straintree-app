import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '../App'
import { 
  TreePine, 
  Leaf, 
  Plus, 
  Eye, 
  Calendar,
  TrendingUp,
  Users,
  Share2
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    familyTrees: 0,
    strains: 0,
    crosses: 0,
    publicTrees: 0
  })
  const [recentTrees, setRecentTrees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch family trees
      const treesResponse = await fetch('/api/family-trees')
      const treesData = await treesResponse.json()
      
      if (treesResponse.ok) {
        setRecentTrees(treesData.family_trees.slice(0, 5))
        setStats(prev => ({
          ...prev,
          familyTrees: treesData.total,
          publicTrees: treesData.family_trees.filter(tree => tree.is_public).length
        }))
      }

      // Fetch strains count
      const strainsResponse = await fetch('/api/strains?per_page=1')
      const strainsData = await strainsResponse.json()
      
      if (strainsResponse.ok) {
        setStats(prev => ({
          ...prev,
          strains: strainsData.total
        }))
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's an overview of your strain tracking activity.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Family Trees</CardTitle>
              <TreePine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.familyTrees}</div>
              <p className="text-xs text-muted-foreground">
                Total family trees created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Strains</CardTitle>
              <Leaf className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.strains}</div>
              <p className="text-xs text-muted-foreground">
                Strains in database
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Public Trees</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.publicTrees}</div>
              <p className="text-xs text-muted-foreground">
                Shared with community
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Type</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user?.is_premium ? 'Premium' : 'Free'}
              </div>
              <p className="text-xs text-muted-foreground">
                Current plan
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Get started with common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/family-trees" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Family Tree
                </Button>
              </Link>
              <Link to="/strains" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <Leaf className="h-4 w-4 mr-2" />
                  Add New Strain
                </Button>
              </Link>
              <Link to="/strains" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Browse Strains
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Family Trees */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Family Trees</CardTitle>
              <CardDescription>
                Your most recently updated family trees
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTrees.length > 0 ? (
                <div className="space-y-4">
                  {recentTrees.map((tree) => (
                    <div
                      key={tree.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <TreePine className="h-5 w-5 text-green-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">{tree.name}</h4>
                          <p className="text-sm text-gray-500">
                            {tree.crosses_count} crosses • Updated {formatDate(tree.updated_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {tree.is_public && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Public
                          </span>
                        )}
                        <Link to={`/family-trees/${tree.id}`}>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <Link to="/family-trees">
                      <Button variant="outline" className="w-full">
                        View All Family Trees
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TreePine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No family trees yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Create your first family tree to start tracking strain genetics.
                  </p>
                  <Link to="/family-trees">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Family Tree
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        {stats.familyTrees === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Follow these steps to start tracking your strain genetics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                    <Leaf className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium mb-2">1. Add Strains</h3>
                  <p className="text-sm text-gray-600">
                    Start by adding the strains you're working with to the database.
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                    <TreePine className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium mb-2">2. Create Family Tree</h3>
                  <p className="text-sm text-gray-600">
                    Create a family tree to organize your breeding projects.
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium mb-2">3. Track Crosses</h3>
                  <p className="text-sm text-gray-600">
                    Document crosses and track genetics across generations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

