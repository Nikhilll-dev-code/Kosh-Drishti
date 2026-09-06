import numpy as np
from sklearn.ensemble import IsolationForest

class AnomalyScorer:
    def __init__(self, contamination=0.1, random_state=42):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=contamination,
            random_state=random_state
        )
        self.is_fitted = False

    def fit_predict(self, feature_matrix):
        """
        Fits IsolationForest on normalized 7-feature matrix
        Returns anomaly scores normalized to [0, 1]
        """
        if len(feature_matrix) == 0:
            return []

        X = np.array(feature_matrix)
        
        # If dataset is very small, return uniform baseline scores with warning
        if len(X) < 5:
            return [0.2 for _ in range(len(X))]

        self.model.fit(X)
        self.is_fitted = True

        # raw decision function: lower means more anomalous
        raw_scores = self.model.decision_function(X)

        # Min-max scale to 0.05 - 0.95 range
        min_s = np.min(raw_scores)
        max_s = np.max(raw_scores)

        if max_s == min_s:
            return [0.2 for _ in range(len(X))]

        # Invert so higher score = higher anomaly risk
        normalized_scores = 1.0 - ((raw_scores - min_s) / (max_s - min_s))
        return [round(float(s), 3) for s in normalized_scores]

anomaly_scorer = AnomalyScorer()
