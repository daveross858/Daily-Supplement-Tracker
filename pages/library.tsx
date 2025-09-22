import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContextFirebase'
import { 
  SupplementLibraryItem,
  getUserSupplementLibrary,
  saveUserSupplementLibrary
} from '../utils/storage-enhanced'

export default function ManageLibrary() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [supplementLibrary, setSupplementLibrary] = useState<SupplementLibraryItem[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<SupplementLibraryItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [newSupplement, setNewSupplement] = useState({
    name: '',
    defaultDosage: '',
    category: 'Vitamins'
  })

  const categories = ['Vitamins', 'Minerals', 'Essential Fatty Acids', 'Digestive Health', 'Herbal', 'Other']

  // Filter supplements based on search term
  const filteredSupplements = supplementLibrary.filter(supplement =>
    supplement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplement.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Load library data on component mount
  useEffect(() => {
    async function loadLibrary() {
      if (user) {
        try {
          const library = await getUserSupplementLibrary(user.id)
          setSupplementLibrary(library)
        } catch (error) {
          console.error('Error loading supplement library:', error)
        }
      }
    }

    if (isAuthenticated && user) {
      loadLibrary()
    }
  }, [isAuthenticated, user])

  const addToLibrary = async () => {
    if (newSupplement.name.trim() && user) {
      try {
        const supplement: SupplementLibraryItem = {
          id: Date.now().toString(),
          name: newSupplement.name.trim(),
          defaultDosage: newSupplement.defaultDosage.trim() || '1 dose',
          category: newSupplement.category
        }
        
        const updatedLibrary = [...supplementLibrary, supplement]
        setSupplementLibrary(updatedLibrary)
        await saveUserSupplementLibrary(user.id, updatedLibrary)
        
        setNewSupplement({ name: '', defaultDosage: '', category: 'Vitamins' })
        setShowAddModal(false)
      } catch (error) {
        console.error('Error adding supplement to library:', error)
      }
    }
  }

  const updateLibraryItem = async (updatedItem: SupplementLibraryItem) => {
    if (user) {
      try {
        const updatedLibrary = supplementLibrary.map(item =>
          item.id === updatedItem.id ? updatedItem : item
        )
        setSupplementLibrary(updatedLibrary)
        await saveUserSupplementLibrary(user.id, updatedLibrary)
        setEditingItem(null)
      } catch (error) {
        console.error('Error updating supplement:', error)
      }
    }
  }

  const removeFromLibrary = async (id: string) => {
    if (user) {
      try {
        const updatedLibrary = supplementLibrary.filter(s => s.id !== id)
        setSupplementLibrary(updatedLibrary)
        await saveUserSupplementLibrary(user.id, updatedLibrary)
      } catch (error) {
        console.error('Error removing supplement from library:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-2xl text-white">📚</span>
            </div>
            <p className="text-gray-600">Loading library...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please log in to manage your supplement library.</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        {/* Header */}
        <div className="p-4 md:p-6 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs">Add, edit, and organize your supplements</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">{supplementLibrary.length}</div>
                <div className="text-xs md:text-sm text-gray-600 leading-tight">Total Supplements</div>
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">{categories.length}</div>
                <div className="text-xs md:text-sm text-gray-600 leading-tight">Categories</div>
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 col-span-2 md:col-span-1">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">
                  {supplementLibrary.length > 0 ? Math.round(supplementLibrary.length / categories.length * 10) / 10 : 0}
                </div>
                <div className="text-xs md:text-sm text-gray-600 leading-tight">Avg per Category</div>
              </div>
            </div>
          </div>

          {/* Search and Add Section */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-4 md:px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Supplement Library</h2>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-purple-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl hover:bg-purple-700 active:bg-purple-800 transition-all duration-200 font-medium transform active:scale-95"
                >
                  Add New Supplement
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6">
              {/* Search Input */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search supplements by name or category..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                  <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
                </div>
              </div>

              {/* Supplements List */}
              {filteredSupplements.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-purple-50 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📚</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {supplementLibrary.length === 0 ? 'No supplements in library' : 'No supplements match your search'}
                  </h3>
                  <p className="text-gray-500">
                    {supplementLibrary.length === 0 ? 'Add your first supplement to get started' : 'Try a different search term'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map(category => {
                    const categorySupplements = filteredSupplements.filter(s => s.category === category)
                    if (categorySupplements.length === 0) return null
                    
                    return (
                      <div key={category} className="space-y-2">
                        <h3 className="text-base md:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                          {category} ({categorySupplements.length})
                        </h3>
                        <div className="space-y-2">
                          {categorySupplements.map(supplement => (
                            <div key={supplement.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-all duration-200">
                              {editingItem?.id === supplement.id ? (
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <input
                                    type="text"
                                    value={editingItem.name}
                                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                                  />
                                  <input
                                    type="text"
                                    value={editingItem.defaultDosage}
                                    onChange={(e) => setEditingItem({...editingItem, defaultDosage: e.target.value})}
                                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                                  />
                                  <select
                                    value={editingItem.category}
                                    onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                                  >
                                    {categories.map((cat) => (
                                      <option key={cat} value={cat}>
                                        {cat}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <div className="flex-1">
                                  <h5 className="text-base md:text-lg font-medium text-gray-900">{supplement.name}</h5>
                                  <p className="text-sm text-gray-600">{supplement.defaultDosage}</p>
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-2 ml-4">
                                {editingItem?.id === supplement.id ? (
                                  <>
                                    <button
                                      onClick={() => updateLibraryItem(editingItem)}
                                      className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 active:bg-green-800 transition-all duration-200 font-medium"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingItem(null)}
                                      className="bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-700 active:bg-gray-800 transition-all duration-200 font-medium"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => setEditingItem(supplement)}
                                      className="text-blue-600 hover:text-blue-700 p-2 rounded-lg transition-all duration-200"
                                      title="Edit"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => removeFromLibrary(supplement.id)}
                                      className="text-red-600 hover:text-red-700 p-2 rounded-lg transition-all duration-200"
                                      title="Delete"
                                    >
                                      🗑️
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Supplement Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
              <div className="bg-purple-50 px-6 py-4 border-b border-purple-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Add New Supplement</h3>
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setNewSupplement({ name: '', defaultDosage: '', category: 'Vitamins' })
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
                <p className="text-sm text-purple-600 mt-1">Add a new supplement to your library</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {/* Supplement Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplement Name *
                    </label>
                    <input
                      type="text"
                      value={newSupplement.name}
                      onChange={(e) => setNewSupplement({...newSupplement, name: e.target.value})}
                      placeholder="e.g., Vitamin D3"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      autoFocus
                    />
                  </div>

                  {/* Default Dosage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Dosage
                    </label>
                    <input
                      type="text"
                      value={newSupplement.defaultDosage}
                      onChange={(e) => setNewSupplement({...newSupplement, defaultDosage: e.target.value})}
                      placeholder="e.g., 1000 IU"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newSupplement.category}
                      onChange={(e) => setNewSupplement({...newSupplement, category: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setNewSupplement({ name: '', defaultDosage: '', category: 'Vitamins' })
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      addToLibrary()
                    }}
                    disabled={!newSupplement.name.trim()}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      newSupplement.name.trim()
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Add to Library
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}