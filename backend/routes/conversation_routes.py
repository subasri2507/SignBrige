from flask import Blueprint, request, jsonify
from database.db import SessionLocal
from database.models import Conversation, Message

conv_bp = Blueprint("conversations", __name__, url_prefix="/api/conversations")

@conv_bp.route("", methods=["GET"])
def get_conversations():
    """GET /api/conversations - List all conversations"""
    db = SessionLocal()
    try:
        convs = db.query(Conversation).order_by(Conversation.created_at.desc()).all()
        return jsonify({
            "success": True,
            "conversations": [c.to_dict() for c in convs]
        }), 200
    finally:
        db.close()

@conv_bp.route("", methods=["POST"])
def create_conversation():
    """POST /api/conversations - Create a new conversation"""
    data = request.get_json(force=True, silent=True) or {}
    title = data.get("title", "New Conversation")

    db = SessionLocal()
    try:
        conv = Conversation(title=title)
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return jsonify({
            "success": True,
            "conversation": conv.to_dict()
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        db.close()

@conv_bp.route("/<int:conv_id>/messages", methods=["GET"])
def get_conversation_messages(conv_id):
    """GET /api/conversations/<id>/messages - Get all messages in conversation"""
    db = SessionLocal()
    try:
        conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
        if not conv:
            return jsonify({"success": False, "error": "Conversation not found"}), 404

        messages = db.query(Message).filter(Message.conversation_id == conv_id).order_by(Message.created_at.asc()).all()
        return jsonify({
            "success": True,
            "conversation": conv.to_dict(),
            "messages": [m.to_dict() for m in messages]
        }), 200
    finally:
        db.close()

@conv_bp.route("/<int:conv_id>/messages", methods=["POST"])
def add_conversation_message(conv_id):
    """POST /api/conversations/<id>/messages - Append message to conversation"""
    data = request.get_json(force=True, silent=True) or {}
    
    db = SessionLocal()
    try:
        conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
        if not conv:
            # Create conversation on the fly if it doesn't exist
            conv = Conversation(id=conv_id, title=f"Conversation #{conv_id}")
            db.add(conv)
            db.commit()

        msg = Message(
            conversation_id=conv_id,
            sender_type=data.get("sender_type", "hearing"),
            direction=data.get("direction", "voice_to_sign"),
            original_text=data.get("original_text", ""),
            translated_text=data.get("translated_text", ""),
            recognized_gloss=data.get("recognized_gloss", ""),
            spoken_language=data.get("spoken_language", "en"),
            confidence=data.get("confidence")
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)
        return jsonify({
            "success": True,
            "message": msg.to_dict()
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        db.close()

@conv_bp.route("/<int:conv_id>", methods=["DELETE"])
def delete_conversation(conv_id):
    """DELETE /api/conversations/<id> - Delete conversation and its messages"""
    db = SessionLocal()
    try:
        conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
        if not conv:
            return jsonify({"success": False, "error": "Conversation not found"}), 404

        db.delete(conv)
        db.commit()
        return jsonify({"success": True, "message": f"Conversation {conv_id} deleted"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        db.close()

@conv_bp.route("/clear-all", methods=["DELETE"])
def clear_all_conversations():
    """DELETE /api/conversations/clear-all - Delete all conversations and messages"""
    db = SessionLocal()
    try:
        db.query(Message).delete()
        db.query(Conversation).delete()
        db.commit()
        return jsonify({"success": True, "message": "All conversations cleared"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        db.close()

@conv_bp.route("/messages/<int:message_id>", methods=["DELETE"])
def delete_single_message(message_id):
    """DELETE /api/conversations/messages/<message_id> - Delete single message"""
    db = SessionLocal()
    try:
        msg = db.query(Message).filter(Message.id == message_id).first()
        if not msg:
            return jsonify({"success": False, "error": "Message not found"}), 404
        db.delete(msg)
        db.commit()
        return jsonify({"success": True, "message": f"Message {message_id} deleted"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        db.close()
