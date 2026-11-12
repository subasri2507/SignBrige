import React, { useState } from 'react';
import { Mic, MicOff, AlertCircle, Globe, Send, RotateCcw, Sparkles } from 'lucide-react';
import { ISL_CONFIG } from '../config/islConfig';

const SAMPLE_PHRASES = {
  en: [
    "Good morning teacher I want to study book",
    "I need doctor help at hospital",
    "Welcome friend how are you today",
    "Mother and father love family"
  ],
  ta: [
    "வணக்கம் ஆசிரியர் எனக்கு புத்தகம் படிக்க வேண்டும்",
    "எனக்கு மருத்துவர் உதவி வேண்டும்",
    "காலை வணக்கம் நண்பன்",
    "எனக்கு தண்ணீர் மற்றும் உணவு வேண்டும்"
  ],
  hi: [
    "नमस्ते शिक्षक मुझे किताब पढ़ना है",
    "मुझे अस्पताल में डॉक्टर की मदद चाहिए",
    "सुप्रभात दोस्त आज आप कैसे हैं",
    "मुझे पानी और भोजन चाहिए"
  ],
  te: [
    "నమస్కారం ఉపాధ్యాయుడు నాకు పుస్తకం చదవడం కావాలి",
    "నాకు డాక్టర్ సహాయం కావాలి",
    "శుభోదయం స్నేహితుడు"
  ],
  ml: [
    "നമസ്കാരം അധ്യാപകൻ എനിക്ക് പുസ്തകം പഠിക്കാൻ വേണം",
    "എനിക്ക് ഡോക്ടർ സഹായം വേണം",
    "സുപ്രഭാതം സുഹൃത്ത്"
  ],
  kn: [
    "ನಮಸ್ಕಾರ ಶಿಕ್ಷಕ ನನಗೆ ಪುಸ್ತಕ ಓದಲು ಬೇಕು",
    "ನನಗೆ ವೈದ್ಯರ ಸಹಾಯ ಬೇಕು",
    "ಶುಭೋದಯ ಸ್ನೇಹಿತ"
  ],
  mr: [
    "नमस्कार शिक्षक मला पुस्तक वाचायचे आहे",
    "मला डॉक्टर मदत हवी आहे",
    "सुप्रभात मित्र"
  ],
  bn: [
    "নমস্কার শিক্ষক আমি বই পড়তে চাই",
    "আমার ডাক্তার সাহায্য দরকার",
    "সুপ্রভাত বন্ধু"
  ],
  gu: [
    "નમસ્તે શિક્ષક મારે પુસ્તક વાંચવું છે",
    "મારે ડૉક્ટર મદદ જોઈએ છે",
    "સુપ્રભાત મિત્ર"
  ]
};

export default function SpeechInput({
  language,
  onLanguageChange,
  isListening,
  onStartListening,
  onStopListening,
  transcript,
  onTranscriptChange,
  interimTranscript,
  onSubmit,
  error,
  isProcessing = false
}) {
  const [signDialect, setSignDialect] = useState('ISL');
  const currentLangObj = ISL_CONFIG.spokenLanguages.find((l) => l.code === language) || ISL_CONFIG.spokenLanguages[0];
  const samples = SAMPLE_PHRASES[language] || SAMPLE_PHRASES.en;

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      {/* Header with 9-Language Selector */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Spoken Language ({ISL_CONFIG.spokenLanguages.length} Supported Languages)
            </span>
          </div>

          {/* Sign Language / ISL Regional Dialect Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-medium">Sign Mode:</span>
            <select
              value={signDialect}
              onChange={(e) => setSignDialect(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500"
            >
              {ISL_CONFIG.signLanguages.map((sl) => (
                <option key={sl.code} value={sl.code}>
                  {sl.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 9 Spoken Languages Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5 gap-1.5 bg-slate-900/90 p-2 rounded-xl border border-slate-700">
          {ISL_CONFIG.spokenLanguages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => onLanguageChange(lang.code)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
                <span className="text-[10px] opacity-75 hidden sm:inline">({lang.nativeName})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mic Trigger & Waveform Display */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 mb-4">
        <button
          type="button"
          onClick={isListening ? onStopListening : onStartListening}
          disabled={isProcessing}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg shrink-0 ${
            isListening
              ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-rose-500/40'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:scale-105'
          }`}
          title={isListening ? 'Click to stop microphone' : 'Click to start microphone'}
        >
          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <span className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : 'bg-slate-600'}`}></span>
            <span className="text-xs font-medium text-slate-300">
              {isListening
                ? `Listening live speech in ${currentLangObj.name} (${currentLangObj.nativeName})...`
                : `Microphone Ready — ${currentLangObj.name} (${currentLangObj.nativeName})`}
            </span>
          </div>

          {/* Sound wave visualizer bars */}
          {isListening ? (
            <div className="flex items-center justify-center sm:justify-start gap-1 h-6">
              {[40, 70, 100, 60, 90, 45, 80, 55, 95, 50, 75, 30].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-indigo-400 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${(i * 0.1).toFixed(1)}s`,
                    animationDuration: '0.6s'
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Click the microphone to speak in {currentLangObj.name}, or click a sample sentence below.
            </p>
          )}
        </div>

        {transcript && (
          <button
            type="button"
            onClick={() => onTranscriptChange('')}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
            title="Clear transcript"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Quick Multilingual Demo Sentences */}
      <div className="mb-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Try Sample {currentLangObj.name} Sentences:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {samples.map((phrase, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onTranscriptChange(phrase)}
              className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-700/80 border border-slate-700/70 text-[11px] text-slate-300 transition-colors text-left"
            >
              "{phrase}"
            </button>
          ))}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Textarea for Live Transcription or Manual Entry */}
      <div className="relative">
        <textarea
          rows={3}
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          placeholder={`Speak or type in ${currentLangObj.name} (${currentLangObj.nativeName})...`}
          className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
        />

        {interimTranscript && (
          <div className="absolute bottom-4 left-4 text-xs italic text-indigo-400 pointer-events-none">
            {interimTranscript}...
          </div>
        )}
      </div>

      {/* Action submit button */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-slate-400">
          Active Sign System:{' '}
          <strong className="text-indigo-400">
            {ISL_CONFIG.signLanguages.find((s) => s.code === signDialect)?.shortName || 'ISL (National)'}
          </strong>{' '}
          • <span className="text-emerald-400">Ready to Sign</span>
        </span>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!transcript.trim() || isProcessing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
        >
          {isProcessing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Processing ISL...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Translate to Sign</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
