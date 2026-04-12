const fs = require('fs');

async function test() {
  const login = await fetch('https://triad.my.id/api/v1/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@triad.ai', password: 'password123' }) // assuming default user, or if it fails we will see
  }).then(r => r.json());

  console.log("Login:", login);

  if(!login.data || !login.data.token) {
    console.log("cant login");
    return;
  }

  const token = login.data.token;
  
  const payment = await fetch('https://triad.my.id/api/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ amount: 100000, payment_method: "bank_transfer", proof_url: "http://example.com/a.jpg", notes: "test" })
  }).then(r => r.json());

  console.log("Payment Create Result:", payment);
}

test();
