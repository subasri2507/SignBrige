import axios from 'axios';
import { ISL_CONFIG } from '../config/islConfig';

const apiClient = axios.create({
  baseURL: ISL_CONFIG.apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const api = {
  // System Health
  checkHealth: async () => {
    try {
      const res = await apiClient.get('/health');
      return res.data;
    } catch (err) {
      return { status: 'offline', error: err.message };
    }
  },

  // Voice to Sign Pipeline
  voiceToSign: async (text, spokenLanguage = 'en') => {
    const res = await apiClient.post('/voice/to-sign', {
      text,
      spoken_language: spokenLanguage
    });
    return res.data;
  },

  // Speech Transcription
  transcribeAudio: async (formData) => {
    const res = await apiClient.post('/speech/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  transcribeText: async (text, language = 'en') => {
    const res = await apiClient.post('/speech/transcribe', { text, language });
    return res.data;
  },

  // Spoken Translation
  translateText: async (text, sourceLang, targetLang) => {
    const res = await apiClient.post('/speech/translate', {
      text,
      source_lang: sourceLang,
      target_lang: targetLang
    });
    return res.data;
  },

  // Text to Speech
  synthesizeSpeech: async (text, language = 'en') => {
    const res = await apiClient.post('/speech/synthesize', { text, language });
    return res.data;
  },

  // Sign Recognition
  recognizeSign: async (landmarksPayload) => {
    const res = await apiClient.post('/sign/recognize', landmarksPayload);
    return res.data;
  },

  // Continuous Multi-Sign Sentence Stream Recognition
  recognizeContinuous: async (glossStream, targetLang = 'en') => {
    const res = await apiClient.post('/sign/recognize-continuous', {
      gloss_stream: glossStream,
      target_lang: targetLang
    });
    return res.data;
  },

  // Trained CNN-LSTM Model Accuracy & Evaluation Metrics
  getModelMetrics: async () => {
    try {
      const res = await apiClient.get('/sign/model-metrics');
      return res.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Sign to Speech Pipeline
  signToSpeech: async (glosses, targetLang = 'en') => {
    const res = await apiClient.post('/sign/to-speech', {
      glosses,
      target_lang: targetLang
    });
    return res.data;
  },

  // Submit Sign Correction
  submitCorrection: async (originalPrediction, correctedLabel, language = 'en', notes = '') => {
    const res = await apiClient.post('/sign/correct', {
      original_prediction: originalPrediction,
      corrected_label: correctedLabel,
      language,
      notes
    });
    return res.data;
  },

  // Avatar Animations & Bundled GLTF 2.0 Assets
  getAvatarAnimations: async () => {
    const res = await apiClient.get('/avatar/animations');
    return res.data;
  },

  getAvatarGltfInfo: async () => {
    try {
      const res = await apiClient.get('/avatar/gltf-info');
      return res.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAvatarClip: async (gloss) => {
    const res = await apiClient.get(`/avatar/clip/${encodeURIComponent(gloss)}`);
    return res.data;
  },

  // Deaf Signer & ISL Interpreter User Study Evaluation
  getStudySummary: async () => {
    try {
      const res = await apiClient.get('/study/summary');
      return res.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  submitStudyEvaluation: async (payload) => {
    const res = await apiClient.post('/study/submit', payload);
    return res.data;
  },

  deleteStudyEvaluation: async (evalId) => {
    const res = await apiClient.delete(`/study/${evalId}`);
    return res.data;
  },

  // Conversations
  getConversations: async () => {
    const res = await apiClient.get('/conversations');
    return res.data;
  },

  createConversation: async (title = 'New Conversation') => {
    const res = await apiClient.post('/conversations', { title });
    return res.data;
  },

  getConversationMessages: async (convId) => {
    const res = await apiClient.get(`/conversations/${convId}/messages`);
    return res.data;
  },

  addMessage: async (convId, messageData) => {
    const res = await apiClient.post(`/conversations/${convId}/messages`, messageData);
    return res.data;
  },

  deleteConversation: async (convId) => {
    const res = await apiClient.delete(`/conversations/${convId}`);
    return res.data;
  },

  clearAllConversations: async () => {
    const res = await apiClient.delete('/conversations/clear-all');
    return res.data;
  },

  deleteMessage: async (messageId) => {
    const res = await apiClient.delete(`/conversations/messages/${messageId}`);
    return res.data;
  },

  // Settings
  getSettings: async () => {
    const res = await apiClient.get('/settings');
    return res.data;
  },

  updateSettings: async (settings) => {
    const res = await apiClient.put('/settings', settings);
    return res.data;
  }
};
