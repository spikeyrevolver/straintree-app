import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Eye, BarChart3, X } from 'lucide-react'
import FamilyTreeVisualization from '../components/FamilyTreeVisualization'

const FamilyTreeDetailPage = () => {
  const { id } = useParams()
  const [familyTree, setFamilyTree] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('visualization') // 'visualization' or 'list'
  
  // Cross creation states
  const [showCrossModal, setShowCrossModal] = useState(false)
  const [availableStrains, setAvailableStrains] = useState([])
  const [crossForm, setCrossForm] = useState({
    parent1_id: '',
    parent2_id: '',
    offspring_name: '',
    generation: 1,
    cross_date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [creatingCross, setCreatingCross] = useState(false)

  useEffect(() => {
    fetchFamilyTree()
    fetchAvailableStrains()
  }, [id])

  const fetchFamilyTree = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/family-trees/${id}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch family tree')
      }
      
      const data = await response.json()
      // Fix: Extract family_tree from response
      setFamilyTree(data.family_tree)
    } catch (error) {
      console.error('Error fetching family tree:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableStrains = async () => {
    try {
      const response = await fetch(`/api/family-trees/${id}/available-strains`, {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (response.ok) {
        setAvailableStrains(data.strains || [])
      }
    } catch (error) {
      console.error('Error fetching available strains:', error)
    }
  }

  const handleCreateCross = async (e) => {
    e.preventDefault()
    
    if (!crossForm.parent1_id || !crossForm.parent2_id) {
      alert('Please select both parent strains')
      return
    }

    try {
      setCreatingCross(true)
      const response = await fetch(`/api/family-trees/${id}/crosses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(crossForm)
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Cross created successfully:', data)
        
        // Reset form and close modal
        setCrossForm({
          parent1_id: '',
          parent2_id: '',
          offspring_name: '',
          generation: 1,
          cross_date: new Date().toISOString().split('T')[0],
          notes: ''
        })
        setShowCrossModal(false)
        
        // Refresh family tree data
        fetchFamilyTree()
      } else {
        const errorData = await response.json()
        alert(`Failed to create cross: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating cross:', error)
      alert('Failed to create cross')
    } finally {
      setCreatingCross(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading family tree...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Family Tree Not Found</h2>
        <p className="text-gray-600 mb-4">The family tree you're looking for doesn't exist or you don't have access to it.</p>
        <Link 
          to="/family-trees"
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Family Trees
        </Link>
      </div>
    )
  }

  if (!familyTree) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-600 mb-4">Family Tree Not Found</h2>
        <p className="text-gray-600 mb-4">The family tree you're looking for doesn't exist or you don't have access to it.</p>
        <Link 
          to="/family-trees"
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Family Trees
        </Link>
      </div>
    )
  }

  // Calculate unique strains from crosses
  const uniqueStrains = new Set()
  if (familyTree.crosses) {
    familyTree.crosses.forEach(cross => {
      if (cross.parent1_strain) uniqueStrains.add(cross.parent1_strain.name)
      if (cross.parent2_strain) uniqueStrains.add(cross.parent2_strain.name)
      if (cross.offspring_strain) uniqueStrains.add(cross.offspring_strain.name)
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/family-trees"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Family Trees
          </Link>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{familyTree.name}</h1>
            {familyTree.description && (
              <p className="text-gray-600 mt-1">{familyTree.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'visualization' 
                ? 'bg-blue-600 text-white' 
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setViewMode('visualization')}
          >
            <Eye className="h-4 w-4 mr-2 inline" />
            Visualization
          </button>
          <button
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white' 
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setViewMode('list')}
          >
            <BarChart3 className="h-4 w-4 mr-2 inline" />
            List View
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Crosses</p>
              <p className="text-2xl font-bold text-gray-900">{familyTree.crosses?.length || 0}</p>
            </div>
            <button
              onClick={() => setShowCrossModal(true)}
              className="p-2 hover:bg-green-50 rounded-lg transition-colors"
              title="Add Cross"
            >
              <Plus className="h-8 w-8 text-green-600" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Strains</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueStrains.size}</p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Updated</p>
              <p className="text-sm text-gray-900">
                {familyTree.updated_at ? new Date(familyTree.updated_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <Eye className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'visualization' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <FamilyTreeVisualization familyTree={familyTree} />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Crosses List</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {familyTree.crosses?.map((cross) => (
                <div key={cross.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">
                      {cross.parent1_strain?.name} × {cross.parent2_strain?.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      → {cross.offspring_strain?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Generation: F{cross.generation} • 
                      {cross.cross_date && ` Date: ${new Date(cross.cross_date).toLocaleDateString()}`}
                    </p>
                    {cross.notes && (
                      <p className="text-sm text-gray-600 mt-1">{cross.notes}</p>
                    )}
                  </div>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                    F{cross.generation}
                  </span>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-8">No crosses in this family tree yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cross Creation Modal */}
      {showCrossModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Create Cross</h2>
              <button
                onClick={() => setShowCrossModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCross} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent 1
                </label>
                <select
                  value={crossForm.parent1_id}
                  onChange={(e) => setCrossForm({...crossForm, parent1_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select Parent 1</option>
                  {availableStrains.map((strain) => (
                    <option key={strain.id} value={strain.id}>
                      {strain.name} ({strain.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent 2
                </label>
                <select
                  value={crossForm.parent2_id}
                  onChange={(e) => setCrossForm({...crossForm, parent2_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select Parent 2</option>
                  {availableStrains.map((strain) => (
                    <option key={strain.id} value={strain.id}>
                      {strain.name} ({strain.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Offspring Name (Optional)
                </label>
                <input
                  type="text"
                  value={crossForm.offspring_name}
                  onChange={(e) => setCrossForm({...crossForm, offspring_name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Auto-generated if left empty"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Generation
                </label>
                <input
                  type="number"
                  value={crossForm.generation}
                  onChange={(e) => setCrossForm({...crossForm, generation: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cross Date
                </label>
                <input
                  type="date"
                  value={crossForm.cross_date}
                  onChange={(e) => setCrossForm({...crossForm, cross_date: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={crossForm.notes}
                  onChange={(e) => setCrossForm({...crossForm, notes: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Optional notes about this cross..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCrossModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCross}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {creatingCross ? 'Creating...' : 'Create Cross'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FamilyTreeDetailPage

