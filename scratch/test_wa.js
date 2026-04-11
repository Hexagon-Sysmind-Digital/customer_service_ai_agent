const fs = require('fs');

async function main() {
  const API_BASE = 'https://triad.my.id/api/v1';

  console.log('Logging in...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'jayaabadi@gmail.com', password: 'jaya123' })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error('Login failed:', loginData);
    return;
  }
  const token = loginData.data.token;
  console.log('Login successful');

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Check Status
  console.log('Checking WA Status...');
  const statusRes = await fetch(`${API_BASE}/whatsapp/status`, { headers });
  console.log('Status HTTP:', statusRes.status, await statusRes.text());

  // Disconnect
  console.log('Attempting Disconnect (POST)...');
  let discRes = await fetch(`${API_BASE}/whatsapp/disconnect`, { method: 'POST', headers });
  console.log('Disconnect POST HTTP:', discRes.status, await discRes.text());
  
  if (discRes.status === 405 || discRes.status === 404) {
    console.log('Attempting Disconnect (DELETE)...');
    discRes = await fetch(`${API_BASE}/whatsapp/disconnect`, { method: 'DELETE', headers });
    console.log('Disconnect DELETE HTTP:', discRes.status, await discRes.text());
    
    console.log('Attempting Disconnect (GET)...');
    discRes = await fetch(`${API_BASE}/whatsapp/disconnect`, { method: 'GET', headers });
    console.log('Disconnect GET HTTP:', discRes.status, await discRes.text());
  }

  // Connect (QR)
  console.log('Attempting Connect (POST)...');
  let connRes = await fetch(`${API_BASE}/whatsapp/connect`, { method: 'POST', headers });
  console.log('Connect POST HTTP:', connRes.status, await connRes.text());
  
  if (connRes.status === 405 || connRes.status === 404) {
    console.log('Attempting Connect (GET)...');
    connRes = await fetch(`${API_BASE}/whatsapp/connect`, { method: 'GET', headers });
    console.log('Connect GET HTTP:', connRes.status, await connRes.text());
  }

}

main().catch(console.error);
