'use server'

import { cookies } from 'next/headers'

const API_BASE = 'https://triad.my.id/api/v1'

export async function fetchTenants() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/tenants`, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain',
        'Authorization': `Bearer ${token}`
      }
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to fetch tenants' }
    return { success: true, data: data.data || [] }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function createTenant(payload: Record<string, unknown>) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to create tenant' }
    return { success: true, data: data.data }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function updateTenant(id: string, payload: Record<string, unknown>) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/tenants/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/plain',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to update tenant' }
    return { success: true, data: data.data }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function deleteTenant(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/tenants/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to delete tenant' }
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}
