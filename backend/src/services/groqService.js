const https = require('https');
const dotenv = require('dotenv');
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Template-based fallback explanation (Runs offline if API key is missing or fails)
 */
function generateTemplateExplanation(work, ruleFlags = [], compositeRisk = 0, config = {}) {
  if (!ruleFlags || ruleFlags.length === 0) {
    return 'No anomaly indicators detected for this work. The project complies with standard MPLADS guidelines and timeline requirements.';
  }

  const parts = [];
  const tenderThreshold = (config && config.r2_tender_threshold) || 2500000;
  const amountLakhs = `₹${((work.sanctioned_amount || work.proposed_cost || 0) / 100000).toFixed(2)} Lakhs`;

  if (ruleFlags.includes('R1')) {
    parts.push(
      `Classification under an ineligible category violates Para 3.3 of statutory MPLADS guidelines prohibiting expenditure on private, religious, or non-durable assets.`
    );
  }

  if (ruleFlags.includes('R2')) {
    parts.push(
      `Project title and financial parameters exhibit high similarity matching an existing sanctioned work in the constituency (Rule R2: Duplicate Work).`
    );
  }

  if (ruleFlags.includes('R3')) {
    parts.push(
      `Utilization Certificate (UC) submission lag exceeds allowed statutory timeline limits (Rule R3: Excessive Delay).`
    );
  }

  if (ruleFlags.includes('R4')) {
    const threshLakhs = (tenderThreshold / 100000).toFixed(0);
    parts.push(
      `The sanctioned cost of ${amountLakhs} approaches the mandated competitive tender threshold of ₹${threshLakhs} Lakhs without attached tender verification ID (Rule R4: Tender Bypass).`
    );
  }

  if (ruleFlags.includes('R5')) {
    parts.push(
      `The assigned Implementing Agency holds an over-concentrated share of constituency works, exceeding 35% concentration guidelines (Rule R5: IA Concentration).`
    );
  }

  if (ruleFlags.includes('R6')) {
    parts.push(
      `Sanctioned cost exceeds 1.5x expected category benchmark rates for standard public assets (Rule R6: Cost Anomaly).`
    );
  }

  return parts.join(' ');
}

/**
 * Make a direct HTTPS request to Groq API
 */
function callGroqAPI(prompt) {
  return new Promise((resolve, reject) => {
    if (!GROQ_API_KEY) {
      return reject(new Error('GROQ_API_KEY is not configured in environment'));
    }

    const body = JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 450
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.choices && parsed.choices[0]) {
            resolve(parsed.choices[0].message.content.trim());
          } else {
            reject(new Error('Invalid response structure from Groq API'));
          }
        } catch (e) {
          reject(new Error('JSON parse error: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(12000, () => {
      req.destroy(new Error('Groq API timeout after 12s'));
    });

    req.write(body);
    req.end();
  });
}

/**
 * Generate AI explanation using Groq LLM strictly as an evidence explainer
 */
async function generateLLMExplanation(work, ruleFlags = [], compositeRisk = 0, evidence = [], anomalyScore = 0.2) {
  if (!GROQ_API_KEY) {
    console.log('[GroqService] No GROQ_API_KEY present — using template explainer.');
    return generateTemplateExplanation(work, ruleFlags, compositeRisk);
  }

  const evidenceStr = Array.isArray(evidence)
    ? evidence.map(e => `- [${e.type || 'SIGNAL'}] ${e.reason || e.evidence || ''}`).join('\n')
    : `Rule Flags: ${ruleFlags.join(', ')}`;

  const prompt = `You are an expert fraud & compliance audit analyst for India's MPLADS (Members of Parliament Local Area Development Scheme).

CRITICAL INSTRUCTIONS:
1. You are an AI EXPLAINER assistant. The numerical Composite Risk Score (${compositeRisk}/100) and ML Anomaly Score (${anomalyScore}) have already been calculated deterministically by the rule and ML pipeline.
2. Do NOT invent new facts or alter numerical scores.
3. Use ONLY the supplied evidence below. If information is unavailable, explicitly state so.

Work Context:
- Work ID: ${work.work_id}
- Title: ${work.title || work.description || 'N/A'}
- Category: ${work.category || 'N/A'}
- Sanctioned Cost: ₹${((work.sanctioned_amount || work.proposed_cost || 0) / 100000).toFixed(2)} Lakhs
- State / Constituency: ${work.state || 'N/A'} / ${work.constituency || 'N/A'}
- Implementing Agency: ${work.implementing_agency || work.ia_id || 'N/A'}
- Composite Risk Score: ${compositeRisk}/100
- ML IsolationForest Anomaly Score: ${anomalyScore}

Pre-Computed Audit Evidence:
${evidenceStr}

Please provide a concise, structured response in 3 brief sections:
1. Plain-Language Explanation: (2-3 sentences explaining why this work was flagged based strictly on the evidence)
2. Key Risk Drivers: (Bullet list of the main triggered rules or ML signals)
3. Recommended Action: (Actionable next step for a District Authority auditor)`;

  try {
    const explanation = await callGroqAPI(prompt);
    console.log(`[GroqService] AI explanation generated for work ${work.work_id}`);
    return explanation;
  } catch (err) {
    console.warn(`[GroqService] Groq API error: ${err.message}. Using template fallback.`);
    return generateTemplateExplanation(work, ruleFlags, compositeRisk);
  }
}

module.exports = {
  generateLLMExplanation,
  generateTemplateExplanation
};
