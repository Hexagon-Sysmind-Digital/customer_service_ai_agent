'use server'

import { cookies } from 'next/headers'
import { Credit, PaymentStatus } from '@/types'

const API_BASE = 'https://triad.my.id/api/v1'

export async function fetchCredits() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/credits`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to fetch credits' }
    return { success: true, data: data.data || [] }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function fetchCreditById(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/credits/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to fetch credit' }
    return { success: true, data: data.data }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function fetchPaymentStatus(userId?: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  const url = userId ? `${API_BASE}/credits/payment-status?user_id=${userId}` : `${API_BASE}/credits/payment-status`

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to fetch payment status' }
    return { success: true, data: data.data as PaymentStatus }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function createCredit(formData: FormData, isAdmin: boolean) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  const payload: any = {
    amount: Number(formData.get('amount')),
    billing_month: formData.get('billing_month'),
    due_date: formData.get('due_date'),
    subscription_start: formData.get('subscription_start'),
    subscription_end: formData.get('subscription_end'),
    next_renewal_date: formData.get('next_renewal_date'),
    notes: formData.get('notes'),
  }

  // Admin specific fields
  if (isAdmin) {
    payload.user_id = formData.get('user_id')
    payload.tenant_id = formData.get('tenant_id')
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  // Admin headers mapping
  if (isAdmin) {
    const userId = formData.get('user_id') as string | null
    const tenantId = formData.get('tenant_id') as string | null

    if (userId) {
      headers['X-Users-ID'] = userId
    }
    if (tenantId) {
       headers['X-Tenant-ID'] = tenantId
    }
  }

  try {
    const res = await fetch(`${API_BASE}/credits`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to create credit' }
    return { success: true, data: data.data }
  } catch (err) {
    console.error(err)
    return { success: false, error: 'Network error' }
  }
}

export async function updateCreditStatus(id: string, status: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/credits/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to update credit' }
    return { success: true, data: data.data }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function deleteCredit(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/credits/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to delete credit' }
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function sendReminders() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/credits/send-reminders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to send reminders' }
    return { success: true, message: data.message }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}
