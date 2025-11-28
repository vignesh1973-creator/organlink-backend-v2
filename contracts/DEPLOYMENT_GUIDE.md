# OrganLink Registry Enhanced Contract - Deployment Guide

## 📋 Overview

This guide will help you deploy the **enhanced OrganLink Registry smart contract** that supports both **Signature-based** and **Aadhaar-based** verification.

---

## 🔧 Prerequisites

1. **MetaMask Wallet** with some test ETH on Sepolia
2. **Remix IDE** (https://remix.ethereum.org)
3. **Your private key** for backend integration
4. **Infura API Key** (or use existing one)

---

## 📝 Step 1: Prepare the Contract

The contract is located at: `contracts/OrganLinkRegistry.sol`

**Key Features:**
- ✅ Dual verification support (`signature` / `aadhaar`)
- ✅ OCR verification flag
- ✅ Backward compatible with old ABI
- ✅ Admin controls
- ✅ Event logging for transparency

---

## 🚀 Step 2: Deploy on Remix

### 2.1 Open Remix IDE

Go to https://remix.ethereum.org

### 2.2 Create New File

1. Click "File Explorer" (left sidebar)
2. Create new file: `OrganLinkRegistry.sol`
3. Copy the entire contract code from `contracts/OrganLinkRegistry.sol`

### 2.3 Compile the Contract

1. Go to "Solidity Compiler" tab (left sidebar)
2. Select Compiler Version: **0.8.19** or higher
3. Click **"Compile OrganLinkRegistry.sol"**
4. Ensure there are no errors ✅

### 2.4 Deploy the Contract

1. Go to "Deploy & Run Transactions" tab
2. **Environment:** Select "Injected Provider - MetaMask"
3. **Account:** Ensure your MetaMask wallet is connected
4. **Network:** Switch MetaMask to **Sepolia Testnet**
5. **Contract:** Select "OrganLinkRegistry"
6. Click **"Deploy"**
7. Confirm transaction in MetaMask

### 2.5 Save Contract Address

After deployment, you'll see the contract address in the "Deployed Contracts" section.

**Example:** `0x1234567890abcdef1234567890abcdef12345678`

📝 **SAVE THIS ADDRESS** - you'll need it in the next step!

---

## 🔗 Step 3: Update Backend Configuration

### 3.1 Update Environment Variables

Edit your `.env` file:

```env
# OrganLink Registry Contract (NEW - Enhanced Version)
ORGANLINK_REGISTRY_ADDRESS=0xYOUR_NEW_CONTRACT_ADDRESS_HERE

# Blockchain Settings (Keep existing)
INFURA_API_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
METAMASK_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
```

**Important:** Replace `0xYOUR_NEW_CONTRACT_ADDRESS_HERE` with your actual deployed contract address.

### 3.2 Verify Backend Integration

The backend code has already been updated to use the new ABI. No additional code changes needed! ✅

Files updated:
- ✅ `server/services/blockchain.ts` - Enhanced ABI
- ✅ `server/routes/hospital-donors.ts` - Verification type support
- ✅ `server/routes/hospital-patients.ts` - Verification type support

---

## 🧪 Step 4: Test on Localhost

### 4.1 Start the Server

```bash
cd server
npm run dev
```

### 4.2 Test Signature-Based Registration

1. Navigate to Register Donor/Patient
2. Select **"Signature Only (Demo)"**
3. Fill in details
4. Upload a signature image
5. Submit

**Expected Result:**
- ✅ OCR verification
- ✅ IPFS upload
- ✅ Blockchain recording with `verificationType: "signature"`
- ✅ Database record created

### 4.3 Test Aadhaar-Based Registration

1. Navigate to Register Donor/Patient
2. Select **"Aadhaar Card (Enhanced Security)"**
3. Fill in details (e.g., Name: "M Vignesh")
4. Upload Aadhaar card image
5. Submit

**Expected Result:**
- ✅ Aadhaar OCR extraction (name, DOB, gender)
- ✅ Name verification match
- ✅ Profile photo extraction
- ✅ IPFS upload
- ✅ Blockchain recording with `verificationType: "aadhaar"`, `ocrVerified: true`
- ✅ Database record created

---

## 🔍 Step 5: Verify Blockchain Records

### Option 1: Use Remix

1. In Remix, under "Deployed Contracts"
2. Click on your contract to expand functions
3. Call `recordCount()` - should return total records
4. Call `getRecord(1)` - retrieve first record

**Expected Output:**
```
patientHash: 0x...
hospitalName: "Your Hospital Name"
verificationType: "signature" or "aadhaar"
ocrVerified: true or false
ipfsCID: "QmXXX..."
timestamp: 1234567890
```

### Option 2: Use Etherscan

1. Go to https://sepolia.etherscan.io
2. Search for your contract address
3. Go to "Contract" → "Read Contract"
4. View `recordCount` and `getRecord`

---

## 📊 Step 6: Monitor Transactions

### In Remix Console

Watch for transaction logs after deployment:

```
Transaction hash: 0xabc...
Block: 12345678
Gas used: ~150,000
Contract address: 0x...
```

### In MetaMask

Check "Activity" tab to see:
- Contract deployment
- `addVerifiedRecord` transactions
- Gas fees

---

## 🛠️ Troubleshooting

### Issue: "Out of Gas" Error

**Solution:** Increase gas limit in MetaMask before deploying

### Issue: "Execution Reverted" Error

**Possible Causes:**
1. Not calling as admin account
2. Invalid verification type (must be "signature" or "aadhaar")
3. Missing required fields (hospitalName or ipfsCID)

**Solution:** Check console logs and ensure all parameters are correct

### Issue: Backend Can't Connect to Contract

**Checklist:**
- ✅ Contract address in `.env` is correct
- ✅ Private key has funds on Sepolia
- ✅ Infura API URL is valid
- ✅ Network is Sepolia (not mainnet)

---

## 📈 Gas Estimates

| Operation | Gas Used | Est. Cost (Sepolia) |
|-----------|----------|---------------------|
| Deploy Contract | ~850,000 | ~0.0017 ETH |
| Add Record (signature) | ~120,000 | ~0.00024 ETH |
| Add Record (aadhaar) | ~130,000 | ~0.00026 ETH |
| Get Record | ~30,000 (read only) | Free |

**Note:** Aadhaar records use slightly more gas due to extra fields.

---

## 🔄 Migrating from Old Contract (Optional)

If you have an old OrganLink Registry contract:

### Option 1: Keep Both

- Old contract: Signature-only records
- New contract: Enhanced records with verification type

### Option 2: Fresh Start

- Deploy new contract
- Start fresh with enhanced verification
- Keep old contract address for reference

**Recommendation:** Use **Option 2** for this demo/project.

---

## ✅ Verification Checklist

Before moving to production:

- [ ] Contract deployed successfully on Sepolia
- [ ] Contract address saved in `.env`
- [ ] Backend server connects to contract
- [ ] Signature registration works
- [ ] Aadhaar registration works
- [ ] Blockchain records viewable on Etherscan
- [ ] Frontend displays verification status
- [ ] IPFS documents accessible
- [ ] Gas costs acceptable

---

## 🎯 Next Steps After Deployment

1. **Update ENV_VARIABLES_FOR_RENDER.txt**
   - Add new contract address for Render deployment

2. **Test Full Flow**
   - Register donor with Aadhaar
   - View donor profile (with photo)
   - Check blockchain verification status

3. **Demo Preparation**
   - Prepare sample Aadhaar cards
   - Create test data for presentation
   - Document verification flow

4. **Production Deployment** (when ready)
   - Deploy to Mainnet (requires real ETH)
   - Update all environment variables
   - Test thoroughly before going live

---

## 📝 Contract Admin Functions

### Change Admin (if needed)

If you need to transfer admin rights to another wallet:

```solidity
// In Remix
changeAdmin("0xNEW_ADMIN_WALLET_ADDRESS")
```

**Warning:** Be careful! Only the current admin can call this.

---

## 🎓 For Your College Demo

**Talking Points:**

1. **Show Old vs New Contract**
   - Old: Only signature verification
   - New: Dual-mode with Aadhaar support

2. **Demonstrate Blockchain Transparency**
   - Show Etherscan records
   - Explain verification types
   - Show OCR verification flag

3. **Security Enhancement**
   - Signature can be forged
   - Aadhaar is government-issued
   - OCR verification adds extra layer

4. **Future Scalability**
   - Easy to add more document types
   - Can extend to global IDs
   - Minimal gas cost increase

---

## 📞 Support

If you encounter issues:

1. Check Remix console for errors
2. Check server logs (`npm run dev`)
3. Verify MetaMask network (should be Sepolia)
4. Ensure sufficient test ETH in wallet

---

## 🎉 Success!

Once deployed and tested successfully:
- ✅ Your contract supports both signature and Aadhaar verification
- ✅ All records are transparently stored on blockchain
- ✅ IPFS integration works seamlessly
- ✅ Ready for college demo!

**Contract Address (update after deployment):**
```
0x_________________________________
```

Good luck with your deployment! 🚀
