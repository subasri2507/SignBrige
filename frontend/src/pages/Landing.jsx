import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Mic, 
  Camera, 
  Globe, 
  CheckCircle2, 
  ShieldCheck
} from 'lucide-react';
import { ISL_CONFIG } from '../config/islConfig';

export default function Landing() {
  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          {/* Inclusive Communication Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Inclusive Two-Way Sign & Speech Communication</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
            Bringing Hearing & Deaf People Together Through{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              Indian Sign Language
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            SignBridge makes everyday conversations effortless and natural: speak in your preferred language to sign through a 3D interpreter, or sign in front of your camera to speak aloud clearly across 9 languages.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/classroom"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <span>Start Two-Way Classroom</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm transition-all hover:scale-105"
            >
              <span>Open Dashboard</span>
            </Link>
          </div>

          {/* Quick specs pill */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Sign Languages: <strong className="text-slate-200">ISL (National, South, North) + ASL/BSL Bridge</strong>
            </span>
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              9 Spoken Languages: <strong className="text-slate-200">English, Tamil, Hindi, Telugu, Malayalam, Kannada, Marathi, Bengali, Gujarati</strong>
            </span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Two-Way Communication</h2>
          <h3 className="text-3xl font-extrabold text-white">How SignBridge Connects People</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Direction A Card */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-5">
              <Mic className="w-6 h-6" />
            </div>
            <div className="inline-block px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 text-xs font-bold mb-3 border border-indigo-500/20">
              Hearing Person → Deaf / Non-Speaking Person
            </div>
            <h4 className="text-xl font-bold text-white mb-3">Voice to Expressive 3D Sign Interpreter</h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Speak naturally in Tamil, English, Hindi, or any supported regional language. Your words are translated into Indian Sign Language and signed step by step by the 3D interpreter.
            </p>
            <div className="space-y-2 text-xs text-slate-400 bg-slate-900/60 p-4 rounded-xl border border-slate-800 font-mono">
              <div>1. Live Voice Capture & Transcription</div>
              <div>2. Regional Language Translation</div>
              <div>3. Indian Sign Language Gloss & Fingerspelling</div>
              <div>4. Smooth 3D Interpreter Hand & Finger Signing</div>
            </div>
            <div className="mt-6">
              <Link to="/voice-to-sign" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5">
                <span>Open Voice-to-Sign</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Direction B Card */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-5">
              <Camera className="w-6 h-6" />
            </div>
            <div className="inline-block px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 text-xs font-bold mb-3 border border-emerald-500/20">
              Deaf / Non-Speaking Person → Hearing Person
            </div>
            <h4 className="text-xl font-bold text-white mb-3">Webcam Sign Recognition to Spoken Voice</h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Sign comfortably in front of your webcam. Hand movements and gestures are recognized, formed into complete natural sentences, and spoken aloud in the listener's language.
            </p>
            <div className="space-y-2 text-xs text-slate-400 bg-slate-900/60 p-4 rounded-xl border border-slate-800 font-mono">
              <div>1. Live Webcam Hand & Gesture Tracking</div>
              <div>2. Single Sign & Continuous Sentence Recognition</div>
              <div>3. Natural Sentence Formation</div>
              <div>4. Clear Spoken Audio in 9 Languages</div>
            </div>
            <div className="mt-6">
              <Link to="/sign-to-speech" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5">
                <span>Open Sign-to-Speech</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Spoken Languages & ISL */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs font-bold text-sky-400 uppercase tracking-widest block mb-2">Multilingual Pan-India Bridge</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
                9 Spoken Languages + Indian Sign Language
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                People across India speak diverse regional languages. SignBridge brings everyone into the same conversation with native speech recognition, translation, and voice output paired with Indian Sign Language.
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {ISL_CONFIG.spokenLanguages.map((l) => (
                  <div key={l.code} className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 text-center">
                    <div className="text-xl mb-0.5">{l.flag}</div>
                    <div className="font-bold text-xs text-white">{l.name}</div>
                    <div className="text-[10px] text-slate-400">{l.nativeName}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Designed for Real Everyday Conversations</h4>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>5 Sign Language Modes:</strong> National ISLRTC Standard, Southern Regional ISL, Northern/Western Regional ISL, plus ASL & BSL Bridges.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Everyday & Classroom Vocabulary:</strong> Greetings, Family, Questions, Classroom, Emergency/Medical, Daily Needs, Emotions, Actions, Time, and Alphabetical Fingerspelling.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Expressive 3D Sign Interpreter:</strong> Clear waist-up framing with full 5-finger hand articulation and customizable studio lighting.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
