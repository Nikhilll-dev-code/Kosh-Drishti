import numpy as np
from sklearn.ensemble import IsolationForest

class AnomalyScorer:
    def __init__(self, contamination=0.1, random_state=42):
        self.contamination = contamination
        self.random_state = random_state
        self.model = IsolationForest(
            n_estimators=100,
            contamination=self.contamination,
            random_state=self.random_state
        )
        self.is_fitted = False

    def fit_predict(self, feature_matrix):
        """
        Fits IsolationForest on normalized 7-feature matrix
        Returns tuple of (scores_list, status_string)
        """
        if not feature_matrix or len(feature_matrix) == 0:
            return [], "EMPTY_INPUT"

        # Safely convert to numpy array and handle NaN/inf values
        try:
            X = np.nan_to_num(np.array(feature_matrix, dtype=np.float64), nan=0.0, posinf=1.0, neginf=0.0)
        except Exception as e:
            return [0.2 for _ in range(len(feature_matrix))], f"CONVERSION_ERROR: {str(e)}"

        n_samples, n_features = X.shape

        # Sample size safety check (N < 5 samples)
        if n_samples < 5:
            # Baseline linear heuristic fallback for very small batches
            fallback_scores = []
            for row in X:
                score = (row[3] * 0.25) + (row[4] * 0.20) + (row[5] * 0.20) + (row[1] * 0.15) + (row[2] * 0.10) + (row[6] * 0.10)
                fallback_scores.append(round(float(np.clip(score, 0.05, 0.95)), 3))
            return fallback_scores, "SMALL_SAMPLE_BASELINE"

        # Constant feature check (zero variance across all rows)
        if np.all(X == X[0, :]):
            return [0.1 for _ in range(n_samples)], "CONSTANT_FEATURE_MATRIX"

        try:
            self.model.fit(X)
            self.is_fitted = True

            # Raw decision function score (lower means more anomalous)
            raw_scores = self.model.decision_function(X)

            # Min-Max normalization to [0.05, 0.95] range
            min_s = float(np.min(raw_scores))
            max_s = float(np.max(raw_scores))

            if max_s == min_s:
                return [0.2 for _ in range(n_samples)], "UNIFORM_DECISION_SCORES"

            # Invert raw score so higher value = higher anomaly risk
            normalized_scores = 1.0 - ((raw_scores - min_s) / (max_s - min_s))
            final_scores = [round(float(np.clip(s, 0.05, 0.95)), 3) for s in normalized_scores]
            
            return final_scores, "ISOLATION_FOREST_SUCCESS"
        except Exception as err:
            return [0.2 for _ in range(n_samples)], f"FIT_ERROR: {str(err)}"

anomaly_scorer = AnomalyScorer()
