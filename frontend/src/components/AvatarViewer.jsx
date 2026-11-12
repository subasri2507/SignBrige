import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Square, 
  Gauge, 
  Sparkles,
  Info,
  Sun,
  Moon,
  Hand
} from 'lucide-react';
import { ISL_CONFIG } from '../config/islConfig';

/**
 * Handshape Definitions for 5-Finger Articulated Hands
 * Each finger has: curl (0 = straight, 1.4 = fully curled into palm), spread (-0.3 to +0.3)
 * Thumb has: curl (0 = straight, 1.0 = curled), abduct (spread away from palm), oppose (rotate across palm)
 */
const HANDSHAPES = {
  FLAT_OPEN: {
    thumb: { curl: 0.05, abduct: 0.65, oppose: 0.15 },
    index: { curl: 0.04, spread: 0.06 },
    middle: { curl: 0.03, spread: 0.02 },
    ring: { curl: 0.05, spread: -0.02 },
    pinky: { curl: 0.07, spread: -0.06 }
  },
  SPREAD_FIVE: {
    thumb: { curl: 0.0, abduct: 0.85, oppose: 0.1 },
    index: { curl: 0.02, spread: 0.22 },
    middle: { curl: 0.02, spread: 0.06 },
    ring: { curl: 0.02, spread: -0.10 },
    pinky: { curl: 0.02, spread: -0.25 }
  },
  NAMASTE_PALM: {
    thumb: { curl: 0.05, abduct: 0.35, oppose: 0.1 },
    index: { curl: 0.02, spread: 0.03 },
    middle: { curl: 0.02, spread: 0.0 },
    ring: { curl: 0.02, spread: -0.03 },
    pinky: { curl: 0.03, spread: -0.06 }
  },
  FIST: {
    thumb: { curl: 0.85, abduct: 0.2, oppose: 0.75 },
    index: { curl: 1.45, spread: 0.0 },
    middle: { curl: 1.45, spread: 0.0 },
    ring: { curl: 1.45, spread: 0.0 },
    pinky: { curl: 1.45, spread: 0.0 }
  },
  THUMBS_UP: {
    thumb: { curl: 0.0, abduct: 0.95, oppose: 0.0 },
    index: { curl: 1.45, spread: 0.0 },
    middle: { curl: 1.45, spread: 0.0 },
    ring: { curl: 1.45, spread: 0.0 },
    pinky: { curl: 1.45, spread: 0.0 }
  },
  W_WATER: {
    thumb: { curl: 0.75, abduct: 0.2, oppose: 0.85 },
    index: { curl: 0.04, spread: 0.18 },
    middle: { curl: 0.03, spread: 0.0 },
    ring: { curl: 0.05, spread: -0.18 },
    pinky: { curl: 1.35, spread: -0.05 }
  },
  INDEX_POINT: {
    thumb: { curl: 0.75, abduct: 0.25, oppose: 0.7 },
    index: { curl: 0.02, spread: 0.0 },
    middle: { curl: 1.4, spread: 0.0 },
    ring: { curl: 1.4, spread: 0.0 },
    pinky: { curl: 1.4, spread: 0.0 }
  },
  PINCH_FOOD: {
    thumb: { curl: 0.35, abduct: 0.45, oppose: 0.85 },
    index: { curl: 0.65, spread: 0.04 },
    middle: { curl: 0.65, spread: 0.0 },
    ring: { curl: 0.7, spread: -0.04 },
    pinky: { curl: 0.75, spread: -0.08 }
  },
  C_CLASSROOM: {
    thumb: { curl: 0.45, abduct: 0.6, oppose: 0.65 },
    index: { curl: 0.65, spread: 0.05 },
    middle: { curl: 0.65, spread: 0.0 },
    ring: { curl: 0.65, spread: -0.05 },
    pinky: { curl: 0.65, spread: -0.10 }
  },
  NO_SNAP: {
    thumb: { curl: 0.25, abduct: 0.5, oppose: 0.75 },
    index: { curl: 0.35, spread: 0.08 },
    middle: { curl: 0.35, spread: -0.02 },
    ring: { curl: 1.4, spread: 0.0 },
    pinky: { curl: 1.4, spread: 0.0 }
  },
  L_SHAPE: {
    thumb: { curl: 0.02, abduct: 0.95, oppose: 0.05 },
    index: { curl: 0.02, spread: 0.04 },
    middle: { curl: 1.42, spread: 0.0 },
    ring: { curl: 1.42, spread: 0.0 },
    pinky: { curl: 1.42, spread: 0.0 }
  },
  TWO_V: {
    thumb: { curl: 0.8, abduct: 0.25, oppose: 0.75 },
    index: { curl: 0.02, spread: 0.16 },
    middle: { curl: 0.02, spread: -0.14 },
    ring: { curl: 1.42, spread: 0.0 },
    pinky: { curl: 1.42, spread: 0.0 }
  },
  Y_PHONE: {
    thumb: { curl: 0.02, abduct: 0.92, oppose: 0.05 },
    index: { curl: 1.42, spread: 0.0 },
    middle: { curl: 1.42, spread: 0.0 },
    ring: { curl: 1.42, spread: 0.0 },
    pinky: { curl: 0.02, spread: -0.25 }
  },
  CLAW: {
    thumb: { curl: 0.55, abduct: 0.65, oppose: 0.45 },
    index: { curl: 0.75, spread: 0.14 },
    middle: { curl: 0.75, spread: 0.04 },
    ring: { curl: 0.75, spread: -0.06 },
    pinky: { curl: 0.75, spread: -0.16 }
  }
};

/**
 * 20 ISL Sign Keyframe Definitions + Reference Interpreter Pose
 * Coordinate system:
 *   x: - is avatar's Right side (viewer's Left), + is avatar's Left side (viewer's Right)
 *   y: 0 is waist/belt, 0.35 is chest, 0.52 is shoulders, 0.70 is chin, 0.82 is face/temple
 *   z: + is forward in front of body toward viewer
 */
function getSignTargetPose(signName, time) {
  const s = (signName || 'IDLE').toUpperCase();
  const wave = Math.sin(time * 4);
  const fastWave = Math.sin(time * 6);
  const pulse = Math.sin(time * 3) * 0.5 + 0.5;

  switch (s) {
    case 'IDLE':
    case 'INTERPRETER':
      // Matches the exact reference image (Right hand raised at temple, Left hand at chest, open palms with extended thumbs)
      return {
        headRot: [0.02 * Math.sin(time * 1.5), -0.06, -0.02],
        rightArm: {
          elbow: [-0.38, 0.26, 0.14],
          wrist: [-0.18, 0.62 + 0.01 * Math.sin(time * 2), 0.18],
          rot: [0.15, 0.35, -0.55],
          shape: 'FLAT_OPEN'
        },
        leftArm: {
          elbow: [0.35, 0.16, 0.15],
          wrist: [0.05, 0.33 + 0.01 * Math.cos(time * 2), 0.24],
          rot: [0.25, -0.35, 0.65],
          shape: 'FLAT_OPEN'
        }
      };

    case 'HELLO':
      // Right hand raised near temple waving gently, left hand poised at chest
      return {
        headRot: [0.04, -0.05, 0.03 * wave],
        rightArm: {
          elbow: [-0.38, 0.28, 0.16],
          wrist: [-0.19 + 0.03 * wave, 0.64, 0.20],
          rot: [0.1, 0.25, -0.45 + 0.18 * wave],
          shape: 'FLAT_OPEN'
        },
        leftArm: {
          elbow: [0.34, 0.16, 0.15],
          wrist: [0.06, 0.32, 0.24],
          rot: [0.25, -0.35, 0.65],
          shape: 'FLAT_OPEN'
        }
      };

    case 'NAMASTE':
      // Both palms pressed together symmetrically at chest center with respectful head bow
      return {
        headRot: [0.14 + 0.03 * pulse, 0, 0],
        rightArm: {
          elbow: [-0.34, 0.20, 0.18],
          wrist: [-0.035, 0.36, 0.26],
          rot: [0.2, 0.75, -0.25],
          shape: 'NAMASTE_PALM'
        },
        leftArm: {
          elbow: [0.34, 0.20, 0.18],
          wrist: [0.035, 0.36, 0.26],
          rot: [0.2, -0.75, 0.25],
          shape: 'NAMASTE_PALM'
        }
      };

    case 'HELP':
      // Left flat palm horizontal, Right thumbs-up resting on it, lifting upward together
      const lift = 0.05 * pulse;
      return {
        headRot: [0.05, 0, 0],
        rightArm: {
          elbow: [-0.32, 0.20 + lift, 0.18],
          wrist: [-0.02, 0.35 + lift, 0.27],
          rot: [0.0, 0.4, -0.2],
          shape: 'THUMBS_UP'
        },
        leftArm: {
          elbow: [0.32, 0.16 + lift, 0.18],
          wrist: [0.02, 0.29 + lift, 0.27],
          rot: [1.1, -0.2, 0.8],
          shape: 'FLAT_OPEN'
        }
      };

    case 'WATER':
      // Right hand forming 'W' (3 middle fingers extended) tapping gently near mouth/chin
      return {
        headRot: [0.05, -0.04, 0],
        rightArm: {
          elbow: [-0.32, 0.25, 0.18],
          wrist: [-0.05, 0.56 + 0.02 * fastWave, 0.22],
          rot: [0.1, 0.5, -0.25],
          shape: 'W_WATER'
        },
        leftArm: {
          elbow: [0.30, 0.12, 0.12],
          wrist: [0.18, 0.18, 0.20],
          rot: [0.3, -0.3, 0.4],
          shape: 'FLAT_OPEN'
        }
      };

    case 'THANK_YOU':
      // Flat right hand touching chin then moving gracefully forward toward viewer
      const reach = 0.07 * pulse;
      return {
        headRot: [0.08 * pulse, 0, 0],
        rightArm: {
          elbow: [-0.33, 0.24, 0.18],
          wrist: [-0.04, 0.54 - 0.08 * pulse, 0.20 + reach],
          rot: [0.25 + 0.35 * pulse, 0.2, -0.45],
          shape: 'FLAT_OPEN'
        },
        leftArm: {
          elbow: [0.34, 0.16, 0.15],
          wrist: [0.08, 0.30, 0.23],
          rot: [0.25, -0.35, 0.65],
          shape: 'FLAT_OPEN'
        }
      };

    case 'YES':
      // Right fist at shoulder/chest height nodding up and down clearly with head nod
      return {
        headRot: [0.14 * fastWave, 0, 0],
        rightArm: {
          elbow: [-0.34, 0.24, 0.18],
          wrist: [-0.14, 0.46 + 0.03 * fastWave, 0.25],
          rot: [0.45 * fastWave, 0.1, -0.15],
          shape: 'FIST'
        },
        leftArm: {
          elbow: [0.30, 0.12, 0.12],
          wrist: [0.16, 0.20, 0.20],
          rot: [0.3, -0.3, 0.4],
          shape: 'FLAT_OPEN'
        }
      };

    case 'NO':
      // Right hand snapping index & middle fingers to thumb while shaking side-to-side
      return {
        headRot: [0, 0.18 * fastWave, 0],
        rightArm: {
          elbow: [-0.34, 0.24, 0.18],
          wrist: [-0.14 + 0.04 * fastWave, 0.48, 0.25],
          rot: [0.1, 0.25 * fastWave, -0.2],
          shape: 'NO_SNAP'
        },
        leftArm: {
          elbow: [0.30, 0.12, 0.12],
          wrist: [0.16, 0.20, 0.20],
          rot: [0.3, -0.3, 0.4],
          shape: 'FLAT_OPEN'
        }
      };

    case 'I':
    case 'ME':
      // Index finger pointing inward toward center of chest
      return {
        headRot: [0.06, 0, 0],
        rightArm: {
          elbow: [-0.35, 0.22, 0.18],
          wrist: [-0.04, 0.38, 0.23 + 0.02 * wave],
          rot: [0.1, 1.1, -0.45],
          shape: 'INDEX_POINT'
        },
        leftArm: {
          elbow: [0.30, 0.12, 0.12],
          wrist: [0.18, 0.18, 0.20],
          rot: [0.3, -0.3, 0.4],
          shape: 'FLAT_OPEN'
        }
      };

    case 'YOU':
      // Index finger pointing directly forward toward viewer
      return {
        headRot: [0, 0, 0],
        rightArm: {
          elbow: [-0.30, 0.24, 0.20],
          wrist: [-0.08, 0.42, 0.34 + 0.03 * pulse],
          rot: [0.85, 0.0, -0.15],
          shape: 'INDEX_POINT'
        },
        leftArm: {
          elbow: [0.30, 0.12, 0.12],
          wrist: [0.18, 0.18, 0.20],
          rot: [0.3, -0.3, 0.4],
          shape: 'FLAT_OPEN'
        }
      };

    case 'GOOD':
      // Clear Thumbs-Up gesture held firmly in front of chest
      return {
        headRot: [0.08 * pulse, 0, 0],
        rightArm: {
          elbow: [-0.32, 0.22, 0.18],
          wrist: [-0.08, 0.42 + 0.02 * pulse, 0.28],
          rot: [0.0, 0.3, -0.2],
          shape: 'THUMBS_UP'
        },
        leftArm: {
          elbow: [0.32, 0.16, 0.15],
          wrist: [0.08, 0.30, 0.22],
          rot: [0.25, -0.35, 0.65],
          shape: 'FLAT_OPEN'
        }
      };

    case 'BAD':
      // Thumbs-Down gesture rotated downward
      return {
        headRot: [0.04, 0.1 * wave, 0],
        rightArm: {
          elbow: [-0.34, 0.26, 0.18],
          wrist: [-0.08, 0.38, 0.28],
          rot: [0.2, 0.3, -2.6],
          shape: 'THUMBS_UP'
        },
        leftArm: {
          elbow: [0.30, 0.12, 0.12],
          wrist: [0.18, 0.18, 0.20],
          rot: [0.3, -0.3, 0.4],
          shape: 'FLAT_OPEN'
        }
      };

    case 'PLEASE':
      // Flat open hand rubbing in a circular motion on the chest
      const cx = 0.04 * Math.cos(time * 4);
      const cy = 0.04 * Math.sin(time * 4);
      return {
        headRot: [0.05, 0.03, 0],
        rightArm: {
          elbow: [-0.34, 0.20, 0.16],
          wrist: [-0.02 + cx, 0.36 + cy, 0.23],
          rot: [0.15, 0.45, -0.55],
          shape: 'FLAT_OPEN'
        },
        leftArm: {
          elbow: [0.30, 0.12, 0.12],
          wrist: [0.18, 0.18, 0.20],
          rot: [0.3, -0.3, 0.4],
          shape: 'FLAT_OPEN'
        }
      };

    case 'TEACHER':
      // Both hands near temples moving forward, then flat palms at sides
      return {
        headRot: [0.04, 0, 0],
        rightArm: {
          elbow: [-0.38, 0.30, 0.16],
          wrist: [-0.16, 0.64, 0.20 + 0.04 * pulse],
          rot: [0.1, 0.4, -0.35],
          shape: 'PINCH_FOOD'
        },
        leftArm: {
          elbow: [0.38, 0.30, 0.16],
          wrist: [0.16, 0.64, 0.20 + 0.04 * pulse],
          rot: [0.1, -0.4, 0.35],
          shape: 'PINCH_FOOD'
        }
      };

    case 'STUDENT':
      // Right hand lifting knowledge from open left palm up to forehead
      return {
        headRot: [0.05, 0, 0],
        rightArm: {
          elbow: [-0.34, 0.24, 0.18],
          wrist: [-0.06, 0.36 + 0.24 * pulse, 0.24],
          rot: [0.1, 0.4, -0.35],
          shape: 'PINCH_FOOD'
        },
        leftArm: {
          elbow: [0.32, 0.16, 0.18],
          wrist: [0.04, 0.28, 0.26],
          rot: [1.1, -0.2, 0.8],
          shape: 'FLAT_OPEN'
        }
      };

    case 'CLASSROOM':
      // Both C-shaped hands sweeping outward in an arc outlining a room
      const arc = Math.sin(time * 3);
      return {
        headRot: [0.03, 0, 0],
        rightArm: {
          elbow: [-0.36, 0.22, 0.18],
          wrist: [-0.10 - 0.08 * pulse, 0.40, 0.26 + 0.04 * arc],
          rot: [0.1, 0.4, -0.2],
          shape: 'C_CLASSROOM'
        },
        leftArm: {
          elbow: [0.36, 0.22, 0.18],
          wrist: [0.10 + 0.08 * pulse, 0.40, 0.26 + 0.04 * arc],
          rot: [0.1, -0.4, 0.2],
          shape: 'C_CLASSROOM'
        }
      };

    case 'FOOD':
      // Bunched fingertips tapping near lips twice
      return {
        headRot: [0.06, 0, 0],
        rightArm: {
          elbow: [-0.32, 0.24, 0.18],
          wrist: [-0.03, 0.56 + 0.015 * fastWave, 0.22 - 0.02 * fastWave],
          rot: [0.2, 0.6, -0.35],
          shape: 'PINCH_FOOD'
        },
        leftArm: {
          elbow: [0.30, 0.12, 0.12],
          wrist: [0.18, 0.18, 0.20],
          rot: [0.3, -0.3, 0.4],
          shape: 'FLAT_OPEN'
        }
      };

    case 'RESTROOM':
      // Right fist/T-hand shaking side-to-side at shoulder height
      return {
        headRot: [0, 0, 0],
        rightArm: {
          elbow: [-0.34, 0.24, 0.18],
          wrist: [-0.14 + 0.03 * fastWave, 0.44, 0.25],
          rot: [0.1, 0.2 * fastWave, -0.15],
          shape: 'FIST'
        },
        leftArm: {
          elbow: [0.30, 0.12, 0.12],
          wrist: [0.18, 0.18, 0.20],
          rot: [0.3, -0.3, 0.4],
          shape: 'FLAT_OPEN'
        }
      };

    case 'WELCOME':
      // Both open palms sweeping gracefully from outward to chest
      return {
        headRot: [0.06 * pulse, 0, 0],
        rightArm: {
          elbow: [-0.36, 0.22, 0.18],
          wrist: [-0.22 + 0.10 * pulse, 0.38, 0.26],
          rot: [0.2, 0.35, -0.45],
          shape: 'FLAT_OPEN'
        },
        leftArm: {
          elbow: [0.36, 0.22, 0.18],
          wrist: [0.22 - 0.10 * pulse, 0.38, 0.26],
          rot: [0.2, -0.35, 0.45],
          shape: 'FLAT_OPEN'
        }
      };

    case 'UNDERSTAND':
      // Index finger flicking upright beside forehead/temple
      return {
        headRot: [0.08 * pulse, -0.05, 0],
        rightArm: {
          elbow: [-0.36, 0.28, 0.16],
          wrist: [-0.16, 0.65, 0.19],
          rot: [0.0, 0.3, -0.2],
          shape: pulse > 0.4 ? 'INDEX_POINT' : 'FIST'
        },
        leftArm: {
          elbow: [0.32, 0.16, 0.15],
          wrist: [0.08, 0.30, 0.22],
          rot: [0.25, -0.35, 0.65],
          shape: 'FLAT_OPEN'
        }
      };

    case 'STOP':
      // Right vertical flat hand slicing sharply down onto horizontal Left palm
      const chop = 0.06 * (1 - pulse);
      return {
        headRot: [0.05, 0, 0],
        rightArm: {
          elbow: [-0.32, 0.24, 0.18],
          wrist: [-0.02, 0.33 + chop, 0.27],
          rot: [0.2, 0.85, -0.15],
          shape: 'FLAT_OPEN'
        },
        leftArm: {
          elbow: [0.32, 0.16, 0.18],
          wrist: [0.03, 0.29, 0.27],
          rot: [1.1, -0.2, 0.8],
          shape: 'FLAT_OPEN'
        }
      };

    // ================= NEW EXPANDED ISL VOCABULARY POSES (54 ADDITIONAL SIGNS) =================
    case 'MORNING':
      // Right arm rising like the morning sun above horizontal left forearm
      return {
        headRot: [-0.04 * pulse, 0, 0],
        rightArm: {
          elbow: [-0.32, 0.22, 0.18],
          wrist: [-0.06, 0.34 + 0.18 * pulse, 0.25],
          rot: [0.2, 0.35, -0.35],
          shape: 'FLAT_OPEN'
        },
        leftArm: {
          elbow: [0.32, 0.18, 0.18],
          wrist: [0.02, 0.28, 0.26],
          rot: [1.1, -0.2, 0.8],
          shape: 'FLAT_OPEN'
        }
      };

    case 'AFTERNOON':
      // Right flat hand angled overhead like midday sun above forehead
      return {
        headRot: [-0.05, 0, 0],
        rightArm: {
          elbow: [-0.36, 0.30, 0.16],
          wrist: [-0.10, 0.66 + 0.02 * wave, 0.22],
          rot: [0.45, 0.3, -0.45],
          shape: 'FLAT_OPEN'
        },
        leftArm: {
          elbow: [0.32, 0.18, 0.18],
          wrist: [0.02, 0.28, 0.26],
          rot: [1.1, -0.2, 0.8],
          shape: 'FLAT_OPEN'
        }
      };

    case 'EVENING':
      // Right curved hand descending over horizontal left forearm like sunset
      return {
        headRot: [0.05, 0, 0],
        rightArm: {
          elbow: [-0.32, 0.24, 0.18],
          wrist: [-0.04, 0.44 - 0.12 * pulse, 0.26],
          rot: [0.65, 0.3, -0.4],
          shape: 'C_CLASSROOM'
        },
        leftArm: {
          elbow: [0.32, 0.18, 0.18],
          wrist: [0.02, 0.28, 0.26],
          rot: [1.1, -0.2, 0.8],
          shape: 'FLAT_OPEN'
        }
      };

    case 'NIGHT':
      // Both hands closing together near tilted cheek/resting gesture
      return {
        headRot: [0.08, -0.08, -0.15],
        rightArm: {
          elbow: [-0.34, 0.24, 0.16],
          wrist: [-0.12, 0.54, 0.20],
          rot: [0.2, 0.5, -0.35],
          shape: 'FLAT_OPEN'
        },
        leftArm: {
          elbow: [0.32, 0.22, 0.16],
          wrist: [-0.08, 0.52, 0.22],
          rot: [0.2, -0.5, 0.35],
          shape: 'FLAT_OPEN'
        }
      };

    case 'GOODBYE':
      // Raised open hand waving side-to-side warmly
      return {
        headRot: [0.03, 0.04 * wave, 0.04 * wave],
        rightArm: {
          elbow: [-0.38, 0.28, 0.16],
          wrist: [-0.20 + 0.05 * fastWave, 0.62, 0.22],
          rot: [0.1, 0.2, -0.35 + 0.25 * fastWave],
          shape: 'SPREAD_FIVE'
        },
        leftArm: {
          elbow: [0.32, 0.14, 0.14],
          wrist: [0.14, 0.22, 0.20],
          rot: [0.25, -0.35, 0.55],
          shape: 'FLAT_OPEN'
        }
      };

    case 'WE':
      // Index finger sweeping in an arc from right shoulder to left shoulder across chest
      return {
        headRot: [0.03, 0.05 * wave, 0],
        rightArm: {
          elbow: [-0.34, 0.22, 0.18],
          wrist: [-0.10 + 0.16 * pulse, 0.44, 0.24 + 0.04 * Math.sin(pulse * Math.PI)],
          rot: [0.15, 0.95, -0.4],
          shape: 'INDEX_POINT'
        },
        leftArm: {
          elbow: [0.32, 0.14, 0.14],
          wrist: [0.16, 0.20, 0.20],
          rot: [0.25, -0.35, 0.55],
          shape: 'FLAT_OPEN'
        }
      };

    case 'THEY':
      // Index finger sweeping outward to the side
      return {
        headRot: [0, -0.08 * pulse, 0],
        rightArm: {
          elbow: [-0.34, 0.24, 0.18],
          wrist: [-0.14 - 0.10 * pulse, 0.42, 0.28],
          rot: [0.65, -0.25, -0.2],
          shape: 'INDEX_POINT'
        },
        leftArm: {
          elbow: [0.32, 0.14, 0.14],
          wrist: [0.16, 0.20, 0.20],
          rot: [0.25, -0.35, 0.55],
          shape: 'FLAT_OPEN'
        }
      };

    case 'HE':
      // Pointing right index toward right side & touching upper lip (mustache sign in ISL)
      return {
        headRot: [0.02, -0.06, 0],
        rightArm: {
          elbow: [-0.34, 0.26, 0.18],
          wrist: [-0.06 - 0.10 * pulse, 0.54 - 0.08 * pulse, 0.24],
          rot: [0.35, 0.45, -0.25],
          shape: 'INDEX_POINT'
        },
        leftArm: {
          elbow: [0.32, 0.14, 0.14],
          wrist: [0.16, 0.20, 0.20],
          rot: [0.25, -0.35, 0.55],
          shape: 'FLAT_OPEN'
        }
      };

    case 'SHE':
      // Touching nose/cheek (nose-ring sign in ISL) then pointing gracefully
      return {
        headRot: [0.02, 0.05, 0],
        rightArm: {
          elbow: [-0.34, 0.26, 0.18],
          wrist: [-0.05, 0.58 - 0.06 * pulse, 0.22 + 0.04 * pulse],
          rot: [0.2, 0.55, -0.3],
          shape: 'INDEX_POINT'
        },
        leftArm: {
          elbow: [0.32, 0.14, 0.14],
          wrist: [0.16, 0.20, 0.20],
          rot: [0.25, -0.35, 0.55],
          shape: 'FLAT_OPEN'
        }
      };

    case 'MOTHER':
      // Open spread 5-finger hand tapping thumb gently on chin/cheek
      return {
        headRot: [0.04, -0.03, 0],
        rightArm: {
          elbow: [-0.34, 0.26, 0.18],
          wrist: [-0.06, 0.56 + 0.015 * fastWave, 0.21],
          rot: [0.1, 0.65, -0.2],
          shape: 'SPREAD_FIVE'
        },
        leftArm: {
          elbow: [0.32, 0.16, 0.15],
          wrist: [0.08, 0.30, 0.22],
          rot: [0.25, -0.35, 0.65],
          shape: 'FLAT_OPEN'
        }
      };

    case 'FATHER':
      // Open spread 5-finger hand tapping thumb at forehead/temple
      return {
        headRot: [0.04, -0.03, 0],
        rightArm: {
          elbow: [-0.36, 0.30, 0.18],
          wrist: [-0.08, 0.68 + 0.015 * fastWave, 0.20],
          rot: [0.1, 0.65, -0.2],
          shape: 'SPREAD_FIVE'
        },
        leftArm: {
          elbow: [0.32, 0.16, 0.15],
          wrist: [0.08, 0.30, 0.22],
          rot: [0.25, -0.35, 0.65],
          shape: 'FLAT_OPEN'
        }
      };

    case 'BROTHER':
      // Both index fingers brought parallel side-by-side in front of chest
      return {
        headRot: [0.04, 0, 0],
        rightArm: {
          elbow: [-0.32, 0.22, 0.18],
          wrist: [-0.04, 0.38 + 0.02 * fastWave, 0.26],
          rot: [0.5, 0.2, -0.1],
          shape: 'INDEX_POINT'
        },
        leftArm: {
          elbow: [0.32, 0.22, 0.18],
          wrist: [0.04, 0.38 - 0.02 * fastWave, 0.26],
          rot: [0.5, -0.2, 0.1],
          shape: 'INDEX_POINT'
        }
      };

    case 'SISTER':
      // Right index touching cheek then aligning with left index finger
      return {
        headRot: [0.04, 0.03, 0],
        rightArm: {
          elbow: [-0.32, 0.24, 0.18],
          wrist: [-0.04, 0.50 - 0.12 * pulse, 0.25],
          rot: [0.4, 0.3, -0.15],
          shape: 'INDEX_POINT'
        },
        leftArm: {
          elbow: [0.32, 0.20, 0.18],
          wrist: [0.04, 0.38, 0.26],
          rot: [0.5, -0.2, 0.1],
          shape: 'INDEX_POINT'
        }
      };

    case 'FRIEND':
      // Both hands clasping/interlocking warmly at chest center
      return {
        headRot: [0.05, 0.03 * wave, 0],
        rightArm: {
          elbow: [-0.32, 0.20, 0.18],
          wrist: [-0.02, 0.36 + 0.02 * fastWave, 0.27],
          rot: [0.3, 0.6, -0.4],
          shape: 'CLAW'
        },
        leftArm: {
          elbow: [0.32, 0.20, 0.18],
          wrist: [0.02, 0.35 + 0.02 * fastWave, 0.27],
          rot: [0.3, -0.6, 0.4],
          shape: 'CLAW'
        }
      };

    case 'FAMILY':
      // Both C-hands tracing an inclusive circle in front of torso
      const fCircle = Math.sin(time * 3);
      return {
        headRot: [0.04, 0, 0],
        rightArm: {
          elbow: [-0.36, 0.22, 0.18],
          wrist: [-0.14 * pulse - 0.03, 0.38, 0.25 + 0.05 * fCircle],
          rot: [0.15, 0.45, -0.2],
          shape: 'C_CLASSROOM'
        },
        leftArm: {
          elbow: [0.36, 0.22, 0.18],
          wrist: [0.14 * pulse + 0.03, 0.38, 0.25 + 0.05 * fCircle],
          rot: [0.15, -0.45, 0.2],
          shape: 'C_CLASSROOM'
        }
      };

    case 'WHAT':
      // Both open palms facing up, shaking side-to-side inquisitively
      return {
        headRot: [0.04, 0.08 * fastWave, 0.05],
        rightArm: {
          elbow: [-0.36, 0.20, 0.18],
          wrist: [-0.16 + 0.03 * fastWave, 0.36, 0.26],
          rot: [0.8, 0.2, -0.5],
          shape: 'SPREAD_FIVE'
        },
        leftArm: {
          elbow: [0.36, 0.20, 0.18],
          wrist: [0.16 + 0.03 * fastWave, 0.36, 0.26],
          rot: [0.8, -0.2, 0.5],
          shape: 'SPREAD_FIVE'
        }
      };

    case 'WHERE':
      // Upright index finger wagging side to side with questioning head tilt
      return {
        headRot: [0.02, 0.08 * fastWave, 0.06],
        rightArm: {
          elbow: [-0.34, 0.24, 0.18],
          wrist: [-0.12 + 0.05 * fastWave, 0.48, 0.26],
          rot: [0.1, 0.25 * fastWave, -0.15],
          shape: 'INDEX_POINT'
        },
        leftArm: {
          elbow: [0.32, 0.14, 0.14],
          wrist: [0.16, 0.20, 0.20],
          rot: [0.25, -0.35, 0.55],
          shape: 'FLAT_OPEN'
        }
      };

    case 'WHEN':
      // Right index circling around upright left index finger
      return {
        headRot: [0.05, 0, 0.04],
        rightArm: {
          elbow: [-0.32, 0.22, 0.18],
          wrist: [-0.02 + 0.04 * Math.cos(time * 4), 0.40 + 0.04 * Math.sin(time * 4), 0.27],
          rot: [0.3, 0.4, -0.2],
          shape: 'INDEX_POINT'
        },
        leftArm: {
          elbow: [0.32, 0.20, 0.18],
          wrist: [0.02, 0.38, 0.26],
          rot: [0.1, -0.2, 0.1],
          shape: 'INDEX_POINT'
        }
      };

    case 'WHY':
      // Touching forehead thoughtfully then opening into Y-handshape
      return {
        headRot: [0.05, -0.04, 0.06],
        rightArm: {
          elbow: [-0.36, 0.28, 0.18],
          wrist: [-0.12, 0.62 - 0.10 * pulse, 0.22 + 0.04 * pulse],
          rot: [0.15, 0.35, -0.25],
          shape: 'Y_PHONE'
        },
        leftArm: {
          elbow: [0.32, 0.14, 0.14],
          wrist: [0.16, 0.20, 0.20],
          rot: [0.25, -0.35, 0.55],
          shape: 'FLAT_OPEN'
        }
      };

    case 'WHO':
      // Index finger making small circle near chin/mouth
      return {
        headRot: [0.03, 0, 0.05],
        rightArm: {
          elbow: [-0.34, 0.24, 0.18],
          wrist: [-0.06 + 0.02 * Math.cos(time * 5), 0.52 + 0.02 * Math.sin(time * 5), 0.24],
          rot: [0.2, 0.45, -0.25],
          shape: 'INDEX_POINT'
        },
        leftArm: {
          elbow: [0.32, 0.14, 0.14],
          wrist: [0.16, 0.20, 0.20],
          rot: [0.25, -0.35, 0.55],
          shape: 'FLAT_OPEN'
        }
      };

    case 'HOW':
      // Curved hands rolling upward to open palms at chest
      return {
        headRot: [0.05, 0, 0],
        rightArm: {
          elbow: [-0.34, 0.20, 0.18],
          wrist: [-0.06, 0.38, 0.26],
          rot: [0.4 + 0.4 * pulse, 0.4, -0.3],
          shape: pulse > 0.5 ? 'FLAT_OPEN' : 'C_CLASSROOM'
        },
        leftArm: {
          elbow: [0.34, 0.20, 0.18],
          wrist: [0.06, 0.38, 0.26],
          rot: [0.4 + 0.4 * pulse, -0.4, 0.3],
          shape: pulse > 0.5 ? 'FLAT_OPEN' : 'C_CLASSROOM'
        }
      };

    case 'HOW_MUCH':
      // Bunched fingers opening upward into spread 5-finger hands
      return {
        headRot: [0.04, 0, 0.04],
        rightArm: {
          elbow: [-0.34, 0.22, 0.18],
          wrist: [-0.10, 0.36 + 0.06 * pulse, 0.26],
          rot: [0.6, 0.2, -0.3],
          shape: pulse > 0.45 ? 'SPREAD_FIVE' : 'PINCH_FOOD'
        },
        leftArm: {
          elbow: [0.34, 0.22, 0.18],
          wrist: [0.10, 0.36 + 0.06 * pulse, 0.26],
          rot: [0.6, -0.2, 0.3],
          shape: pulse > 0.45 ? 'SPREAD_FIVE' : 'PINCH_FOOD'
        }
      };

    case 'WHICH':
      // Alternating thumbs-up hands moving up and down like a balance scale
      return {
        headRot: [0.03, 0.06 * wave, 0.04 * wave],
        rightArm: {
          elbow: [-0.34, 0.22, 0.18],
          wrist: [-0.10, 0.38 + 0.05 * wave, 0.26],
          rot: [0.0, 0.3, -0.2],
          shape: 'THUMBS_UP'
        },
        leftArm: {
          elbow: [0.34, 0.22, 0.18],
          wrist: [0.10, 0.38 - 0.05 * wave, 0.26],
          rot: [0.0, -0.3, 0.2],
          shape: 'THUMBS_UP'
        }
      };

    case 'SCHOOL':
      // Clapping flat hands twice in front of chest
      return {
        headRot: [0.04, 0, 0],
        rightArm: {
          elbow: [-0.34, 0.20, 0.18],
          wrist: [-0.03 - 0.04 * pulse, 0.36, 0.26],
          rot: [0.3, 0.65, -0.35],
          shape: 'FLAT_OPEN'
        },
        leftArm: {
          elbow: [0.34, 0.20, 0.18],
          wrist: [0.03 + 0.04 * pulse, 0.36, 0.26],
          rot: [0.3, -0.65, 0.35],
          shape: 'FLAT_OPEN'
        }
      };

    case 'COLLEGE':
      // Right flat palm rising higher above left flat palm in circular arc
      return {
        headRot: [-0.03, 0, 0],
        rightArm: {
          elbow: [-0.34, 0.24, 0.18],
          wrist: [-0.02 + 0.03 * Math.cos(time * 4), 0.38 + 0.12 * pulse, 0.26],
          rot: [0.8, 0.2, -0.5],
          shape: 'FLAT_OPEN'
        },
        leftArm: {
          elbow: [0.32, 0.16, 0.18],
          wrist: [0.02, 0.28, 0.26],
          rot: [1.1, -0.2, 0.8],
          shape: 'FLAT_OPEN'
        }
      };

    case 'BOOK':
      // Both palms opening hinged at pinkies like opening a textbook
      return {
        headRot: [0.10, 0, 0],
        rightArm: {
          elbow: [-0.32, 0.18, 0.18],
          wrist: [-0.04, 0.34, 0.27],
          rot: [0.7, 0.6 * (1 - pulse), -0.4],
          shape: 'FLAT_OPEN'
        },
        leftArm: {
          elbow: [0.32, 0.18, 0.18],
          wrist: [0.04, 0.34, 0.27],
          rot: [0.7, -0.6 * (1 - pulse), 0.4],
          shape: 'FLAT_OPEN'
        }
      };

    case 'WRITE':
      // Right pinched pen hand writing across flat open left palm
      return {
        headRot: [0.12, 0, 0],
        rightArm: {
          elbow: [-0.32, 0.20, 0.18],
          wrist: [0.0 + 0.04 * fastWave, 0.33, 0.28],
          rot: [0.4, 0.5, -0.35],
          shape: 'PINCH_FOOD'
        },
        leftArm: {
          elbow: [0.32, 0.16, 0.18],
          wrist: [0.04, 0.30, 0.26],
          rot: [0.95, -0.25, 0.65],
          shape: 'FLAT_OPEN'
        }
      };

    case 'READ':
      // Right V-fingers (2 eyes) scanning down open left palm
      return {
        headRot: [0.10, 0, 0],
        rightArm: {
          elbow: [-0.32, 0.22, 0.18],
          wrist: [-0.02, 0.38 - 0.06 * pulse, 0.27],
          rot: [0.45, 0.45, -0.3],
          shape: 'TWO_V'
        },
        leftArm: {
          elbow: [0.32, 0.18, 0.18],
          wrist: [0.05, 0.32, 0.26],
          rot: [0.85, -0.3, 0.6],
          shape: 'FLAT_OPEN'
        }
      };

    case 'STUDY':
      // Right spread fingers wiggling toward open left palm
      return {
        headRot: [0.08, 0, 0],
        rightArm: {
          elbow: [-0.32, 0.22, 0.18],
          wrist: [-0.03, 0.36 + 0.02 * fastWave, 0.27],
          rot: [0.4, 0.5, -0.35],
          shape: 'SPREAD_FIVE'
        },
        leftArm: {
          elbow: [0.32, 0.18, 0.18],
          wrist: [0.05, 0.30, 0.26],
          rot: [0.9, -0.25, 0.65],
          shape: 'FLAT_OPEN'
        }
      };

    case 'EXAM':
      // Both index fingers drawing question marks and opening palms
      return {
        headRot: [0.05, 0, 0],
        rightArm: {
          elbow: [-0.34, 0.24, 0.18],
          wrist: [-0.10, 0.44 - 0.06 * pulse, 0.26],
          rot: [0.25, 0.2, -0.2],
          shape: pulse > 0.5 ? 'SPREAD_FIVE' : 'INDEX_POINT'
        },
        leftArm: {
          elbow: [0.34, 0.24, 0.18],
          wrist: [0.10, 0.44 - 0.06 * pulse, 0.26],
          rot: [0.25, -0.2, 0.2],
          shape: pulse > 0.5 ? 'SPREAD_FIVE' : 'INDEX_POINT'
        }
      };

    case 'DOCTOR':
      // Right 2 fingers tapping pulse on inside of left wrist
      return {
        headRot: [0.08, 0.03, 0],
        rightArm: {
          elbow: [-0.32, 0.20, 0.18],
          wrist: [0.02, 0.32 + 0.015 * fastWave, 0.27],
          rot: [0.4, 0.55, -0.35],
          shape: 'TWO_V'
        },
        leftArm: {
          elbow: [0.32, 0.16, 0.18],
          wrist: [0.04, 0.29, 0.26],
          rot: [1.0, -0.2, 0.75],
          shape: 'FLAT_OPEN'
        }
      };

    case 'HOSPITAL':
      // Right 2 fingers drawing a medical cross (+) on left upper arm/shoulder
      return {
        headRot: [0.04, -0.05, 0],
        rightArm: {
          elbow: [-0.30, 0.22, 0.20],
          wrist: [0.14 + 0.02 * wave, 0.44 + 0.02 * fastWave, 0.22],
          rot: [0.2, 0.85, -0.35],
          shape: 'TWO_V'
        },
        leftArm: {
          elbow: [0.32, 0.14, 0.14],
          wrist: [0.18, 0.20, 0.20],
          rot: [0.25, -0.35, 0.55],
          shape: 'FLAT_OPEN'
        }
      };

    case 'MEDICINE':
      // Right pinched hand placing medicine toward mouth
      return {
        headRot: [0.06, 0, 0],
        rightArm: {
          elbow: [-0.32, 0.24, 0.18],
          wrist: [-0.04, 0.42 + 0.14 * pulse, 0.24],
          rot: [0.2, 0.5, -0.3],
          shape: 'PINCH_FOOD'
        },
        leftArm: {
          elbow: [0.32, 0.16, 0.18],
          wrist: [0.04, 0.29, 0.26],
          rot: [1.0, -0.2, 0.75],
          shape: 'FLAT_OPEN'
        }
      };

    case 'PAIN':
      // Both index fingers pointing toward each other and twisting sharply
      return {
        headRot: [0.06, 0.03 * fastWave, 0.04],
        rightArm: {
          elbow: [-0.34, 0.22, 0.18],
          wrist: [-0.05 + 0.015 * fastWave, 0.40, 0.26],
          rot: [0.2, 0.75, -0.3 + 0.2 * fastWave],
          shape: 'INDEX_POINT'
        },
        leftArm: {
          elbow: [0.34, 0.22, 0.18],
          wrist: [0.05 - 0.015 * fastWave, 0.40, 0.26],
          rot: [0.2, -0.75, 0.3 - 0.2 * fastWave],
          shape: 'INDEX_POINT'
        }
      };

    case 'EMERGENCY':
      // Raised right spread hand waving rapidly at high alert
      return {
        headRot: [0.02, 0.05 * fastWave, 0],
        rightArm: {
          elbow: [-0.36, 0.30, 0.18],
          wrist: [-0.14 + 0.05 * fastWave, 0.64, 0.22],
          rot: [0.1, 0.25 * fastWave, -0.25],
          shape: 'SPREAD_FIVE'
        },
        leftArm: {
          elbow: [0.32, 0.18, 0.16],
          wrist: [0.08, 0.32, 0.23],
          rot: [0.25, -0.35, 0.65],
          shape: 'FLAT_OPEN'
        }
      };

    case 'HOME':
      // Both flat hands angled together at fingertips forming a house roof peak
      return {
        headRot: [0.04, 0, 0],
        rightArm: {
          elbow: [-0.34, 0.24, 0.18],
          wrist: [-0.04, 0.44 + 0.02 * pulse, 0.26],
          rot: [0.2, 0.65, -0.45],
          shape: 'FLAT_OPEN'
        },
        leftArm: {
          elbow: [0.34, 0.24, 0.18],
          wrist: [0.04, 0.44 + 0.02 * pulse, 0.26],
          rot: [0.2, -0.65, 0.45],
          shape: 'FLAT_OPEN'
        }
      };

    case 'HAPPY':
      // Both flat hands brushing upward repeatedly over chest with joyful posture
      return {
        headRot: [-0.04 * pulse, 0, 0.03 * wave],
        rightArm: {
          elbow: [-0.34, 0.22, 0.18],
          wrist: [-0.08, 0.34 + 0.06 * pulse, 0.25],
          rot: [0.3, 0.45, -0.4],
          shape: 'FLAT_OPEN'
        },
        leftArm: {
          elbow: [0.34, 0.22, 0.18],
          wrist: [0.08, 0.34 + 0.06 * pulse, 0.25],
          rot: [0.3, -0.45, 0.4],
          shape: 'FLAT_OPEN'
        }
      };

    case 'SAD':
      // Both spread hands drawing downward in front of face with bowed head
      return {
        headRot: [0.14, 0, 0],
        rightArm: {
          elbow: [-0.34, 0.24, 0.18],
          wrist: [-0.08, 0.56 - 0.10 * pulse, 0.23],
          rot: [0.15, 0.4, -0.25],
          shape: 'SPREAD_FIVE'
        },
        leftArm: {
          elbow: [0.34, 0.24, 0.18],
          wrist: [0.08, 0.56 - 0.10 * pulse, 0.23],
          rot: [0.15, -0.4, 0.25],
          shape: 'SPREAD_FIVE'
        }
      };

    case 'TIRED':
      // Both hands drooping downward at chest with relaxed shoulders
      return {
        headRot: [0.12, 0, -0.06],
        rightArm: {
          elbow: [-0.34, 0.18, 0.16],
          wrist: [-0.08, 0.32 - 0.04 * pulse, 0.23],
          rot: [0.5, 0.4, -0.5],
          shape: 'C_CLASSROOM'
        },
        leftArm: {
          elbow: [0.34, 0.18, 0.16],
          wrist: [0.08, 0.32 - 0.04 * pulse, 0.23],
          rot: [0.5, -0.4, 0.5],
          shape: 'C_CLASSROOM'
        }
      };

    case 'ANGRY':
      // Claw hand pulling outward from chest/stomach
      return {
        headRot: [0.06, 0.04 * fastWave, 0],
        rightArm: {
          elbow: [-0.34, 0.22, 0.18],
          wrist: [-0.06, 0.38 + 0.03 * fastWave, 0.26],
          rot: [0.3, 0.4, -0.25],
          shape: 'CLAW'
        },
        leftArm: {
          elbow: [0.34, 0.22, 0.18],
          wrist: [0.06, 0.38 + 0.03 * fastWave, 0.26],
          rot: [0.3, -0.4, 0.25],
          shape: 'CLAW'
        }
      };

    case 'SORRY':
      // Right fist rubbing in a circle over heart/chest with apologetic head nod
      return {
        headRot: [0.10, 0, 0.04],
        rightArm: {
          elbow: [-0.34, 0.20, 0.16],
          wrist: [-0.02 + 0.035 * Math.cos(time * 4), 0.36 + 0.035 * Math.sin(time * 4), 0.23],
          rot: [0.15, 0.45, -0.45],
          shape: 'FIST'
        },
        leftArm: {
          elbow: [0.30, 0.12, 0.12],
          wrist: [0.18, 0.18, 0.20],
          rot: [0.3, -0.3, 0.4],
          shape: 'FLAT_OPEN'
        }
      };

    case 'LOVE':
      // Both arms crossed/folded warmly over heart on chest
      return {
        headRot: [0.06, 0, 0.05 * wave],
        rightArm: {
          elbow: [-0.30, 0.18, 0.18],
          wrist: [0.04, 0.38, 0.23],
          rot: [0.2, 0.65, -0.65],
          shape: 'FLAT_OPEN'
        },
        leftArm: {
          elbow: [0.30, 0.18, 0.18],
          wrist: [-0.04, 0.38, 0.25],
          rot: [0.2, -0.65, 0.65],
          shape: 'FLAT_OPEN'
        }
      };

    case 'NEED':
      // Crooked index hand pulling downward firmly twice
      return {
        headRot: [0.06 * pulse, 0, 0],
        rightArm: {
          elbow: [-0.32, 0.22, 0.18],
          wrist: [-0.10, 0.42 - 0.05 * pulse, 0.27],
          rot: [0.55, 0.15, -0.2],
          shape: 'INDEX_POINT'
        },
        leftArm: {
          elbow: [0.32, 0.14, 0.14],
          wrist: [0.16, 0.20, 0.20],
          rot: [0.25, -0.35, 0.55],
          shape: 'FLAT_OPEN'
        }
      };

    case 'WANT':
      // Both open claw hands pulling inward toward chest
      return {
        headRot: [0.04, 0, 0],
        rightArm: {
          elbow: [-0.34, 0.20, 0.18],
          wrist: [-0.10, 0.36, 0.30 - 0.06 * pulse],
          rot: [0.75, 0.2, -0.35],
          shape: 'CLAW'
        },
        leftArm: {
          elbow: [0.34, 0.20, 0.18],
          wrist: [0.10, 0.36, 0.30 - 0.06 * pulse],
          rot: [0.75, -0.2, 0.35],
          shape: 'CLAW'
        }
      };

    case 'COME':
      // Right hand beckoning inward toward body
      return {
        headRot: [0.04, 0, 0],
        rightArm: {
          elbow: [-0.32, 0.22, 0.18],
          wrist: [-0.08, 0.40 + 0.03 * pulse, 0.32 - 0.08 * pulse],
          rot: [0.4, 0.4, -0.3],
          shape: 'INDEX_POINT'
        },
        leftArm: {
          elbow: [0.32, 0.14, 0.14],
          wrist: [0.16, 0.20, 0.20],
          rot: [0.25, -0.35, 0.55],
          shape: 'FLAT_OPEN'
        }
      };

    case 'GO':
      // Right index & arm sweeping outward/forward away from body
      return {
        headRot: [0, -0.05 * pulse, 0],
        rightArm: {
          elbow: [-0.32, 0.22, 0.18],
          wrist: [-0.12 - 0.06 * pulse, 0.40, 0.24 + 0.10 * pulse],
          rot: [0.75, -0.2, -0.2],
          shape: 'INDEX_POINT'
        },
        leftArm: {
          elbow: [0.32, 0.14, 0.14],
          wrist: [0.16, 0.20, 0.20],
          rot: [0.25, -0.35, 0.55],
          shape: 'FLAT_OPEN'
        }
      };

    case 'WAIT':
      // Both palms held out with fingers wiggling gently
      return {
        headRot: [0.02, 0, 0],
        rightArm: {
          elbow: [-0.34, 0.20, 0.18],
          wrist: [-0.12, 0.36 + 0.015 * fastWave, 0.27],
          rot: [0.75, 0.2, -0.35],
          shape: 'SPREAD_FIVE'
        },
        leftArm: {
          elbow: [0.34, 0.20, 0.18],
          wrist: [0.12, 0.36 - 0.015 * fastWave, 0.27],
          rot: [0.75, -0.2, 0.35],
          shape: 'SPREAD_FIVE'
        }
      };

    case 'WORK':
      // Right fist tapping repeatedly on back of left fist
      return {
        headRot: [0.05, 0, 0],
        rightArm: {
          elbow: [-0.32, 0.22, 0.18],
          wrist: [-0.02, 0.35 + 0.04 * Math.abs(fastWave), 0.27],
          rot: [0.4, 0.5, -0.3],
          shape: 'FIST'
        },
        leftArm: {
          elbow: [0.32, 0.18, 0.18],
          wrist: [0.02, 0.30, 0.27],
          rot: [0.8, -0.4, 0.5],
          shape: 'FIST'
        }
      };

    case 'TODAY':
    case 'NOW':
      // Both Y-hands/palms dropping slightly right in front of waist/chest
      return {
        headRot: [0.06 * pulse, 0, 0],
        rightArm: {
          elbow: [-0.34, 0.20, 0.18],
          wrist: [-0.10, 0.36 - 0.05 * pulse, 0.26],
          rot: [0.7, 0.2, -0.3],
          shape: 'Y_PHONE'
        },
        leftArm: {
          elbow: [0.34, 0.20, 0.18],
          wrist: [0.10, 0.36 - 0.05 * pulse, 0.26],
          rot: [0.7, -0.2, 0.3],
          shape: 'Y_PHONE'
        }
      };

    case 'TOMORROW':
      // Right thumb touching cheek and arcing forward
      return {
        headRot: [0.02, -0.04, 0],
        rightArm: {
          elbow: [-0.34, 0.26, 0.18],
          wrist: [-0.08, 0.54, 0.20 + 0.08 * pulse],
          rot: [0.25 + 0.3 * pulse, 0.4, -0.2],
          shape: 'THUMBS_UP'
        },
        leftArm: {
          elbow: [0.32, 0.14, 0.14],
          wrist: [0.16, 0.20, 0.20],
          rot: [0.25, -0.35, 0.55],
          shape: 'FLAT_OPEN'
        }
      };

    case 'YESTERDAY':
      // Right thumb touching cheek and arcing backward toward shoulder
      return {
        headRot: [0.02, -0.06, 0],
        rightArm: {
          elbow: [-0.36, 0.26, 0.16],
          wrist: [-0.10 - 0.04 * pulse, 0.54, 0.22 - 0.06 * pulse],
          rot: [-0.15, 0.5, -0.25],
          shape: 'THUMBS_UP'
        },
        leftArm: {
          elbow: [0.32, 0.14, 0.14],
          wrist: [0.16, 0.20, 0.20],
          rot: [0.25, -0.35, 0.55],
          shape: 'FLAT_OPEN'
        }
      };

    case 'TIME':
      // Right index finger tapping top of left wrist (wristwatch gesture)
      return {
        headRot: [0.08, 0.03, 0],
        rightArm: {
          elbow: [-0.32, 0.20, 0.18],
          wrist: [0.02, 0.33 + 0.02 * Math.abs(fastWave), 0.27],
          rot: [0.45, 0.55, -0.35],
          shape: 'INDEX_POINT'
        },
        leftArm: {
          elbow: [0.32, 0.16, 0.18],
          wrist: [0.04, 0.29, 0.26],
          rot: [0.8, -0.4, 0.65],
          shape: 'FIST'
        }
      };

    case 'NAME':
      // Both 2-finger H-hands tapping together at chest center
      return {
        headRot: [0.04, 0, 0],
        rightArm: {
          elbow: [-0.32, 0.20, 0.18],
          wrist: [-0.02, 0.37 + 0.02 * Math.abs(fastWave), 0.27],
          rot: [0.3, 0.65, -0.35],
          shape: 'TWO_V'
        },
        leftArm: {
          elbow: [0.32, 0.18, 0.18],
          wrist: [0.02, 0.34, 0.27],
          rot: [0.3, -0.65, 0.35],
          shape: 'TWO_V'
        }
      };

    default: {
      // Dynamic kinematic generator for SPELL:<WORD> fingerspelling AND all 500 ISL vocabulary classes
      const allShapes = [
        'FLAT_OPEN', 'SPREAD_FIVE', 'FIST', 'THUMBS_UP', 'W_WATER',
        'INDEX_POINT', 'PINCH_FOOD', 'C_CLASSROOM', 'NO_SNAP',
        'L_SHAPE', 'TWO_V', 'Y_PHONE', 'CLAW'
      ];

      if (s.startsWith('SPELL:')) {
        const word = s.slice(6) || 'A';
        const letterIdx = Math.floor(time * 2.2) % word.length;
        const charCode = word.charCodeAt(letterIdx) || 65;
        const rShape = allShapes[charCode % allShapes.length];
        const lShape = allShapes[(charCode + 5) % allShapes.length];
        const tap = 0.025 * Math.sin(time * 7);
        return {
          headRot: [0.06, 0.03 * Math.sin(time * 2), 0],
          rightArm: {
            elbow: [-0.33, 0.22, 0.18],
            wrist: [-0.04 + 0.02 * Math.cos(charCode), 0.42 + tap, 0.27],
            rot: [0.35, 0.55, -0.35],
            shape: rShape
          },
          leftArm: {
            elbow: [0.33, 0.20, 0.18],
            wrist: [0.04, 0.37 - tap, 0.26],
            rot: [0.45, -0.55, 0.35],
            shape: lShape
          }
        };
      }

      // Deterministic 500-class procedural kinematic pose for any extended ISL dictionary gloss
      let hash = 0;
      for (let i = 0; i < s.length; i++) {
        hash = (hash * 31 + s.charCodeAt(i)) % 9973;
      }
      const rShape = allShapes[hash % allShapes.length];
      const lShape = allShapes[(hash >> 3) % allShapes.length];
      const twoHanded = (hash % 2) === 0;
      const rxOff = -0.06 - (hash % 11) * 0.01;
      const ryOff = 0.36 + ((hash >> 2) % 15) * 0.016;
      const motionX = 0.04 * Math.sin(time * (3 + (hash % 3)));
      const motionY = 0.04 * Math.cos(time * (3 + (hash % 4)));

      return {
        headRot: [0.04 * pulse, 0.03 * wave, 0],
        rightArm: {
          elbow: [-0.34, 0.24, 0.18],
          wrist: [rxOff + motionX, ryOff + motionY, 0.25],
          rot: [0.25 + 0.2 * pulse, 0.45, -0.35],
          shape: rShape
        },
        leftArm: twoHanded
          ? {
              elbow: [0.34, 0.22, 0.18],
              wrist: [-rxOff - motionX, ryOff - motionY * 0.5, 0.25],
              rot: [0.25 + 0.2 * pulse, -0.45, 0.35],
              shape: lShape
            }
          : {
              elbow: [0.32, 0.16, 0.15],
              wrist: [0.08, 0.30, 0.22],
              rot: [0.25, -0.35, 0.65],
              shape: 'FLAT_OPEN'
            }
      };
    }
  }
}

/**
 * Single Articulated 3-Phalanx Finger Component
 */
function ArticulatedFinger({ position, length, radius, curl = 0.05, spread = 0, skinColor }) {
  const seg1 = length * 0.45;
  const seg2 = length * 0.32;
  const seg3 = length * 0.25;

  return (
    <group position={position} rotation={[0, 0, -spread]}>
      {/* Knuckle joint */}
      <mesh>
        <sphereGeometry args={[radius * 1.05, 12, 12]} />
        <meshStandardMaterial color={skinColor} roughness={0.45} />
      </mesh>
      {/* Proximal Phalanx */}
      <group rotation={[curl * 0.65, 0, 0]}>
        <mesh position={[0, seg1 / 2, 0]}>
          <capsuleGeometry args={[radius, seg1 * 0.65, 8, 12]} />
          <meshStandardMaterial color={skinColor} roughness={0.45} />
        </mesh>
        {/* Middle Phalanx */}
        <group position={[0, seg1, 0]} rotation={[curl * 0.85, 0, 0]}>
          <mesh position={[0, seg2 / 2, 0]}>
            <capsuleGeometry args={[radius * 0.9, seg2 * 0.65, 8, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.45} />
          </mesh>
          {/* Distal Phalanx (Fingertip) */}
          <group position={[0, seg2, 0]} rotation={[curl * 0.55, 0, 0]}>
            <mesh position={[0, seg3 / 2, 0]}>
              <capsuleGeometry args={[radius * 0.8, seg3 * 0.6, 8, 12]} />
              <meshStandardMaterial color={skinColor} roughness={0.4} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

/**
 * Detailed 5-Finger Human Hand Component (Left or Right)
 * Renders palm, thumb pad, wrist, and 5 articulated fingers (Thumb, Index, Middle, Ring, Pinky)
 */
function DetailedHand({ isLeft, shapeName = 'FLAT_OPEN', skinColor }) {
  const shape = HANDSHAPES[shapeName] || HANDSHAPES.FLAT_OPEN;
  const side = isLeft ? -1 : 1; // Thumb is on inner side when palm faces forward

  return (
    <group>
      {/* Wrist joint */}
      <mesh position={[0, 0.01, 0]}>
        <sphereGeometry args={[0.028, 14, 14]} />
        <meshStandardMaterial color={skinColor} roughness={0.45} />
      </mesh>

      {/* Sculpted Palm body */}
      <mesh position={[0, 0.048, 0]} scale={[1.0, 1.0, 0.42]}>
        <cylinderGeometry args={[0.042, 0.034, 0.072, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.45} />
      </mesh>

      {/* Rounded Metacarpal Ridge (top of palm under knuckles) */}
      <mesh position={[0, 0.082, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.016, 0.056, 8, 12]} />
        <meshStandardMaterial color={skinColor} roughness={0.45} />
      </mesh>

      {/* Thumb Thenar Muscle Pad */}
      <mesh position={[side * 0.026, 0.038, 0.008]} rotation={[0, 0, -side * 0.35]}>
        <capsuleGeometry args={[0.015, 0.028, 8, 12]} />
        <meshStandardMaterial color={skinColor} roughness={0.45} />
      </mesh>

      {/* Articulated Thumb (3 segments) */}
      <group
        position={[side * 0.034, 0.032, 0.008]}
        rotation={[shape.thumb.oppose * 0.5, -side * shape.thumb.oppose * 0.6, -side * shape.thumb.abduct]}
      >
        <mesh position={[0, 0.016, 0]}>
          <capsuleGeometry args={[0.011, 0.020, 8, 12]} />
          <meshStandardMaterial color={skinColor} roughness={0.45} />
        </mesh>
        <group position={[0, 0.032, 0]} rotation={[shape.thumb.curl * 0.6, 0, side * shape.thumb.curl * 0.3]}>
          <mesh position={[0, 0.014, 0]}>
            <capsuleGeometry args={[0.0095, 0.018, 8, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.45} />
          </mesh>
          <group position={[0, 0.026, 0]} rotation={[shape.thumb.curl * 0.7, 0, 0]}>
            <mesh position={[0, 0.010, 0]}>
              <capsuleGeometry args={[0.0085, 0.014, 8, 12]} />
              <meshStandardMaterial color={skinColor} roughness={0.4} />
            </mesh>
          </group>
        </group>
      </group>

      {/* 4 Articulated Fingers along top of palm */}
      {/* Index Finger */}
      <ArticulatedFinger
        position={[side * 0.027, 0.086, 0]}
        length={0.076}
        radius={0.0082}
        curl={shape.index.curl}
        spread={side * shape.index.spread}
        skinColor={skinColor}
      />

      {/* Middle Finger */}
      <ArticulatedFinger
        position={[side * 0.009, 0.090, 0]}
        length={0.084}
        radius={0.0085}
        curl={shape.middle.curl}
        spread={side * shape.middle.spread}
        skinColor={skinColor}
      />

      {/* Ring Finger */}
      <ArticulatedFinger
        position={[-side * 0.009, 0.087, 0]}
        length={0.077}
        radius={0.0080}
        curl={shape.ring.curl}
        spread={side * shape.ring.spread}
        skinColor={skinColor}
      />

      {/* Pinky Finger */}
      <ArticulatedFinger
        position={[-side * 0.026, 0.081, 0]}
        length={0.062}
        radius={0.0072}
        curl={shape.pinky.curl}
        spread={side * shape.pinky.spread}
        skinColor={skinColor}
      />
    </group>
  );
}

/**
 * Helper to orient a cylinder/capsule bone segment between two 3D points A and B
 */
function positionSegmentBetween(mesh, ptA, ptB) {
  if (!mesh) return;
  const dir = new THREE.Vector3().subVectors(ptB, ptA);
  const len = dir.length();
  const mid = new THREE.Vector3().addVectors(ptA, ptB).multiplyScalar(0.5);
  mesh.position.copy(mid);
  mesh.scale.set(1, Math.max(len, 0.001), 1);
  if (len > 0.0001) {
    const up = new THREE.Vector3(0, 1, 0);
    mesh.quaternion.setFromUnitVectors(up, dir.normalize());
  }
}

/**
 * Complete Upper-Body Interpreter Avatar matching the reference visual
 */
function SignLanguageInterpreterAvatar({ currentSign, isPlaying, speed = 1.0 }) {
  const headGroupRef = useRef();
  const upperArmRRef = useRef();
  const forearmRRef = useRef();
  const elbowSphereRRef = useRef();
  const cuffRRef = useRef();
  const handRGroupRef = useRef();

  const upperArmLRef = useRef();
  const forearmLRef = useRef();
  const elbowSphereLRef = useRef();
  const cuffLRef = useRef();
  const handLGroupRef = useRef();

  const [rightShape, setRightShape] = useState('FLAT_OPEN');
  const [leftShape, setLeftShape] = useState('FLAT_OPEN');

  // Smooth interpolated state vectors
  const animState = useMemo(() => ({
    rElbow: new THREE.Vector3(-0.38, 0.26, 0.14),
    rWrist: new THREE.Vector3(-0.18, 0.62, 0.18),
    rRot: new THREE.Euler(0.15, 0.35, -0.55),
    lElbow: new THREE.Vector3(0.35, 0.16, 0.15),
    lWrist: new THREE.Vector3(0.05, 0.33, 0.24),
    lRot: new THREE.Euler(0.25, -0.35, 0.65),
    headRot: new THREE.Euler(0, -0.05, 0)
  }), []);

  const shoulderR = useMemo(() => new THREE.Vector3(-0.23, 0.50, 0.0), []);
  const shoulderL = useMemo(() => new THREE.Vector3(0.23, 0.50, 0.0), []);

  useFrame((state, delta) => {
    const t = isPlaying ? state.clock.getElapsedTime() * speed : 0;
    const pose = getSignTargetPose(currentSign, t);
    const alpha = THREE.MathUtils.clamp(delta * 7 * speed, 0, 1);

    // Update handshapes when sign changes
    if (pose.rightArm.shape !== rightShape) setRightShape(pose.rightArm.shape);
    if (pose.leftArm.shape !== leftShape) setLeftShape(pose.leftArm.shape);

    // Interpolate 3D joint positions
    animState.rElbow.lerp(new THREE.Vector3(...pose.rightArm.elbow), alpha);
    animState.rWrist.lerp(new THREE.Vector3(...pose.rightArm.wrist), alpha);
    animState.lElbow.lerp(new THREE.Vector3(...pose.leftArm.elbow), alpha);
    animState.lWrist.lerp(new THREE.Vector3(...pose.leftArm.wrist), alpha);

    // Interpolate hand & head rotations
    animState.rRot.x = THREE.MathUtils.lerp(animState.rRot.x, pose.rightArm.rot[0], alpha);
    animState.rRot.y = THREE.MathUtils.lerp(animState.rRot.y, pose.rightArm.rot[1], alpha);
    animState.rRot.z = THREE.MathUtils.lerp(animState.rRot.z, pose.rightArm.rot[2], alpha);

    animState.lRot.x = THREE.MathUtils.lerp(animState.lRot.x, pose.leftArm.rot[0], alpha);
    animState.lRot.y = THREE.MathUtils.lerp(animState.lRot.y, pose.leftArm.rot[1], alpha);
    animState.lRot.z = THREE.MathUtils.lerp(animState.lRot.z, pose.leftArm.rot[2], alpha);

    if (headGroupRef.current) {
      headGroupRef.current.rotation.x = THREE.MathUtils.lerp(headGroupRef.current.rotation.x, pose.headRot[0], alpha);
      headGroupRef.current.rotation.y = THREE.MathUtils.lerp(headGroupRef.current.rotation.y, pose.headRot[1], alpha);
      headGroupRef.current.rotation.z = THREE.MathUtils.lerp(headGroupRef.current.rotation.z, pose.headRot[2], alpha);
    }

    // Position Right Arm segments (Shoulder -> Elbow -> Wrist)
    positionSegmentBetween(upperArmRRef.current, shoulderR, animState.rElbow);
    positionSegmentBetween(forearmRRef.current, animState.rElbow, animState.rWrist);
    if (elbowSphereRRef.current) elbowSphereRRef.current.position.copy(animState.rElbow);
    if (cuffRRef.current) {
      cuffRRef.current.position.copy(animState.rWrist);
      if (forearmRRef.current) cuffRRef.current.quaternion.copy(forearmRRef.current.quaternion);
    }
    if (handRGroupRef.current) {
      handRGroupRef.current.position.copy(animState.rWrist);
      handRGroupRef.current.rotation.copy(animState.rRot);
    }

    // Position Left Arm segments (Shoulder -> Elbow -> Wrist)
    positionSegmentBetween(upperArmLRef.current, shoulderL, animState.lElbow);
    positionSegmentBetween(forearmLRef.current, animState.lElbow, animState.lWrist);
    if (elbowSphereLRef.current) elbowSphereLRef.current.position.copy(animState.lElbow);
    if (cuffLRef.current) {
      cuffLRef.current.position.copy(animState.lWrist);
      if (forearmLRef.current) cuffLRef.current.quaternion.copy(forearmLRef.current.quaternion);
    }
    if (handLGroupRef.current) {
      handLGroupRef.current.position.copy(animState.lWrist);
      handLGroupRef.current.rotation.copy(animState.lRot);
    }
  });

  // Palette modeled after the reference image
  const skinColor = '#eab696';
  const lipColor = '#c46d5e';
  const hairColor = '#36271e';
  const sweaterColor = '#559159';
  const cuffColor = '#437847';
  const skirtColor = '#1e222a';

  return (
    <group position={[0, -0.05, 0]}>
      {/* ================= LOWER WAIST / SKIRT & BELT ================= */}
      {/* Tailored Dark Skirt / Waist */}
      <mesh position={[0, -0.15, 0]} scale={[1.0, 1.0, 0.68]}>
        <cylinderGeometry args={[0.175, 0.23, 0.30, 32]} />
        <meshStandardMaterial color={skirtColor} roughness={0.7} />
      </mesh>

      {/* Black Waist Belt */}
      <mesh position={[0, 0.0, 0]} scale={[1.02, 1.0, 0.70]}>
        <cylinderGeometry args={[0.176, 0.176, 0.036, 32]} />
        <meshStandardMaterial color="#0f1115" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Silver Rectangular Belt Buckle */}
      <mesh position={[0, 0.0, 0.123]}>
        <boxGeometry args={[0.048, 0.038, 0.012]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.0, 0.126]}>
        <boxGeometry args={[0.032, 0.022, 0.012]} />
        <meshStandardMaterial color="#0f1115" roughness={0.5} />
      </mesh>

      {/* ================= TORSO / GREEN SWEATER ================= */}
      {/* Main Torso */}
      <mesh position={[0, 0.27, 0]} scale={[1.0, 1.0, 0.68]}>
        <cylinderGeometry args={[0.215, 0.172, 0.52, 32]} />
        <meshStandardMaterial color={sweaterColor} roughness={0.55} />
      </mesh>

      {/* Upper Chest & Shoulder Line */}
      <mesh position={[0, 0.50, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1.0, 1.0, 0.75]}>
        <capsuleGeometry args={[0.068, 0.34, 16, 24]} />
        <meshStandardMaterial color={sweaterColor} roughness={0.55} />
      </mesh>

      {/* Green Mock-Turtleneck Collar */}
      <mesh position={[0, 0.57, 0.005]}>
        <cylinderGeometry args={[0.078, 0.092, 0.065, 24]} />
        <meshStandardMaterial color={cuffColor} roughness={0.5} />
      </mesh>

      {/* ================= NECK & SCULPTED HEAD ================= */}
      {/* Neck */}
      <mesh position={[0, 0.62, 0.005]}>
        <cylinderGeometry args={[0.062, 0.068, 0.10, 24]} />
        <meshStandardMaterial color={skinColor} roughness={0.45} />
      </mesh>

      {/* Articulated Head Group */}
      <group ref={headGroupRef} position={[0, 0.78, 0.015]}>
        {/* Sculpted Oval Head */}
        <mesh scale={[0.92, 1.08, 0.95]}>
          <sphereGeometry args={[0.145, 32, 32]} />
          <meshStandardMaterial color={skinColor} roughness={0.42} />
        </mesh>

        {/* Subtle Jaw / Chin Contour */}
        <mesh position={[0, -0.095, 0.035]} scale={[0.85, 0.75, 0.85]}>
          <sphereGeometry args={[0.075, 24, 24]} />
          <meshStandardMaterial color={skinColor} roughness={0.42} />
        </mesh>

        {/* Ears */}
        <mesh position={[-0.132, -0.01, -0.01]} scale={[0.35, 0.75, 0.5]}>
          <sphereGeometry args={[0.042, 16, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.45} />
        </mesh>
        <mesh position={[0.132, -0.01, -0.01]} scale={[0.35, 0.75, 0.5]}>
          <sphereGeometry args={[0.042, 16, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.45} />
        </mesh>

        {/* Sculpted Nose */}
        <mesh position={[0, -0.005, 0.138]} rotation={[-0.18, 0, 0]}>
          <capsuleGeometry args={[0.014, 0.036, 8, 12]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>

        {/* Expressive Eyes (Left & Right) */}
        {[-0.048, 0.048].map((ex, i) => (
          <group key={i} position={[ex, 0.025, 0.122]}>
            {/* White Sclera */}
            <mesh scale={[1.15, 0.82, 0.5]}>
              <sphereGeometry args={[0.022, 16, 16]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.2} />
            </mesh>
            {/* Hazel-Green Iris */}
            <mesh position={[0, 0, 0.009]} scale={[1, 1, 0.4]}>
              <sphereGeometry args={[0.012, 16, 16]} />
              <meshStandardMaterial color="#3b5e4c" roughness={0.2} />
            </mesh>
            {/* Dark Pupil */}
            <mesh position={[0, 0, 0.013]} scale={[1, 1, 0.3]}>
              <sphereGeometry args={[0.006, 12, 12]} />
              <meshStandardMaterial color="#090d16" />
            </mesh>
            {/* Eye Specular Catchlight */}
            <mesh position={[0.003, 0.003, 0.015]}>
              <sphereGeometry args={[0.0022, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Eyebrow */}
            <mesh position={[0, 0.030, 0.005]} rotation={[0, 0, i === 0 ? 0.12 : -0.12]}>
              <capsuleGeometry args={[0.0045, 0.032, 6, 10]} />
              <meshStandardMaterial color={hairColor} roughness={0.6} />
            </mesh>
          </group>
        ))}

        {/* Lips / Mouth */}
        <mesh position={[0, -0.062, 0.128]} rotation={[0, 0, Math.PI / 2]} scale={[0.7, 1.0, 0.6]}>
          <capsuleGeometry args={[0.009, 0.034, 8, 12]} />
          <meshStandardMaterial color={lipColor} roughness={0.35} />
        </mesh>

        {/* Styled Parted Short Hair (Matching reference image) */}
        {/* Main Hair Cap */}
        <mesh position={[0, 0.035, -0.012]} scale={[0.97, 1.05, 0.98]}>
          <sphereGeometry args={[0.148, 32, 32]} />
          <meshStandardMaterial color={hairColor} roughness={0.55} />
        </mesh>
        {/* Swept Side Fringe */}
        <mesh position={[-0.025, 0.105, 0.075]} rotation={[0.3, 0.2, -0.45]} scale={[1.2, 0.6, 0.8]}>
          <capsuleGeometry args={[0.042, 0.09, 12, 16]} />
          <meshStandardMaterial color={hairColor} roughness={0.5} />
        </mesh>
        {/* Side Temple Hair Taper */}
        <mesh position={[-0.125, 0.03, 0.02]} scale={[0.35, 0.8, 0.7]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color={hairColor} roughness={0.55} />
        </mesh>
        <mesh position={[0.125, 0.03, 0.02]} scale={[0.35, 0.8, 0.7]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color={hairColor} roughness={0.55} />
        </mesh>
      </group>

      {/* ================= RIGHT ARM & 5-FINGER HAND ================= */}
      {/* Upper Arm (Shoulder -> Elbow) */}
      <mesh ref={upperArmRRef}>
        <cylinderGeometry args={[0.052, 0.058, 1.0, 20]} />
        <meshStandardMaterial color={sweaterColor} roughness={0.55} />
      </mesh>
      {/* Elbow Joint Sphere */}
      <mesh ref={elbowSphereRRef}>
        <sphereGeometry args={[0.053, 16, 16]} />
        <meshStandardMaterial color={sweaterColor} roughness={0.55} />
      </mesh>
      {/* Forearm Sleeve (Elbow -> Wrist) */}
      <mesh ref={forearmRRef}>
        <cylinderGeometry args={[0.038, 0.050, 1.0, 20]} />
        <meshStandardMaterial color={sweaterColor} roughness={0.55} />
      </mesh>
      {/* Sleeve Wrist Cuff */}
      <mesh ref={cuffRRef}>
        <cylinderGeometry args={[0.041, 0.041, 0.032, 20]} />
        <meshStandardMaterial color={cuffColor} roughness={0.5} />
      </mesh>
      {/* Articulated 5-Finger Right Hand */}
      <group ref={handRGroupRef}>
        <DetailedHand isLeft={false} shapeName={rightShape} skinColor={skinColor} />
      </group>

      {/* ================= LEFT ARM & 5-FINGER HAND ================= */}
      {/* Upper Arm (Shoulder -> Elbow) */}
      <mesh ref={upperArmLRef}>
        <cylinderGeometry args={[0.052, 0.058, 1.0, 20]} />
        <meshStandardMaterial color={sweaterColor} roughness={0.55} />
      </mesh>
      {/* Elbow Joint Sphere */}
      <mesh ref={elbowSphereLRef}>
        <sphereGeometry args={[0.053, 16, 16]} />
        <meshStandardMaterial color={sweaterColor} roughness={0.55} />
      </mesh>
      {/* Forearm Sleeve (Elbow -> Wrist) */}
      <mesh ref={forearmLRef}>
        <cylinderGeometry args={[0.038, 0.050, 1.0, 20]} />
        <meshStandardMaterial color={sweaterColor} roughness={0.55} />
      </mesh>
      {/* Sleeve Wrist Cuff */}
      <mesh ref={cuffLRef}>
        <cylinderGeometry args={[0.041, 0.041, 0.032, 20]} />
        <meshStandardMaterial color={cuffColor} roughness={0.5} />
      </mesh>
      {/* Articulated 5-Finger Left Hand */}
      <group ref={handLGroupRef}>
        <DetailedHand isLeft={true} shapeName={leftShape} skinColor={skinColor} />
      </group>
    </group>
  );
}

export default function AvatarViewer({
  glossSequence = [],
  activeGlossIndex = 0,
  onGlossSelect,
  unsupportedWords = []
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [previewSign, setPreviewSign] = useState(null);
  const [studioLightBg, setStudioLightBg] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [signSearch, setSignSearch] = useState('');

  const filteredGlosses = useMemo(() => {
    return ISL_CONFIG.supportedGlosses.filter((item) => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const q = signSearch.trim().toLowerCase();
      const matchQuery =
        !q ||
        item.gloss.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [selectedCategory, signSearch]);

  // Sync index from props when new gloss sequence arrives
  useEffect(() => {
    if (glossSequence.length > 0) {
      setPreviewSign(null);
      if (activeGlossIndex >= 0 && activeGlossIndex < glossSequence.length) {
        setCurrentIdx(activeGlossIndex);
      } else {
        setCurrentIdx(0);
      }
      setIsPlaying(true);
    }
  }, [activeGlossIndex, glossSequence]);

  // Sequence playback timer
  useEffect(() => {
    if (!isPlaying || glossSequence.length === 0 || previewSign) return;

    const timer = setInterval(() => {
      setCurrentIdx((prev) => {
        if (prev + 1 >= glossSequence.length) {
          return 0;
        }
        return prev + 1;
      });
    }, 2200 / speed);

    return () => clearInterval(timer);
  }, [isPlaying, glossSequence, speed, previewSign]);

  const activeSign = previewSign
    ? previewSign
    : glossSequence.length > 0
    ? glossSequence[currentIdx]
    : 'INTERPRETER';

  const handleReplay = () => {
    setPreviewSign(null);
    setCurrentIdx(0);
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentIdx(0);
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex flex-col h-full">
      {/* Header with Active Gloss & Backdrop Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex flex-wrap items-center gap-1.5">
              <span>3D ISL Interpreter Avatar</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                500 Authored 4-Stage Clips
              </span>
              <a
                href="/models/isl_interpreter_avatar.gltf"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors"
                title="Inspect bundled GLTF 2.0 43-joint skeletal rig & embedded keyframe tracks"
              >
                GLTF 2.0 Rig (43 Joints)
              </a>
            </h3>
            <p className="text-[11px] text-slate-400">
              ISLRTC 4-Stage Keyframes (Preparation → Stroke → Hold → Retraction) & Fingerspelling
            </p>
          </div>
        </div>

        {/* Active Sign & Studio Light Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStudioLightBg(!studioLightBg)}
            className="p-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-[11px] flex items-center gap-1 transition-colors"
            title="Toggle Studio Light / Dark Backdrop"
          >
            {studioLightBg ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-sky-400" />}
            <span>{studioLightBg ? 'Studio Light' : 'Dark Mode'}</span>
          </button>

          <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-mono font-bold text-xs tracking-wider shadow-md shadow-indigo-600/30">
            {activeSign}
          </span>
        </div>
      </div>

      {/* 3D Canvas Area — Framed Waist-Up like Reference Image */}
      <div
        className={`relative flex-1 min-h-[380px] w-full rounded-2xl overflow-hidden border shadow-inner transition-colors duration-300 ${
          studioLightBg
            ? 'bg-gradient-to-b from-[#cbd5ee] via-[#d7e0f5] to-[#bcc8e6] border-slate-400/40'
            : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-slate-700/60'
        }`}
      >
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 0.46, 1.32]} fov={36} />
          <ambientLight intensity={studioLightBg ? 0.85 : 0.65} />
          <directionalLight position={[2.5, 4, 4]} intensity={1.15} castShadow />
          <directionalLight position={[-2.5, 2, 2]} intensity={0.55} color="#e0e7ff" />
          <pointLight position={[0, 1.2, 1.5]} intensity={0.35} color="#ffffff" />

          {/* 3D Articulated Sign Language Interpreter */}
          <SignLanguageInterpreterAvatar
            currentSign={activeSign}
            isPlaying={isPlaying}
            speed={speed}
          />

          <OrbitControls
            target={[0, 0.44, 0]}
            enableZoom={true}
            maxPolarAngle={Math.PI / 2 + 0.08}
            minPolarAngle={Math.PI / 3}
            minAzimuthAngle={-Math.PI / 4}
            maxAzimuthAngle={Math.PI / 4}
            maxDistance={2.2}
            minDistance={0.9}
            enablePan={false}
          />
        </Canvas>

        {/* Bottom Overlay Guide */}
        <div
          className={`absolute bottom-2.5 left-3 text-[10px] font-medium px-2.5 py-1 rounded-md backdrop-blur-xs pointer-events-none ${
            studioLightBg ? 'bg-slate-900/70 text-white' : 'bg-slate-950/70 text-slate-400'
          }`}
        >
          Drag to rotate • Scroll to zoom • 5-Finger ISL Articulation
        </div>
      </div>

      {/* Sequence Timeline Tokens (when sentence is translated) */}
      {glossSequence.length > 0 && (
        <div className="mt-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
            <span>Sentence ISL Gloss Sequence ({glossSequence.length} signs):</span>
            <span>Step {currentIdx + 1} of {glossSequence.length}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {glossSequence.map((gloss, idx) => {
              const isCurrent = !previewSign && idx === currentIdx;
              return (
                <button
                  key={`${gloss}-${idx}`}
                  type="button"
                  onClick={() => {
                    setPreviewSign(null);
                    setCurrentIdx(idx);
                    setIsPlaying(true);
                    if (onGlossSelect) onGlossSelect(idx);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white scale-105 shadow-md shadow-indigo-600/40 ring-2 ring-indigo-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {gloss}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Sign Interactive Explorer Bar */}
      <div className="mt-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Hand className="w-3.5 h-3.5 text-indigo-400" />
            <span>Interactive ISL Sign Explorer</span>
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={signSearch}
              onChange={(e) => setSignSearch(e.target.value)}
              placeholder="Search ISL signs..."
              className="bg-slate-950 border border-slate-700 rounded-md px-2 py-0.5 text-[10px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-36"
            />
            {previewSign && (
              <button
                type="button"
                onClick={() => setPreviewSign(null)}
                className="text-[10px] text-indigo-400 hover:underline font-medium"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-1.5 scrollbar-thin">
          {(ISL_CONFIG.categories || ['All']).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/90 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scrollable Grid of Filtered Signs */}
        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
          {filteredGlosses.map((item) => (
            <button
              key={item.gloss}
              type="button"
              onClick={() => {
                setPreviewSign(item.gloss);
                setIsPlaying(true);
              }}
              title={`${item.label} (${item.category})`}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all flex items-center gap-1 ${
                activeSign === item.gloss
                  ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.gloss}</span>
            </button>
          ))}
          {filteredGlosses.length === 0 && (
            <span className="text-[11px] text-slate-500 py-1">No matching ISL sign found.</span>
          )}
        </div>
      </div>

      {/* Open-Vocabulary Fingerspelling Info Banner */}
      {unsupportedWords && unsupportedWords.length > 0 && (
        <div className="mt-2.5 flex items-start gap-2 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
          <div>
            <strong>Open-Vocabulary ISL Fingerspelling Active:</strong> Words [
            <span className="font-semibold underline">{unsupportedWords.join(', ')}</span>
            ] are automatically animated using 5-Finger ISL Alphabetical Fingerspelling (<code className="text-emerald-300">SPELL:A-Z</code>).
          </div>
        </div>
      )}

      {/* Animation Playback Controls */}
      <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 px-3 rounded-xl text-white font-medium text-xs flex items-center gap-1.5 shadow-md transition-all ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
            title={isPlaying ? 'Pause animation' : 'Play animation'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            type="button"
            onClick={handleReplay}
            className="p-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Replay sequence from beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay</span>
          </button>

          <button
            type="button"
            onClick={handleStop}
            className="p-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Stop animation"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Stop</span>
          </button>
        </div>

        {/* Speed Multiplier Controls */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700 text-xs">
          <Gauge className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
          {[0.5, 1.0, 1.5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                speed === s
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
