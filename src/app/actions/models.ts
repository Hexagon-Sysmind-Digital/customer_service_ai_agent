'use server'

import { cookies } from 'next/headers'

const API_BASE = 'https://triad.my.id/api/v1'

export async function fetchModels() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await res.json()
    if (!res.ok) {
        return { success: false, error: data.message || 'Failed to fetch models' }
    }
    return { success: true, data: data.data || [] }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function createModel(payload: { model_name: string; model_code: string }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/models`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to create model' }
    return { success: true, data: data.data }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function updateModel(id: string, payload: { model_name: string; model_code: string }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/models/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to update model' }
    return { success: true, data: data.data }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function deleteModel(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/models/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to delete model' }
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}
