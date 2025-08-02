import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Leaf, 
  TreePine, 
  Plus, 
  TrendingUp, 
  Calendar,
  Eye,
  BarChart3
} from 'lucide-react'
import { apiCall, API_ENDPOINTS, API_BASE_URL } from '../config/api'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStrains: 0,
    totalFamilyTrees: 0,
    totalCrosses: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch strains using new API configuration
      const strainsResponse = await apiCall(API_ENDPOINTS.STRAINS)
      const strains = strainsResponse.ok ? await strainsResponse.json() : []
      
      // Fetch family trees using new API configuration
      const familyTreesResponse = await apiCall(API_ENDPOINTS.FAMILY_TREES)
      const familyTrees = familyTreesResponse.ok ? await familyTreesResponse.json() : []
      
      // Calculate total crosses
      const totalCrosses = familyTrees.reduce((sum, tree) => sum + (tree.crosses?.length || 0), 0)
      
      setStats({
        totalStrains: strains.length,
        totalFamilyTrees: familyTrees.length,
        totalCrosses,
        recentActivity: familyTrees.slice(0, 3) // Show recent family trees
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to StrainTree
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your comprehensive cannabis genetics tracking and breeding management platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Strains</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalStrains}</p>
                <p className="text-sm text-green-600 mt-1">
                  <TrendingUp className="h-4 w-4 inline mr-1" />
                  Active genetics
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Leaf className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Family Trees</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalFamilyTrees}</p>
                <p className="text-sm text-blue-600 mt-1">
                  <BarChart3 className="h-4 w-4 inline mr-1" />
                  Breeding projects
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TreePine className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Crosses</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCrosses}</p>
                <p className="text-sm text-purple-600 mt-1">
                  <Plus className="h-4 w-4 inline mr-1" />
                  Breeding events
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Plus className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild className="h-20 flex-col space-y-2">
              <Link to="/strains">
                <Leaf className="h-6 w-6" />
                <span>Add New Strain</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col space-y-2">
              <Link to="/family-trees">
                <TreePine className="h-6 w-6" />
                <span>Create Family Tree</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Recent Family Trees</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {stats.recentActivity.map((tree) => (
                <div key={tree.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <TreePine className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tree.name}</h3>
                      <p className="text-sm text-gray-600">{tree.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {tree.crosses?.length || 0} crosses
                    </Badge>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/family-trees/${tree.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TreePine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No family trees yet</p>
              <Button asChild>
                <Link to="/family-trees">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Family Tree
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard

