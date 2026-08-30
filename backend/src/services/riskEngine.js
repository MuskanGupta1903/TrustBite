// TrustBite — Risk Synthesis Engine
// Combines visual signal, user context, community signal, and temporal data
// into an explainable TrustBite Signal.

const { SIGNAL_LEVELS } = require('./inputValidator');

/**
 * Synthesize all signals into an explainable TrustBite risk signal
 * 
 * @param {object} validation - Validated AI result from inputValidator
 * @param {object} sensoryData - User-provided sensory questionnaire answers
 * @param {object} communitySignal - Community intelligence data
 * @returns {object} Synthesized risk signal with evidence provenance
 */
function synthesizeRisk(validation, sensoryData, communitySignal) {
  const factors = [];
  let signalScore = 0;

  // Factor 1: Visual signal (from Gemini AI)
  const visualFactor = assessVisualSignal(validation);
  if (visualFactor) {
    factors.push(visualFactor);
    signalScore += visualFactor.weight;
  }

  // Factor 2: User sensory context
  const sensoryFactor = assessSensorySignal(sensoryData, validation.detectedCategory);
  if (sensoryFactor) {
    factors.push(sensoryFactor);
    signalScore += sensoryFactor.weight;
  }

  // Factor 3: Community signal
  const communityFactor = assessCommunitySignal(communitySignal);
  if (communityFactor) {
    factors.push(communityFactor);
    signalScore += communityFactor.weight;
  }

  // Factor 4: Temporal trend
  const trendFactor = assessTrendSignal(communitySignal);
  if (trendFactor) {
    factors.push(trendFactor);
    signalScore += trendFactor.weight;
  }

  // Factor 5: Anomaly detection
  const anomalyFactor = assessAnomalySignal(communitySignal);
  if (anomalyFactor) {
    factors.push(anomalyFactor);
    signalScore += anomalyFactor.weight;
  }

  // Determine overall signal level
  const signalLevel = computeSignalLevel(signalScore, factors.length);

  // Generate human-readable explanation
  const explanation = generateExplanation(factors, signalLevel);

  return {
    signal_level: signalLevel,
    signal_score: Math.min(signalScore, 10),
    contributing_factors: factors,
    explanation,
    factor_count: factors.length,
    disclaimer: 'This is a screening aid, not laboratory confirmation. Multiple independent signals are combined to produce this assessment.',
  };
}

/**
 * Assess visual signal contribution
 */
function assessVisualSignal(validation) {
  if (!validation || validation.inputStatus !== 'VALID_FOOD') return null;

  switch (validation.screeningStatus) {
    case 'LIKELY_VISUAL_CONCERN':
      return {
        source: 'visual',
        icon: '📷',
        label: 'Visual Analysis',
        signal: 'Visual anomalies detected in the image',
        detail: validation.visualObservations?.join('; ') || 'Possible visual anomaly detected',
        severity: 'high',
        weight: 3,
      };
    case 'POSSIBLE_VISUAL_CONCERN':
      return {
        source: 'visual',
        icon: '📷',
        label: 'Visual Analysis',
        signal: 'Possible visual anomaly detected',
        detail: validation.visualObservations?.join('; ') || 'Some visual indicators present',
        severity: 'moderate',
        weight: 2,
      };
    case 'NO_OBVIOUS_VISUAL_CONCERN':
      return {
        source: 'visual',
        icon: '📷',
        label: 'Visual Analysis',
        signal: 'No obvious visual concerns detected',
        detail: validation.visualObservations?.join('; ') || 'Appears normal visually',
        severity: 'low',
        weight: 0,
      };
    default:
      return {
        source: 'visual',
        icon: '📷',
        label: 'Visual Analysis',
        signal: 'Insufficient visual evidence for assessment',
        detail: 'Could not draw conclusions from image',
        severity: 'unknown',
        weight: 0,
      };
  }
}

/**
 * Assess user sensory signal contribution
 */
function assessSensorySignal(sensoryData, category) {
  if (!sensoryData || Object.keys(sensoryData).length === 0) return null;

  let concernCount = 0;
  const concerns = [];

  // Dairy-specific sensory signals
  if (sensoryData.smell === 'yes') {
    concernCount++;
    concerns.push('Unusual smell reported');
  }
  if (sensoryData.lumpy === 'yes') {
    concernCount++;
    concerns.push('Curdling or lumpy texture reported');
  }

  // Produce-specific sensory signals
  if (sensoryData.mold === 'yes') {
    concernCount++;
    concerns.push('Visible mold or dark spotting reported');
  }
  if (sensoryData.texture === 'yes') {
    concernCount++;
    concerns.push('Unusual texture (soft, mushy, or waxy) reported');
  }

  if (concernCount === 0) return null;

  return {
    source: 'user',
    icon: '🗣️',
    label: 'Your Observations',
    signal: concerns.join('; '),
    detail: `${concernCount} sensory concern(s) reported by user`,
    severity: concernCount >= 2 ? 'high' : 'moderate',
    weight: concernCount >= 2 ? 2 : 1,
  };
}

/**
 * Assess community signal contribution
 */
function assessCommunitySignal(communitySignal) {
  if (!communitySignal) return null;

  const reports7d = communitySignal.nearby_reports_7d || 0;
  const radius = communitySignal.radius_km || 3;

  if (reports7d === 0) return null;

  let severity = 'low';
  let weight = 0;
  let signal = '';

  if (reports7d >= 10) {
    severity = 'high';
    weight = 3;
    signal = `${reports7d} reports within ${radius} km in the last 7 days`;
  } else if (reports7d >= 5) {
    severity = 'moderate';
    weight = 2;
    signal = `${reports7d} reports within ${radius} km in the last 7 days`;
  } else if (reports7d >= 2) {
    severity = 'low';
    weight = 1;
    signal = `${reports7d} reports within ${radius} km in the last 7 days`;
  } else {
    signal = `${reports7d} report within ${radius} km in the last 7 days`;
    weight = 0;
  }

  return {
    source: 'community',
    icon: '📍',
    label: 'Community Reports',
    signal,
    detail: `${communitySignal.similar_category_reports || 0} reports in the same category`,
    severity,
    weight,
  };
}

/**
 * Assess temporal trend signal
 */
function assessTrendSignal(communitySignal) {
  if (!communitySignal) return null;

  const trend = communitySignal.trend;
  if (!trend || trend === 'STABLE') return null;

  if (trend === 'UNUSUAL_SPIKE') {
    return {
      source: 'trend',
      icon: '📈',
      label: 'Trend Analysis',
      signal: 'Unusual spike in reports detected',
      detail: communitySignal.trend_description || 'Reports have increased significantly',
      severity: 'high',
      weight: 2,
    };
  }

  if (trend === 'INCREASING') {
    return {
      source: 'trend',
      icon: '📈',
      label: 'Trend Analysis',
      signal: 'Reports are increasing in this area',
      detail: communitySignal.trend_description || 'Reports are above the weekly average',
      severity: 'moderate',
      weight: 1,
    };
  }

  return null;
}

/**
 * Assess anomaly signal
 */
function assessAnomalySignal(communitySignal) {
  if (!communitySignal || !communitySignal.anomaly_detected) return null;

  return {
    source: 'anomaly',
    icon: '⚡',
    label: 'Anomaly Detection',
    signal: 'Unusual activity pattern detected',
    detail: communitySignal.anomaly_description || 'Report frequency is significantly above normal',
    severity: 'high',
    weight: 2,
  };
}

/**
 * Compute final signal level from score and factor count
 */
function computeSignalLevel(score, factorCount) {
  if (score >= 6 || (score >= 4 && factorCount >= 3)) return SIGNAL_LEVELS.HIGH;
  if (score >= 4 || (score >= 3 && factorCount >= 2)) return SIGNAL_LEVELS.ELEVATED;
  if (score >= 2) return SIGNAL_LEVELS.MODERATE;
  if (score > 0) return SIGNAL_LEVELS.LOW;
  return SIGNAL_LEVELS.LOW;
}

/**
 * Generate human-readable explanation of the signal
 */
function generateExplanation(factors, signalLevel) {
  const concernFactors = factors.filter(f => f.weight > 0);
  
  if (concernFactors.length === 0) {
    return 'No significant concerns detected from any signal source.';
  }

  if (concernFactors.length === 1) {
    return `One signal source indicates a possible concern: ${concernFactors[0].signal.toLowerCase()}.`;
  }

  return `Multiple independent signals (${concernFactors.length}) are pointing in the same direction, which increases the overall confidence of this screening.`;
}

module.exports = {
  synthesizeRisk,
};
