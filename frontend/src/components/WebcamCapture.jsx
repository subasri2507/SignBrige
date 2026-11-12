import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertCircle, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import { ISL_CONFIG } from '../config/islConfig';

export default function WebcamCapture({
  videoRef,
  isActive,
  onStart,
  onStop,
  onCaptureFrame,
  error,
  isRecognizing = false,
  autoScan = true,
  onToggleAutoScan,
  onSimulateSign
}) {
  const overlayCanvasRef = useRef(null);
  const [fps, setFps] = useState(0);
  const [simCategory, setSimCategory] = useState('All');
  const [simSearch, setSimSearch] = useState('');

  const filteredSimGlosses = ISL_CONFIG.supportedGlosses.filter((item) => {
    const matchCat = simCategory === 'All' || item.category === simCategory;
    const q = simSearch.trim().toLowerCase();
    const matchQ =
      !q ||
      item.gloss.toLowerCase().includes(q) ||
      item.label.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  // Simple bounding box / landmark scanning animation overlay on canvas
  useEffect(() => {
    let animId;
    let lastTime = performance.now();
    let frameCount = 0;

    const drawScan = (time) => {
      frameCount++;
      if (time - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = time;
      }

      const canvas = overlayCanvasRef.current;
      if (canvas && isActive) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw guide box for upper body and hands
        ctx.strokeStyle = isRecognizing ? '#10b981' : '#6366f1';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);

        // Signing zone guide (center chest & hands area)
        const w = canvas.width;
        const h = canvas.height;
        ctx.strokeRect(w * 0.15, h * 0.15, w * 0.70, h * 0.75);

        // Corner markers
        ctx.setLineDash([]);
        ctx.fillStyle = isRecognizing ? '#10b981' : '#0ea5e9';
        const corners = [
          [w * 0.15, h * 0.15],
          [w * 0.85, h * 0.15],
          [w * 0.15, h * 0.90],
          [w * 0.85, h * 0.90]
        ];
        corners.forEach(([cx, cy]) => {
          ctx.beginPath();
          ctx.arc(cx, cy, 5, 0, Math.PI * 2);
          ctx.fill();
        });

        // Landmark scan sweep line
        if (autoScan) {
          const scanY = ((time % 2000) / 2000) * (h * 0.75) + (h * 0.15);
          const gradient = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
          gradient.addColorStop(0, 'rgba(14, 165, 233, 0)');
          gradient.addColorStop(0.5, 'rgba(14, 165, 233, 0.4)');
          gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(w * 0.15, scanY - 10, w * 0.70, 20);
        }
      }
      animId = requestAnimationFrame(drawScan);
    };

    if (isActive) {
      animId = requestAnimationFrame(drawScan);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isActive, isRecognizing, autoScan]);

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      {/* Video Stream Container */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-700/60 shadow-inner flex items-center justify-center">
        {/* Video feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${
            isActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Canvas for scanning visualizer */}
        <canvas
          ref={overlayCanvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Inactive Standby Screen */}
        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/80 backdrop-blur-xs">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-4 shadow-lg">
              <CameraOff className="w-8 h-8" />
            </div>
            <h4 className="text-base font-semibold text-slate-200 mb-1">Webcam Inactive</h4>
            <p className="text-xs text-slate-400 max-w-sm mb-5">
              Start your camera to enable real-time Indian Sign Language (ISL) recognition. Hand and pose landmarks are processed securely.
            </p>
            <button
              type="button"
              onClick={onStart}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera</span>
            </button>
          </div>
        )}

        {/* Live HUD Badges */}
        {isActive && (
          <>
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-emerald-400 text-[11px] font-semibold backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>LIVE FEED ({fps} FPS)</span>
              </span>
              {isRecognizing && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-600/90 text-white text-[11px] font-semibold animate-pulse">
                  <Zap className="w-3 h-3" />
                  <span>MediaPipe Analyzing...</span>
                </span>
              )}
            </div>

            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 text-[10px] font-medium backdrop-blur-md">
                Indian Sign Language (ISL)
              </span>
            </div>
          </>
        )}
      </div>

      {/* Camera Error Message */}
      {error && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Buttons */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isActive ? (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <CameraOff className="w-4 h-4" />
              <span>Stop Camera</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStart}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera</span>
            </button>
          )}

          {isActive && (
            <button
              type="button"
              onClick={onCaptureFrame}
              disabled={isRecognizing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition-all"
              title="Capture instantaneous frame"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRecognizing ? 'animate-spin' : ''}`} />
              <span>Snapshot Recognize</span>
            </button>
          )}
        </div>

        {/* Auto Continuous Recognition Toggle */}
        {isActive && onToggleAutoScan && (
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={autoScan}
              onChange={onToggleAutoScan}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>Continuous Recognition (1.5s interval)</span>
          </label>
        )}
      </div>

      {/* Quick ISL Sign Selector */}
      {onSimulateSign && (
        <div className="mt-4 pt-3 border-t border-slate-700/60">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Quick ISL Sign Selector:</span>
            </span>
            <input
              type="text"
              value={simSearch}
              onChange={(e) => setSimSearch(e.target.value)}
              placeholder="Search signs..."
              className="bg-slate-950 border border-slate-700 rounded-md px-2 py-0.5 text-[10px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-36"
            />
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-2">
            {(ISL_CONFIG.categories || ['All']).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSimCategory(cat)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
                  simCategory === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {filteredSimGlosses.map((item) => (
              <button
                key={item.gloss}
                type="button"
                onClick={() => onSimulateSign(item.gloss)}
                className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-indigo-950 border border-slate-700/80 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-300 text-[11px] font-medium transition-all"
              >
                <span>{item.icon}</span> {item.label.split('/')[0].trim()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
