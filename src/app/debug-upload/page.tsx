'use client'

import { useState } from 'react'

export default function DebugUploadPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fieldName, setFieldName] = useState('image')

  const handleTest = async () => {
    setLoading(true)
    setResult(null)

    try {
      if (!selectedFile) {
        // Test GET - check token
        const res = await fetch('/api/debug-upload')
        const data = await res.json()
        setResult(data)
      } else {
        // Test POST with file
        const fd = new FormData()
        fd.append(fieldName, selectedFile)
        
        const res = await fetch('/api/debug-upload', {
          method: 'POST',
          body: fd,
        })
        const data = await res.json()
        setResult(data)
      }
    } catch (err) {
      setResult({ error: String(err) })
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto', fontFamily: 'monospace' }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>🔧 Debug: Upload Image API</h1>

      <div style={{ background: '#1e1e1e', color: '#fff', padding: 20, borderRadius: 12, marginBottom: 20 }}>
        <p style={{ margin: '0 0 8px', opacity: 0.6, fontSize: 12 }}>STEP 1: Check token</p>
        <button
          onClick={() => { setSelectedFile(null); handleTest(); }}
          style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
        >
          GET /api/debug-upload (check token)
        </button>
      </div>

      <div style={{ background: '#1e1e1e', color: '#fff', padding: 20, borderRadius: 12, marginBottom: 20 }}>
        <p style={{ margin: '0 0 12px', opacity: 0.6, fontSize: 12 }}>STEP 2: Upload test file</p>
        
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Field name:</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['image', 'file', 'photo', 'picture', 'upload'].map(name => (
              <button
                key={name}
                onClick={() => setFieldName(name)}
                style={{
                  background: fieldName === name ? '#6366f1' : '#333',
                  color: '#fff', border: 'none', padding: '4px 10px',
                  borderRadius: 6, cursor: 'pointer', fontSize: 12
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={e => setSelectedFile(e.target.files?.[0] || null)}
          style={{ marginBottom: 12, display: 'block', color: '#fff' }}
        />
        
        <button
          onClick={handleTest}
          disabled={!selectedFile || loading}
          style={{
            background: selectedFile ? '#22c55e' : '#555',
            color: '#fff', border: 'none', padding: '8px 16px',
            borderRadius: 8, cursor: selectedFile ? 'pointer' : 'not-allowed', fontSize: 14
          }}
        >
          {loading ? 'Testing...' : `POST with field="${fieldName}"`}
        </button>
      </div>

      {result && (
        <div style={{ background: '#0d1117', color: '#e6edf3', padding: 20, borderRadius: 12, border: '1px solid #30363d' }}>
          <p style={{ margin: '0 0 8px', color: '#58a6ff', fontSize: 12 }}>RAW RESPONSE:</p>
          <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.6, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(result, null, 2)}
          </pre>

          {result.parsed_json?.data?.image_url && (
            <div style={{ marginTop: 20, borderTop: '1px solid #30363d', paddingTop: 20 }}>
              <p style={{ color: '#3fb950', fontSize: 12, margin: '0 0 8px' }}>✅ Found image_url in response:</p>
              <p style={{ color: '#fff', fontSize: 13, marginBottom: 12 }}>{result.parsed_json.data.image_url}</p>
              <img
                src={result.parsed_json.data.image_url}
                alt="test"
                style={{ maxWidth: 200, height: 'auto', borderRadius: 8 }}
                onError={(e) => {
                  const el = e.currentTarget
                  el.style.display = 'none'
                  el.nextElementSibling!.textContent = `❌ Image URL 404`
                }}
              />
              <span style={{ color: '#f85149', fontSize: 12 }}></span>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 24, padding: 16, background: '#161b22', borderRadius: 12, fontSize: 12, color: '#8b949e' }}>
        <strong style={{ color: '#e6edf3' }}>Instructions:</strong>
        <ol style={{ margin: '8px 0 0 16px', lineHeight: 2 }}>
          <li>Click "GET" to verify your auth token exists</li>
          <li>Select an image file</li>
          <li>Try each field name (image, file, photo...) until upload succeeds</li>
          <li>Check the raw response to find the correct URL field</li>
        </ol>
      </div>
    </div>
  )
}
