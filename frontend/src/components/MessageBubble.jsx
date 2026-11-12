import React, { useState } from 'react';
import { Volume2, VolumeX, Trash2, User, Eye } from 'lucide-react';
import { api } from '../services/api';
import { getBcp47Tag } from '../config/islConfig';

export default function MessageBubble({ message, onDelete }) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const isHearing = message.sender_type === 'hearing';
  const isVoiceToSign = message.direction === 'voice_to_sign';

  const handlePlayTTS = async () => {
    const textToSpeak = message.translated_text || message.original_text;
    if (!textToSpeak) return;

    setIsPlayingAudio(true);
    try {
      // 1. First attempt browser speech synthesis (immediate and reliable)
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const langCode = message.spoken_language || 'en';
        utterance.lang = getBcp47Tag(langCode);
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      } else {
        // 2. Fallback to backend audio API
        const res = await api.synthesizeSpeech(textToSpeak, message.spoken_language || 'en');
        if (res.audio_base64) {
          const audio = new Audio(res.audio_base64);
          audio.onended = () => setIsPlayingAudio(false);
          audio.onerror = () => setIsPlayingAudio(false);
          await audio.play();
        } else {
          setIsPlayingAudio(false);
        }
      }
    } catch (e) {
      console.error('[TTS Playback] Error:', e);
      setIsPlayingAudio(false);
    }
  };

  const formattedTime = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex flex-col mb-4 ${isHearing ? 'items-start' : 'items-end'}`}>
      {/* Sender Header Badge */}
      <div className="flex items-center gap-2 mb-1 px-1 text-xs">
        <span className={`inline-flex items-center gap-1 font-semibold ${isHearing ? 'text-indigo-400' : 'text-emerald-400'}`}>
          {isHearing ? <User className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{isHearing ? 'Hearing Person (Voice)' : 'Deaf / Non-Speaking Person (ISL)'}</span>
        </span>
        <span className="text-[10px] text-slate-500">{formattedTime}</span>
      </div>

      {/* Bubble Container */}
      <div
        className={`max-w-xl rounded-2xl p-4 shadow-lg border transition-all ${
          isHearing
            ? 'bg-slate-800/90 border-indigo-500/30 text-slate-100 rounded-tl-sm'
            : 'bg-slate-800/90 border-emerald-500/30 text-slate-100 rounded-tr-sm'
        }`}
      >
        {/* Main Content */}
        <div className="text-sm font-medium leading-relaxed mb-2">
          {message.original_text}
        </div>

        {/* Translation if exists */}
        {message.translated_text && message.translated_text !== message.original_text && (
          <div className="text-xs text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-700/60 mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Translation:</span>
            {message.translated_text}
          </div>
        )}

        {/* ISL Gloss Tag */}
        {message.recognized_gloss && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">ISL Gloss:</span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold">
              {message.recognized_gloss}
            </span>
          </div>
        )}

        {/* Footer info & Controls */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-700/50 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[10px]">
              Lang: {message.spoken_language ? message.spoken_language.toUpperCase() : 'EN'}
            </span>
            {message.confidence !== null && message.confidence !== undefined && (
              <span className="text-emerald-400 font-medium">
                Conf: {Math.round(message.confidence * 100)}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Speak Button */}
            <button
              type="button"
              onClick={handlePlayTTS}
              className={`p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors ${
                isPlayingAudio ? 'text-indigo-400 animate-pulse' : ''
              }`}
              title="Speak message aloud"
            >
              {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Delete button */}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(message.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                title="Delete message"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
