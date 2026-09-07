from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from app.isolation_forest import anomaly_scorer
from app.explainer import generate_llm_explanation, generate_template_explanation

app = FastAPI(
    title="Kosh-Drishti ML & Scoring Service",
    description="Isolation Forest Anomaly Scoring & Plain-Language Explainer API for SIH26102",
    version="1.0.0"
)

class FeatureVectorInput(BaseModel):
    work_id: str
    features: List[float] # 7 normalized numeric features

class ScoringRequest(BaseModel):
    items: List[FeatureVectorInput]

class ExplainRequest(BaseModel):
    work: Dict[str, Any]
    rule_flags: List[str]
    composite_risk: int
    tender_threshold: Optional[int] = 5000000

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "Kosh-Drishti ML Service",
        "model_fitted": anomaly_scorer.is_fitted
    }

@app.post("/score")
def score_works(req: ScoringRequest):
    if not req.items:
        return {"scores": {}}

    matrix = [item.features for item in req.items]
    scores = anomaly_scorer.fit_predict(matrix)

    result = {}
    for i, item in enumerate(req.items):
        result[item.work_id] = scores[i]

    return {"scores": result}

@app.post("/explain")
def explain_work(req: ExplainRequest):
    explanation = generate_llm_explanation(
        work=req.work,
        rule_flags=req.rule_flags,
        composite_risk=req.composite_risk,
        tender_threshold=req.tender_threshold
    )
    return {
        "work_id": req.work.get("work_id"),
        "explanation": explanation
    }
