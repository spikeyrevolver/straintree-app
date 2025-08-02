import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, TreePine, ExternalLink, Filter, TrendingUp, Calendar, User } from 'lucide-react'

export default function StrainCrossReference({ onStrainSelect }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedStrain, setSelectedStrain] = useState(null)

  // Sample data for demonstration
  const sampleStrainData = [
    {
      name: 'Sour Diesel',
      usage_count: 15,
      family_trees: [
        {
          id: 1,
          name: 'Sour Diesel Genetics Project',
          owner: 'testuser',
          role: 'parent',
          crosses: [
            { offspring: 'Sour OG', partner: 'OG Kush', date: '2024-01-15' },
            { offspring: 'Sour Widow', partner: 'White Widow', date: '2024-02-10' }
          ]
        },
        {
          id: 2,
          name: 'Diesel Hybrids Collection',
          owner: 'breeder123',
          role: 'parent',
          crosses: [
            { offspring: 'Diesel Dream', partner: 'Blue Dream', date: '2024-01-20' }
          ]
        }
      ],
      characteristics: {
        type: 'Sativa-dominant hybrid',
        thc: '20-25%',
        cbd: '0.1-0.3%',
        flowering_time: '10-11 weeks',
        effects: ['Energetic', 'Creative', 'Uplifting']
      }
    },
    {
      name: 'OG Kush',
      usage_count: 12,
      family_trees: [
        {
          id: 1,
          name: 'Sour Diesel Genetics Project',
          owner: 'testuser',
          role: 'parent',
          crosses: [
            { offspring: 'Sour OG', partner: 'Sour Diesel', date: '2024-01-15' }
          ]
        },
        {
          id: 3,
          name: 'OG Lineage Study',
          owner: 'genetics_pro',
          role: 'parent',
          crosses: [
            { offspring: 'OG Cookies', partner: 'Girl Scout Cookies', date: '2024-02-05' }
          ]
        }
      ],
      characteristics: {
        type: 'Indica-dominant hybrid',
        thc: '19-26%',
        cbd: '0.1-0.3%',
        flowering_time: '8-9 weeks',
        effects: ['Relaxing', 'Euphoric', 'Sleepy']
      }
    },
    {
      name: 'Blue Dream',
      usage_count: 8,
      family_trees: [
        {
          id: 1,
          name: 'Sour Diesel Genetics Project',
          owner: 'testuser',
          role: 'parent',
          crosses: [
            { offspring: 'Sour Dream', partner: 'Sour OG', date: '2024-03-20' }
          ]
        }
      ],
      characteristics: {
        type: 'Sativa-dominant hybrid',
        thc: '17-24%',
        cbd: '0.1-0.2%',
        flowering_time: '9-10 weeks',
        effects: ['Balanced', 'Creative', 'Relaxing']
      }
    }
  ]

  useEffect(() => {
    if (searchTerm.length >= 2) {
      setLoading(true)
      // Simulate API search
      setTimeout(() => {
        const results = sampleStrainData.filter(strain =>
          strain.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setSearchResults(results)
        setLoading(false)
      }, 500)
    } else {
      setSearchResults([])
    }
  }, [searchTerm])

  const handleStrainClick = (strain) => {
    setSelectedStrain(strain)
    if (onStrainSelect) {
      onStrainSelect(strain)
    }
  }

  const getTotalCrosses = (strain) => {
    return strain.family_trees.reduce((total, tree) => total + tree.crosses.length, 0)
  }

  const getUniquePartners = (strain) => {
    const partners = new Set()
    strain.family_trees.forEach(tree => {
      tree.crosses.forEach(cross => {
        partners.add(cross.partner)
      })
    })
    return Array.from(partners)
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-blue-600" />
            <span>Strain Cross-Reference</span>
          </CardTitle>
          <CardDescription>
            Search for strains across all family trees to see their usage and breeding history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search for a strain (e.g., Sour Diesel, OG Kush)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchTerm.length > 0 && searchTerm.length < 2 && (
            <p className="text-sm text-gray-500 mt-2">Type at least 2 characters to search</p>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {loading && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Searching...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Search Results ({searchResults.length})</h3>
          {searchResults.map((strain) => (
            <Card key={strain.name} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6" onClick={() => handleStrainClick(strain)}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{strain.name}</h4>
                    <p className="text-gray-600">{strain.characteristics.type}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {strain.usage_count} uses
                    </Badge>
                    <Badge variant="outline">
                      {getTotalCrosses(strain)} crosses
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Characteristics</h5>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">THC:</span> {strain.characteristics.thc}</div>
                      <div><span className="font-medium">CBD:</span> {strain.characteristics.cbd}</div>
                      <div><span className="font-medium">Flowering:</span> {strain.characteristics.flowering_time}</div>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Effects</h5>
                    <div className="flex flex-wrap gap-1">
                      {strain.characteristics.effects.map((effect) => (
                        <Badge key={effect} variant="outline" className="text-xs">
                          {effect}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">
                    Used in {strain.family_trees.length} Family Trees
                  </h5>
                  <div className="space-y-2">
                    {strain.family_trees.map((tree) => (
                      <div key={tree.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <TreePine className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{tree.name}</span>
                          <Badge variant="outline" className="text-xs">
                            by {tree.owner}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {tree.crosses.length} crosses
                          </span>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {getUniquePartners(strain).length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-900 mb-2">Common Breeding Partners</h5>
                    <div className="flex flex-wrap gap-1">
                      {getUniquePartners(strain).map((partner) => (
                        <Badge key={partner} variant="secondary" className="text-xs">
                          {partner}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searchTerm.length >= 2 && searchResults.length === 0 && !loading && (
        <Card>
          <CardContent className="py-8 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No strains found</h3>
            <p className="text-gray-500">
              No strains matching "{searchTerm}" were found in any family trees.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Selected Strain Details */}
      {selectedStrain && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-green-600" />
              <span>Detailed Analysis: {selectedStrain.name}</span>
            </CardTitle>
            <CardDescription>
              Complete breeding history and usage across all family trees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Usage Statistics */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Usage Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{selectedStrain.usage_count}</div>
                    <div className="text-sm text-gray-600">Total Uses</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{getTotalCrosses(selectedStrain)}</div>
                    <div className="text-sm text-gray-600">Total Crosses</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{selectedStrain.family_trees.length}</div>
                    <div className="text-sm text-gray-600">Family Trees</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{getUniquePartners(selectedStrain).length}</div>
                    <div className="text-sm text-gray-600">Partners</div>
                  </div>
                </div>
              </div>

              {/* Breeding Timeline */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Breeding Timeline</h4>
                <div className="space-y-2">
                  {selectedStrain.family_trees.flatMap(tree =>
                    tree.crosses.map(cross => ({
                      ...cross,
                      tree_name: tree.name,
                      owner: tree.owner
                    }))
                  ).sort((a, b) => new Date(a.date) - new Date(b.date)).map((cross, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium">
                          {selectedStrain.name} × {cross.partner} → {cross.offspring}
                        </div>
                        <div className="text-sm text-gray-600">
                          {cross.tree_name} by {cross.owner}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(cross.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

