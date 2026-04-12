'use server'

import { cookies } from 'next/headers'

const API_BASE = 'https://triad.my.id/api/v1'

export async function fetchPayments() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const tenantId = cookieStore.get('user_tenant')?.value
  const role = cookieStore.get('user_role')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }

    if (role === 'user' && tenantId) {
      headers['X-Tenant-ID'] = tenantId
    }

    const res = await fetch(`${API_BASE}/payments`, {
      method: 'GET',
      headers: headers,
      cache: 'no-store'
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to fetch payments' }
    return { success: true, data: data.data || [] }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function fetchPaymentById(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const role = cookieStore.get('user_role')?.value
  const tenantId = cookieStore.get('user_tenant')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }

    // Usually admin might not need X-Tenant-ID for global view, 
    // but if the endpoint requires it for specific resource lookup, we include it based on role.
    if (role === 'user' && tenantId) {
        headers['X-Tenant-ID'] = tenantId
    }

    const res = await fetch(`${API_BASE}/payments/${id}`, {
      method: 'GET',
      headers: headers,
      cache: 'no-store'
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to fetch payment' }
    return { success: true, data: data.data }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function createPayment(payload: Record<string, unknown>) {
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

    const res = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    if (!res.ok) {
      console.error("Create Payment Backend Error:", data);
      return { success: false, error: data.message || data.error || 'Failed to create payment' }
    }
    return { success: true, data: data.data }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function verifyPayment(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/payments/${id}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to verify payment' }
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function rejectPayment(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/payments/${id}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to reject payment' }
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function uploadPaymentProof(formData: FormData) {
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

    const res = await fetch(`${API_BASE}/payments/upload-proof`, {
      method: 'POST',
      headers: headers,
      body: formData
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to upload proof' }
    return { success: true, data: data.data }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}
