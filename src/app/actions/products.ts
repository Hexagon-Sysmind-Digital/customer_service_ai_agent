'use server'

import { cookies } from 'next/headers'

const API_BASE = 'https://triad.my.id/api/v1'

export async function fetchProducts() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const tenantId = cookieStore.get('user_tenant')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }

    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId
    }

    const res = await fetch(`${API_BASE}/products`, {
      method: 'GET',
      headers: headers,
      cache: 'no-store'
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to fetch products' }
    return { success: true, data: data.data || [] }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function fetchProductById(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const tenantId = cookieStore.get('user_tenant')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }

    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId
    }

    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'GET',
      headers: headers,
      cache: 'no-store'
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to fetch product' }
    return { success: true, data: data.data }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function createProduct(payload: Record<string, unknown>) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const tenantId = cookieStore.get('user_tenant')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }

    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId
    }

    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to create product' }
    return { success: true, data: data.data }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function updateProduct(id: string, payload: Record<string, unknown>) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const tenantId = cookieStore.get('user_tenant')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }

    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId
    }

    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to update product' }
    return { success: true, data: data.data }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function deleteProduct(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const tenantId = cookieStore.get('user_tenant')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`
    }

    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId
    }

    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: headers
    })

    if (!res.ok) {
        const data = await res.json()
        return { success: false, error: data.message || 'Failed to delete product' }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function uploadProductImage(formData: FormData) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const tenantId = cookieStore.get('user_tenant')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`
      // NOTE: Do NOT set Content-Type here — fetch will auto-set multipart/form-data with boundary
    }

    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId
    }

    const res = await fetch(`${API_BASE}/products/upload-image`, {
      method: 'POST',
      headers: headers,
      body: formData
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || data.error || 'Failed to upload image' }

    // Confirmed API response: { success: true, data: { image_url: "https://triad.my.id/storage/image/xxx.jpg" } }
    const imageUrl: string = data?.data?.image_url || data?.data?.url || data?.image_url || ''

    return { success: true, data: { image_url: imageUrl } }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}
