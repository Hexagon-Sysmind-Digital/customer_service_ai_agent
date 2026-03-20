'use server'

import { cookies } from 'next/headers'

const API_BASE = 'https://triad.my.id/api/v1'

export async function fetchDashboardSummary() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/dashboard/summary`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to fetch dashboard summary' }
    return { success: true, data: data.data }
  } catch (err: any) {
    return { success: false, error: `Network error: ${err.message || 'Unknown'}` }
  }
}
