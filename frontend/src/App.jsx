import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('url')
  const [urlInput, setUrlInput] = useState('')
  const [textInput, setTextInput] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [urlValidation, setUrlValidation] = useState({ isValid: true, message: '' })


  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'
  // Accepted file types for document analysis
  const acceptedFileTypes = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain': '.txt',
    'application/rtf': '.rtf'
  }

  const maxFileSize = 10 * 1024 * 1024 // 10MB

  // Create floating particles on mount
  useEffect(() => {
    const createParticles = () => {
      const particlesContainer = document.querySelector('.particles')
      if (!particlesContainer) return

      // Clear existing particles
      particlesContainer.innerHTML = ''

      for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div')
        particle.className = 'particle'
        particle.style.left = Math.random() * 100 + '%'
        particle.style.animationDelay = Math.random() * 15 + 's'
        particle.style.animationDuration = (15 + Math.random() * 10) + 's'
        particlesContainer.appendChild(particle)
      }
    }

    createParticles()
  }, [])

  // Advanced URL validation function
  // Simplified and more accurate URL validation function
  const validateUrl = (url) => {
    if (!url || url.trim() === '') {
      return { isValid: false, message: 'Please enter a URL' }
    }

    const trimmedUrl = url.trim()

    // Try using the URL constructor (most reliable method)
    try {
      const urlObj = new URL(trimmedUrl)
      
      // Check if protocol is http or https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { isValid: false, message: 'URL must use HTTP or HTTPS protocol' }
      }

      // Check if hostname exists and is reasonable
      if (!urlObj.hostname || urlObj.hostname.length < 3) {
        return { isValid: false, message: 'Invalid domain name' }
      }

      // Additional basic checks for obviously invalid URLs
      if (urlObj.hostname.includes('..') || urlObj.hostname.startsWith('.') || urlObj.hostname.endsWith('.')) {
        return { isValid: false, message: 'Invalid domain format' }
      }

      return { isValid: true, message: 'Valid URL ✓' }
      
    } catch (e) {
      // Try to auto-correct common issues
      let correctedUrl = trimmedUrl

      // Add protocol if missing
      if (!correctedUrl.startsWith('http://') && !correctedUrl.startsWith('https://')) {
        correctedUrl = 'https://' + correctedUrl
      }

      try {
        const urlObj = new URL(correctedUrl)
        
        // Validate the corrected URL
        if (['http:', 'https:'].includes(urlObj.protocol) && 
            urlObj.hostname && 
            urlObj.hostname.length >= 3 &&
            !urlObj.hostname.includes('..') &&
            !urlObj.hostname.startsWith('.') &&
            !urlObj.hostname.endsWith('.')) {
          
          return { 
            isValid: true, 
            message: `Auto-corrected to: ${correctedUrl}`,
            correctedUrl
          }
        }
      } catch (e2) {
        // If auto-correction fails, return original error
      }
      
      return { isValid: false, message: 'Please enter a valid URL (e.g., https://example.com)' }
    }
  }


  // Helper function to validate IP addresses
  const isValidIP = (ip) => {
    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    return ipPattern.test(ip)
  }

  // File validation function
  const validateFile = (file) => {
    if (!file) {
      return { isValid: false, message: 'Please select a file' }
    }

    // Check file type
    if (!acceptedFileTypes[file.type]) {
      const allowedTypes = Object.values(acceptedFileTypes).join(', ')
      return { 
        isValid: false, 
        message: `File type not supported. Allowed types: ${allowedTypes}` 
      }
    }

    // Check file size
    if (file.size > maxFileSize) {
      return { 
        isValid: false, 
        message: `File too large. Maximum size is ${maxFileSize / 1024 / 1024}MB` 
      }
    }

    return { isValid: true, message: 'Valid file' }
  }

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Handle URL input change with real-time validation
  const handleUrlChange = (e) => {
    const url = e.target.value
    setUrlInput(url)
    
    if (url.trim()) {
      const validation = validateUrl(url)
      setUrlValidation(validation)
      
      // Auto-correct URL if suggested
      if (validation.correctedUrl) {
        setUrlInput(validation.correctedUrl)
      }
    } else {
      setUrlValidation({ isValid: true, message: '' })
    }
  }

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    setSelectedFile(file)
    setUploadProgress(0)

    if (file) {
      const validation = validateFile(file)
      if (!validation.isValid) {
        setError(validation.message)
        setSelectedFile(null)
      } else {
        setError('')
      }
    }
  }

  // Check if analysis can be performed
  const canAnalyze = () => {
    if (activeTab === 'url') {
      return urlInput.trim().length > 0 && urlValidation.isValid
    } else if (activeTab === 'text') {
      return textInput.trim().length > 50
    } else if (activeTab === 'document') {
      return selectedFile && validateFile(selectedFile).isValid
    }
    return false
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setError('')
    setResults(null)
    setUploadProgress(0)
    
    // Reset validation states
    if (tab !== 'url') {
      setUrlValidation({ isValid: true, message: '' })
    }
  }

  const analyzeContent = async () => {
    setIsLoading(true)
    setError('')
    setResults(null)
    setUploadProgress(0)

    try {
      let response

      if (activeTab === 'document') {
        // Handle file upload
        const formData = new FormData()
        formData.append('type', 'document')
        formData.append('file', selectedFile)

        response = await axios.post(`${API_BASE}/analyze`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // Increased timeout for file processing
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percentCompleted)
          }
        })
      } else {
        // Handle URL or text analysis
        const payload = {
          type: activeTab,
          data: activeTab === 'url' ? urlInput.trim() : textInput.trim()
        }

        response = await axios.post(`${API_BASE}/analyze`, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000
        })
      }

      setResults(response.data)
      setUploadProgress(100)
      
      // Smooth scroll to results
      setTimeout(() => {
        const resultsEl = document.querySelector('.results-container')
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)

    } catch (err) {
      console.error('Analysis error:', err)
      
      if (err.response?.data?.error) {
        setError(err.response.data.error)
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please try again with smaller content or check your connection.')
      } else if (err.message.includes('Network Error')) {
        setError('Unable to connect to the analysis service. Please ensure the backend is running on port 8080.')
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
      setUploadProgress(0)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate score angle for circular progress
  const scoreAngle = results ? (results.credibility_score / 100) * 360 : 0

  return (
    <div className="app">
      {/* Animated Background */}
      <div className="animated-bg"></div>
      
      {/* Floating Particles */}
      <div className="particles"></div>

      {/* Header */}
      <header className="header">
        <h1>Credibility Guardian</h1>
        <p>By Team TechnoCrat</p>
        <br />
        <p>Advanced AI-powered misinformation detection</p>
      </header>

      {/* Input Form */}
      <div className="form-container glass-container">
        <div className="tab-nav">
          <button 
            className={`tab-button ${activeTab === 'url' ? 'active' : ''}`}
            onClick={() => handleTabChange('url')}
          >
            🔗 URL Analysis
          </button>
          <button 
            className={`tab-button ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => handleTabChange('text')}
          >
            📝 Text Analysis
          </button>
          <button 
            className={`tab-button ${activeTab === 'document' ? 'active' : ''}`}
            onClick={() => handleTabChange('document')}
          >
            📄 Document Analysis
          </button>
        </div>

        <div className="input-container">
          {activeTab === 'url' && (
            <div className="input-group">
              <label htmlFor="url-input">Article URL</label>
              <input
                id="url-input"
                type="url"
                value={urlInput}
                onChange={handleUrlChange}
                className={`input-field ${!urlValidation.isValid ? 'error' : urlValidation.message && urlValidation.isValid ? 'success' : ''}`}
                placeholder="https://example.com/article"
                disabled={isLoading}
              />
              {urlValidation.message && (
                <div className={`validation-message ${urlValidation.isValid ? 'success' : 'error'}`}>
                  {urlValidation.isValid ? '✓' : '✗'} {urlValidation.message}
                </div>
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="input-group">
              <label htmlFor="text-input">Text Content</label>
              <textarea
                id="text-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="textarea-field"
                placeholder="Paste your text content here for analysis... (minimum 50 characters)"
                disabled={isLoading}
              />
              <div className="char-counter">
                {textInput.length} characters {textInput.length < 50 && `(need ${50 - textInput.length} more)`}
              </div>
            </div>
          )}

          {activeTab === 'document' && (
            <div className="input-group">
              <label htmlFor="file-input">Upload Document</label>
              <div className="file-upload-area">
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt,.rtf"
                  className="file-input"
                  disabled={isLoading}
                />
                <div className="file-upload-content">
                  {selectedFile ? (
                    <div className="file-info">
                      <div className="file-icon">📄</div>
                      <div className="file-details">
                        <div className="file-name">{selectedFile.name}</div>
                        <div className="file-meta">
                          {formatFileSize(selectedFile.size)} • {selectedFile.type}
                        </div>
                      </div>
                      <button 
                        className="file-remove"
                        onClick={() => setSelectedFile(null)}
                        disabled={isLoading}
                      >
                        ✗
                      </button>
                    </div>
                  ) : (
                    <div className="file-placeholder">
                      <div className="file-icon">📎</div>
                      <div>Click to select or drag and drop</div>
                      <div className="file-hint">PDF, DOC, DOCX, TXT, RTF • Max 10MB</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Upload Progress */}
              {isLoading && activeTab === 'document' && uploadProgress > 0 && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">{uploadProgress}% uploaded</div>
                </div>
              )}
            </div>
          )}
        </div>

        <button 
          className="analyze-btn"
          onClick={analyzeContent}
          disabled={isLoading || !canAnalyze()}
        >
          {isLoading && <span className="loading-spinner"></span>}
          {isLoading 
            ? (activeTab === 'document' ? 'Processing Document...' : 'Analyzing...') 
            : 'Analyze Content'
          }
        </button>
      </div>

      {/* Results Section */}
      {results && (
        <div className="results-container">
          {/* Score Card */}
          <div className="score-card glass-container">
            <div className="score-display">
              <div 
                className="score-circle"
                style={{ '--score-angle': `${scoreAngle}deg` }}
              >
                <div className="score-number">{results.credibility_score}</div>
              </div>
              <div>
                <div className="score-assessment">
                  {results.analysis?.overall_assessment || 'Assessment Complete'}
                </div>
                {results.analysis_type && (
                  <div className="analysis-type">
                    Analysis Type: {results.analysis_type.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="summary-card glass-container">
            <h3 className="card-title">Summary</h3>
            <p className="card-content">{results.summary_of_claims}</p>
          </div>

          {/* Manipulative Techniques */}
          {results.analysis?.manipulative_techniques?.length > 0 ? (
            <div className="techniques-card glass-container">
              <h3 className="card-title">Manipulative Techniques Detected</h3>
              {results.analysis.manipulative_techniques.map((technique, index) => (
                <div key={index} className="technique-item">
                  <div className="technique-name">{technique.technique}</div>
                  <div className="technique-explanation">{technique.explanation}</div>
                  <div className="technique-quote">"{technique.flagged_quote}"</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="summary-card glass-container">
              <h3 className="card-title">Analysis Complete</h3>
              <p className="card-content">No specific manipulative techniques were detected in this content.</p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-card glass-container">
          <h3 className="card-title">Error</h3>
          <p className="card-content">{error}</p>
          <button 
            onClick={() => setError('')} 
            className="analyze-btn" 
            style={{ marginTop: '16px' }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}

export default App
