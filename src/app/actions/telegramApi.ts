'use server'

import { cookies } from 'next/headers'

const API_BASE = 'https://triad.my.id/api/v1'

async function getToken() {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value
}

function headers(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

/**
 * POST /api/v1/telegram/config
 * Setup Bot Telegram Token untuk Tenant
 */
export async function updateTelegramConfig(telegramToken: string, enabled: boolean) {
  const token = await getToken()
  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/telegram/config`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({
        telegram_token: telegramToken,
        telegram_enabled: enabled
      })
    })

    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch {
      return { success: false, error: `API Error (${res.status}): failed parsing JSON` }
    }

    if (!res.ok) {
      return { success: false, error: data.error || data.message || 'Failed to update Telegram config' }
    }

    return { success: true, data: data.data || data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}

/**
 * POST /api/v1/telegram/connect
 * Menghubungkan dan menjalankan polling bot Telegram
 */
export async function connectTelegram() {
  const token = await getToken()
  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/telegram/connect`, {
      method: 'POST',
      headers: headers(token)
    })

    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch {
      return { success: false, error: `API Error (${res.status}): failed parsing JSON` }
    }

    if (!res.ok) {
      return { success: false, error: data.error || data.message || 'Failed to connect Telegram' }
    }

    return { success: true, data: data.data || data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}

/**
 * GET /api/v1/telegram/status
 * Cek status poller bot Telegram
 */
export async function statusTelegram() {
  const token = await getToken()
  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/telegram/status`, {
      method: 'GET',
      headers: headers(token),
      cache: 'no-store'
    })

    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch {
      return { success: false, error: `API Error (${res.status}): failed parsing JSON` }
    }

    if (!res.ok) {
      return { success: false, error: data.error || data.message || 'Failed to check Telegram status' }
    }

    return { success: true, data: data.data || data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}

/**
 * POST /api/v1/telegram/disconnect
 * Mematikan proses polling Telegram (graceful shutdown)
 */
export async function disconnectTelegram() {
  const token = await getToken()
  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/telegram/disconnect`, {
      method: 'POST',
      headers: headers(token)
    })

    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch {
      return { success: false, error: `API Error (${res.status}): failed parsing JSON` }
    }

    if (!res.ok) {
      return { success: false, error: data.error || data.message || 'Failed to disconnect Telegram' }
    }

    return { success: true, data: data.data || data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}
