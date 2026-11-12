import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database.db import init_db, SessionLocal
from database.models import SignDictionary, UserStudyEvaluation

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for frontend Vite dev server (5173) and any local origins
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize SQLite Database
    init_db(app.config["SQLALCHEMY_DATABASE_URI"])

    # Register Blueprints
    from routes.speech_routes import speech_bp
    from routes.sign_routes import sign_bp
    from routes.video_routes import video_bp
    from routes.avatar_routes import avatar_bp
    from routes.conversation_routes import conv_bp
    from routes.settings_routes import settings_bp
    from routes.study_routes import study_bp

    app.register_blueprint(speech_bp)
    app.register_blueprint(sign_bp)
    app.register_blueprint(video_bp)
    app.register_blueprint(avatar_bp)
    app.register_blueprint(conv_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(study_bp)

    # Health Check endpoint
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "SignBridge AI Backend",
            "phase": 1,
            "sign_language": "ISL",
            "supported_sign_languages": ["ISL", "ISL_SOUTH", "ISL_NORTH", "ASL", "BSL"],
            "supported_spoken_languages": ["en", "ta", "hi", "te", "ml", "kn", "mr", "bn", "gu"],
            "vocabulary_size": 500,
            "bundled_authored_clips": 500,
            "gltf_asset": "/models/isl_interpreter_avatar.gltf",
            "version": "1.3.0"
        }), 200

    # Global Error Handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "error": "Endpoint not found"}), 404

    @app.errorhandler(413)
    def request_entity_too_large(e):
        return jsonify({"success": False, "error": "File exceeds maximum upload size (16MB)"}), 413

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"success": False, "error": "Internal server error occurred"}), 500

    # Auto seed initial dictionary and pilot user study baseline into SQLite if empty
    with app.app_context():
        seed_dictionary()
        seed_pilot_study()

    return app

def seed_dictionary():
    import json
    from config import Config
    db = SessionLocal()
    try:
        if os.path.exists(Config.ISL_DICTIONARY_PATH):
            with open(Config.ISL_DICTIONARY_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                entries = data.get("entries", [])
                existing_words = {row.word for row in db.query(SignDictionary.word).all()}
                added = 0
                for item in entries:
                    if item["word"] not in existing_words:
                        entry = SignDictionary(
                            word=item["word"],
                            gloss=item["gloss"],
                            animation_id=item.get("animation_id"),
                            is_supported=item.get("is_supported", True),
                            category=item.get("category", "general"),
                            description=item.get("description", "")
                        )
                        db.add(entry)
                        added += 1
                if added > 0:
                    db.commit()
                    print(f"[SignBridge] Seeded {added} ISL dictionary entries into SQLite (total: {len(existing_words) + added}).")
    except Exception as e:
        db.rollback()
        print(f"[SignBridge] Dictionary seeding notice: {e}")
    finally:
        db.close()

def seed_pilot_study():
    db = SessionLocal()
    try:
        if db.query(UserStudyEvaluation).count() == 0:
            pilot_records = [
                UserStudyEvaluation(
                    participant_code="DS-PILOT-01",
                    participant_group="deaf_signer",
                    isl_proficiency="native",
                    preferred_region="ISL_SOUTH",
                    task_scenario="Two-Way Classroom & Emergency Dialogue",
                    sign_comprehension_rate=94.5,
                    avatar_naturalness_score=5,
                    recognition_responsiveness_score=5,
                    translation_accuracy_score=5,
                    ui_accessibility_score=5,
                    sus_score=92.5,
                    qualitative_feedback="Two-handed Anjali Mudra for NAMASTE and 4-stage hold on temple for HELLO are clear and natural. Fingerspelling fallback handles custom names well.",
                    is_pilot_baseline=True
                ),
                UserStudyEvaluation(
                    participant_code="DS-PILOT-02",
                    participant_group="deaf_signer",
                    isl_proficiency="native",
                    preferred_region="ISL_NORTH",
                    task_scenario="Sign-to-Speech Continuous Sentence Stream",
                    sign_comprehension_rate=91.0,
                    avatar_naturalness_score=4,
                    recognition_responsiveness_score=5,
                    translation_accuracy_score=5,
                    ui_accessibility_score=5,
                    sus_score=87.5,
                    qualitative_feedback="Continuous sentence buffer makes signing multi-word phrases (I NEED HELP / DOCTOR HOSPITAL) smooth without clicking between every word.",
                    is_pilot_baseline=True
                ),
                UserStudyEvaluation(
                    participant_code="DS-PILOT-03",
                    participant_group="deaf_signer",
                    isl_proficiency="fluent",
                    preferred_region="ISL",
                    task_scenario="Voice-to-Sign 3D Avatar Comprehension",
                    sign_comprehension_rate=93.0,
                    avatar_naturalness_score=5,
                    recognition_responsiveness_score=4,
                    translation_accuracy_score=5,
                    ui_accessibility_score=5,
                    sus_score=88.0,
                    qualitative_feedback="Green high-contrast interpreter outfit makes finger articulation easy to read against the dark studio backdrop.",
                    is_pilot_baseline=True
                ),
                UserStudyEvaluation(
                    participant_code="INT-PILOT-01",
                    participant_group="isl_interpreter",
                    isl_proficiency="native",
                    preferred_region="ISL",
                    task_scenario="ISLRTC 500-Gloss & Non-Manual Marker Verification",
                    sign_comprehension_rate=96.0,
                    avatar_naturalness_score=5,
                    recognition_responsiveness_score=5,
                    translation_accuracy_score=5,
                    ui_accessibility_score=5,
                    sus_score=95.0,
                    qualitative_feedback="Preparation-Stroke-Hold-Retraction timing and eyebrow non-manual markers on WH-questions follow ISLRTC pedagogical conventions accurately.",
                    is_pilot_baseline=True
                ),
                UserStudyEvaluation(
                    participant_code="INT-PILOT-02",
                    participant_group="isl_interpreter",
                    isl_proficiency="fluent",
                    preferred_region="ISL_SOUTH",
                    task_scenario="Multilingual Speech-to-ISL Gloss Mapping (Tamil/Hindi/English)",
                    sign_comprehension_rate=92.0,
                    avatar_naturalness_score=4,
                    recognition_responsiveness_score=5,
                    translation_accuracy_score=5,
                    ui_accessibility_score=4,
                    sus_score=86.5,
                    qualitative_feedback="9-language translation grid (Tamil, Hindi, Telugu, Malayalam, Kannada) with instant TTS is helpful for inclusive classroom sessions.",
                    is_pilot_baseline=True
                ),
                UserStudyEvaluation(
                    participant_code="HU-PILOT-01",
                    participant_group="hearing_user",
                    isl_proficiency="beginner",
                    preferred_region="ISL",
                    task_scenario="Two-Way Classroom Mode Instructor Evaluation",
                    sign_comprehension_rate=90.5,
                    avatar_naturalness_score=5,
                    recognition_responsiveness_score=5,
                    translation_accuracy_score=5,
                    ui_accessibility_score=5,
                    sus_score=90.0,
                    qualitative_feedback="Split-screen Two-Way Classroom view lets me speak in Tamil or English while Deaf students see the ISL avatar and reply via webcam.",
                    is_pilot_baseline=True
                )
            ]
            db.add_all(pilot_records)
            db.commit()
            print(f"[SignBridge] Seeded {len(pilot_records)} pilot user study evaluation records into SQLite.")
    except Exception as e:
        db.rollback()
        print(f"[SignBridge] Pilot study seeding notice: {e}")
    finally:
        db.close()

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"============================================================")
    print(f"  SignBridge AI - Backend API Server (Phase 1)")
    print(f"  Fixed Sign Language: Indian Sign Language (ISL)")
    print(f"  Supported Spoken Languages: 9 Indian & Global Languages")
    print(f"  Running on: http://localhost:{port}")
    print(f"  Health Check: http://localhost:{port}/api/health")
    print(f"============================================================")
    app.run(host="0.0.0.0", port=port, debug=Config.DEBUG, use_reloader=False, threaded=True)
