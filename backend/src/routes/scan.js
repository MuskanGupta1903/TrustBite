const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeImage } = require('../services/visionAI');
const { validateInput, computeImageHash, validateFileType, SCREENING_STATUSES } = require('../services/inputValidator');
const { getCommunitySignal, checkDuplicate, checkSpam, getEmptyCommunitySignal } = require('../services/communityIntel');
const { synthesizeRisk } = require('../services/riskEngine');
const db = require('../db');

const router = express.Router();

// Setup multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Sanitize filename to prevent path traversal
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'scan-' + uniqueSuffix + path.extname(safeName));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Please upload a JPEG, PNG, or WebP image.`), false);
    }
  }
});

/**
 * POST /api/scan
 * Full TrustBite screening pipeline:
 * 1. Upload validation
 * 2. Duplicate detection
 * 3. Spam check
 * 4. Gemini Vision analysis
 * 5. Backend validation (input validator)
 * 6. Community intelligence
 * 7. Risk synthesis
 * 8. Database save
 * 9. Structured response
 */
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    // STEP 1: Validate upload
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No photo provided',
        validation: { input_status: 'FILE_ERROR' }
      });
    }

    const { category, locality, lat, lng, userName, itemName, smell, lumpy, mold, texture } = req.body;
    const parsedLat = parseFloat(lat) || 0;
    const parsedLng = parseFloat(lng) || 0;

    // Collect sensory data from questionnaire
    const sensoryData = {};
    if (smell) sensoryData.smell = smell;
    if (lumpy) sensoryData.lumpy = lumpy;
    if (mold) sensoryData.mold = mold;
    if (texture) sensoryData.texture = texture;

    // STEP 2: Compute image hash for duplicate detection
    const imageHash = computeImageHash(req.file.path);

    // STEP 3: Check for duplicate
    if (imageHash) {
      const duplicate = await checkDuplicate(imageHash);
      if (duplicate) {
        // Clean up uploaded file
        cleanupFile(req.file.path);
        return res.json({
          success: true,
          validation: {
            input_status: 'DUPLICATE_REPORT',
            message: 'This image has already been submitted. Duplicate reports are not counted separately to maintain community signal quality.',
          },
          screening: null,
          community: getEmptyCommunitySignal(),
          risk: null,
          result: {
            itemName: 'Duplicate',
            riskLevel: 'duplicate',
            reasoning: 'This image has already been submitted. Please upload a different image.',
          },
        });
      }
    }

    // STEP 4: Check for spam
    const isSpam = await checkSpam(userName);
    if (isSpam) {
      cleanupFile(req.file.path);
      return res.status(429).json({
        success: false,
        error: 'Too many reports submitted in a short time. Please wait a few minutes before submitting another scan.',
        validation: { input_status: 'RATE_LIMITED' }
      });
    }

    // STEP 5: Gemini Vision analysis
    const geminiResult = await analyzeImage(req.file.path, category, itemName);

    // STEP 6: Backend validation — this is the safety boundary
    const validation = validateInput(geminiResult, category, itemName);

    // STEP 7: Community intelligence (only for valid food)
    let communitySignal = getEmptyCommunitySignal();
    if (validation.inputStatus === 'VALID_FOOD' && parsedLat !== 0 && parsedLng !== 0) {
      communitySignal = await getCommunitySignal(parsedLat, parsedLng, 3, category);
    }

    // STEP 8: Risk synthesis (only for valid food)
    let riskSignal = null;
    if (validation.inputStatus === 'VALID_FOOD') {
      riskSignal = synthesizeRisk(validation, sensoryData, communitySignal);
    }

    // STEP 9: Map to legacy-compatible result for frontend
    const legacyResult = mapToLegacyResult(validation, riskSignal);

    // STEP 10: Save report to database
    const reportId = await saveReport({
      userName: userName || 'Anonymous',
      category: category || 'unknown',
      itemName: validation.detectedItem || itemName || legacyResult.itemName,
      riskLevel: legacyResult.riskLevel,
      aiReasoning: validation.reasoning || legacyResult.reasoning,
      locality: locality || 'Unknown Location',
      lat: parsedLat,
      lng: parsedLng,
      validationStatus: validation.inputStatus,
      detectedCategory: validation.detectedCategory,
      detectedItem: validation.detectedItem,
      imageQuality: JSON.stringify(validation.imageQuality),
      screeningStatus: validation.screeningStatus,
      visualObservations: JSON.stringify(validation.visualObservations),
      sensoryData: JSON.stringify(sensoryData),
      imageHash: imageHash,
      signalLevel: riskSignal?.signal_level || 'none',
      communitySignal: JSON.stringify(communitySignal),
      riskFactors: JSON.stringify(riskSignal?.contributing_factors || []),
    });

    // Clean up uploaded file after processing
    cleanupFile(req.file.path);

    // STEP 11: Return structured response
    res.json({
      success: true,
      id: reportId,
      validation: {
        input_status: validation.inputStatus,
        detected_category: validation.detectedCategory,
        detected_item: validation.detectedItem,
        user_category: category,
        category_match: !validation.categoryMismatch,
        category_mismatch: validation.categoryMismatch,
        image_quality: validation.imageQuality,
      },
      screening: {
        status: validation.screeningStatus,
        visual_observations: validation.visualObservations,
        visual_concern: validation.visualConcern,
        reasoning: validation.reasoning,
        sensory_signals: sensoryData,
      },
      community: communitySignal,
      risk: riskSignal,
      limitations: validation.limitations,
      // Legacy-compatible result object for existing frontend
      result: legacyResult,
      message: 'Scan complete and report saved',
    });

  } catch (error) {
    console.error('Scan error:', error);
    
    // Clean up file on error
    if (req.file?.path) {
      cleanupFile(req.file.path);
    }

    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'Image file exceeds 10MB size limit.',
        validation: { input_status: 'FILE_TOO_LARGE' }
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Internal server error during scan. Please try again.',
      validation: { input_status: 'SERVER_ERROR' }
    });
  }
});

/**
 * Map the new structured validation result to a legacy-compatible format
 * so the existing frontend can still consume it while being upgraded
 */
function mapToLegacyResult(validation, riskSignal) {
  switch (validation.inputStatus) {
    case 'NON_FOOD':
      return {
        itemName: validation.detectedItem || 'Non-food item',
        riskLevel: 'non_food',
        reasoning: 'This image does not appear to contain a supported food item. TrustBite currently screens dairy products and fruits & vegetables.',
        screeningStatus: 'NON_FOOD',
      };

    case 'UNSUPPORTED_FOOD':
      return {
        itemName: validation.detectedItem || 'Unsupported food',
        riskLevel: 'unsupported',
        reasoning: 'This food item is not currently supported by TrustBite. We currently screen dairy products (milk, curd, paneer) and produce (fruits, vegetables).',
        screeningStatus: 'UNSUPPORTED_FOOD',
      };

    case 'CATEGORY_MISMATCH':
      return {
        itemName: validation.detectedItem || 'Unknown',
        riskLevel: 'mismatch',
        reasoning: `This appears to be ${validation.detectedCategory?.toLowerCase()} rather than ${validation.categoryMismatch?.userSelected?.toLowerCase()}. Please select the correct category.`,
        screeningStatus: 'CATEGORY_MISMATCH',
        categoryMismatch: validation.categoryMismatch,
      };

    case 'LOW_IMAGE_QUALITY':
      return {
        itemName: validation.detectedItem || 'Unknown',
        riskLevel: 'low_quality',
        reasoning: `Image quality is insufficient for reliable screening. ${validation.imageQuality?.issues?.join('. ') || 'Please retake the photo with better lighting and ensure the food item is clearly visible.'}`,
        screeningStatus: 'LOW_IMAGE_QUALITY',
        imageQuality: validation.imageQuality,
      };

    case 'INSUFFICIENT_EVIDENCE':
      return {
        itemName: validation.detectedItem || 'Unknown',
        riskLevel: 'insufficient',
        reasoning: validation.reasoning || 'There is insufficient visual evidence to perform a reliable screening.',
        screeningStatus: 'INSUFFICIENT_EVIDENCE',
      };

    case 'VALID_FOOD':
    default: {
      // Map the signal level to legacy risk level
      let riskLevel = 'low';
      if (riskSignal) {
        if (riskSignal.signal_level === 'high') riskLevel = 'high';
        else if (riskSignal.signal_level === 'elevated') riskLevel = 'caution';
        else if (riskSignal.signal_level === 'moderate') riskLevel = 'caution';
        else riskLevel = 'low';
      } else {
        // Map from screening status
        if (validation.screeningStatus === 'LIKELY_VISUAL_CONCERN') riskLevel = 'high';
        else if (validation.screeningStatus === 'POSSIBLE_VISUAL_CONCERN') riskLevel = 'caution';
        else riskLevel = 'low';
      }

      return {
        itemName: validation.detectedItem || 'Unknown item',
        riskLevel,
        reasoning: validation.reasoning || 'Visual screening completed.',
        screeningStatus: validation.screeningStatus,
      };
    }
  }
}

/**
 * Save report to database
 */
function saveReport(data) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO reports (
        user_name, category, item_name, risk_level, ai_reasoning, 
        locality, lat, lng, validation_status, detected_category,
        detected_item, image_quality, screening_status, visual_observations,
        sensory_data, image_hash, signal_level, community_signal, risk_factors
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.userName, data.category, data.itemName, data.riskLevel,
        data.aiReasoning, data.locality, data.lat, data.lng,
        data.validationStatus, data.detectedCategory, data.detectedItem,
        data.imageQuality, data.screeningStatus, data.visualObservations,
        data.sensoryData, data.imageHash, data.signalLevel,
        data.communitySignal, data.riskFactors,
      ],
      function(err) {
        if (err) {
          console.error('Error saving report:', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

/**
 * Clean up uploaded file
 */
function cleanupFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('File cleanup error:', err.message);
  }
}

module.exports = router;
