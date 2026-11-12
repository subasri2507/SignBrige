import React from 'react';
import { Languages, Layers, AlertTriangle } from 'lucide-react';

export default function SubtitleDisplay({
  originalText,
  translatedText,
  spokenLanguage = 'en',
  glossSequence = [],
  unsupportedWords = [],
  warningMessage
}) {
  if (!originalText && (!glossSequence || glossSequence.length === 0)) {
    return null;
  }

  const getLanguageLabel = (code) => {
    switch (code) {
      case 'ta': return 'Tamil (தமிழ்)';
      case 'hi': return 'Hindi (हिन्दी)';
      case 'en':
      default: return 'English';
    }
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-lg space-y-3">
      {/* Original Spoken Text */}
      {originalText && (
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Languages className="w-3.5 h-3.5 text-indigo-400" />
            <span>Spoken Input ({getLanguageLabel(spokenLanguage)}):</span>
          </div>
          <div className="text-sm font-medium text-slate-100 bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
            "{originalText}"
          </div>
        </div>
      )}

      {/* Translated Text if different from original */}
      {translatedText && translatedText !== originalText && (
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Languages className="w-3.5 h-3.5 text-sky-400" />
            <span>Semantic Translation (English Interlingua for ISL):</span>
          </div>
          <div className="text-sm font-medium text-sky-200 bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
            "{translatedText}"
          </div>
        </div>
      )}

      {/* ISL Gloss Sequence Representation */}
      {glossSequence && glossSequence.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>ISL Gloss Syntax Representation:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-900/90 border border-slate-700/60">
            {glossSequence.map((gloss, idx) => {
              const isUnsupported = gloss.startsWith('[') || (unsupportedWords && unsupportedWords.includes(gloss.toLowerCase()));
              return (
                <span
                  key={idx}
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold tracking-wide ${
                    isUnsupported
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                  title={isUnsupported ? 'Unsupported in Phase 1 ISL dictionary' : 'Supported ISL Sign'}
                >
                  {gloss}
                  {idx < glossSequence.length - 1 && (
                    <span className="ml-2 text-slate-500 font-sans font-normal">→</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Warning Message regarding vocabulary limit */}
      {warningMessage && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <span>{warningMessage}</span>
        </div>
      )}
    </div>
  );
}
