from flask import Blueprint, request, jsonify
from database.db import SessionLocal
from database.models import UserStudyEvaluation

study_bp = Blueprint("study", __name__, url_prefix="/api/study")


@study_bp.route("/summary", methods=["GET"])
def get_study_summary():
    """
    GET /api/study/summary
    Returns aggregate usability & sign comprehension metrics across Deaf Signers,
    Certified ISL Interpreters, and Hearing Evaluators, along with all study records.
    """
    db = SessionLocal()
    try:
        records = db.query(UserStudyEvaluation).order_by(UserStudyEvaluation.created_at.desc()).all()
        items = [r.to_dict() for r in records]
        n = len(items)

        if n == 0:
            return jsonify({
                "success": True,
                "total_participants": 0,
                "deaf_signer_count": 0,
                "interpreter_count": 0,
                "hearing_user_count": 0,
                "live_participant_count": 0,
                "pilot_cohort_count": 0,
                "mean_sus_score": 0.0,
                "sus_grade": "N/A",
                "mean_sign_comprehension": 0.0,
                "mean_avatar_naturalness": 0.0,
                "mean_recognition_responsiveness": 0.0,
                "mean_translation_accuracy": 0.0,
                "mean_ui_accessibility": 0.0,
                "evaluations": []
            }), 200

        deaf_count = sum(1 for r in items if r["participant_group"] == "deaf_signer")
        interp_count = sum(1 for r in items if r["participant_group"] == "isl_interpreter")
        hearing_count = sum(1 for r in items if r["participant_group"] == "hearing_user")
        pilot_count = sum(1 for r in items if r["is_pilot_baseline"])
        live_count = n - pilot_count

        mean_sus = round(sum(r["sus_score"] for r in items) / n, 1)
        mean_comp = round(sum(r["sign_comprehension_rate"] for r in items) / n, 1)
        mean_avatar = round(sum(r["avatar_naturalness_score"] for r in items) / n, 2)
        mean_recog = round(sum(r["recognition_responsiveness_score"] for r in items) / n, 2)
        mean_trans = round(sum(r["translation_accuracy_score"] for r in items) / n, 2)
        mean_ui = round(sum(r["ui_accessibility_score"] for r in items) / n, 2)

        if mean_sus >= 85:
            sus_grade = "A+ (Excellent)"
        elif mean_sus >= 75:
            sus_grade = "A (Good)"
        elif mean_sus >= 68:
            sus_grade = "B (Above Average)"
        else:
            sus_grade = "C (Needs Improvement)"

        return jsonify({
            "success": True,
            "total_participants": n,
            "deaf_signer_count": deaf_count,
            "interpreter_count": interp_count,
            "hearing_user_count": hearing_count,
            "live_participant_count": live_count,
            "pilot_cohort_count": pilot_count,
            "mean_sus_score": mean_sus,
            "sus_grade": sus_grade,
            "mean_sign_comprehension": mean_comp,
            "mean_avatar_naturalness": mean_avatar,
            "mean_recognition_responsiveness": mean_recog,
            "mean_translation_accuracy": mean_trans,
            "mean_ui_accessibility": mean_ui,
            "evaluations": items
        }), 200
    finally:
        db.close()


@study_bp.route("/submit", methods=["POST"])
def submit_study_evaluation():
    """
    POST /api/study/submit
    Records a new Deaf Signer, ISL Interpreter, or Hearing User study evaluation.
    """
    data = request.get_json(force=True, silent=True) or {}

    participant_code = (data.get("participant_code") or "").strip()
    participant_group = (data.get("participant_group") or "deaf_signer").strip()
    isl_proficiency = (data.get("isl_proficiency") or "native").strip()
    preferred_region = (data.get("preferred_region") or "ISL").strip()
    task_scenario = (data.get("task_scenario") or "Two-Way Classroom & Emergency Dialogue").strip()

    try:
        sign_comp = max(0.0, min(100.0, float(data.get("sign_comprehension_rate", 92.0))))
        avatar_score = max(1, min(5, int(data.get("avatar_naturalness_score", 5))))
        recog_score = max(1, min(5, int(data.get("recognition_responsiveness_score", 5))))
        trans_score = max(1, min(5, int(data.get("translation_accuracy_score", 5))))
        ui_score = max(1, min(5, int(data.get("ui_accessibility_score", 5))))
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "Invalid numeric scores provided"}), 400

    # Compute SUS score (0-100) from Likert ratings if explicit sus_score not passed
    raw_sus = data.get("sus_score")
    if raw_sus is not None:
        try:
            sus_score = max(0.0, min(100.0, float(raw_sus)))
        except (ValueError, TypeError):
            sus_score = 85.0
    else:
        # Map 4 5-point Likert items (sum 4..20, minus 4 => 0..16, * 6.25 => 0..100)
        sus_score = round(((avatar_score + recog_score + trans_score + ui_score) - 4) * 6.25, 1)

    qualitative_feedback = (data.get("qualitative_feedback") or "").strip()

    db = SessionLocal()
    try:
        if not participant_code:
            count = db.query(UserStudyEvaluation).count()
            prefix = "DS" if participant_group == "deaf_signer" else ("INT" if participant_group == "isl_interpreter" else "HU")
            participant_code = f"{prefix}-{count + 1:02d}"

        entry = UserStudyEvaluation(
            participant_code=participant_code,
            participant_group=participant_group,
            isl_proficiency=isl_proficiency,
            preferred_region=preferred_region,
            task_scenario=task_scenario,
            sign_comprehension_rate=sign_comp,
            avatar_naturalness_score=avatar_score,
            recognition_responsiveness_score=recog_score,
            translation_accuracy_score=trans_score,
            ui_accessibility_score=ui_score,
            sus_score=sus_score,
            qualitative_feedback=qualitative_feedback,
            is_pilot_baseline=False
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return jsonify({
            "success": True,
            "message": "User study evaluation recorded successfully",
            "evaluation": entry.to_dict()
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        db.close()


@study_bp.route("/<int:eval_id>", methods=["DELETE"])
def delete_study_evaluation(eval_id):
    """
    DELETE /api/study/<eval_id>
    Deletes a specific evaluation record.
    """
    db = SessionLocal()
    try:
        row = db.query(UserStudyEvaluation).filter(UserStudyEvaluation.id == eval_id).first()
        if not row:
            return jsonify({"success": False, "error": "Evaluation record not found"}), 404
        db.delete(row)
        db.commit()
        return jsonify({"success": True, "deleted_id": eval_id}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        db.close()
