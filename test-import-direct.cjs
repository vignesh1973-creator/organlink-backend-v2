const fetch = require('node-fetch');
const FormData = require('form-data');

async function run() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJob3NwaXRhbF9pZCI6IkhPU1AtMTIzIiwiZW1haWwiOiJ2aWduZXNodmlnbmVzaDE5NzRAZ21haWwuY29tIiwiaWF0IjoxNzM5OTA4NTU5LCJleHAiOjE3Mzk5MTIxNTl9.F_81wXR96sugr2QGxL9eztmAOY1YSahlvrXmpyQitJ9AU5NjB9';
  
  const formData = new FormData();
  formData.append('full_name', 'Jyoti Kumar');
  formData.append('age', '29');
  formData.append('gender', 'Female');
  formData.append('blood_type', 'AB+');
  formData.append('organs_to_donate', JSON.stringify(['Liver']));
  formData.append('medical_history', 'Imported Record');
  formData.append('contact_phone', 'N/A');
  formData.append('contact_email', '');
  formData.append('guardian_name', '');
  formData.append('guardian_phone', '');
  formData.append('verification_type', 'signature');
  formData.append('govt_id_type', 'Custom');
  formData.append('govt_id_number', `IMPORT-${Date.now()}`);
  formData.append('organlink_id', 'OL-2025-CHE-JYOT');
  formData.append('existing_ipfs_hash', 'QmSignatureHashExampleHash001');
  formData.append('existing_blockchain_hash', '0xde6e92d300000000000000000000000000000000000000000000000000000000');
  formData.append('existing_ocr_confidence', '100');

  console.log('Sending request...');
  try {
    const response = await fetch('http://localhost:5000/api/hospital/donors/register', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text);
  } catch (e) {
    console.error('Fetch Error:', e.message);
  }
}

run();
