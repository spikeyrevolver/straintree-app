import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  TreePine, 
  Eye, 
  Share2,
  Calendar,
  Users
} from 'lucide-react'
import { apiCall, API_ENDPOINTS, API_BASE_URL } from '../config/api'

export default function FamilyTreesPage() {
  const [familyTrees, setFamilyTrees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [newTree, setNewTree] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchFamilyTrees()
  }, [])

  const fetchFamilyTrees = async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.FAMILY_TREES)
      const data = await response.json()
      
      if (response.ok) {
        setFamilyTrees(data.family_trees)
      } else {
        setError('Failed to fetch family trees')
      }
    } catch (error) {
      setError('Failed to fetch family trees')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTree = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await apiCall(API_ENDPOINTS.FAMILY_TREES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTree),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess('Family tree created successfully!')
        setNewTree({ name: '', description: '' })
        setShowCreateDialog(false)
        fetchFamilyTrees()
      } else {
        setError(data.error || 'Failed to create family tree')
      }
    } catch (error) {
      setError('Failed to create family tree')
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Family Trees</h1>
            <p className="text-gray-600 mt-2">
              Manage your strain breeding projects and genetics
            </p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="mt-4 sm:mt-0">
                <Plus className="h-4 w-4 mr-2" />
                Create Family Tree
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Family Tree</DialogTitle>
                <DialogDescription>
                  Create a new family tree to organize your strain breeding project.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateTree} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Family Tree Name *</Label>
                  <Input
                    id="name"
                    value={newTree.name}
                    onChange={(e) => setNewTree({...newTree, name: e.target.value})}
                    placeholder="e.g., Blue Dream Breeding Project"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTree.description}
                    onChange={(e) => setNewTree({...newTree, description: e.target.value})}
                    placeholder="Describe your breeding goals and project details..."
                    rows={3}
                  />
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Family Tree</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Success Message */}
        {success && (
          <Alert className="mb-6">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Family Trees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {familyTrees.map((tree) => (
            <Card key={tree.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <TreePine className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-lg">{tree.name}</CardTitle>
                  </div>
                  {tree.is_public && (
                    <Share2 className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                {tree.description && (
                  <CardDescription className="line-clamp-2">
                    {tree.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{tree.crosses_count} crosses</span>
                    <span>Updated {formatDate(tree.updated_at)}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link to={`/family-trees/${tree.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/shared/${tree.share_token}`)
                        setSuccess('Share link copied to clipboard!')
                        setTimeout(() => setSuccess(''), 3000)
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {familyTrees.length === 0 && (
          <div className="text-center py-12">
            <TreePine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No family trees yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first family tree to start tracking strain genetics.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Family Tree
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

