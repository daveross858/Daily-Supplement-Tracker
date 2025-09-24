import React, { useState, useEffect, useRef } from 'react'
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
  const [showCamera, setShowCamera] = useState(false)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
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

  // Camera and image processing functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setShowCamera(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setShowCamera(false)
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context?.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        setIsProcessingImage(true)
        await processSupplementImage(blob)
        setIsProcessingImage(false)
      }
    }, 'image/jpeg', 0.8)

    stopCamera()
  }

  const processSupplementImage = async (imageBlob: Blob) => {
    try {
      // Convert blob to base64
      const base64Image = await blobToBase64(imageBlob)
      
      // Call AI service to extract text (using a simple mock for now)
      const extractedInfo = await extractSupplementInfo(base64Image)
      
      // Populate form with extracted information
      setNewSupplement({
        name: extractedInfo.name || '',
        defaultDosage: extractedInfo.dosage || '',
        category: extractedInfo.category || 'Vitamins'
      })
      
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Error processing image. Please try again or enter information manually.')
    }
  }

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const extractSupplementInfo = async (base64Image: string): Promise<{name?: string, dosage?: string, category?: string}> => {
    // This is a simplified mock implementation
    // In a real app, you would integrate with services like:
    // - Google Cloud Vision API
    // - AWS Textract
    // - OpenAI GPT-4 Vision
    // - Azure Computer Vision
    
    try {
      // For demo purposes, we'll use a simple regex pattern matching
      // In reality, you'd send this to an AI service
      
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock extracted data (in real implementation, this would come from AI service)
      const mockResults = [
        { name: 'Vitamin D3', dosage: '2000 IU', category: 'Vitamins' },
        { name: 'Omega-3 Fish Oil', dosage: '1000mg', category: 'Essential Fatty Acids' },
        { name: 'Magnesium Glycinate', dosage: '400mg', category: 'Minerals' },
        { name: 'Probiotics', dosage: '50 Billion CFU', category: 'Digestive Health' },
        { name: 'Turmeric Curcumin', dosage: '500mg', category: 'Herbal' }
      ]
      
      // Return a random result for demo
      const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)]
      return randomResult
      
    } catch (error) {
      console.error('Error extracting supplement info:', error)
      return {}
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

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-t-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Scan Supplement Label</h3>
                <button
                  onClick={stopCamera}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Position the supplement label within the frame and tap capture
              </p>
            </div>
            
            <div className="relative bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 object-cover"
              />
              
              {/* Overlay guide */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-white border-dashed w-4/5 h-3/5 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                    Position label here
                  </span>
                </div>
              </div>
              
              {/* Capture button */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <button
                  onClick={capturePhoto}
                  disabled={isProcessingImage}
                  className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {isProcessingImage ? (
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
                  )}
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-b-xl p-4">
              <p className="text-xs text-gray-500 text-center">
                {isProcessingImage ? 'Processing image...' : 'Tap the button to capture'}
              </p>
            </div>
          </div>
          
          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Image</h3>
            <p className="text-sm text-gray-600">
              Extracting supplement information from the label...
            </p>
          </div>
        </div>
      )}

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
                
                {/* Camera Button */}
                <div className="mt-3 flex justify-center">
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span className="text-lg">📷</span>
                    Scan Label with Camera
                  </button>
                </div>
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