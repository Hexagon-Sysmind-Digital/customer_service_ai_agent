import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const API_BASE = 'https://triad.my.id/api/v1'

/**
 * POST /api/products/upload-image
 * Proxies the image upload to the backend with proper auth headers.
 * Using a Next.js API route avoids the FormData serialization issue
 * that can occur with Next.js Server Actions.
 */
export async function POST(req: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const tenantId = cookieStore.get('user_tenant')?.value

  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`
    }

    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId
    }

    const backendRes = await fetch(`${API_BASE}/products/upload-image`, {
      method: 'POST',
      headers,
      body: formData,
    })

    const contentType = backendRes.headers.get('content-type') || ''
    let data: any

    if (contentType.includes('application/json')) {
      data = await backendRes.json()
    } else {
      const text = await backendRes.text()
      console.error('[upload-image proxy] Backend returned non-JSON:', text)
      return NextResponse.json(
        { success: false, error: `Backend Error (${backendRes.status}): ${text.substring(0, 100)}` },
        { status: backendRes.status }
      )
    }

    if (!backendRes.ok) {
      console.error('[upload-image proxy] Backend Error Data:', data)
      return NextResponse.json(
        { success: false, error: data.message || data.error || 'Upload failed' },
        { status: backendRes.status }
      )
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[upload-image proxy] CRITICAL ERROR:', err)
    return NextResponse.json(
      { success: false, error: `Proxy Error: ${err.message || 'Unknown error'}` }, 
      { status: 500 }
    )
  }
}
