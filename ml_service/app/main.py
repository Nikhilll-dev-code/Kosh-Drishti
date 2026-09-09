from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from app.isolation_forest import anomaly_scorer
from app.explainer import generate_llm_explanation, generate_template_explanation

app = FastAPI(
    title="Kosh-Drishti ML & Scoring Service",
    description="Isolation Forest Anomaly Scoring & Plain-Language Explainer API for SIH26102",
    version="1.0.0"
)

# CORS: allow backend service and localhost dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ML service is internal, not browser-facing
    allow_methods=["*"],
    allow_headers=["*"],
)

class FeatureVectorInput(BaseModel):
    id: Optional[str] = None
    work_id: Optional[str] = None
    constituency_id: Optional[str] = None
    features: List[float] # 7 normalized numeric features

class ScoringRequest(BaseModel):
    items: List[FeatureVectorInput]

class ExplainRequest(BaseModel):
    work: Dict[str, Any]
    rule_flags: List[str]
    composite_risk: int
    tender_threshold: Optional[int] = 2500000

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "Kosh-Drishti ML Service",
        "model_fitted": anomaly_scorer.is_fitted,
        "contamination": anomaly_scorer.contamination,
        "features_expected": 7
    }

@app.post("/score")
def score_works(req: ScoringRequest):
    if not req.items:
        return {
            "scores": {},
            "model_status": "NO_ITEMS_PROVIDED",
            "features_used": 7
        }

    matrix = [item.features for item in req.items]
    scores, status = anomaly_scorer.fit_predict(matrix)

    result = {}
    for i, item in enumerate(req.items):
        item_id = item.id or item.work_id or item.constituency_id or f"ITEM-{i}"
        result[item_id] = scores[i] if i < len(scores) else 0.2

    return {
        "scores": result,
        "model_status": status,
        "features_used": 7,
        "contamination_setting": anomaly_scorer.contamination
    }

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

if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)

