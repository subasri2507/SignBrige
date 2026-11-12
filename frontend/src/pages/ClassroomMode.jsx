import React, { useState, useEffect, useRef, useCallback } from 'react';
import AvatarViewer from '../components/AvatarViewer';
import MessageBubble from '../components/MessageBubble';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useWebcam } from '../hooks/useWebcam';
import { api } from '../services/api';
import { ISL_CONFIG, getBcp47Tag, getLanguageLabel } from '../config/islConfig';
import { 
  Mic, 
  Camera, 
  CameraOff,
  Send, 
  Sparkles, 
  Trash2, 
  AlertCircle
} from 'lucide-react';

export default function ClassroomMode() {
  const [activeConvId] = useState(1);
  const [messages, setMessages] = useState([]);
  const [hearingLang, setHearingLang] = useState('en');
  
  // Avatar state for the Deaf panel
  const [avatarGlosses, setAvatarGlosses] = useState(['NAMASTE']);
  const [activeAvatarIndex, setActiveAvatarIndex] = useState(0);

  // Hearing Person speech state
  const {
    isListening: isHearingListening,
    transcript: hearingTranscript,
    interimTranscript: hearingInterim,
    startListening: startHearingMic,
    stopListening: stopHearingMic,
    resetTranscript: resetHearingTranscript,
    setTranscript: setHearingTranscript
  } = useSpeechRecognition(hearingLang);

  // Deaf Person webcam state
  const {
    videoRef,
    isActive: isCameraActive,
    error: cameraError,
    startCamera,
    stopCamera,
    captureFrame
  } = useWebcam();

  const [isRecognizingSign, setIsRecognizingSign] = useState(false);
  const [recognizedSign, setRecognizedSign] = useState(null);
  const [autoRecognize, setAutoRecognize] = useState(true);
  const isRecognizingRef = useRef(false);
  const lastSentGlossRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Load existing messages
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.getConversationMessages(activeConvId);
        if (res.success && res.messages) {
          setMessages(res.messages);
        }
      } catch (err) {
        // Fallback default demonstration messages
        setMessages([
          {
            id: 1,
            sender_type: 'hearing',
            direction: 'voice_to_sign',
            original_text: 'Hello, welcome to class!',
            translated_text: 'Hello, welcome to class!',
            recognized_gloss: 'HELLO WELCOME CLASSROOM',
            spoken_language: 'en',
            created_at: new Date(Date.now() - 60000).toISOString()
          },
          {
            id: 2,
            sender_type: 'deaf',
            direction: 'sign_to_speech',
            original_text: 'NAMASTE',
            translated_text: 'Namaste, greetings to you.',
            recognized_gloss: 'NAMASTE',
            spoken_language: 'en',
            confidence: 0.94,
            created_at: new Date().toISOString()
          }
        ]);
      }
    };
    fetchSession();
  }, [activeConvId]);

  // Scroll to bottom when message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Hearing Person: Send Voice Message -> Translate -> Avatar Signs on Deaf Panel
  const handleSendHearingMessage = async () => {
    if (!hearingTranscript.trim()) return;
    const text = hearingTranscript.trim();

    try {
      // 1. Process voice to sign pipeline
      const data = await api.voiceToSign(text, hearingLang);
      const fullSeq = data.full_sign_sequence && data.full_sign_sequence.length > 0
        ? data.full_sign_sequence
        : (data.supported_glosses && data.supported_glosses.length > 0 ? data.supported_glosses : ['HELLO']);

      // Update avatar on Deaf side immediately
      setAvatarGlosses(fullSeq);
      setActiveAvatarIndex(0);

      // 2. Persist to message stream
      const newMsg = {
        sender_type: 'hearing',
        direction: 'voice_to_sign',
        original_text: text,
        translated_text: data.translated_text || text,
        recognized_gloss: fullSeq.join(' '),
        spoken_language: hearingLang,
        confidence: 1.0,
        created_at: new Date().toISOString()
      };

      setMessages((prev) => [...prev, newMsg]);
      resetHearingTranscript();

      // Persist to backend database
      api.addMessage(activeConvId, newMsg).catch(() => {});
    } catch (err) {
      console.error('Hearing send error:', err);
    }
  };

  // Deaf Person: Recognize ISL sign from camera or quick test -> Send to Hearing Panel
  const handleSignRecognized = useCallback(async (gloss, confScore = 0.92) => {
    try {
      setRecognizedSign(gloss);
      // Generate spoken translation & sentence
      const speechRes = await api.signToSpeech([gloss], hearingLang);
      const textOutput = speechRes.generated_text || gloss;

      const newMsg = {
        sender_type: 'deaf',
        direction: 'sign_to_speech',
        original_text: gloss,
        translated_text: textOutput,
        recognized_gloss: gloss,
        spoken_language: hearingLang,
        confidence: confScore,
        created_at: new Date().toISOString()
      };

      setMessages((prev) => [...prev, newMsg]);

      // Speak aloud for the hearing person automatically
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textOutput);
        utterance.lang = getBcp47Tag(hearingLang);
        window.speechSynthesis.speak(utterance);
      }

      // Persist to backend
      api.addMessage(activeConvId, newMsg).catch(() => {});
    } catch (err) {
      console.error('Sign send error:', err);
    }
  }, [activeConvId, hearingLang]);

  // Capture frame from webcam and run ISL sign recognition
  const handleWebcamSnapshot = useCallback(async (isManualClick = false) => {
    if (!isCameraActive || isRecognizingRef.current) return;
    const frame = captureFrame();
    if (!frame) return;

    isRecognizingRef.current = true;
    setIsRecognizingSign(true);
    try {
      const res = await api.recognizeSign({ frame });
      if (res.success && res.gloss && res.gloss !== 'UNKNOWN') {
        setRecognizedSign(res.gloss);
        // Send if manual click OR if it's a new sign in continuous mode
        if (isManualClick || lastSentGlossRef.current !== res.gloss) {
          lastSentGlossRef.current = res.gloss;
          await handleSignRecognized(res.gloss, res.confidence || 0.92);
        }
      }
    } catch (err) {
      console.warn('Recognition error:', err);
    } finally {
      isRecognizingRef.current = false;
      setIsRecognizingSign(false);
    }
  }, [isCameraActive, captureFrame, handleSignRecognized]);

  // Continuous auto-recognition interval when camera is active
  useEffect(() => {
    if (!isCameraActive || !autoRecognize) return;
    const timer = setInterval(() => {
      handleWebcamSnapshot(false);
    }, 1800);
    return () => clearInterval(timer);
  }, [isCameraActive, autoRecognize, handleWebcamSnapshot]);

  const handleClearSession = async () => {
    setMessages([]);
    lastSentGlossRef.current = null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header with Title and Clear Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded border border-sky-500/20">
            Interactive Classroom / Two-Way Communication
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Two-Way Classroom Demonstration
          </h1>
          <p className="text-xs text-slate-400">
            Split-Screen Architecture: Hearing Person (Left) ↔ Deaf / Non-Speaking Person (Right)
          </p>
        </div>

        <button
          type="button"
          onClick={handleClearSession}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold self-start sm:self-auto border border-slate-700"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Clear Classroom Screen</span>
        </button>
      </div>

      {/* Main Two-Panel Split View */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        
        {/* ================= LEFT PANEL: HEARING PERSON ================= */}
        <div className="bg-slate-800/80 border border-indigo-500/30 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Left Panel: Hearing Person</h2>
                <p className="text-[10px] text-slate-400">Speaks into microphone → Transcribed & Sent to Deaf Student</p>
              </div>
            </div>

            {/* Language Selector (9 Spoken Languages) */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
              {ISL_CONFIG.spokenLanguages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setHearingLang(l.code)}
                  title={`${l.name} (${l.nativeName})`}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    hearingLang === l.code ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>

          {/* Speech Recording Bar */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center gap-3">
            <button
              type="button"
              onClick={isHearingListening ? stopHearingMic : startHearingMic}
              className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition-all shadow-md ${
                isHearingListening ? 'bg-rose-500 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-200">
                {isHearingListening ? 'Listening live speech...' : 'Microphone Ready'}
              </div>
              <p className="text-[10px] text-slate-400">
                Speak in {getLanguageLabel(hearingLang)} or type below
              </p>
            </div>
          </div>

          {/* Text Input / Transcription box */}
          <div className="relative">
            <textarea
              rows={2}
              value={hearingTranscript}
              onChange={(e) => setHearingTranscript(e.target.value)}
              placeholder="e.g. Hello, how can I help you today? / எனக்கு உதவி தேவை..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
            {hearingInterim && (
              <div className="text-[10px] italic text-indigo-400 mt-1">
                {hearingInterim}...
              </div>
            )}
          </div>

          {/* Send Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSendHearingMessage}
              disabled={!hearingTranscript.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message (Animate Avatar)</span>
            </button>
          </div>

          {/* Hearing Person's incoming messages history */}
          <div className="pt-3 border-t border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
              Classroom Dialogue Feed:
            </span>
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {messages.map((m, idx) => (
                <MessageBubble key={m.id || idx} message={m} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* ================= RIGHT PANEL: DEAF / NON-SPEAKING PERSON ================= */}
        <div className="bg-slate-800/80 border border-emerald-500/30 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Right Panel: Deaf / Non-Speaking Person</h2>
                <p className="text-[10px] text-slate-400">Views 3D Avatar Translation & Replies with ISL Webcam</p>
              </div>
            </div>

            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
              ISL Receiver & Responder
            </span>
          </div>

          {/* 3D Avatar Display for the Deaf Person */}
          <div>
            <AvatarViewer
              glossSequence={avatarGlosses}
              activeGlossIndex={activeAvatarIndex}
              onGlossSelect={setActiveAvatarIndex}
            />
          </div>

          {/* Webcam Response Area */}
          <div className="pt-2 border-t border-slate-700/60">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Webcam ISL Sign Responder</span>
                {recognizedSign && (
                  <span className="ml-1 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px]">
                    Last Sign: {recognizedSign}
                  </span>
                )}
              </span>

              <div className="flex items-center gap-2">
                {isCameraActive && (
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRecognize}
                      onChange={(e) => setAutoRecognize(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0"
                    />
                    <span>Auto-Scan (1.8s)</span>
                  </label>
                )}

                {isCameraActive ? (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-2.5 py-1 rounded bg-rose-600/90 hover:bg-rose-500 text-white text-[11px] font-medium flex items-center gap-1"
                  >
                    <CameraOff className="w-3 h-3" />
                    <span>Stop Camera</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Turn On Camera</span>
                  </button>
                )}
              </div>
            </div>

            {/* Always-mounted Video Container so videoRef.current is immediately bound on startCamera() */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 mb-3 border border-slate-700 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${
                  isCameraActive ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Active Camera Overlay Guides & Controls */}
              {isCameraActive && (
                <>
                  {/* Signing Zone Guide Box */}
                  <div className="absolute inset-6 border-2 border-dashed border-indigo-400/60 rounded-xl pointer-events-none" />

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-emerald-400 text-[10px] font-semibold backdrop-blur-md">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>LIVE FEED</span>
                    </span>
                    {isRecognizingSign && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-600/90 text-white text-[10px] font-semibold animate-pulse">
                        Recognizing ISL...
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleWebcamSnapshot(true)}
                    disabled={isRecognizingSign}
                    className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isRecognizingSign ? 'Recognizing...' : 'Recognize & Send Sign'}</span>
                  </button>
                </>
              )}

              {/* Inactive Standby Overlay */}
              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950/90">
                  <CameraOff className="w-7 h-7 text-slate-500 mb-2" />
                  <p className="text-xs font-semibold text-slate-300 mb-1">Classroom Responder Camera Inactive</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mb-3">
                    Turn on your webcam to sign ISL responses directly to the Hearing panel, or use the quick ISL response buttons below.
                  </p>
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Start Responder Camera</span>
                  </button>
                </div>
              )}
            </div>

            {/* Camera Error Alert */}
            {cameraError && (
              <div className="mb-3 flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Quick Demo ISL Responses */}
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                Quick ISL Response Actions (One-Click Sign & Speak):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {ISL_CONFIG.supportedGlosses.map((item) => (
                  <button
                    key={item.gloss}
                    type="button"
                    onClick={() => handleSignRecognized(item.gloss, 0.96)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-950 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 text-[10px] font-medium transition-all"
                  >
                    {item.icon} {item.gloss}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
