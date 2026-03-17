'use server'

import { cookies } from 'next/headers'

const API_BASE = 'https://triad.my.id/api/v1'

export async function fetchTenants(userId?: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  const role = cookieStore.get('user_role')?.value
  const tenantId = cookieStore.get('user_tenant')?.value
  const userName = cookieStore.get('user_name')?.value

  // For regular users, don't use the userId query param as it might be restricted
  const url = (role !== 'user' && userId) ? `${API_BASE}/tenants?user_id=${userId}` : `${API_BASE}/tenants`

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }

    // For regular users, we generally use the X-Tenant-ID header instead of full list access
    console.log('DEBUG [fetchTenants] Initial:', { role, tenantId, requestedUserId: userId, url });

    if (role === 'user' && tenantId) {
      headers['X-Tenant-ID'] = tenantId;
      console.log('DEBUG [fetchTenants] Restricted user: Added X-Tenant-ID header');
    }

    console.log('DEBUG [fetchTenants] Final Headers:', headers);

    const res = await fetch(url, {
      method: 'GET',
      headers: headers
    })

    const text = await res.text();
    console.log('DEBUG [fetchTenants] RAW Response:', { status: res.status, text: text.substring(0, 100) });

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { success: false, error: `API Error (${res.status}): Invalid JSON | Role: ${role} | Tenant: ${tenantId}` }
    }

    if (!res.ok) {
        return { success: false, error: `${data.message || 'Error'} (${res.status}) | Role: ${role} | Tenant: ${tenantId}` }
    }
    return { success: true, data: data.data || [] }
  } catch (err) {
    console.error('DEBUG [fetchTenants] Catch Error:', err);
    return { success: false, error: 'Network error' }
  }
}

export async function createTenant(payload: Record<string, unknown>) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }

    const tenantId = cookieStore.get('user_tenant')?.value
    const role = cookieStore.get('user_role')?.value
    
    console.log('DEBUG [createTenant]:', { role, tenantId });

    if (role === 'user' && tenantId) {
      headers['X-Tenant-ID'] = tenantId
      console.log('DEBUG [createTenant]: Added X-Tenant-ID header');
    }

    const res = await fetch(`${API_BASE}/tenants`, {
      method: 'POST',
      headers: headers,
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
        'Content-Type': 'application/json',
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

export async function fetchTenantById(id: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return { success: false, error: 'Unauthorized' }

  const tenantIdCookie = cookieStore.get('user_tenant')?.value
  const role = cookieStore.get('user_role')?.value
  const userName = cookieStore.get('user_name')?.value

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }

    if (role === 'user' && tenantIdCookie) {
      headers['X-Tenant-ID'] = tenantIdCookie
      console.log('DEBUG [fetchTenantById] Restricted user: Added X-Tenant-ID header');
    }

    console.log('DEBUG [fetchTenantById] Final Headers:', headers);

    const res = await fetch(`${API_BASE}/tenants/${id}`, {
      method: 'GET',
      headers: headers
    })
    const data = await res.json()
    console.log('DEBUG [fetchTenantById] Response:', { status: res.status, id, data });
    
    if (!res.ok) {
        return { success: false, error: `${data.message || 'Error'} (${res.status}) | Role: ${role} | Tenant: ${tenantIdCookie}` }
    }

    return { success: true, data: data.data }
  } catch (err) {
    console.error('DEBUG [fetchTenantById] Catch Error:', err);
    return { success: false, error: `Network error | Role: ${role}` }
  }
}
