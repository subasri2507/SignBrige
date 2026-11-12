import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import VoiceToSign from './pages/VoiceToSign';
import SignToSpeech from './pages/SignToSpeech';
import ClassroomMode from './pages/ClassroomMode';
import History from './pages/History';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/voice-to-sign" element={<VoiceToSign />} />
            <Route path="/sign-to-speech" element={<SignToSpeech />} />
            <Route path="/classroom" element={<ClassroomMode />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-800 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-300">SignBridge</span>
              <span>— Inclusive Indian Sign Language & Multilingual Communication</span>
            </div>
            <div>
              <span>Indian Sign Language (ISL) & Regional Spoken Languages</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
