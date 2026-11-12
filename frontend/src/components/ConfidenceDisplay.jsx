import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

export default function ConfidenceDisplay({
  confidence = 0,
  gloss = 'UNKNOWN',
  alternatives = [],
  onSelectAlternative,
  engine = 'landmark_baseline'
}) {
  const scorePercent = Math.round(confidence * 100);

  let level = 'LOW';
  let badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  let barColor = 'bg-rose-500';
  let Icon = AlertCircle;
  let guidance = 'Low recognition confidence. Please repeat the sign clearly.';

  if (confidence >= 0.75) {
    level = 'HIGH';
    badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    barColor = 'bg-emerald-500';
    Icon = CheckCircle2;
    guidance = 'High confidence ISL match. Recognition accepted.';
  } else if (confidence >= 0.50) {
    level = 'MEDIUM';
    badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    barColor = 'bg-amber-500';
    Icon = AlertTriangle;
    guidance = 'Moderate confidence match. Please verify or choose an alternative.';
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg space-y-3">
      {/* Header and Level Badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          ISL Recognition Confidence
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
            {engine === 'cnn_lstm' ? 'Deep CNN-LSTM' : 'Geometric Landmark Baseline'}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeClass}`}>
            <Icon className="w-3.5 h-3.5" />
            <span>{level} ({scorePercent}%)</span>
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-700/60">
        <div
          className={`h-full ${barColor} transition-all duration-500 rounded-full`}
          style={{ width: `${scorePercent}%` }}
        />
      </div>

      {/* Guidance Message */}
      <p className="text-xs text-slate-400">
        {guidance}
      </p>

      {/* Alternatives Selection (for medium confidence) */}
      {alternatives && alternatives.length > 0 && (
        <div className="pt-2 border-t border-slate-700/60">
          <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
            Alternative Possibilities:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {alternatives.map((alt) => (
              <button
                key={alt}
                type="button"
                onClick={() => onSelectAlternative && onSelectAlternative(alt)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-medium text-slate-300 transition-colors"
              >
                {alt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
