// TrustBite — Gemini Vision AI Service
// Replaces the legacy implementation with the current official @google/genai SDK

const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

let ai = null;

function initializeGemini() {
  if (!GEMINI_API_KEY) {
    console.error('WARNING: GEMINI_API_KEY is not set. AI analysis will fail.');
    return false;
  }
  try {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log(`Gemini Vision AI initialized successfully with model: ${GEMINI_MODEL}`);
    return true;
  } catch (err) {
    console.error('Failed to initialize Gemini SDK:', err.message);
    return false;
  }
}

// System instruction for TrustBite's food-safety screening
const TRUSTBITE_SYSTEM_PROMPT = `You are TrustBite's food-safety visual screening engine.

RULES:
1. FIRST determine if the image contains food. If it does NOT contain food (e.g., documents, certificates, electronics, people, buildings, vehicles, screenshots, memes, random objects), you MUST return foodStatus as "NON_FOOD". Never analyze non-food as food.
2. If the image contains food, determine the specific category:
   - DAIRY: milk, curd, yogurt, paneer, cheese
   - PRODUCE: fruits, vegetables
   - OTHER_FOOD: cooked meals, packaged snacks, beverages, grains, spices, etc.
3. TrustBite only supports DAIRY and PRODUCE. If you detect OTHER_FOOD, return category as "OTHER_FOOD" and note it is unsupported.
4. Assess image quality: check for blur, darkness, overexposure, food item too small, heavy obstruction, or insufficient visibility.
5. For supported food items with good image quality, provide visual observations about potential food safety concerns (discoloration, unusual texture, separation, mold, wax coating, artificial appearance, etc.).
6. NEVER claim laboratory confirmation. You are performing visual screening only.
7. NEVER invent visual evidence that isn't present.
8. If evidence is insufficient, say so explicitly.
9. Separate observations (what you see) from conclusions (what it might mean).
10. Be honest about limitations.

You MUST respond with valid JSON only. No markdown, no code fences, no explanation outside JSON.

JSON schema:
{
  "foodStatus": "FOOD" | "NON_FOOD" | "UNCERTAIN",
  "detectedCategory": "DAIRY" | "PRODUCE" | "OTHER_FOOD" | "NON_FOOD" | "UNKNOWN",
  "detectedItem": "string describing the specific item, e.g. 'milk', 'apple', 'certificate'",
  "imageQuality": {
    "status": "GOOD" | "POOR" | "UNUSABLE",
    "issues": ["list of specific issues if any"]
  },
  "visualObservations": ["list of specific visual observations about the food item"],
  "visualConcern": "NONE" | "POSSIBLE" | "LIKELY" | "INSUFFICIENT_EVIDENCE",
  "screeningStatus": "NO_OBVIOUS_VISUAL_CONCERN" | "POSSIBLE_VISUAL_CONCERN" | "LIKELY_VISUAL_CONCERN" | "INSUFFICIENT_EVIDENCE" | "NON_FOOD" | "UNSUPPORTED_FOOD" | "LOW_IMAGE_QUALITY",
  "reasoning": "A brief 1-2 sentence screening summary",
  "limitations": ["list of limitations, always include 'Visual analysis cannot confirm adulteration'"]
}`;

/**
 * Convert an image file to a Gemini-compatible inline data part
 */
function fileToGenerativePart(filePath) {
  const data = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
  };
  
  const mimeType = mimeTypes[ext] || 'image/jpeg';
  
  return {
    inlineData: {
      data: data.toString('base64'),
      mimeType,
    },
  };
}

/**
 * Analyze a food image using Gemini Vision API
 */
const analyzeImage = async (imagePath, userCategory, explicitItemName = null) => {
  console.log(`[Gemini] Analyzing image: ${imagePath} | category: ${userCategory} | model: ${GEMINI_MODEL}`);

  if (!ai) {
    const initialized = initializeGemini();
    if (!initialized) {
      return createFallbackResponse('AI_SERVICE_UNAVAILABLE', 'Gemini API is not configured. Please check environment variables.');
    }
  }

  if (!fs.existsSync(imagePath)) {
    return createFallbackResponse('FILE_ERROR', 'Image file not found.');
  }

  const stats = fs.statSync(imagePath);
  if (stats.size > 10 * 1024 * 1024) {
    return createFallbackResponse('FILE_TOO_LARGE', 'Image file exceeds 10MB limit.');
  }

  try {
    const imagePart = fileToGenerativePart(imagePath);
    const userPrompt = `Analyze this image for TrustBite food-safety screening.
The user selected category: "${userCategory || 'unknown'}"${explicitItemName ? `\nThe user says this item is: "${explicitItemName}"` : ''}

Respond with JSON only. Follow the schema exactly.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: TRUSTBITE_SYSTEM_PROMPT + '\n\n' + userPrompt },
        imagePart
      ],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    console.log('[Gemini] Raw response snippet:', text?.substring(0, 500) || 'empty');

    if (!text) {
      return createFallbackResponse('AI_ANALYSIS_FAILED', 'Empty response from model.');
    }

    const parsed = parseGeminiResponse(text);
    if (!parsed) {
      console.error('[Gemini] Failed to parse response as JSON:', text);
      return createFallbackResponse('PARSE_ERROR', 'AI response could not be parsed.');
    }

    return normalizeGeminiResult(parsed);

  } catch (error) {
    console.error('[Gemini] API Error:', error.message);
    
    // Explicitly handle 404s (e.g., model not found)
    if (error.message?.includes('404') || error.message?.includes('not found')) {
       return createFallbackResponse('AI_SERVICE_UNAVAILABLE', `Model ${GEMINI_MODEL} is currently unavailable or not found.`);
    }
    if (error.message?.includes('API_KEY')) {
      return createFallbackResponse('API_KEY_ERROR', 'Invalid or missing Gemini API key.');
    }
    if (error.message?.includes('quota') || error.message?.includes('429')) {
      return createFallbackResponse('RATE_LIMITED', 'API rate limit reached. Please wait a moment and try again.');
    }
    
    return createFallbackResponse('AI_ANALYSIS_FAILED', `AI analysis failed: ${error.message}`);
  }
};

/**
 * Parse Gemini response text into JSON
 */
function parseGeminiResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        return null;
      }
    }
    return null;
  }
}

/**
 * Normalize Gemini result into a consistent structure
 */
function normalizeGeminiResult(parsed) {
  return {
    foodStatus: parsed.foodStatus || 'UNCERTAIN',
    detectedCategory: parsed.detectedCategory || 'UNKNOWN',
    detectedItem: parsed.detectedItem || 'Unknown',
    imageQuality: {
      status: parsed.imageQuality?.status || 'GOOD',
      issues: Array.isArray(parsed.imageQuality?.issues) ? parsed.imageQuality.issues : [],
    },
    visualObservations: Array.isArray(parsed.visualObservations) ? parsed.visualObservations : [],
    visualConcern: parsed.visualConcern || 'INSUFFICIENT_EVIDENCE',
    screeningStatus: parsed.screeningStatus || 'INSUFFICIENT_EVIDENCE',
    reasoning: parsed.reasoning || 'Analysis completed.',
    limitations: Array.isArray(parsed.limitations) 
      ? parsed.limitations 
      : ['Visual analysis cannot confirm adulteration.'],
    source: 'gemini',
  };
}

/**
 * Create a fallback response when Gemini is unavailable or fails
 */
function createFallbackResponse(errorType, message) {
  return {
    foodStatus: 'UNCERTAIN',
    detectedCategory: 'UNKNOWN',
    detectedItem: 'Unknown',
    imageQuality: { status: 'GOOD', issues: [] },
    visualObservations: [],
    visualConcern: 'INSUFFICIENT_EVIDENCE',
    // Key change: Use specific AI failure statuses rather than INSUFFICIENT_EVIDENCE
    // so the validation layer can reject it without marking it as a successful scan
    screeningStatus: (errorType === 'AI_SERVICE_UNAVAILABLE' || errorType === 'API_KEY_ERROR' || errorType === 'RATE_LIMITED') 
      ? 'AI_SERVICE_UNAVAILABLE' 
      : 'AI_ANALYSIS_FAILED',
    reasoning: message,
    limitations: ['AI analysis was unavailable.'],
    source: 'fallback',
    errorType,
  };
}

initializeGemini();

module.exports = {
  analyzeImage,
};
