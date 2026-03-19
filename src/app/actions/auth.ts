'use server'

import { cookies } from 'next/headers'
 
const API_BASE = 'https://triad.my.id//api/v1'

export async function login(formData: FormData) {
  const email = formData.get('email')
  const password = formData.get('password')

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' }
  }

  try {
    const response = await fetch('https://triad.my.id/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.message || 'Login failed' }
    }

    if (data.data?.token) {
      // Set the HTTP-only cookie
      const cookieStore = await cookies()
      cookieStore.set({
        name: 'auth_token',
        value: data.data.token,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })

      // Store user info in non-http-only cookies for quick access (if present in login response)
      const user = data.data.user;
      const apiKey = data.data.api_key;
      
      if (user) {
        cookieStore.set('user_id', user.id || user.user_id || '', { path: '/' });
        cookieStore.set('user_role', user.role || 'user', { path: '/' });
        cookieStore.set('user_tenant', user.tenant_id || apiKey || '', { path: '/' });
        cookieStore.set('user_name', user.name || '', { path: '/' });
        if (apiKey) {
          cookieStore.set('api_key', apiKey, { path: '/' });
        }
      } else {
         // Try to decode JWT if user info is not explicitly provided
         try {
           const parts = data.data.token.split('.');
           if (parts.length === 3) {
             const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
             cookieStore.set('user_id', payload.sub || payload.id || payload.user_id || '', { path: '/' });
             cookieStore.set('user_role', payload.role || 'user', { path: '/' });
             cookieStore.set('user_tenant', payload.tenant_id || payload.tid || '', { path: '/' });
             cookieStore.set('user_name', payload.name || payload.email || '', { path: '/' });
           }
         } catch (e) {
           console.error('Failed to decode token on login:', e);
         }
      }

      return { 
        success: true, 
        token: data.data.token,
        api_key: apiKey,
        user: user ? {
          ...user,
          tenant_id: user.tenant_id || apiKey // Fallback to api_key as tenant_id for convenience
        } : {
          id: cookieStore.get('user_id')?.value,
          role: cookieStore.get('user_role')?.value,
          tenant_id: cookieStore.get('user_tenant')?.value,
          name: cookieStore.get('user_name')?.value,
          api_key: cookieStore.get('api_key')?.value,
        } 
      }
    } else {

      return { success: false, error: 'Invalid response from server' }
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('auth_token')
  return { success: true }
}

export async function getMe() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { success: false, error: `API Error (${res.status}): ${text.substring(0, 50)}...` }
    }

    if (!res.ok) {
        // Fallback to cookie info if API fails (e.g. 403 or 401)
        const userId = cookieStore.get('user_id')?.value;
        const userRole = cookieStore.get('user_role')?.value;
        const userTenant = cookieStore.get('user_tenant')?.value;
        const userName = cookieStore.get('user_name')?.value;

        if (userId && userRole) {
            return {
                success: true,
                data: {
                    id: userId,
                    role: userRole,
                    tenant_id: userTenant,
                    name: userName || 'User',
                    email: '', // Not in cookies
                }
            };
        }
        return { success: false, error: data.message || `API Error (${res.status})` }
    }
    
    // Sync cookies with fresh data
    if (data.success && data.data) {
        const user = data.data;
        cookieStore.set('user_id', user.id || '', { path: '/' });
        cookieStore.set('user_role', user.role || 'user', { path: '/' });
        cookieStore.set('user_tenant', user.tenant_id || '', { path: '/' });
        cookieStore.set('user_name', user.name || '', { path: '/' });
    }

    return { success: true, data: data.data }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}

export async function updateProfile(payload: { name?: string; email?: string; password?: string }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return { success: false, error: 'Unauthorized' }

  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message || 'Failed to update profile' }
    
    // Update name cookie if successful
    if (data.success && data.data?.name) {
        cookieStore.set('user_name', data.data.name, { path: '/' });
    }

    return { success: true, data: data.data }
  } catch (err) {
    return { success: false, error: 'Network error' }
  }
}




