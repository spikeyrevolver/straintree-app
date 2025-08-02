import { useState, useEffect, useRef } from 'react'
import { TreePine, Plus, Search, Share2, Download, Zap, Leaf } from 'lucide-react'

export default function FamilyTreeVisualization({ familyTree, onAddCross, onShare, onExportPDF }) {
  const [selectedNode, setSelectedNode] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [zoomLevel, setZoomLevel] = useState(1)
  const canvasRef = useRef(null)

  // Use real crosses data from familyTree
  const crosses = familyTree?.crosses || []

  useEffect(() => {
    if (crosses.length > 0) {
      drawFamilyTree()
    }
  }, [crosses, zoomLevel, selectedNode])

  const drawFamilyTree = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    
    // Set canvas size
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Apply zoom
    ctx.save()
    ctx.scale(zoomLevel, zoomLevel)
    
    // Calculate positions for crosses in a tree layout
    const positions = calculateTreePositions(crosses)
    
    // Draw connections between strains
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 2
    
    crosses.forEach((cross, index) => {
      const pos = positions[index]
      
      // Draw lines connecting parents to offspring
      const parentY = pos.y - 60
      const offspringY = pos.y + 60
      
      // Parent 1 to cross point
      ctx.beginPath()
      ctx.moveTo(pos.x - 80, parentY)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      
      // Parent 2 to cross point
      ctx.beginPath()
      ctx.moveTo(pos.x + 80, parentY)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      
      // Cross point to offspring
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
      ctx.lineTo(pos.x, offspringY)
      ctx.stroke()
    })
    
    // Draw strain nodes
    crosses.forEach((cross, index) => {
      const pos = positions[index]
      const isSelected = selectedNode === cross.id
      
      // Draw parent nodes
      drawStrainNode(ctx, pos.x - 80, pos.y - 60, cross.parent1_strain?.name || 'Parent 1', isSelected)
      drawStrainNode(ctx, pos.x + 80, pos.y - 60, cross.parent2_strain?.name || 'Parent 2', isSelected)
      
      // Draw offspring node
      drawStrainNode(ctx, pos.x, pos.y + 60, cross.offspring_strain?.name || 'Offspring', isSelected, true)
      
      // Draw cross symbol
      ctx.fillStyle = '#6366f1'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('×', pos.x, pos.y + 5)
      
      // Draw generation label
      ctx.fillStyle = '#64748b'
      ctx.font = '12px Arial'
      ctx.fillText(`F${cross.generation || 1}`, pos.x, pos.y + 100)
    })
    
    ctx.restore()
  }

  const calculateTreePositions = (crosses) => {
    // Simple grid layout for now - can be enhanced to a proper tree layout
    const positions = []
    const cols = Math.ceil(Math.sqrt(crosses.length))
    const spacing = 200
    
    crosses.forEach((cross, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      
      positions.push({
        x: 150 + col * spacing,
        y: 150 + row * spacing
      })
    })
    
    return positions
  }

  const drawStrainNode = (ctx, x, y, name, isSelected, isOffspring = false) => {
    const radius = 30
    
    // Draw node circle
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fillStyle = isOffspring ? '#10b981' : '#6366f1'
    if (isSelected) {
      ctx.fillStyle = '#f59e0b'
    }
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Draw strain name
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'center'
    
    // Handle long names by splitting
    const maxLength = 12
    if (name.length > maxLength) {
      const words = name.split(' ')
      if (words.length > 1) {
        ctx.fillText(words[0], x, y - 3)
        ctx.fillText(words.slice(1).join(' ').substring(0, maxLength), x, y + 8)
      } else {
        ctx.fillText(name.substring(0, maxLength), x, y + 3)
      }
    } else {
      const words = name.split(' ')
      if (words.length > 1) {
        ctx.fillText(words[0], x, y - 3)
        ctx.fillText(words.slice(1).join(' '), x, y + 8)
      } else {
        ctx.fillText(name, x, y + 3)
      }
    }
  }

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) / zoomLevel
    const y = (event.clientY - rect.top) / zoomLevel
    
    // Check if click is on a node
    let clickedNode = null
    const positions = calculateTreePositions(crosses)
    
    crosses.forEach((cross, index) => {
      const pos = positions[index]
      const nodes = [
        { x: pos.x - 80, y: pos.y - 60, id: cross.id },
        { x: pos.x + 80, y: pos.y - 60, id: cross.id },
        { x: pos.x, y: pos.y + 60, id: cross.id }
      ]
      
      nodes.forEach(node => {
        const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
        if (distance <= 30) {
          clickedNode = node.id
        }
      })
    })
    
    setSelectedNode(clickedNode)
  }

  const filteredCrosses = crosses.filter(cross =>
    (cross.parent1_strain?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cross.parent2_strain?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cross.offspring_strain?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStrainUsageCount = (strainName) => {
    return crosses.filter(cross => 
      cross.parent1_strain?.name === strainName || 
      cross.parent2_strain?.name === strainName || 
      cross.offspring_strain?.name === strainName
    ).length
  }

  const getAllStrains = () => {
    const strains = new Set()
    crosses.forEach(cross => {
      if (cross.parent1_strain?.name) strains.add(cross.parent1_strain.name)
      if (cross.parent2_strain?.name) strains.add(cross.parent2_strain.name)
      if (cross.offspring_strain?.name) strains.add(cross.offspring_strain.name)
    })
    return Array.from(strains).map(name => ({
      name,
      usage: getStrainUsageCount(name)
    })).sort((a, b) => b.usage - a.usage)
  }

  // Show message when no crosses exist
  if (!crosses || crosses.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <TreePine className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No crosses yet</h3>
          <p className="text-gray-600 mb-6">Add parent strains and generate offspring to build your family tree.</p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>• Go to the Strains page to add parent strains</p>
            <p>• Create crosses between parent strains</p>
            <p>• Watch your family tree grow with each generation</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search strains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
            >
              -
            </button>
            <span className="text-sm font-medium">{Math.round(zoomLevel * 100)}%</span>
            <button
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
              onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
            >
              +
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {onAddCross && (
            <button 
              onClick={onAddCross} 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2 inline" />
              Add Cross
            </button>
          )}
          {onShare && (
            <button 
              onClick={onShare}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Share2 className="h-4 w-4 mr-2 inline" />
              Share
            </button>
          )}
          {onExportPDF && (
            <button 
              onClick={onExportPDF}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4 mr-2 inline" />
              Export PDF
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Family Tree Visualization */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <TreePine className="h-5 w-5 text-green-600" />
                <span>Family Tree Visualization</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Interactive view of strain relationships and crosses
              </p>
            </div>
            <div className="p-4">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="w-full h-96 border border-gray-200 rounded-lg cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' }}
                />
                {selectedNode && (
                  <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
                    <p className="text-sm font-medium">Cross #{selectedNode} selected</p>
                    <p className="text-xs text-gray-500">Click elsewhere to deselect</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Strain Information Panel */}
        <div className="space-y-4">
          {/* Strain Usage Statistics */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <span>Popular Strains</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Most used strains in this family tree
              </p>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {getAllStrains().slice(0, 5).map((strain, index) => (
                  <div key={strain.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{strain.name}</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      {strain.usage} uses
                    </span>
                  </div>
                ))}
                {getAllStrains().length === 0 && (
                  <p className="text-sm text-gray-500">No strains yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Cross Details */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Leaf className="h-5 w-5 text-green-600" />
                <span>Recent Crosses</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Latest breeding activities
              </p>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {filteredCrosses.slice(0, 3).map((cross) => (
                  <div key={cross.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="font-medium text-sm">
                      {cross.parent1_strain?.name || 'Parent 1'} × {cross.parent2_strain?.name || 'Parent 2'}
                    </div>
                    <div className="text-green-600 font-medium text-sm">
                      → {cross.offspring_strain?.name || 'Offspring'}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        F{cross.generation || 1}
                      </span>
                      <span className="text-xs text-gray-500">
                        {cross.cross_date ? new Date(cross.cross_date).toLocaleDateString() : 'No date'}
                      </span>
                    </div>
                    {cross.notes && (
                      <p className="text-xs text-gray-600 mt-1">{cross.notes}</p>
                    )}
                  </div>
                ))}
                {filteredCrosses.length === 0 && (
                  <p className="text-sm text-gray-500">No crosses match your search</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Legend</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            <span className="text-sm">Parent Strain</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-600 rounded-full"></div>
            <span className="text-sm">Offspring Strain</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-600 rounded-full"></div>
            <span className="text-sm">Selected Node</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-blue-600 font-bold">×</span>
            <span className="text-sm">Cross Point</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 text-sm">F1, F2, F3...</span>
            <span className="text-sm">Generation</span>
          </div>
        </div>
      </div>
    </div>
  )
}

