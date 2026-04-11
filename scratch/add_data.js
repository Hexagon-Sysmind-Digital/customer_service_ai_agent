const fs = require('fs');

async function main() {
  const API_BASE = 'https://triad.my.id/api/v1';
  let token = '';
  let tenantId = '';

  // 1. Login
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
  token = loginData.data.token;
  const user = loginData.data.user;
  tenantId = user.tenant_id;
  console.log(`Login successful! Tenant ID: ${tenantId}`);

  if (!tenantId) {
    console.error('No tenant ID found for this user.');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId,
    'Content-Type': 'application/json'
  };

  // FAQs
  const faqs = [
    { question: 'Berapa biaya ganti oli mobil?', answer: 'Biaya ganti oli mobil mulai dari Rp 350.000 tergantung jenis oli dan kapasitas mesin mobil Anda. Sudah termasuk jasa penggantian gratis.', category: 'Servis', is_active: true },
    { question: 'Apakah bengkel buka di hari libur/Minggu?', answer: 'Ya, Bengkel Jaya Abadi buka setiap hari termasuk hari Minggu dan tanggal merah dari jam 08:00 hingga 17:00 WIB.', category: 'Umum', is_active: true },
    { question: 'Apakah menyediakan layanan storing / derek?', answer: 'Kami menyediakan layanan perbaikan darurat di jalan (storing) dan derek 24 jam untuk pelanggan dalam radius 20km. Silakan hubungi nomor darurat kami.', category: 'Darurat', is_active: true },
    { question: 'Berapa lama waktu yang dibutuhkan untuk tune up?', answer: 'Pengerjaan tune up standar biasanya memakan waktu sekitar 1 hingga 2 jam tergantung kondisi kendaraan Anda.', category: 'Servis', is_active: true },
    { question: 'Apakah suku cadang yang digunakan bergaransi?', answer: 'Semua suku cadang asli yang kami sediakan dan pasang memiliki garansi resmi dari bengkel selama 6 bulan.', category: 'Sparepart', is_active: true }
  ];

  console.log('Adding FAQs...');
  for (const faq of faqs) {
    const res = await fetch(`${API_BASE}/faqs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(faq)
    });
    console.log('FAQ Added:', faq.question, res.status);
  }

  // Knowledge
  const knowledges = [
    { content: 'Pelanggan yang melakukan servis berkala kelipatan 10.000 km akan mendapatkan gratis pengecekan 21 titik kendaraan dan diskon 10% untuk filter oli. Promo ini berlaku khusus member.', source: 'Promo Servis Berkala', metadata: { type: 'promo' } },
    { content: 'Garansi jasa perbaikan berlaku selama 14 hari kerja setelah kendaraan diambil dari bengkel. Jika keluhan yang sama muncul kembali, kami akan perbaiki tanpa biaya tambahan jasa.', source: 'Kebijakan Garansi Perbaikan', metadata: { type: 'policy' } },
    { content: 'Setiap kendaraan yang masuk akan difoto bodinya untuk memastikan tidak ada lecet baru, lalu dilakukan pengecekan awal oleh service advisor bersama pelanggan sebelum dikerjakan.', source: 'SOP Penerimaan Kendaraan', metadata: { type: 'internal' } },
    { content: 'Pelanggan dapat mendaftar Membership Jaya Abadi dengan biaya Rp 100.000/tahun untuk mendapatkan potongan harga 5% pada semua spare part dan 10% untuk jasa servis.', source: 'Program Membership', metadata: { type: 'program' } },
    { content: 'Setiap servis besar, tune up lengkap, atau transaksi servis di atas Rp 1.500.000 akan mendapatkan layanan cuci mobil dan vakum interior gratis sebelum kendaraan diserahkan kembali.', source: 'Layanan Cuci Mobil Gratis', metadata: { type: 'bonus' } }
  ];

  console.log('Adding Knowledges...');
  for (const k of knowledges) {
    const res = await fetch(`${API_BASE}/knowledge`, {
      method: 'POST',
      headers,
      body: JSON.stringify(k)
    });
    console.log('Knowledge Added:', k.source, res.status);
  }

  // Products
  const products = [
    { name: 'Oli Mesin Shell Helix HX7 10W-40 (4L)', description: 'Oli sintetis berkualitas untuk pelumasan maksimal dan tarikan mesin enteng.', category: 'Oli', price: 380000, stock: 25, is_active: true },
    { name: 'Kampas Rem Depan Bendix Kevlar', description: 'Kampas rem anti panas dan pakem untuk keamanan berkendara. Cocok untuk Avanza/Xenia.', category: 'Sparepart', price: 250000, stock: 15, is_active: true },
    { name: 'Busa Filter Udara Ferrox AI', description: 'Filter udara berbahan stainless steel yang bisa dicuci dan dipakai seumur hidup.', category: 'Sparepart', price: 450000, stock: 10, is_active: true },
    { name: 'Busi NGK Iridium BKR6EIX', description: 'Busi awet dengan performa pembakaran maksimal untuk menjaga keawetan mesin.', category: 'Sparepart', price: 120000, stock: 50, is_active: true },
    { name: 'Wiper Blade Bosch Clear Advantage', description: 'Wiper frameless tangguh, awet, dan menyapu air dengan optimal saat hujan deras.', category: 'Aksesoris', price: 150000, stock: 30, is_active: true }
  ];

  console.log('Adding Products...');
  for (const p of products) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify(p)
    });
    console.log('Product Added:', p.name, res.status);
  }

  console.log('Done!');
}

main().catch(console.error);
