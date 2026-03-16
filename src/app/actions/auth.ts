'use server'

import { cookies } from 'next/headers'

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

      return { success: true }
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
