
import 'dotenv/config';
import { pool } from './config/database.js';
import { ipfsService } from './services/ipfs.js';
import { blockchainService } from './services/blockchain.js';

async function finalSystemAudit() {
  console.log('--- STARTING COMPREHENSIVE SYSTEM AUDIT ---');
  
  // 1. Database Check
  try {
    const dbRes = await pool.query('SELECT NOW()');
    console.log('✅ DATABASE: Connection Successful at', dbRes.rows[0].now);
  } catch (e) {
    console.error('❌ DATABASE: Connection Failed', e.message);
  }

  // 2. IPFS Check
  try {
    const ipfsReady = await ipfsService.testConnection();
    if (ipfsReady) {
      console.log('✅ IPFS: Connection to Pinata Successful');
    } else {
      console.warn('⚠️ IPFS: Pinata connection failed. (Using developer fallback mode)');
    }
  } catch (e) {
    console.warn('⚠️ IPFS: Connection error', e.message);
  }

  // 3. Blockchain Check
  try {
    const balance = await blockchainService.getBalance();
    const address = blockchainService.getWalletAddress();
    console.log(`✅ BLOCKCHAIN: Wallet ${address} connected.`);
    console.log(`✅ BLOCKCHAIN: Balance: ${balance} ETH`);
    
    if (parseFloat(balance) < 0.001) {
      console.warn('⚠️ BLOCKCHAIN: Low gas alert! Current balance might be insufficient for multiple transactions.');
    }
  } catch (e) {
    console.error('❌ BLOCKCHAIN: Connection failed', e.message);
  }

  // 4. AIScoring/Governance Sync Check
  try {
    const count = await blockchainService.getOrgCount();
    console.log(`✅ GOVERNANCE: Blockchain shows ${count} registered organizations.`);
  } catch (e) {
    console.warn('⚠️ GOVERNANCE: Failed to fetch org count', e.message);
  }

  console.log('--- AUDIT COMPLETE ---');
  process.exit(0);
}

finalSystemAudit();
