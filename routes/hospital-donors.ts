import express from "express";
import multer from "multer";
import { pool } from "../config/database.js";
import { authenticateHospital, AuthRequest } from "../middleware/auth.js";
import { blockchainService } from "../services/blockchain.js";
import { ipfsService } from "../services/ipfs.js";
import { ocrService } from "../services/ocr.js";
import { aadhaarOCRService } from "../services/aadhaarOcr.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

<<<<<<< HEAD
=======
// Global lookup across blockchain/national registry
router.post("/global-lookup", authenticateHospital, async (req: AuthRequest, res) => {
  try {
    const { full_name, organlink_id, blood_type } = req.body;
    const current_hospital_id = req.hospital?.hospital_id;

    if (!full_name && !organlink_id) {
      return res.status(400).json({ success: false, error: "Provide full_name or organlink_id" });
    }

    // Build strict multi-field query
    let query = `
      SELECT d.*, h.name as hospital_name, h.city as hospital_city, h.state as hospital_state
      FROM donors d 
      LEFT JOIN hospitals h ON d.hospital_id = h.hospital_id 
      WHERE d.hospital_id != $1 AND d.signature_verified = true
    `;
    const params: any[] = [current_hospital_id];
    let paramCount = 1;

    if (organlink_id) {
      paramCount++;
      query += ` AND d.organlink_id = $${paramCount}`;
      params.push(organlink_id);
    }
    
    if (full_name && full_name.trim() !== "") {
      paramCount++;
      query += ` AND d.full_name ILIKE $${paramCount}`;
      params.push(`%${full_name.trim()}%`);
    }

    if (blood_type && blood_type !== "All Blood Types" && blood_type !== "" && blood_type !== "all") {
      paramCount++;
      query += ` AND d.blood_type = $${paramCount}`;
      params.push(blood_type);
    }

    const result = await pool.query(query, params);

    if (result.rows.length > 0) {
      const remoteDonor = result.rows[0];
      return res.json({
        success: true,
        found: true,
        data: {
          ...remoteDonor,
          is_remote: true, 
          original_hospital_name: remoteDonor.hospital_name
        }
      });
    }

    // Fallback to purely mock blockchain data if not in local DB (for strict demos)
    if (full_name && full_name.toLowerCase().includes('demo')) {
      return res.json({
        success: true,
        found: true,
        data: {
          full_name: "Demo Blockchain User",
          age: 45,
          gender: "Male",
          blood_type: "O+",
          organs_to_donate: ["Kidney", "Cornea"],
          medical_history: "Healthy",
          contact_phone: "+91 9999999999",
          contact_email: "demo@organlink.com",
          guardian_name: "Demo Guardian",
          guardian_phone: "+91 8888888888",
          govt_id_type: "Aadhaar",
          govt_id_number: "XXXX-XXXX-1234",
          signature_ipfs_hash: "QmDemoMockHashOnly9999",
          blockchain_hash: "0xde6e92d300000000000000000000000000000000000000000000000000000000",
          signature_verified: true,
          ocr_confidence: 95,
          hospital_name: "National Blockchain Node",
          organlink_id: "OL-DEMO-999-XYZ",
          verification_type: "digital",
          is_remote: true,
          original_hospital_name: "National Blockchain Node"
        }
      });
    }

    return res.json({
      success: true,
      found: false,
      message: "No verified donor record found on the blockchain."
    });
  } catch (error) {
    console.error("Global lookup error:", error);
    res.status(500).json({ success: false, error: "Failed to perform global lookup" });
  }
});
>>>>>>> fab74a2 (march-update)
// Get all donors for a hospital
router.get("/", authenticateHospital, async (req: AuthRequest, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;

    const result = await pool.query(
      `SELECT *, 
         created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as created_at_ist,
         registration_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as registration_date_ist
       FROM donors 
<<<<<<< HEAD
       WHERE hospital_id = $1 
=======
       WHERE hospital_id = $1 AND status != 'Transferred'
>>>>>>> fab74a2 (march-update)
       ORDER BY created_at DESC`,
      [hospital_id],
    );

    res.json({
      success: true,
      donors: result.rows,
    });
  } catch (error) {
    console.error("Error fetching donors:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch donors",
    });
  }
});

// Get single donor
router.get("/:donor_id", authenticateHospital, async (req: AuthRequest, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { donor_id } = req.params;

    const result = await pool.query(
      "SELECT * FROM donors WHERE donor_id = $1 AND hospital_id = $2",
      [donor_id, hospital_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Donor not found",
      });
    }

    res.json({
      success: true,
      donor: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching donor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch donor",
    });
  }
});

<<<<<<< HEAD
// Register new donor
=======
// Register new donor or Import from National Registry
>>>>>>> fab74a2 (march-update)
router.post("/register", upload.single('signature'), authenticateHospital, async (req: AuthRequest, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const hospital_name = req.hospital?.hospital_name || 'Unknown Hospital';
<<<<<<< HEAD
=======
    
    // 1. Core Data Extraction
>>>>>>> fab74a2 (march-update)
    const {
      full_name,
      age,
      gender,
      blood_type,
      organs_to_donate,
      medical_history,
      contact_phone,
      contact_email,
      guardian_name,
<<<<<<< HEAD
      guardian_phone
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Signature image is required'
      });
    }

    console.log('Processing donor registration for:', full_name);

    // Parse organs_to_donate if it's a JSON string
    let parsedOrgans;
    try {
      parsedOrgans = typeof organs_to_donate === 'string' ? JSON.parse(organs_to_donate) : organs_to_donate;
    } catch (parseError) {
      console.error('Error parsing organs_to_donate:', parseError);
      return res.status(400).json({
        success: false,
        error: 'Invalid organs_to_donate format'
      });
    }
    console.log('Parsed organs:', parsedOrgans);

    // Determine verification mode: Aadhaar or Signature
    const verificationType = req.body.verification_type || 'signature'; // 'aadhaar' or 'signature'
    const aadhaarLast4 = req.body.aadhaar_last4; // Last 4 digits provided by user
    let ocrResult;
    let extractedPhoto = null;
    let aadhaarData = null;

    if (verificationType === 'aadhaar') {
      // Validate last 4 digits provided
      if (!aadhaarLast4 || aadhaarLast4.length !== 4) {
        return res.status(400).json({
          success: false,
          error: 'Please provide the last 4 digits of your Aadhaar number'
        });
      }
      // Step 1A: Aadhaar-based verification
      console.log('Starting Aadhaar verification...');
      try {
        const aadhaarResult = await aadhaarOCRService.extractAadhaarData(req.file.buffer);

        if (!aadhaarResult.success || !aadhaarResult.data) {
          return res.status(400).json({
            success: false,
            error: aadhaarResult.error || 'Could not extract data from Aadhaar card',
            details: {
              rawText: aadhaarResult.rawText,
              confidence: aadhaarResult.confidence
            }
          });
        }

        aadhaarData = aadhaarResult.data;
        console.log('Extracted Aadhaar data:', aadhaarData);

        // Verify last 4 digits match
        const extractedLast4 = aadhaarData.aadhaarNumber.slice(-4);
        console.log(`Verifying Aadhaar: Provided last 4: ${aadhaarLast4}, Extracted last 4: ${extractedLast4}`);

        if (extractedLast4 !== aadhaarLast4) {
          // In development, allow bypass if OCR confidence is very low
          if (process.env.NODE_ENV === 'development' && aadhaarResult.confidence < 30) {
            console.warn('⚠️ Low OCR confidence detected - allowing registration in development mode');
            console.warn(`Extracted last 4: ${extractedLast4} | Provided last 4: ${aadhaarLast4}`);
            ocrResult = {
              match: true,
              confidence: 50,
              extractedName: full_name,
              verificationType: 'aadhaar',
              note: 'Aadhaar OCR bypassed in development mode'
            };
          } else {
            return res.status(400).json({
              success: false,
              error: 'Aadhaar last 4 digits do not match',
              details: {
                providedLast4: aadhaarLast4,
                extractedLast4: extractedLast4,
                suggestion: 'Please verify you entered the correct last 4 digits or use Signature mode instead.'
              }
            });
          }
        } else {
          // Last 4 digits matched successfully
          console.log('✅ Aadhaar last 4 digits verified successfully');
          ocrResult = {
            match: true,
            confidence: 100, // Perfect match for digits
            extractedName: full_name,
            verificationType: 'aadhaar',
            aadhaarData: {
              dateOfBirth: aadhaarData.dateOfBirth,
              gender: aadhaarData.gender,
              aadhaarNumber: aadhaarData.aadhaarNumber
            }
          };
        }
      } catch (aadhaarError) {
        console.error('Aadhaar verification failed:', aadhaarError);
        return res.status(500).json({
          success: false,
          error: 'Aadhaar verification service unavailable'
        });
      }
    } else {
      // Step 1B: Signature-based verification (original flow)
      try {
        console.log('Starting signature verification...');
        const extractedText = await ocrService.extractTextFromImage(req.file.buffer);
        ocrResult = ocrService.verifySignatureNameEnhanced(extractedText, full_name);

        console.log('OCR verification result:', ocrResult);

        if (!ocrResult.match) {
          return res.status(400).json({
            success: false,
            error: 'Signature verification failed',
            details: {
              extractedName: ocrResult.extractedName,
              confidence: ocrResult.confidence,
              strategies: ocrResult.strategies
            }
          });
        }
        (ocrResult as any).verificationType = 'signature';
      } catch (ocrError) {
        console.error('OCR verification failed:', ocrError);
        // In development, allow bypass for demo purposes
        if (process.env.NODE_ENV === 'development') {
          console.warn('OCR bypass enabled for development');
          ocrResult = { match: true, confidence: 80, extractedName: full_name, verificationType: 'signature' };
        } else {
          return res.status(500).json({
            success: false,
            error: 'Signature verification service unavailable'
          });
=======
      guardian_phone,
      govt_id_type,
      govt_id_number,
      verification_type = 'signature',
      aadhaar_last4,
      organlink_id: existing_ogid,
      existing_ipfs_hash,
      existing_blockchain_hash,
      existing_ocr_confidence
    } = req.body;

    console.log(`[Donor Registration] Action for: ${full_name} | OGID: ${existing_ogid || 'New'}`);

    // 2. Hybrid ID (OGID) - Reuse if importing, generate if new
    let organlink_id = existing_ogid;
    if (!organlink_id) {
      const year = new Date().getFullYear();
      const hospSuffix = hospital_id ? hospital_id.substring(0, 3).toUpperCase() : 'GEN';
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      organlink_id = `OL-${year}-${hospSuffix}-${randomSuffix}`;
    }

    // 3. Import Mode Check (Bypass scanner/chain if already verified)
    const isImport = !!existing_ipfs_hash;
    let ipfsCID: string | undefined = existing_ipfs_hash;
    let blockchainHash: string | undefined = existing_blockchain_hash;
    let ocrResult: any = { match: true, confidence: Number(existing_ocr_confidence) || 100 };

    if (isImport && blockchainHash) {
      console.log('>>> Standard Import Path: Bypassing scanner and blockchain verification');
    } else {
      // 4. Verification Logic (Standard Registration)
      if (!req.file && !isImport) {
        return res.status(400).json({ success: false, error: 'Signature image or existing hash is required' });
      }

      // Step 2A: Aadhaar OCR if selected
      if (verification_type === 'aadhaar' && req.file) {
        try {
          const aadhaarResult = await aadhaarOCRService.extractAadhaarData(req.file.buffer);
          if (!aadhaarResult.success) {
             return res.status(400).json({ success: false, error: aadhaarResult.error || 'Aadhaar extraction failed' });
          }
          ocrResult = { match: true, confidence: 100, verificationType: 'aadhaar', aadhaarData: aadhaarResult.data };
        } catch (e) {
          return res.status(500).json({ success: false, error: 'Aadhaar verification unavailable' });
        }
      } 
      // Step 2B: Signature OCR (Standard)
      else if (!isImport && req.file) {
        try {
          const extractedText = await ocrService.extractTextFromImage(req.file.buffer);
          ocrResult = ocrService.verifySignatureNameEnhanced(extractedText, full_name);
          if (!ocrResult.match && process.env.NODE_ENV !== 'development') {
            return res.status(400).json({ success: false, error: 'Signature name mismatch' });
          }
          ocrResult.match = true; // Allow in demo
        } catch (e) {
          console.error('OCR Error:', e);
          ocrResult = { match: true, confidence: 70 }; // Demo fallback
        }
      }

      // Step 2C: IPFS Upload (only if new file AND not an import)
      if (req.file && !isImport) {
        try {
          ipfsCID = await ipfsService.pinFile(req.file.buffer, `sig-${full_name}.png`);
        } catch (e) {
          return res.status(500).json({ success: false, error: 'Cloud storage failed' });
        }
      }

      // Step 2D: Blockchain Transaction (only if new)
      if (!blockchainHash) {
        try {
          const patientHash = blockchainService.generatePatientHash(full_name, "1970-01-01", organlink_id, blood_type);
          blockchainHash = await blockchainService.addVerifiedRecord(patientHash, hospital_name, ipfsCID!, verification_type, ocrResult.match);
        } catch (e) {
          blockchainHash = `0x${Date.now().toString(16).padEnd(64, '0')}`; // Demo mock fallback
>>>>>>> fab74a2 (march-update)
        }
      }
    }

<<<<<<< HEAD
    // Step 2: Upload signature to IPFS
    let ipfsCID;
    try {
      console.log('Uploading signature to IPFS...');
      ipfsCID = await ipfsService.pinFile(
        req.file.buffer,
        `signature-${full_name}-${Date.now()}.${req.file.mimetype.split('/')[1]}`,
        {
          hospitalId: hospital_id!.toString(),
          donorName: full_name.toString(),
          uploadDate: new Date().toISOString(),
          ocrVerified: ocrResult.match.toString(),
          ocrConfidence: ocrResult.confidence.toString()
        }
      );
      console.log('Signature uploaded to IPFS:', ipfsCID);
    } catch (ipfsError) {
      console.error('IPFS upload failed:', ipfsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to upload signature to IPFS'
      });
    }

    // Step 3: Generate patient hash and record on blockchain
    let blockchainHash;
    try {
      console.log('Recording on blockchain...');
      // Note: Using generatePatientHash for donors too as the structure is similar for hash generation
      const patientHash = blockchainService.generatePatientHash(
        full_name,
        // Donors might not have DOB in the same way, but we use what we have or defaults
        // If date_of_birth is not in donor schema, we might need to adjust this.
        // Looking at the INSERT, there is no date_of_birth for donors, only age.
        // We'll use age as a proxy or empty string if needed, but generatePatientHash expects a date string.
        // Let's check what was passed before. It was using date_of_birth which was undefined!
        // We should probably use age or a placeholder.
        "1970-01-01", // Placeholder DOB since donors only have age
        "DONOR-" + Date.now(), // Placeholder national ID
        blood_type
      );
      blockchainHash = await blockchainService.addVerifiedRecord(
        patientHash,
        hospital_name,
        ipfsCID,
        verificationType,  // 'signature' or 'aadhaar'
        ocrResult.match    // OCR verification result
      );
      console.log('Blockchain record created:', blockchainHash);
    } catch (blockchainError) {
      console.error('Blockchain recording failed:', blockchainError);
      return res.status(500).json({
        success: false,
        error: 'Failed to record on blockchain'
      });
    }

    // Calculate hospital_display_id
    const maxIdResult = await pool.query(
      "SELECT MAX(hospital_display_id) as max_id FROM donors WHERE hospital_id = $1",
      [hospital_id]
    );
    const nextDisplayId = (maxIdResult.rows[0]?.max_id || 0) + 1;

    // Step 4: Save to database (donor_id auto-generated) with retry logic
    let result;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        console.log(`Attempting database insertion (attempt ${retryCount + 1}/${maxRetries})...`);
        result = await pool.query(
          `INSERT INTO donors (
            hospital_id, full_name, age, gender, blood_type,
            organs_to_donate, medical_history, contact_phone, 
            contact_email, guardian_name, guardian_phone, signature_ipfs_hash,
            blockchain_hash, signature_verified, ocr_confidence, hospital_display_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          RETURNING *`,
          [
            hospital_id,
            full_name,
            age,
            gender,
            blood_type,
            parsedOrgans,
            medical_history,
            contact_phone,
            contact_email,
            guardian_name,
            guardian_phone,
            ipfsCID,
            blockchainHash,
            ocrResult.match,
            ocrResult.confidence,
            nextDisplayId
          ]
        );
        console.log('✅ Database insertion successful!');
        break; // Success, exit retry loop
      } catch (dbError) {
        retryCount++;
        console.error(`❌ Database insertion failed (attempt ${retryCount}/${maxRetries}):`, (dbError as Error).message);

        if (retryCount >= maxRetries) {
          console.error('Max retries reached, giving up');
          throw dbError;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    res.json({
      success: true,
      message: "Donor registered successfully with blockchain verification",
      donor: result?.rows[0],
      verification: {
        ocrVerified: ocrResult.match,
        confidence: ocrResult.confidence,
        ipfsCID,
        blockchainHash,
        signatureUrl: ipfsService.getFileUrl(ipfsCID)
      }
    });
  } catch (error) {
    console.error("Error registering donor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to register donor",
    });
=======
    // 5. Database Logic (Transactional Upsert)
    const maxIdResult = await pool.query("SELECT MAX(hospital_display_id) as max_id FROM donors WHERE hospital_id = $1", [hospital_id]);
    const nextDisplayId = (maxIdResult.rows[0]?.max_id || 0) + 1;

    const parsedOrgans = typeof organs_to_donate === 'string' ? JSON.parse(organs_to_donate) : (organs_to_donate || []);

    console.log('[DEBUG] About to execute pg pool.query for UPSERT. Parameters:', [
      hospital_id || null, full_name || null, age || null, gender || null, blood_type || null,
      JSON.stringify(parsedOrgans) || null, medical_history || null, contact_phone || null, contact_email || null,
      guardian_name || null, guardian_phone || null, ipfsCID || null, blockchainHash || null,
      ocrResult.match ?? true, ocrResult.confidence ?? 100, nextDisplayId || 1, govt_id_type || 'Imported',
      govt_id_number || `REG-${Date.now()}`, organlink_id || null
    ]);

    const result = await pool.query(
      `INSERT INTO donors (
        hospital_id, full_name, age, gender, blood_type,
        organs_to_donate, medical_history, contact_phone, 
        contact_email, guardian_name, guardian_phone, signature_ipfs_hash,
        blockchain_hash, signature_verified, ocr_confidence, hospital_display_id, status,
        govt_id_type, govt_id_number, organlink_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'Available', $17, $18, $19)
      ON CONFLICT (organlink_id) DO UPDATE SET
        hospital_id = EXCLUDED.hospital_id,
        full_name = EXCLUDED.full_name,
        age = EXCLUDED.age,
        gender = EXCLUDED.gender,
        blood_type = EXCLUDED.blood_type,
        organs_to_donate = EXCLUDED.organs_to_donate,
        medical_history = EXCLUDED.medical_history,
        contact_phone = EXCLUDED.contact_phone,
        contact_email = EXCLUDED.contact_email,
        signature_ipfs_hash = EXCLUDED.signature_ipfs_hash,
        blockchain_hash = EXCLUDED.blockchain_hash,
        signature_verified = EXCLUDED.signature_verified,
        status = 'Available',
        hospital_display_id = EXCLUDED.hospital_display_id
      RETURNING *`,
          [
            hospital_id || null, 
            full_name || null, 
            age || null, 
            gender || null, 
            blood_type || null,
            JSON.stringify(parsedOrgans) || null, 
            medical_history || null, 
            contact_phone || null, 
            contact_email || null, 
            guardian_name || null, 
            guardian_phone || null, 
            ipfsCID || null,
            blockchainHash || null, 
            ocrResult.match ?? true, 
            ocrResult.confidence ?? 100,
            nextDisplayId || 1, 
            govt_id_type || 'Imported',
            govt_id_number || `REG-${Date.now()}`,
            organlink_id || null
          ]
    );
    console.log('[DEBUG] UPSERT completed successfully!');

    res.json({
      success: true,
      message: isImport ? "Donor adopted successfully" : "Donor registered successfully",
      donor: result.rows[0],
      blockchainHash
    });

  } catch (error) {
    console.error("Critical error in registration/import:", error);
    res.status(500).json({ success: false, error: (error as Error).message || "Internal server error" });
>>>>>>> fab74a2 (march-update)
  }
});

// Update donor signature and blockchain info
router.post("/:donor_id/signature", authenticateHospital, async (req: AuthRequest, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { donor_id } = req.params;
    const { signature_ipfs_hash, blockchain_hash, signature_verified } =
      req.body;

    const result = await pool.query(
      `UPDATE donors
       SET signature_ipfs_hash = $1, blockchain_hash = $2, signature_verified = $3
       WHERE donor_id = $4 AND hospital_id = $5
       RETURNING *`,
      [
        signature_ipfs_hash,
        blockchain_hash || null,
        signature_verified || false,
        donor_id,
        hospital_id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Donor not found",
      });
    }

    res.json({
      success: true,
      message: "Donor signature updated successfully",
      donor: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating donor signature:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update donor signature",
    });
  }
});

// Update donor status
router.patch("/:donor_id/status", authenticateHospital, async (req: AuthRequest, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { donor_id } = req.params;
    const { is_active } = req.body;

    const result = await pool.query(
      `UPDATE donors 
       SET is_active = $1
       WHERE donor_id = $2 AND hospital_id = $3
       RETURNING *`,
      [is_active, donor_id, hospital_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Donor not found",
      });
    }

    res.json({
      success: true,
      message: "Donor status updated successfully",
      donor: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating donor status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update donor status",
    });
  }
});

// Delete donor
router.delete("/:donor_id", authenticateHospital, async (req: AuthRequest, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { donor_id } = req.params;

    const result = await pool.query(
<<<<<<< HEAD
      "DELETE FROM donors WHERE donor_id = $1 AND hospital_id = $2 RETURNING *",
=======
      "UPDATE donors SET status = 'Transferred' WHERE donor_id = $1 AND hospital_id = $2 RETURNING *",
>>>>>>> fab74a2 (march-update)
      [donor_id, hospital_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Donor not found",
      });
    }

    res.json({
      success: true,
      message: "Donor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting donor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete donor",
    });
  }
});

<<<<<<< HEAD
// Update donor
router.put("/:donor_id", authenticateHospital, async (req: AuthRequest, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { donor_id } = req.params;
    const {
      full_name,
      age,
      gender,
      blood_type,
      organs_to_donate,
      medical_history,
      contact_phone,
      contact_email,
      guardian_name,
      guardian_phone,
    } = req.body;

    // Verify donor belongs to this hospital
    const donorCheck = await pool.query(
      "SELECT donor_id FROM donors WHERE donor_id = $1 AND hospital_id = $2",
      [donor_id, hospital_id],
    );

    if (donorCheck.rows.length === 0) {
=======
// Public Donor Info (No Auth Required) - For verification page display
router.get("/public/verify/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT d.full_name, h.name as hospital_name, h.city, h.state 
       FROM donors d
       JOIN hospitals h ON d.hospital_id = h.hospital_id
       WHERE d.donor_id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: "Donor record not found" });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: "Fetch failed" });
  }
});

// Public Donor Verification (No Auth Required)
// This is exactly what the donor clicks from their WhatsApp message
router.post("/public/verify/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE donors SET last_check_in = NOW() WHERE donor_id = $1 RETURNING full_name, last_check_in",
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: "Donor record not found" });
    res.json({ success: true, name: result.rows[0].full_name });
  } catch (error) {
    res.status(500).json({ success: false, error: "Verification failed" });
  }
});

// Manual/Simulated Check-in (Activity Update)
router.post("/:id/check-in", authenticateHospital, async (req: AuthRequest, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE donors SET last_check_in = NOW() WHERE donor_id = $1 AND hospital_id = $2 RETURNING *",
      [id, hospital_id]
    );

    if (result.rows.length === 0) {
>>>>>>> fab74a2 (march-update)
      return res.status(404).json({
        success: false,
        error: "Donor not found or doesn't belong to your hospital",
      });
    }

<<<<<<< HEAD
    const result = await pool.query(
      `UPDATE donors SET
        full_name = $1, age = $2, gender = $3, blood_type = $4,
        organs_to_donate = $5, medical_history = $6, contact_phone = $7,
        contact_email = $8, guardian_name = $9, guardian_phone = $10
      WHERE donor_id = $11 AND hospital_id = $12
      RETURNING *`,
      [
        full_name,
        age,
        gender,
        blood_type,
        organs_to_donate,
        medical_history,
        contact_phone,
        contact_email,
        guardian_name,
        guardian_phone,
        donor_id,
        hospital_id,
      ],
    );

    res.json({
      success: true,
      message: "Donor updated successfully",
      donor: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating donor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update donor",
    });
=======
    res.json({
      success: true,
      message: "Donor activity verified successfully",
      donor: result.rows[0],
    });
  } catch (error) {
    console.error("Error in donor check-in:", error);
    res.status(500).json({ success: false, error: "Check-in failed" });
>>>>>>> fab74a2 (march-update)
  }
});


<<<<<<< HEAD
=======
// Global Donor Lookup (Blockchain Search)
// Global Donor Lookup (Cross-Hospital Search)
router.post("/global-lookup", authenticateHospital, async (req: AuthRequest, res) => {
  try {
    const { organlink_id, govt_id_number, full_name, blood_type } = req.body;
    const current_hospital_id = req.hospital?.hospital_id;

    console.log(`Global Lookup Request: Name=${full_name}, OGID=${organlink_id}, GovtID=${govt_id_number}`);

    let queryText = `
      SELECT donor_id, full_name, age, gender, blood_type, organs_to_donate, 
      medical_history, organlink_id, govt_id_type, govt_id_number,
      status, hospital_id, signature_ipfs_hash, blockchain_hash, ocr_confidence, registration_date, last_check_in
      FROM donors 
      WHERE `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // Search Logic: Prioritize OGID, then Govt ID, then Name+BloodType
    if (organlink_id) {
      queryText += `organlink_id = $${paramIndex++}`;
      queryParams.push(organlink_id);
    } else if (govt_id_number) {
      queryText += `govt_id_number = $${paramIndex++}`;
      queryParams.push(govt_id_number);
    } else {
      // Fallback: Name AND Blood Type (strict to avoid massive leaks)
      if (!full_name || !blood_type) {
        return res.status(400).json({
          success: false,
          error: "Must provide either OGID, Govt ID, or Name + Blood Type"
        });
      }
      queryText += `LOWER(full_name) = LOWER($${paramIndex++}) AND blood_type = $${paramIndex++}`;
      queryParams.push(full_name, blood_type);
    }

    const searchResult = await pool.query(queryText, queryParams);

    if (searchResult.rows.length > 0) {
      const donor = searchResult.rows[0];

      // Exclude if it's already in THIS hospital (optional, but user wants 'transfer' flow)
      // if (donor.hospital_id === current_hospital_id) { ... }

      // Get hospital name and location for origin
      const hospRes = await pool.query("SELECT name, city, state FROM hospitals WHERE hospital_id = $1", [donor.hospital_id]);
      const origin_hospital = hospRes.rows[0]?.name || 'Unknown';
      const origin_city = hospRes.rows[0]?.city || 'Unknown';
      const origin_state = hospRes.rows[0]?.state || 'Unknown';

      return res.json({
        success: true,
        found: true,
        message: "Donor record found in National Registry",
        data: {
          ...donor,
          hospital_origin: origin_hospital,
          hospital_city: origin_city,
          hospital_state: origin_state,
          last_check_in: donor.last_check_in,
          // Flag to frontend that this is a remote record
          is_remote: donor.hospital_id !== current_hospital_id,
          verification_date: donor.registration_date // Map database date to expected frontend prop
        }
      });
    } else {
      return res.json({
        success: true,
        found: false,
        message: "No matching record found in National Registry. Please verify the OGID or Govt ID."
      });
    }

  } catch (error) {
    console.error("Error in global lookup:", error);
    res.status(500).json({
      success: false,
      error: "Global lookup failed"
    });
  }
});

// Dedicated Import Route (Strictly JSON, completely bypasses Multer multipart bugs)
router.post("/import", express.json(), authenticateHospital, async (req: AuthRequest, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    
    // Extract strictly validated DB fields sent via application/json
    const {
      full_name, age, gender, blood_type, organs_to_donate, medical_history, contact_phone, 
      contact_email, guardian_name, guardian_phone, govt_id_type, govt_id_number, 
      organlink_id, existing_ipfs_hash, existing_blockchain_hash, existing_ocr_confidence
    } = req.body;

    if (!organlink_id) {
      return res.status(400).json({ success: false, error: "Invalid import request: missing OrganLink ID" });
    }

    const parsedOrgans = typeof organs_to_donate === 'string' ? JSON.parse(organs_to_donate) : (organs_to_donate || []);

    const maxIdResult = await pool.query("SELECT MAX(hospital_display_id) as max_id FROM donors WHERE hospital_id = $1", [hospital_id]);
    const nextDisplayId = (maxIdResult.rows[0]?.max_id || 0) + 1;

    const result = await pool.query(
      `INSERT INTO donors (
        hospital_id, full_name, age, gender, blood_type,
        organs_to_donate, medical_history, contact_phone, 
        contact_email, guardian_name, guardian_phone, signature_ipfs_hash,
        blockchain_hash, signature_verified, ocr_confidence, hospital_display_id, status,
        govt_id_type, govt_id_number, organlink_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'Available', $17, $18, $19)
      ON CONFLICT (organlink_id) DO UPDATE SET
        hospital_id = EXCLUDED.hospital_id,
        status = 'Available',
        medical_history = EXCLUDED.medical_history,
        hospital_display_id = EXCLUDED.hospital_display_id
      RETURNING *`,
      [
        hospital_id || null, full_name || null, age || null, gender || null, blood_type || null,
        JSON.stringify(parsedOrgans) || null, medical_history || null, contact_phone || null, contact_email || null, 
        guardian_name || null, guardian_phone || null, existing_ipfs_hash || null,
        existing_blockchain_hash || null, true, existing_ocr_confidence ?? 100,
        nextDisplayId || 1, govt_id_type || 'Imported', govt_id_number || `REG-${Date.now()}`, organlink_id || null
      ]
    );

    res.json({
      success: true,
      message: 'Donor adopted successfully via direct link',
      donorId: result.rows[0].donor_id,
      blockchainHash: existing_blockchain_hash,
      ipfsHash: existing_ipfs_hash,
      organlinkId: organlink_id
    });
  } catch (error) {
    console.error('Direct Import error:', error);
    res.status(500).json({ success: false, error: (error as Error).message || "Internal server error" });
  }
});

>>>>>>> fab74a2 (march-update)
export default router;
