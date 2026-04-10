'use server'

import { cookies } from 'next/headers'

const API_BASE = 'https://triad.my.id/api/v1'

function getCommonHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export async function connectWhatsApp() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  
  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/whatsapp/connect`, {
      method: 'POST',
      headers: getCommonHeaders(token)
    })
    
    const text = await res.text()
    let data;
    try {
      data = JSON.parse(text)
    } catch(e) {
      return { success: false, error: `API Error (${res.status}): failed parsing JSON` }
    }

    if (!res.ok) {
      return { success: false, error: data.error || data.message || 'Error connecting WhatsApp' }
    }
    
    return { success: true, data: data.data || data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}

export async function statusWhatsApp() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  
  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/whatsapp/status`, {
      method: 'GET',
      headers: getCommonHeaders(token),
      cache: 'no-store'
    })
    
    const text = await res.text()
    let data;
    try {
      data = JSON.parse(text)
    } catch(e) {
      return { success: false, error: `API Error (${res.status}): failed parsing JSON` }
    }

    if (!res.ok) {
      return { success: false, error: data.error || data.message || 'Error checking WhatsApp status' }
    }
    
    return { success: true, data: data.data || data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}

export async function disconnectWhatsApp() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  
  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/whatsapp/disconnect`, {
      method: 'POST',
      headers: getCommonHeaders(token)
    })
    
    const text = await res.text()
    let data;
    try {
      data = JSON.parse(text)
    } catch(e) {
      return { success: false, error: `API Error (${res.status}): failed parsing JSON` }
    }

    if (!res.ok) {
      return { success: false, error: data.error || data.message || 'Error disconnecting WhatsApp' }
    }
    
    return { success: true, data: data.data || data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}
