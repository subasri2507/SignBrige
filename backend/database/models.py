from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    role = Column(String(50), default="user")  # 'hearing', 'deaf', 'admin', 'user'
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), default="New Conversation")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "message_count": len(self.messages) if self.messages else 0
        }

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender_type = Column(String(50), nullable=False)  # 'hearing' or 'deaf'
    direction = Column(String(50), nullable=False)    # 'voice_to_sign' or 'sign_to_speech'
    original_text = Column(Text, nullable=False)
    translated_text = Column(Text, nullable=True)
    recognized_gloss = Column(String(255), nullable=True)
    spoken_language = Column(String(10), default="en") # 'en', 'ta', 'hi'
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")

    def to_dict(self):
        return {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "sender_type": self.sender_type,
            "direction": self.direction,
            "original_text": self.original_text,
            "translated_text": self.translated_text,
            "recognized_gloss": self.recognized_gloss,
            "spoken_language": self.spoken_language,
            "confidence": self.confidence,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class RecognitionCorrection(Base):
    __tablename__ = "recognition_corrections"

    id = Column(Integer, primary_key=True, index=True)
    original_prediction = Column(String(100), nullable=False)
    corrected_label = Column(String(100), nullable=False)
    language = Column(String(10), default="en")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "original_prediction": self.original_prediction,
            "corrected_label": self.corrected_label,
            "language": self.language,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class SignDictionary(Base):
    __tablename__ = "sign_dictionary"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String(100), nullable=False, index=True)
    gloss = Column(String(100), nullable=False, index=True)
    animation_id = Column(String(100), nullable=True)
    is_supported = Column(Boolean, default=True)
    category = Column(String(50), default="general")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "word": self.word,
            "gloss": self.gloss,
            "animation_id": self.animation_id,
            "is_supported": self.is_supported,
            "category": self.category,
            "description": self.description
        }


class UserStudyEvaluation(Base):
    """
    Stores structured Deaf Signer, Certified ISL Interpreter, and Hearing User
    usability & sign-comprehension evaluation records (SUS + 5-point Likert metrics).
    """
    __tablename__ = "user_study_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    participant_code = Column(String(50), nullable=False)        # e.g. 'DS-01', 'INT-01', 'HU-01'
    participant_group = Column(String(50), nullable=False)       # 'deaf_signer', 'isl_interpreter', 'hearing_user'
    isl_proficiency = Column(String(50), default="native")       # 'native', 'fluent', 'intermediate', 'beginner'
    preferred_region = Column(String(50), default="ISL")         # 'ISL', 'ISL_SOUTH', 'ISL_NORTH'
    task_scenario = Column(String(150), default="Two-Way Classroom & Emergency Dialogue")
    sign_comprehension_rate = Column(Float, default=92.0)        # % of avatar signs accurately understood (0-100)
    avatar_naturalness_score = Column(Integer, default=5)        # Likert 1-5: 4-stage keyframe & finger clarity
    recognition_responsiveness_score = Column(Integer, default=5)# Likert 1-5: CNN-LSTM & continuous stream speed
    translation_accuracy_score = Column(Integer, default=5)      # Likert 1-5: 9-language translation fidelity
    ui_accessibility_score = Column(Integer, default=5)          # Likert 1-5: visual contrast & deaf-friendly UX
    sus_score = Column(Float, default=87.5)                      # System Usability Scale (0-100)
    qualitative_feedback = Column(Text, nullable=True)
    is_pilot_baseline = Column(Boolean, default=False)           # True for seeded pilot benchmark cohort
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "participant_code": self.participant_code,
            "participant_group": self.participant_group,
            "isl_proficiency": self.isl_proficiency,
            "preferred_region": self.preferred_region,
            "task_scenario": self.task_scenario,
            "sign_comprehension_rate": self.sign_comprehension_rate,
            "avatar_naturalness_score": self.avatar_naturalness_score,
            "recognition_responsiveness_score": self.recognition_responsiveness_score,
            "translation_accuracy_score": self.translation_accuracy_score,
            "ui_accessibility_score": self.ui_accessibility_score,
            "sus_score": self.sus_score,
            "qualitative_feedback": self.qualitative_feedback,
            "is_pilot_baseline": self.is_pilot_baseline,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

