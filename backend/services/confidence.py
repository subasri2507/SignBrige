from config import Config

class ConfidenceService:
    """
    Confidence scoring, categorization, and action recommendation service
    for ISL sign recognition.
    """
    def __init__(self, high_thresh=None, med_thresh=None):
        self.high_threshold = high_thresh if high_thresh is not None else Config.CONFIDENCE_THRESHOLD_HIGH
        self.med_threshold = med_thresh if med_thresh is not None else Config.CONFIDENCE_THRESHOLD_MEDIUM

    def evaluate(self, confidence_score):
        """
        Evaluates a recognition confidence score.
        Returns:
            dict: {
                "score": float,
                "level": "HIGH" | "MEDIUM" | "LOW",
                "color": "emerald" | "amber" | "rose",
                "action": "ACCEPT" | "CONFIRM_ALTERNATIVE" | "REPEAT_SIGN",
                "user_guidance": str
            }
        """
        score = float(confidence_score) if confidence_score is not None else 0.0

        if score >= self.high_threshold:
            return {
                "score": round(score, 3),
                "level": "HIGH",
                "color": "emerald",
                "action": "ACCEPT",
                "user_guidance": "High confidence match. Recognition accepted."
            }
        elif score >= self.med_threshold:
            return {
                "score": round(score, 3),
                "level": "MEDIUM",
                "color": "amber",
                "action": "CONFIRM_ALTERNATIVE",
                "user_guidance": "Moderate confidence match. Please verify or select an alternative."
            }
        else:
            return {
                "score": round(score, 3),
                "level": "LOW",
                "color": "rose",
                "action": "REPEAT_SIGN",
                "user_guidance": "Low recognition confidence. Please repeat the sign clearly in camera view."
            }
