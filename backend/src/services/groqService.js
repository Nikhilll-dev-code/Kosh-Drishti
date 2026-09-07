const https = require('https');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Template-based fallback explanation (FR-EXP-02)
 * Runs offline, no API key needed
 */
function generateTemplateExplanation(work, ruleFlags, compositeRisk, config) {
  if (!ruleFlags || ruleFlags.length === 0) {
    return 'No anomaly indicators detected for this work. The project complies with standard MPLADS guidelines and timeline requirements.';
  }

  const parts = [];
  const tenderThreshold = (config && config.r2_tender_threshold) || 2500000;
  const amountLakhs = `₹${((work.sanctioned_amount || 0) / 100000).toFixed(2)} Lakhs`;

  if (ruleFlags.includes('R1')) {
    parts.push(
      `This work (sanctioned at ${amountLakhs}) shares a duplicate project description and identical expenditure structure with a prior sanctioned work under the same Implementing Agency across financial years, matching documented duplicate-billing signatures (CAG 2018 Report Finding, Rule R1).`
    );
  }

  if (ruleFlags.includes('R2')) {
    const threshLakhs = (tenderThreshold / 100000).toFixed(0);
    parts.push(
      `The sanctioned cost of ${amountLakhs} exceeds the mandated competitive tender threshold of ₹${threshLakhs} Lakhs, yet no e-tender reference ID is recorded against this work (Rule R2: Tender Bypass, MPLADS Guidelines §7.2).`
    );
  }

  if (ruleFlags.includes('R3')) {
    const cat = work.category || 'Prohibited Category';
    parts.push(
      `The work description classifies under an ineligible asset type ('${cat}'), violating Para 3.3 of MPLADS Guidelines prohibiting expenditure on private, religious, or non-durable assets (Rule R3: Ineligible Category, CAG Audit 2004–09 finding).`
    );
  }

  if (ruleFlags.includes('R4')) {
    parts.push(
      `The constituency's annual fund utilization percentile ranks in the bottom national decile for multiple consecutive years, indicating chronic under-spending of the ₹5 Crore annual entitlement (Rule R4: Chronic Under-utilization).`
    );
  }

  if (ruleFlags.includes('R5')) {
    parts.push(
      `Cumulative constituency expenditure fails to meet the statutory 15% SC-area and 7.5% ST-area annual allocation quotas mandated under MPLADS Guidelines Para 2.4 (Rule R5: SC/ST Norm Violation).`
    );
  }

  if (ruleFlags.includes('R6')) {
    if (work.completion_date && work.uc_filed_date) {
      const days = Math.floor(
        (new Date(work.uc_filed_date) - new Date(work.completion_date)) / 86400000
      );
      parts.push(
        `The Utilization Certificate (UC) was submitted ${days} days after work completion, exceeding the mandated 30-day statutory window under MPLADS Guidelines Para 6.4 (Rule R6: Delayed UC).`
      );
    } else {
      parts.push(
        `The work is marked as completed but no Utilization Certificate (UC) has been filed past the 45-day allowable grace window, constituting a statutory default under MPLADS Guidelines Para 6.4 (Rule R6: Missing UC).`
      );
    }
  }

  return parts.join(' ');
}

/**
 * Make a direct HTTPS request to Groq API (no external npm dependency needed)
 */
function callGroqAPI(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 350
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
            reject(new Error('Invalid Groq response: ' + data));
          }
        } catch (e) {
          reject(new Error('JSON parse error: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error('Groq API timeout after 15s'));
    });

    req.write(body);
    req.end();
  });
}

/**
 * Generate AI explanation using Groq LLM, with template fallback
 */
async function generateLLMExplanation(work, ruleFlags, compositeRisk, config) {
  if (!GROQ_API_KEY) {
    console.log('[GroqService] No GROQ_API_KEY — using template explainer.');
    return generateTemplateExplanation(work, ruleFlags, compositeRisk, config);
  }

  if (!ruleFlags || ruleFlags.length === 0) {
    return 'No anomaly indicators detected for this work. The project complies with standard MPLADS guidelines and timeline requirements.';
  }

  const tenderThreshold = (config && config.r2_tender_threshold) || 2500000;

  const prompt = `You are an expert fraud & compliance audit analyst for India's MPLADS (Members of Parliament Local Area Development Scheme).

Convert the following rule-hit flags and project details into a single clear, non-jargon, evidence-backed explanation paragraph for a District Authority auditor reviewing the work.

Project Details:
- Work ID: ${work.work_id}
- Description: ${work.description}
- Sanctioned Amount: ₹${((work.sanctioned_amount || 0) / 100000).toFixed(2)} Lakhs (₹${work.sanctioned_amount})
- Category: ${work.category}
- State: ${work.state}
- Implementing Agency: ${work.ia_id}
- Sanction Date: ${work.sanction_date}
- Completion Date: ${work.completion_date || 'Not yet completed'}
- UC Filed Date: ${work.uc_filed_date || 'Not filed'}
- Triggered Rules: ${ruleFlags.join(', ')}
- Composite Risk Score: ${compositeRisk}/100
- Tender Bypass Threshold: ₹${(tenderThreshold / 100000).toFixed(0)} Lakhs

Rule Reference:
- R1: Duplicate Billing (CAG 2018 Gujarat Audit Finding)
- R2: Tender Bypass (MPLADS Guidelines §7.2)
- R3: Ineligible Category (MPLADS Guidelines Para 3.3)
- R4: Chronic Under-Utilization (Scheme Financial Norms)
- R5: SC/ST Norm Violation (MPLADS Guidelines Para 2.4)
- R6: Late/Missing UC (MPLADS Guidelines Para 6.4)

Instructions:
1. Explain exactly WHY each triggered rule fired, citing MPLADS guidelines or CAG report clauses.
2. Use active voice and objective auditor tone. Do NOT declare guilt; frame as 'requires human audit review'.
3. Keep response to 3–4 clear sentences in one paragraph. No bullet points.`;

  try {
    const explanation = await callGroqAPI(prompt);
    console.log(`[GroqService] AI explanation generated for work ${work.work_id}`);
    return explanation;
  } catch (err) {
    console.error(`[GroqService] Groq API error: ${err.message}. Falling back to template.`);
    return generateTemplateExplanation(work, ruleFlags, compositeRisk, config);
  }
}

module.exports = {
  generateLLMExplanation,
  generateTemplateExplanation
};
