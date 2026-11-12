import math
import numpy as np
from utils.video_processing import CV2_AVAILABLE, decode_base64_image

MEDIAPIPE_AVAILABLE = False
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    pass

if CV2_AVAILABLE:
    import cv2


class LandmarkExtractor:
    """
    Extracts hand, pose, and holistic landmarks from video frames
    using MediaPipe (when mp.solutions is available) with an integrated
    OpenCV Computer Vision Hand Contour & Convexity Defect Landmark Extractor
    so live webcam sign recognition works reliably across all Python/OS environments.
    """
    def __init__(self, static_image_mode=False, max_num_hands=2, min_detection_confidence=0.5):
        self.mp_hands = None
        self.mp_pose = None
        self.hands_detector = None
        self.pose_detector = None
        self.face_cascade = None

        if CV2_AVAILABLE:
            try:
                cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
                self.face_cascade = cv2.CascadeClassifier(cascade_path)
            except Exception:
                self.face_cascade = None

        if MEDIAPIPE_AVAILABLE:
            try:
                mp_sol = getattr(mp, "solutions", None)
                if mp_sol is None:
                    from mediapipe.python import solutions as mp_sol
                self.mp_hands = mp_sol.hands
                self.mp_pose = mp_sol.pose
                self.hands_detector = self.mp_hands.Hands(
                    static_image_mode=static_image_mode,
                    max_num_hands=max_num_hands,
                    min_detection_confidence=min_detection_confidence,
                    min_tracking_confidence=0.5
                )
                self.pose_detector = self.mp_pose.Pose(
                    static_image_mode=static_image_mode,
                    min_detection_confidence=min_detection_confidence,
                    min_tracking_confidence=0.5
                )
            except Exception as e:
                print(f"[LandmarkExtractor] MediaPipe solutions unavailable ({e}); using OpenCV Hand Landmark Detector.")

    def _synthesize_21_landmarks(self, cx, cy, bw, bh, fingers_extended=5, is_thumb_up=False, is_thumb_down=False):
        """
        Generates a normalized 21-landmark hand skeleton centered at (cx, cy)
        matching the detected finger extension state from OpenCV contour analysis.
        """
        wrist_x = float(np.clip(cx, 0.05, 0.95))
        wrist_y = float(np.clip(cy + bh * 0.35, 0.10, 0.95))

        landmarks = [{"x": wrist_x, "y": wrist_y, "z": 0.0}]  # 0: Wrist

        # Thumb (landmarks 1..4)
        for i in range(1, 5):
            frac = i / 4.0
            if is_thumb_up:
                tx = wrist_x - 0.03 * frac
                ty = wrist_y - (0.14 * frac)
            elif is_thumb_down:
                tx = wrist_x - 0.03 * frac
                ty = wrist_y + (0.14 * frac)
            elif fingers_extended >= 1:
                tx = wrist_x - (bw * 0.45 * frac)
                ty = wrist_y - (bh * 0.35 * frac)
            else:
                tx = wrist_x - 0.02 * frac
                ty = wrist_y - 0.03 * frac
            landmarks.append({"x": float(tx), "y": float(ty), "z": -0.02})

        # 4 Fingers: Index (5..8), Middle (9..12), Ring (13..16), Pinky (17..20)
        finger_offsets = [-0.045, -0.015, 0.015, 0.045]
        for f_idx, x_off in enumerate(finger_offsets):
            # Determine if this specific finger is extended
            is_ext = False
            if not is_thumb_up and not is_thumb_down:
                if fingers_extended >= 4:
                    is_ext = True
                elif fingers_extended == 3 and f_idx in (0, 1, 2):  # W shape
                    is_ext = True
                elif fingers_extended == 2 and f_idx in (0, 1):     # V / 2 fingers
                    is_ext = True
                elif fingers_extended == 1 and f_idx == 0:          # Index pointing
                    is_ext = True

            mcp_x = wrist_x + x_off
            mcp_y = wrist_y - bh * 0.32
            landmarks.append({"x": float(mcp_x), "y": float(mcp_y), "z": -0.01})  # MCP

            for seg in range(1, 4):
                s_frac = seg / 3.0
                if is_ext:
                    px = mcp_x + x_off * 0.2 * s_frac
                    py = mcp_y - (bh * 0.48 * s_frac)
                else:
                    # Curled finger stays close to MCP/wrist
                    px = mcp_x
                    py = mcp_y - (0.015 * s_frac)
                landmarks.append({"x": float(px), "y": float(py), "z": -0.02})

        return landmarks

    def _extract_opencv_hand_landmarks(self, frame_bgr):
        """
        Real-time OpenCV Computer Vision Hand Segmentation, Convexity Defect Analysis,
        and 21-Point Landmark Synthesis when MediaPipe solutions is unavailable.
        """
        result = {
            "left_hand": None,
            "right_hand": None,
            "pose": None,
            "sequence_features": [0.0] * 126
        }
        if not CV2_AVAILABLE or frame_bgr is None:
            return result

        h, w = frame_bgr.shape[:2]
        if h == 0 or w == 0:
            return result

        # 1. Convert to YCrCb and HSV for robust skin-tone segmentation
        ycrcb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2YCrCb)
        hsv = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2HSV)

        mask_ycrcb = cv2.inRange(ycrcb, np.array([0, 130, 75], dtype=np.uint8), np.array([255, 180, 135], dtype=np.uint8))
        mask_hsv = cv2.inRange(hsv, np.array([0, 20, 50], dtype=np.uint8), np.array([25, 255, 255], dtype=np.uint8))
        skin_mask = cv2.bitwise_or(mask_ycrcb, mask_hsv)

        # 2. Mask out detected faces so only hands are segmented
        if self.face_cascade is not None:
            try:
                gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
                faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.15, minNeighbors=4, minSize=(50, 50))
                for (fx, fy, fw, fh) in faces:
                    # Mask out face and neck area
                    pad_x = int(fw * 0.15)
                    pad_y = int(fh * 0.25)
                    cv2.rectangle(
                        skin_mask,
                        (max(0, fx - pad_x), max(0, fy - pad_y)),
                        (min(w, fx + fw + pad_x), min(h, fy + fh + pad_y)),
                        0,
                        -1
                    )
            except Exception:
                pass

        # Focus primarily on the central signing guide box (12% to 88% width, 10% to 92% height)
        roi_mask = np.zeros_like(skin_mask)
        cv2.rectangle(roi_mask, (int(w * 0.10), int(h * 0.10)), (int(w * 0.85), int(h * 0.92)), 255, -1)
        skin_mask = cv2.bitwise_and(skin_mask, roi_mask)

        # Morphological filtering to remove noise
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_OPEN, kernel, iterations=1)
        skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, kernel, iterations=2)

        contours, _ = cv2.findContours(skin_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        min_hand_area = (w * h) * 0.012
        valid_contours = [c for c in contours if cv2.contourArea(c) >= min_hand_area]
        valid_contours.sort(key=cv2.contourArea, reverse=True)

        if not valid_contours:
            return result

        def analyze_contour(cnt):
            area = cv2.contourArea(cnt)
            bx, by, bw, bh = cv2.boundingRect(cnt)
            cx = (bx + bw / 2.0) / w
            cy = (by + bh / 2.0) / h
            nw = bw / float(w)
            nh = bh / float(h)
            aspect = bh / float(max(bw, 1))

            hull = cv2.convexHull(cnt)
            hull_area = max(cv2.contourArea(hull), 1.0)
            solidity = area / hull_area

            # Count finger valleys via convexity defects
            defect_count = 0
            try:
                hull_idx = cv2.convexHull(cnt, returnPoints=False)
                if hull_idx is not None and len(hull_idx) > 3 and len(cnt) > 10:
                    defects = cv2.convexityDefects(cnt, hull_idx)
                    if defects is not None:
                        for i in range(defects.shape[0]):
                            s, e, f, d = defects[i, 0]
                            start = cnt[s][0]
                            end = cnt[e][0]
                            far = cnt[f][0]
                            a = math.dist(start, end)
                            b = math.dist(start, far)
                            c = math.dist(end, far)
                            angle = math.degrees(math.acos(max(-1.0, min(1.0, (b * b + c * c - a * a) / max(2 * b * c, 1e-5)))))
                            depth = d / 256.0
                            if angle <= 95 and depth > bh * 0.12:
                                defect_count += 1
            except Exception:
                pass

            return {
                "cx": cx,
                "cy": cy,
                "nw": nw,
                "nh": nh,
                "aspect": aspect,
                "solidity": solidity,
                "defects": defect_count,
                "area": area
            }

        # Case A: Two distinct hand contours detected
        if len(valid_contours) >= 2:
            c1 = analyze_contour(valid_contours[0])
            c2 = analyze_contour(valid_contours[1])
            # Sort left vs right in image
            left_c, right_c = (c1, c2) if c1["cx"] < c2["cx"] else (c2, c1)
            f_left = min(5, left_c["defects"] + 1) if left_c["solidity"] < 0.85 else 0
            f_right = min(5, right_c["defects"] + 1) if right_c["solidity"] < 0.85 else 0
            result["left_hand"] = self._synthesize_21_landmarks(left_c["cx"], left_c["cy"], left_c["nw"], left_c["nh"], fingers_extended=max(f_left, 4))
            result["right_hand"] = self._synthesize_21_landmarks(right_c["cx"], right_c["cy"], right_c["nw"], right_c["nh"], fingers_extended=max(f_right, 4))

        # Case B: One primary contour detected (could be two hands pressed together in NAMASTE or a single signing hand)
        else:
            c1 = analyze_contour(valid_contours[0])
            # Check for NAMASTE posture: tall central contour with high solidity (two palms pressed together vertically)
            is_namaste_posture = (
                c1["aspect"] >= 1.15 and
                c1["solidity"] >= 0.72 and
                c1["defects"] <= 1 and
                0.20 <= c1["cx"] <= 0.78 and
                c1["nh"] >= 0.25
            )
            if is_namaste_posture:
                # Synthesize both left and right open palms pressed together at (cx, cy)
                result["left_hand"] = self._synthesize_21_landmarks(c1["cx"] - 0.03, c1["cy"], c1["nw"] * 0.5, c1["nh"], fingers_extended=5)
                result["right_hand"] = self._synthesize_21_landmarks(c1["cx"] + 0.03, c1["cy"], c1["nw"] * 0.5, c1["nh"], fingers_extended=5)
            else:
                # Single hand gesture classification based on defects & solidity
                if c1["defects"] >= 3:
                    fingers = 5
                elif c1["defects"] == 2:
                    fingers = 3  # W shape (WATER)
                elif c1["defects"] == 1:
                    fingers = 2  # V shape / NO / READ
                else:
                    if c1["aspect"] > 1.35:
                        fingers = 1  # Index pointing or Thumbs up
                    else:
                        fingers = 0  # Fist (YES)

                is_thumb_up = (fingers == 1 and c1["solidity"] >= 0.78 and c1["cy"] > 0.45)
                result["right_hand"] = self._synthesize_21_landmarks(
                    c1["cx"],
                    c1["cy"],
                    c1["nw"],
                    c1["nh"],
                    fingers_extended=fingers,
                    is_thumb_up=is_thumb_up
                )

        # Build 126-dim feature vector
        features = []
        for hand_key in ["left_hand", "right_hand"]:
            if result[hand_key]:
                for pt in result[hand_key]:
                    features.extend([pt["x"], pt["y"], pt["z"]])
            else:
                features.extend([0.0] * 63)
        result["sequence_features"] = features
        return result

    def extract_from_frame(self, frame_bgr):
        """
        Extracts landmarks from an OpenCV BGR frame.
        Uses MediaPipe Hands/Pose if available, or OpenCV Hand Landmark Detector fallback.
        """
        result = {
            "left_hand": None,
            "right_hand": None,
            "pose": None,
            "sequence_features": [0.0] * 126
        }

        if frame_bgr is None:
            return result

        # Use OpenCV computer vision hand landmark detector if MediaPipe solutions is unavailable
        if not MEDIAPIPE_AVAILABLE or self.hands_detector is None:
            return self._extract_opencv_hand_landmarks(frame_bgr)

        try:
            frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            hands_res = self.hands_detector.process(frame_rgb)
            if hands_res.multi_hand_landmarks and hands_res.multi_handedness:
                for idx, hand_handedness in enumerate(hands_res.multi_handedness):
                    label = hand_handedness.classification[0].label
                    lm_list = hands_res.multi_hand_landmarks[idx]
                    coords = [{"x": float(lm.x), "y": float(lm.y), "z": float(lm.z)} for lm in lm_list.landmark]
                    if label == "Left":
                        result["left_hand"] = coords
                    else:
                        result["right_hand"] = coords

            if self.pose_detector:
                pose_res = self.pose_detector.process(frame_rgb)
                if pose_res.pose_landmarks:
                    result["pose"] = [
                        {
                            "x": float(lm.x),
                            "y": float(lm.y),
                            "z": float(lm.z),
                            "visibility": float(lm.visibility)
                        } for lm in pose_res.pose_landmarks.landmark
                    ]

            # If MediaPipe missed hands in frame, try OpenCV contour fallback
            if result["left_hand"] is None and result["right_hand"] is None:
                return self._extract_opencv_hand_landmarks(frame_bgr)

            features = []
            for hand_key in ["left_hand", "right_hand"]:
                if result[hand_key]:
                    for pt in result[hand_key]:
                        features.extend([pt["x"], pt["y"], pt["z"]])
                else:
                    features.extend([0.0] * 63)
            result["sequence_features"] = features

        except Exception as e:
            print(f"[LandmarkExtractor] Frame processing error: {e}")
            return self._extract_opencv_hand_landmarks(frame_bgr)

        return result

    def extract_from_base64(self, base64_image_str):
        """Helper to extract directly from base64 image string"""
        frame = decode_base64_image(base64_image_str)
        if frame is None:
            return {
                "left_hand": None,
                "right_hand": None,
                "pose": None,
                "sequence_features": [0.0] * 126
            }
        return self.extract_from_frame(frame)
