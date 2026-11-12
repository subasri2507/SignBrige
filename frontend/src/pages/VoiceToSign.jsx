import React, { useState } from 'react';
import SpeechInput from '../components/SpeechInput';
import AvatarViewer from '../components/AvatarViewer';
import SubtitleDisplay from '../components/SubtitleDisplay';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { api } from '../services/api';
import { Bookmark, CheckCircle, AlertCircle } from 'lucide-react';

export default function VoiceToSign() {
  const [language, setLanguage] = useState('en');
  const [pipelineData, setPipelineData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const {
    isListening,
    transcript,
    interimTranscript,
    error: micError,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript
  } = useSpeechRecognition(language);

  // Execute Voice-to-Sign Workflow
  const handleProcessVoiceToSign = async () => {
    if (!transcript.trim()) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const data = await api.voiceToSign(transcript.trim(), language);
      if (data.success) {
        setPipelineData(data);
      } else {
        setErrorMsg(data.error || 'Failed to process voice to sign.');
      }
    } catch (err) {
      console.error('[VoiceToSign] Error:', err);
      setErrorMsg(err.response?.data?.error || err.message || 'API processing error.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Save to database
  const handleSaveConversation = async () => {
    if (!pipelineData) return;
    try {
      // Create session or append
      const convRes = await api.createConversation(`Voice Session: "${transcript.slice(0, 30)}..."`);
      if (convRes.success && convRes.conversation) {
        await api.addMessage(convRes.conversation.id, {
          sender_type: 'hearing',
          direction: 'voice_to_sign',
          original_text: pipelineData.input_text,
          translated_text: pipelineData.translated_text,
          recognized_gloss: pipelineData.supported_glosses?.join(' '),
          spoken_language: pipelineData.spoken_language,
          confidence: 1.0
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save message:', err);
      setErrorMsg('Failed to save conversation to database.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
            Hearing Person → Deaf / Non-Speaking Person
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Voice-to-Sign Communication
          </h1>
          <p className="text-xs text-slate-400">
            Speak in any of 9 supported languages and watch the 3D interpreter sign your message in Indian Sign Language
          </p>
        </div>

        {pipelineData && (
          <button
            type="button"
            onClick={handleSaveConversation}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all self-start sm:self-auto"
          >
            {saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Saved to Database!</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 text-indigo-400" />
                <span>Save to History</span>
              </>
            )}
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Speech Input & Subtitles (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <SpeechInput
            language={language}
            onLanguageChange={setLanguage}
            isListening={isListening}
            onStartListening={startListening}
            onStopListening={stopListening}
            transcript={transcript}
            onTranscriptChange={setTranscript}
            interimTranscript={interimTranscript}
            onSubmit={handleProcessVoiceToSign}
            error={micError}
            isProcessing={isProcessing}
          />

          {pipelineData && (
            <SubtitleDisplay
              originalText={pipelineData.input_text}
              translatedText={pipelineData.translated_text}
              spokenLanguage={pipelineData.spoken_language}
              glossSequence={pipelineData.gloss_sequence}
              unsupportedWords={pipelineData.unsupported_words}
              warningMessage={pipelineData.warning_message}
            />
          )}
        </div>

        {/* Right Column: 3D Avatar Viewer (7 cols) */}
        <div className="lg:col-span-7">
          <AvatarViewer
            glossSequence={pipelineData?.full_sign_sequence || pipelineData?.supported_glosses || []}
            unsupportedWords={pipelineData?.unsupported_words || []}
          />
        </div>
      </div>
    </div>
  );
}
