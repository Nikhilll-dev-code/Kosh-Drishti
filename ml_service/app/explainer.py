import os

def generate_template_explanation(work, rule_flags, composite_risk, tender_threshold=5000000):
    """
    Template-based fallback explanation generator (SRS FR-EXP-02)
    Executes if LLM API key is absent or unreachable
    """
    if not rule_flags:
        return "No anomaly indicators for this work. The project complies with standard MPLADS guidelines and timeline requirements."

    parts = []
    amount_lakhs = f"₹{work.get('sanctioned_amount', 0) / 100000:.2f} Lakhs"

    if 'R1' in rule_flags:
        parts.append(f"This work (sanctioned at {amount_lakhs}) shares a duplicate project description and identical expenditure structure with a prior sanctioned work under the same Implementing Agency across financial years, matching documented duplicate-billing signatures (CAG 2018 Report Finding).")

    if 'R2' in rule_flags:
        thresh_lakhs = tender_threshold / 100000
        parts.append(f"The sanctioned cost of {amount_lakhs} exceeds the mandated tender threshold of ₹{thresh_lakhs:.0f} Lakhs, yet no competitive tender reference ID is attached (Rule R2: Tender Bypass, MPLADS Guidelines §7.2).")

    if 'R3' in rule_flags:
        cat = work.get('category', 'Prohibited Category')
        parts.append(f"The work description classifies under an ineligible asset type ('{cat}'), violating Para 3.3 of MPLADS Guidelines prohibiting expenditure on private or non-durable assets (CAG Audit 2004-09 finding).")

    if 'R4' in rule_flags:
        parts.append("The constituency's annual fund utilization percentile ranks in the bottom national decile for multiple consecutive years (Rule R4: Chronic Under-utilization).")

    if 'R5' in rule_flags:
        parts.append("Cumulative constituency expenditure fails to meet the statutory 15% SC-area and 7.5% ST-area annual allocation quotas (Rule R5: SC/ST Norm Violation, Para 2.4).")

    if 'R6' in rule_flags:
        if work.get('completion_date') and work.get('uc_filed_date'):
            parts.append("The Utilization Certificate (UC) was submitted past the 30-day post-completion statutory window (Rule R6: Delayed UC, MPLADS Guidelines Para 6.4).")
        else:
            parts.append("The work is marked completed, but no Utilization Certificate (UC) has been filed past the 45-day allowable grace window (Rule R6: Missing UC).")

    return " ".join(parts)


def generate_llm_explanation(work, rule_flags, composite_risk, tender_threshold=5000000):
    """
    Generate plain-language explanation via Groq LLM API or fallback to template
    """
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        return generate_template_explanation(work, rule_flags, composite_risk, tender_threshold)

    try:
        from groq import Groq
        client = Groq(api_key=groq_api_key)
        
        prompt = f"""You are an expert fraud & compliance audit analyst for the India MPLADS (Members of Parliament Local Area Development Scheme).
Convert the following rule-hit flags and project details into a single clear, non-jargon evidence-backed explanation paragraph for a District Authority auditor.

Project Details:
- Work ID: {work.get('work_id')}
- Description: {work.get('description')}
- Sanctioned Amount: ₹{work.get('sanctioned_amount')}
- Category: {work.get('category')}
- Triggered Rules: {', '.join(rule_flags)}
- Composite Risk Score: {composite_risk}/100

Mandatory guidelines:
1. Explain exactly WHY each triggered rule fired, citing MPLADS guidelines or CAG report clauses.
2. Maintain active voice and objective auditor tone. Do NOT declare guilt; frame as 'needs human audit review'.
3. Keep response to 3-4 clear sentences in one paragraph.
"""
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            max_tokens=300
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[EXPLAINER FALLBACK] Groq API error: {e}. Falling back to template explainer.")
        return generate_template_explanation(work, rule_flags, composite_risk, tender_threshold)
