import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft,
  Plus, 
  TreePine, 
  Share2,
  Calendar,
  Users,
  Dna,
  Info,
  X
} from 'lucide-react'

export default function FamilyTreeViewPage() {
  const { treeId } = useParams()
  const [familyTree, setFamilyTree] = useState(null)
  const [visualizationData, setVisualizationData] = useState(null)
  const [availableStrains, setAvailableStrains] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Dialog states
  const [showAddParentDialog, setShowAddParentDialog] = useState(false)
  const [showGenerateOffspringDialog, setShowGenerateOffspringDialog] = useState(false)
  const [showStrainDetailsDialog, setShowStrainDetailsDialog] = useState(false)
  const [selectedStrain, setSelectedStrain] = useState(null)
  
  // Form states
  const [selectedParentStrain, setSelectedParentStrain] = useState('')
  const [offspringForm, setOffspringForm] = useState({
    parent1_id: '',
    parent2_id: '',
    offspring_name: '',
    flowering_time: '',
    yield_info: '',
    notes: '',
    generation: 1
  })

  useEffect(() => {
    if (treeId) {
      fetchFamilyTree()
      fetchVisualizationData()
      fetchAvailableStrains()
    }
  }, [treeId])

  const fetchFamilyTree = async () => {
    try {
      const response = await fetch(`/api/family-trees/${treeId}`, {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (response.ok) {
        setFamilyTree(data.family_tree)
      } else {
        setError('Failed to fetch family tree')
      }
    } catch (error) {
      setError('Failed to fetch family tree')
    }
  }

  const fetchVisualizationData = async () => {
    try {
      const response = await fetch(`/api/family-trees/${treeId}/visualization`, {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (response.ok) {
        setVisualizationData(data)
      } else {
        setError('Failed to fetch visualization data')
      }
    } catch (error) {
      setError('Failed to fetch visualization data')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableStrains = async () => {
    try {
      const response = await fetch(`/api/family-trees/${treeId}/available-strains`, {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (response.ok) {
        setAvailableStrains(data.strains)
      }
    } catch (error) {
      console.error('Failed to fetch available strains:', error)
    }
  }

  const handleGenerateOffspring = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/family-trees/${treeId}/generate-offspring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...offspringForm,
          cross_date: new Date().toISOString().split('T')[0]
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess('Offspring generated successfully!')
        setOffspringForm({
          parent1_id: '',
          parent2_id: '',
          offspring_name: '',
          flowering_time: '',
          yield_info: '',
          notes: '',
          generation: 1
        })
        setShowGenerateOffspringDialog(false)
        fetchVisualizationData() // Refresh the visualization
      } else {
        setError(data.error || 'Failed to generate offspring')
      }
    } catch (error) {
      setError('Failed to generate offspring')
    }
  }

  const handleStrainClick = (strain) => {
    setSelectedStrain(strain)
    setShowStrainDetailsDialog(true)
  }

  const renderVisualization = () => {
    if (!visualizationData || !visualizationData.nodes) {
      return (
        <div className="text-center py-12">
          <TreePine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No crosses yet
          </h3>
          <p className="text-gray-500 mb-4">
            Add parent strains and generate offspring to build your family tree.
          </p>
        </div>
      )
    }

    return (
      <div className="bg-green-50 rounded-lg p-6 min-h-96">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visualizationData.nodes.map((node) => (
            <Card 
              key={node.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                node.type === 'parent' ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'
              }`}
              onClick={() => handleStrainClick(node)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{node.name}</CardTitle>
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    node.type === 'parent' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {node.type === 'parent' ? 'Parent' : `F${node.generation || 1}`}
                  </div>
                </div>
                <CardDescription className="text-xs">
                  {node.strain_type}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 text-xs text-gray-600">
                  {node.thc_content && (
                    <div>THC: {node.thc_content}%</div>
                  )}
                  {node.cbd_content && (
                    <div>CBD: {node.cbd_content}%</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {visualizationData.edges.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Crosses</h4>
            <div className="space-y-2">
              {visualizationData.edges.slice(0, 3).map((edge) => {
                const parent1 = visualizationData.nodes.find(n => n.id === edge.parent1_id)
                const parent2 = visualizationData.nodes.find(n => n.id === edge.parent2_id)
                const offspring = visualizationData.nodes.find(n => n.id === edge.offspring_id)
                
                return (
                  <div key={edge.id} className="text-sm text-gray-600 bg-white p-2 rounded border">
                    <span className="font-medium">{parent1?.name}</span> × <span className="font-medium">{parent2?.name}</span> → <span className="font-medium text-green-600">{offspring?.name}</span>
                    {edge.cross_date && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({new Date(edge.cross_date).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!familyTree) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Family Tree Not Found</h2>
          <p className="text-gray-600 mb-4">The family tree you're looking for doesn't exist or you don't have access to it.</p>
          <Link to="/family-trees">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Family Trees
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/family-trees">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Family Trees
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{familyTree.name}</h1>
              {familyTree.description && (
                <p className="text-gray-600 mt-1">{familyTree.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Dialog open={showGenerateOffspringDialog} onOpenChange={setShowGenerateOffspringDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Dna className="h-4 w-4 mr-2" />
                  Add Cross
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Generate Offspring</DialogTitle>
                  <DialogDescription>
                    Select two parent strains to create a new offspring.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleGenerateOffspring} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="parent1">Parent 1 *</Label>
                    <Select value={offspringForm.parent1_id} onValueChange={(value) => setOffspringForm({...offspringForm, parent1_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select first parent strain" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStrains.map((strain) => (
                          <SelectItem key={strain.id} value={strain.id.toString()}>
                            {strain.name} ({strain.strain_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="parent2">Parent 2 *</Label>
                    <Select value={offspringForm.parent2_id} onValueChange={(value) => setOffspringForm({...offspringForm, parent2_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select second parent strain" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStrains.filter(s => s.id.toString() !== offspringForm.parent1_id).map((strain) => (
                          <SelectItem key={strain.id} value={strain.id.toString()}>
                            {strain.name} ({strain.strain_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="offspring_name">Offspring Name *</Label>
                    <Input
                      id="offspring_name"
                      value={offspringForm.offspring_name}
                      onChange={(e) => setOffspringForm({...offspringForm, offspring_name: e.target.value})}
                      placeholder="e.g., Blue Dream F1"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="flowering_time">Flowering Time</Label>
                      <Input
                        id="flowering_time"
                        value={offspringForm.flowering_time}
                        onChange={(e) => setOffspringForm({...offspringForm, flowering_time: e.target.value})}
                        placeholder="e.g., 8-9 weeks"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="generation">Generation</Label>
                      <Select value={offspringForm.generation.toString()} onValueChange={(value) => setOffspringForm({...offspringForm, generation: parseInt(value)})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">F1</SelectItem>
                          <SelectItem value="2">F2</SelectItem>
                          <SelectItem value="3">F3</SelectItem>
                          <SelectItem value="4">F4</SelectItem>
                          <SelectItem value="5">F5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="yield_info">Yield Info</Label>
                    <Input
                      id="yield_info"
                      value={offspringForm.yield_info}
                      onChange={(e) => setOffspringForm({...offspringForm, yield_info: e.target.value})}
                      placeholder="e.g., 400-500g/m²"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={offspringForm.notes}
                      onChange={(e) => setOffspringForm({...offspringForm, notes: e.target.value})}
                      placeholder="Additional notes about this cross..."
                      rows={2}
                    />
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowGenerateOffspringDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Generate Offspring</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <Alert className="mb-6">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Family Tree Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Crosses</CardTitle>
              <Dna className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visualizationData?.edges?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Strains</CardTitle>
              <TreePine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visualizationData?.nodes?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {new Date(familyTree.updated_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Family Tree Visualization */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Family Tree Visualization</CardTitle>
                <CardDescription>
                  Interactive view of strain relationships and crosses
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                  <span>Parent Strain</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                  <span>Offspring Strain</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderVisualization()}
          </CardContent>
        </Card>

        {/* Strain Details Dialog */}
        <Dialog open={showStrainDetailsDialog} onOpenChange={setShowStrainDetailsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                {selectedStrain?.name}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStrainDetailsDialog(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
              <DialogDescription>
                Detailed information about this strain
              </DialogDescription>
            </DialogHeader>
            
            {selectedStrain && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Type</Label>
                    <p className="font-medium">{selectedStrain.strain_type}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Role</Label>
                    <p className="font-medium capitalize">{selectedStrain.type}</p>
                  </div>
                </div>
                
                {(selectedStrain.thc_content || selectedStrain.cbd_content) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedStrain.thc_content && (
                      <div>
                        <Label className="text-xs text-gray-500">THC Content</Label>
                        <p className="font-medium">{selectedStrain.thc_content}%</p>
                      </div>
                    )}
                    {selectedStrain.cbd_content && (
                      <div>
                        <Label className="text-xs text-gray-500">CBD Content</Label>
                        <p className="font-medium">{selectedStrain.cbd_content}%</p>
                      </div>
                    )}
                  </div>
                )}
                
                {(selectedStrain.flowering_time || selectedStrain.yield_info) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedStrain.flowering_time && (
                      <div>
                        <Label className="text-xs text-gray-500">Flowering Time</Label>
                        <p className="font-medium">{selectedStrain.flowering_time}</p>
                      </div>
                    )}
                    {selectedStrain.yield_info && (
                      <div>
                        <Label className="text-xs text-gray-500">Yield</Label>
                        <p className="font-medium">{selectedStrain.yield_info}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {selectedStrain.description && (
                  <div>
                    <Label className="text-xs text-gray-500">Description</Label>
                    <p className="text-sm text-gray-700 mt-1">{selectedStrain.description}</p>
                  </div>
                )}
                
                {selectedStrain.generation && (
                  <div>
                    <Label className="text-xs text-gray-500">Generation</Label>
                    <p className="font-medium">F{selectedStrain.generation}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

