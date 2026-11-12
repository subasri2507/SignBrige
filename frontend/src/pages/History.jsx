import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import MessageBubble from '../components/MessageBubble';
import { 
  History as HistoryIcon, 
  Trash2, 
  AlertTriangle, 
  Search, 
  Filter, 
  RefreshCw,
  FolderOpen,
  Calendar
} from 'lucide-react';

export default function History() {
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState('all');

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await api.getConversations();
      if (res.success && res.conversations) {
        setConversations(res.conversations);
        if (res.conversations.length > 0 && !selectedConvId) {
          setSelectedConvId(res.conversations[0].id);
        }
      }
    } catch (err) {
      console.warn('History fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    if (!convId) return;
    try {
      const res = await api.getConversationMessages(convId);
      if (res.success) {
        setMessages(res.messages || []);
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
    }
  }, [selectedConvId]);

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error('Delete message error:', err);
    }
  };

  const handleDeleteConversation = async (convId) => {
    try {
      await api.deleteConversation(convId);
      const remaining = conversations.filter((c) => c.id !== convId);
      setConversations(remaining);
      if (remaining.length > 0) {
        setSelectedConvId(remaining[0].id);
      } else {
        setSelectedConvId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Delete conversation error:', err);
    }
  };

  const handleClearAllHistory = async () => {
    try {
      await api.clearAllConversations();
      setConversations([]);
      setSelectedConvId(null);
      setMessages([]);
      setClearModalOpen(false);
    } catch (err) {
      console.error('Clear all error:', err);
    }
  };

  // Filter messages
  const filteredMessages = messages.filter((m) => {
    const matchesSearch = 
      m.original_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.translated_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.recognized_gloss?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDirection = 
      directionFilter === 'all' || m.direction === directionFilter;

    return matchesSearch && matchesDirection;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-indigo-400" />
            <span>Conversation History & Records</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Persisted logs of Voice-to-Sign and Sign-to-Speech sessions with timestamps, gloss tags, and confidence scores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchConversations}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Refresh history"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          {conversations.length > 0 && (
            <button
              type="button"
              onClick={() => setClearModalOpen(true)}
              className="p-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All History</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Sessions List (Left) + Message Details (Right) */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left: Sessions (4 cols) */}
        <div className="lg:col-span-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Sessions ({conversations.length})
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading sessions...</div>
          ) : conversations.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <FolderOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <span>No recorded conversations found.</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {conversations.map((c) => {
                const isSelected = c.id === selectedConvId;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConvId(c.id)}
                    className={`p-3 rounded-xl cursor-pointer border transition-all text-xs flex items-center justify-between group ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-semibold truncate">{c.title}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</span>
                        <span className="ml-1 px-1.5 py-0.2 bg-slate-800 rounded">
                          {c.message_count || 0} msgs
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(c.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 rounded transition-opacity"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Message Stream (8 cols) */}
        <div className="lg:col-span-8 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages, glosses, translations..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 text-xs bg-slate-900 p-1 rounded-xl border border-slate-700">
              <Filter className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5" />
              {['all', 'voice_to_sign', 'sign_to_speech'].map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => setDirectionFilter(dir)}
                  className={`px-2 py-1 rounded-lg font-medium transition-all ${
                    directionFilter === dir
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {dir === 'all' ? 'All' : dir === 'voice_to_sign' ? 'Voice → Sign' : 'Sign → Speech'}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Display */}
          {filteredMessages.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No messages found in this conversation matching criteria.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {filteredMessages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  onDelete={handleDeleteMessage}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {clearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white mb-1">Clear Entire History?</h3>
              <p className="text-xs text-slate-400">
                This will permanently delete all saved conversations and messages from SQLite database. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setClearModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllHistory}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
