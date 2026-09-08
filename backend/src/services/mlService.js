const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Sends a list of feature vectors to the Python FastAPI IsolationForest ML Service
 * Payload structure expected by ML Service:
 * { items: [ { work_id: string, features: number[] } ] }
 */
async function fetchMLAnomalyScores(featureItems) {
  if (!featureItems || featureItems.length === 0) {
    return { scores: {}, model_status: 'EMPTY_INPUT' };
  }

  const payload = JSON.stringify({ items: featureItems });

  return new Promise((resolve) => {
    try {
      const url = new URL(`${ML_SERVICE_URL}/score`);
      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port || 8000,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          },
          timeout: 3000 // 3 second connection timeout
        },
        (res) => {
          let rawData = '';
          res.on('data', chunk => { rawData += chunk; });
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = JSON.parse(rawData);
                resolve({
                  scores: parsed.scores || {},
                  model_status: parsed.model_status || 'ISOLATION_FOREST_ACTIVE',
                  features_used: parsed.features_used || 7
                });
              } catch (e) {
                console.warn('[MLService] Error parsing ML service response, using fallback scores');
                resolve(createFallbackScores(featureItems));
              }
            } else {
              console.warn(`[MLService] HTTP ${res.statusCode} from ML service, using fallback scores`);
              resolve(createFallbackScores(featureItems));
            }
          });
        }
      );

      req.on('error', (err) => {
        console.warn(`[MLService] Unable to connect to Python ML Service (${err.message}). Using heuristic ML fallback.`);
        resolve(createFallbackScores(featureItems));
      });

      req.on('timeout', () => {
        req.destroy();
        console.warn('[MLService] Request to ML service timed out. Using heuristic ML fallback.');
        resolve(createFallbackScores(featureItems));
      });

      req.write(payload);
      req.end();
    } catch (err) {
      console.warn(`[MLService] Request setup error: ${err.message}. Using fallback.`);
      resolve(createFallbackScores(featureItems));
    }
  });
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
 */
async function checkMLServiceHealth() {
  return new Promise((resolve) => {
    try {
      const url = new URL(`${ML_SERVICE_URL}/health`);
      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port || 8000,
          path: url.pathname,
          method: 'GET',
          timeout: 1500 // 1.5s timeout for health check
        },
        (res) => {
          let raw = '';
          res.on('data', chunk => { raw += chunk; });
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = JSON.parse(raw);
                if (parsed.status === 'UP') {
                  resolve('HEALTHY');
                } else {
                  resolve('DEGRADED');
                }
              } catch (e) {
                resolve('DEGRADED');
              }
            } else {
              resolve('DEGRADED');
            }
          });
        }
      );
      req.on('error', () => resolve('UNAVAILABLE'));
      req.on('timeout', () => { req.destroy(); resolve('UNAVAILABLE'); });
      req.end();
    } catch (e) {
      resolve('UNAVAILABLE');
    }
  });
}

module.exports = {
  fetchMLAnomalyScores,
  checkMLServiceHealth
};
