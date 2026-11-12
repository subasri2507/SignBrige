import { useState, useRef, useEffect, useCallback } from 'react';

const DEFAULT_CONSTRAINTS = {
  width: { ideal: 640 },
  height: { ideal: 480 },
  facingMode: 'user'
};

export const useWebcam = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const attachStreamToVideo = useCallback(async (videoEl, stream) => {
    if (!videoEl || !stream) return;
    try {
      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
      await videoEl.play();
    } catch (playErr) {
      // Autoplay might wait for loadedmetadata on some browsers
      videoEl.onloadedmetadata = () => {
        videoEl.play().catch(() => {});
      };
    }
  }, []);

  const startCamera = useCallback(async (customConstraints) => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam mediaDevices API not supported in this browser environment.');
      }

      // Stop any existing tracks before starting a fresh stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Guard against React SyntheticEvent being passed when used directly as onClick={startCamera}
      const isValidConstraints =
        customConstraints &&
        typeof customConstraints === 'object' &&
        !customConstraints.nativeEvent &&
        !customConstraints.target &&
        !customConstraints.preventDefault;

      const videoConstraints = isValidConstraints ? customConstraints : DEFAULT_CONSTRAINTS;

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false
        });
      } catch (constraintErr) {
        // Fallback to basic video: true if specific resolution/facingMode constraint fails on desktop webcam
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;
      setIsActive(true);
      setPermissionGranted(true);

      if (videoRef.current) {
        await attachStreamToVideo(videoRef.current, stream);
      }
    } catch (err) {
      console.error('[Webcam] Access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Please allow camera access in your browser to recognize signs.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera device found on this system. Please connect a webcam.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is currently in use by another application or tab. Close other camera apps and try again.');
      } else {
        setError(`Unable to start camera: ${err.message}`);
      }
      setIsActive(false);
    }
  }, [attachStreamToVideo]);

  // Ensure stream is attached even if the <video> element mounts after setIsActive(true)
  useEffect(() => {
    if (isActive && videoRef.current && streamRef.current) {
      attachStreamToVideo(videoRef.current, streamRef.current);
    }
  }, [isActive, attachStreamToVideo]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !isActive) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // Mirror for natural signing feel
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.85);
  }, [isActive]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isActive,
    error,
    permissionGranted,
    startCamera,
    stopCamera,
    captureFrame
  };
};
