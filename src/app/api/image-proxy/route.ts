import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Image proxy: /api/image-proxy?url=<encoded-url>
 * Fetches images from triad.my.id/storage through the server,
 * adding the auth token since the storage might not be publicly accessible.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const imageUrl = searchParams.get('url')

  if (!imageUrl) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  try {
    const decodedUrl = decodeURIComponent(imageUrl)
    
    // Get auth token and tenant ID from cookies
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    const tenantId = cookieStore.get('user_tenant')?.value

    const fetchHeaders: Record<string, string> = {}
    if (token) {
      fetchHeaders['Authorization'] = `Bearer ${token}`
    }
    if (tenantId) {
      fetchHeaders['X-Tenant-ID'] = tenantId
    }

    // Try fetching with auth and tenant headers first
    let res = await fetch(decodedUrl, { headers: fetchHeaders })

    // If still 404, let's try some common alternative paths
    if (res.status === 404) {
      const urlObj = new URL(decodedUrl);
      const alternatives = [
        // 1. Try removing /storage
        decodedUrl.replace('/storage/', '/'),
        // 2. Try changing /storage/image to /images
        decodedUrl.replace('/storage/image/', '/images/'),
        // 3. Try adding /api/v1/ if it was missing 
        `${urlObj.origin}/api/v1${urlObj.pathname}`
      ];

      for (const alt of alternatives) {
        if (alt === decodedUrl) continue;
        const altRes = await fetch(alt, { headers: fetchHeaders });
        if (altRes.ok) {
          res = altRes;
          console.log(`[image-proxy] Found working alternative: ${alt}`);
          break;
        }
      }
    }

    // Last resort: without auth
    if (!res.ok) {
      res = await fetch(decodedUrl)
    }

    if (!res.ok) {
      return new NextResponse(`Backend Image Not Found: ${res.status} at ${decodedUrl}`, { status: res.status })
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error('[image-proxy] error:', err)
    return new NextResponse('Proxy error', { status: 500 })
  }
}

