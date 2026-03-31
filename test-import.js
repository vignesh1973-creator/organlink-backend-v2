const fetch = require('node-fetch');

async function testImport() {
  const loginRes = await fetch('http://localhost:5173/api/hospital/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'mumbai@organlink.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Logged in, token:', token ? 'YES' : 'NO');

  const importData = {
    full_name: 'Jyoti Kumar',
    age: '29',
    gender: 'Female',
    blood_type: 'AB+',
    organs_to_donate: JSON.stringify(['Liver']),
    medical_history: 'Import Test',
    contact_phone: '9876543210',
    contact_email: 'jyoti@example.com',
    govt_id_type: 'Aadhaar',
    govt_id_number: '123412341234',
    organlink_id: 'OL-2025-CHE-JYOT',
    existing_ipfs_hash: 'QmSignatureHashExample',
    existing_blockchain_hash: '0xde6e92d300000000000000000000000000000000000000000000000000000000'
  };

  const formData = new URLSearchParams();
  for (const key in importData) {
    formData.append(key, importData[key]);
  }

  console.log('Sending import request...');
  const res = await fetch('http://localhost:5173/api/hospital/donors/register', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}

testImport();
