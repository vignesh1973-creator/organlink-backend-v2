
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const secret = 'super-secret-key-12345';
const token = jwt.sign({ organization_id: 1, type: 'organization' }, secret, { expiresIn: '1h' });

async function checkApi() {
    try {
        console.log("Fetching http://localhost:5000/api/organization/policies...");
        console.log("With Token:", token.substring(0, 20) + "...");

        const res = await fetch('http://localhost:5000/api/organization/policies', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            console.log("Error status:", res.status);
            const txt = await res.text();
            console.log(txt);
            return;
        }

        const data: any = await res.json();
        const p1 = data.policies.find((p: any) => p.title.includes('Kidney Transport'));
        console.log("Policy #1 from API:", p1);

    } catch (e) {
        console.error(e);
    }
}

checkApi();
