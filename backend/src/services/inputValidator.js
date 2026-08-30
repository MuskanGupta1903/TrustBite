// TrustBite — Input Validator
// Backend safety layer that validates AI output and enforces application rules.
// The model should not have unrestricted authority over final screening status.

const crypto = require('crypto');
const fs = require('fs');

// Supported categories
const SUPPORTED_CATEGORIES = ['DAIRY', 'PRODUCE'];

// Valid screening statuses
const SCREENING_STATUSES = {
  VALID_FOOD: 'VALID_FOOD',
  NON_FOOD: 'NON_FOOD',
  UNSUPPORTED_FOOD: 'UNSUPPORTED_FOOD',
  CATEGORY_MISMATCH: 'CATEGORY_MISMATCH',
  LOW_IMAGE_QUALITY: 'LOW_IMAGE_QUALITY',
  INSUFFICIENT_EVIDENCE: 'INSUFFICIENT_EVIDENCE',
  NO_OBVIOUS_VISUAL_CONCERN: 'NO_OBVIOUS_VISUAL_CONCERN',
  POSSIBLE_VISUAL_CONCERN: 'POSSIBLE_VISUAL_CONCERN',
  LIKELY_VISUAL_CONCERN: 'LIKELY_VISUAL_CONCERN',
  DUPLICATE_REPORT: 'DUPLICATE_REPORT',
  AI_UNAVAILABLE: 'AI_UNAVAILABLE',
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  AI_ANALYSIS_FAILED: 'AI_ANALYSIS_FAILED',
};

// Valid signal levels for the final TrustBite signal
const SIGNAL_LEVELS = {
  NONE: 'none',           // No screening performed (non-food, etc.)
  LOW: 'low',             // No obvious visual concern
  MODERATE: 'moderate',   // Possible concern from one signal
  ELEVATED: 'elevated',   // Multiple signals pointing in same direction
  HIGH: 'high',           // Strong convergence of signals
};

/**
 * Validate the Gemini AI result and enforce application safety rules.
 * The backend overrides the model when necessary.
 * 
 * @param {object} geminiResult - Parsed result from Gemini Vision
 * @param {string} userCategory - User-selected category ('dairy' or 'produce')
 * @param {string} userItemName - User-specified item name (optional)
 * @returns {object} Validated result with enforced status
 */
function validateInput(geminiResult, userCategory, userItemName) {
  const result = { ...geminiResult };
  const overrides = [];

  // RULE 0: AI Failure
  if (result.screeningStatus === 'AI_SERVICE_UNAVAILABLE' || result.screeningStatus === 'AI_ANALYSIS_FAILED' || result.errorType) {
    result.screeningStatus = result.screeningStatus === 'AI_SERVICE_UNAVAILABLE' ? SCREENING_STATUSES.AI_SERVICE_UNAVAILABLE : SCREENING_STATUSES.AI_ANALYSIS_FAILED;
    result.signalLevel = SIGNAL_LEVELS.NONE;
    overrides.push('AI analysis failed or was unavailable. No screening performed.');
    return buildValidationResult(result, result.screeningStatus, overrides);
  }

  // RULE 1: Non-food detection — absolute override
  if (result.foodStatus === 'NON_FOOD' || result.detectedCategory === 'NON_FOOD') {
    result.screeningStatus = SCREENING_STATUSES.NON_FOOD;
    result.signalLevel = SIGNAL_LEVELS.NONE;
    overrides.push('Image identified as non-food. No food-safety screening performed.');
    return buildValidationResult(result, 'NON_FOOD', overrides);
  }

  // RULE 2: Unsupported food category
  if (result.foodStatus === 'FOOD' && result.detectedCategory === 'OTHER_FOOD') {
    result.screeningStatus = SCREENING_STATUSES.UNSUPPORTED_FOOD;
    result.signalLevel = SIGNAL_LEVELS.NONE;
    overrides.push('Food item detected but category is not currently supported by TrustBite.');
    return buildValidationResult(result, 'UNSUPPORTED_FOOD', overrides);
  }

  // RULE 3: Image quality gate
  if (result.imageQuality?.status === 'UNUSABLE' || result.imageQuality?.status === 'POOR') {
    result.screeningStatus = SCREENING_STATUSES.LOW_IMAGE_QUALITY;
    result.signalLevel = SIGNAL_LEVELS.NONE;
    overrides.push('Image quality is insufficient for reliable visual screening.');
    return buildValidationResult(result, 'LOW_IMAGE_QUALITY', overrides);
  }

  // RULE 4: Category mismatch detection
  const normalizedUserCategory = normalizeCategory(userCategory);
  const normalizedDetectedCategory = result.detectedCategory?.toUpperCase();
  
  if (normalizedUserCategory && normalizedDetectedCategory && 
      SUPPORTED_CATEGORIES.includes(normalizedDetectedCategory) &&
      normalizedUserCategory !== normalizedDetectedCategory) {
    result.screeningStatus = SCREENING_STATUSES.CATEGORY_MISMATCH;
    result.signalLevel = SIGNAL_LEVELS.NONE;
    result.categoryMismatch = {
      userSelected: normalizedUserCategory,
      detected: normalizedDetectedCategory,
    };
    overrides.push(`Category mismatch: user selected ${normalizedUserCategory} but image appears to contain ${normalizedDetectedCategory}.`);
    return buildValidationResult(result, 'CATEGORY_MISMATCH', overrides);
  }

  // RULE 5: Uncertain food status
  if (result.foodStatus === 'UNCERTAIN') {
    result.screeningStatus = SCREENING_STATUSES.INSUFFICIENT_EVIDENCE;
    result.signalLevel = SIGNAL_LEVELS.NONE;
    overrides.push('Could not reliably determine if the image contains a supported food item.');
    return buildValidationResult(result, 'INSUFFICIENT_EVIDENCE', overrides);
  }

  // RULE 6: Valid food — pass through the screening status from Gemini
  // but ensure it's one of our known statuses
  const validScreeningStatuses = [
    'NO_OBVIOUS_VISUAL_CONCERN',
    'POSSIBLE_VISUAL_CONCERN', 
    'LIKELY_VISUAL_CONCERN',
    'INSUFFICIENT_EVIDENCE',
  ];

  if (!validScreeningStatuses.includes(result.screeningStatus)) {
    result.screeningStatus = SCREENING_STATUSES.INSUFFICIENT_EVIDENCE;
    overrides.push('Screening status normalized to known value.');
  }

  return buildValidationResult(result, 'VALID_FOOD', overrides);
}

/**
 * Build the final validation result object
 */
function buildValidationResult(geminiResult, inputStatus, overrides) {
  return {
    inputStatus,
    detectedCategory: geminiResult.detectedCategory || 'UNKNOWN',
    detectedItem: geminiResult.detectedItem || 'Unknown',
    categoryMismatch: geminiResult.categoryMismatch || null,
    imageQuality: geminiResult.imageQuality || { status: 'GOOD', issues: [] },
    screeningStatus: geminiResult.screeningStatus,
    visualObservations: geminiResult.visualObservations || [],
    visualConcern: geminiResult.visualConcern || 'INSUFFICIENT_EVIDENCE',
    reasoning: geminiResult.reasoning || '',
    limitations: geminiResult.limitations || ['Visual analysis cannot confirm adulteration.'],
    overrides,
    source: geminiResult.source || 'gemini',
  };
}

/**
 * Normalize user category string to our standard enum
 */
function normalizeCategory(category) {
  if (!category) return null;
  const upper = category.toUpperCase().trim();
  if (upper === 'DAIRY') return 'DAIRY';
  if (upper === 'PRODUCE' || upper === 'FRUITS' || upper === 'VEGETABLES') return 'PRODUCE';
  return null;
}

/**
 * Compute SHA-256 hash of an image file for duplicate detection
 * @param {string} filePath - Path to the image file
 * @returns {string} hex hash
 */
function computeImageHash(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  } catch (err) {
    console.error('[InputValidator] Failed to hash image:', err.message);
    return null;
  }
}

/**
 * Validate uploaded file type
 * @param {object} file - Multer file object
 * @returns {object} { valid, reason }
 */
function validateFileType(file) {
  if (!file) {
    return { valid: false, reason: 'No file uploaded.' };
  }

  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return { valid: false, reason: `Unsupported file type: ${file.mimetype}. Please upload a JPEG, PNG, or WebP image.` };
  }

  // 10MB limit
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, reason: 'Image file exceeds 10MB size limit.' };
  }

  return { valid: true };
}

module.exports = {
  validateInput,
  computeImageHash,
  validateFileType,
  normalizeCategory,
  SCREENING_STATUSES,
  SIGNAL_LEVELS,
  SUPPORTED_CATEGORIES,
};
