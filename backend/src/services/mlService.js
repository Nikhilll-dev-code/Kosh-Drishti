const dotenv = require('dotenv');
dotenv.config();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Sends a list of feature vectors to the Python FastAPI IsolationForest ML Service
 * Payload structure expected by ML Service:
 * { items: [ { work_id: string, features: number[] } ] }
 *
 * Uses Node 18+ native fetch() which supports both HTTP and HTTPS transparently.
 */
async function fetchMLAnomalyScores(featureItems) {
  if (!featureItems || featureItems.length === 0) {
    return { scores: {}, model_status: 'EMPTY_INPUT' };
  }

  const payload = JSON.stringify({ items: featureItems });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const res = await fetch(`${ML_SERVICE_URL}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const parsed = await res.json();
      return {
        scores: parsed.scores || {},
        model_status: parsed.model_status || 'ISOLATION_FOREST_ACTIVE',
        features_used: parsed.features_used || 7
      };
    } else {
      console.warn(`[MLService] HTTP ${res.status} from ML service, using fallback scores`);
      return createFallbackScores(featureItems);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[MLService] Request to ML service timed out. Using heuristic ML fallback.');
    } else {
      console.warn(`[MLService] Unable to connect to Python ML Service (${err.message}). Using heuristic ML fallback.`);
    }
    return createFallbackScores(featureItems);
  }
}

/**
 * Creates heuristic fallback anomaly scores when the Python ML service is offline
 */
function createFallbackScores(featureItems) {
  const fallbackScores = {};
  for (const item of featureItems) {
    const f = item.features || [];
    // Simple heuristic weighted average of feature matrix elements
    const costScaled = f[0] || 0;
    const ucLag = f[1] || 0;
    const iaConc = f[2] || 0;
    const dupSim = f[3] || 0;
    const tenderBypass = f[4] || 0;
    const ineligible = f[5] || 0;
    const benchmarkDev = f[6] || 0;

    const rawScore = (dupSim * 0.25) + (tenderBypass * 0.20) + (ineligible * 0.20) + (ucLag * 0.15) + (iaConc * 0.10) + (benchmarkDev * 0.10);
    fallbackScores[item.work_id] = Math.round(Math.min(Math.max(rawScore, 0.05), 0.95) * 1000) / 1000;
  }
  return {
    scores: fallbackScores,
    model_status: 'FALLBACK_HEURISTIC_ACTIVE'
  };
}

/**
 * Dynamic Health Check for Python FastAPI IsolationForest ML Service (Task 9)
 * Returns 'HEALTHY', 'DEGRADED', or 'UNAVAILABLE'
 *
 * Uses Node 18+ native fetch() which supports both HTTP and HTTPS transparently.
 */
async function checkMLServiceHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout

    const res = await fetch(`${ML_SERVICE_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const parsed = await res.json();
      return parsed.status === 'UP' ? 'HEALTHY' : 'DEGRADED';
    } else {
      return 'DEGRADED';
    }
  } catch (err) {
    return 'UNAVAILABLE';
  }
}

module.exports = {
  fetchMLAnomalyScores,
  checkMLServiceHealth
};
