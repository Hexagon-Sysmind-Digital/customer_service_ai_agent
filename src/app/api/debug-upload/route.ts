import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const API_BASE = 'https://triad.my.id/api/v1'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const tenantId = cookieStore.get('user_tenant')?.value

  return NextResponse.json({
    token_exists: !!token,
    tenant_id: tenantId,
    upload_endpoint: `${API_BASE}/products/upload-image`,
    test_image_url: 'https://triad.my.id/storage/image/c336700b-c79c-44d5-9f0a-0df8434a92cb.jpg',
    message: 'Use POST with a file to test upload'
  })
}

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const tenantId = cookieStore.get('user_tenant')?.value

  if (!token) {
    return NextResponse.json({ error: 'No auth token in cookies' }, { status: 401 })
  }

  try {
    // Forward the multipart form data to the backend
    const formData = await req.formData()
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`
    }
    if (tenantId) headers['X-Tenant-ID'] = tenantId

    const backendRes = await fetch(`${API_BASE}/products/upload-image`, {
      method: 'POST',
      headers,
      body: formData
    })

    const rawText = await backendRes.text()
    let parsedJson: unknown = null
    try {
      parsedJson = JSON.parse(rawText)
    } catch {
      parsedJson = null
    }

    return NextResponse.json({
      http_status: backendRes.status,
      ok: backendRes.ok,
      raw_text: rawText,
      parsed_json: parsedJson,
      response_headers: Object.fromEntries(backendRes.headers.entries()),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
