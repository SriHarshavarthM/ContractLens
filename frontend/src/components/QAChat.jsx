import React, { useState, useRef, useEffect } from 'react';
import { useContractStore } from '../store/useContractStore';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Info,
  CheckCircle2,
  Trash2,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function QAChat() {
  const { qaHistory, askQuestion, qaLoading, clearQAHistory, activeContractId, contracts } = useContractStore();
  const [inputQuestion, setInputQuestion] = useState('');
  const messagesEndRef = useRef(null);

  const activeContract = contracts.find((c) => c.id === activeContractId);

  const suggestedQuestions = [
    "What happens if we miss the payment deadline?",
    "What is the liability cap under this agreement?",
    "What are the SLA uptime commitments and penalty credits?",
    "How much notice is required to prevent automatic renewal?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [qaHistory, qaLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputQuestion.trim() || qaLoading) return;
    askQuestion(inputQuestion.trim());
    setInputQuestion('');
  };

  const handleSelectSuggested = (q) => {
    setInputQuestion(q);
    askQuestion(q);
  };

  return (
    <div className="glass-panel rounded-2xl border border-white/10 flex flex-col h-[740px] overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 lg:p-6 border-b border-white/10 flex items-center justify-between bg-navy-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-indigo to-cyan-400 p-[1px]">
            <div className="w-full h-full bg-navy-950 rounded-[11px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">Contract Q&A Assistant</h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Ground Truth Citations
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Answers generated strictly from {activeContract?.filename || 'the active contract'} with exact clause citations.
            </p>
          </div>
        </div>

        {qaHistory.length > 0 && (
          <button
            onClick={clearQAHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {qaHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-indigo-400" />
            </div>

            <div className="max-w-md">
              <h4 className="text-lg font-bold text-white mb-2">
                Ask anything about your contract
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Query liability clauses, indemnity, SLA breach penalties, cure periods, or payment milestones. Every answer cites the verbatim section.
              </p>
            </div>

            {/* Suggested Question Chips */}
            <div className="w-full max-w-lg space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-left pl-1">
                Suggested questions for demo:
              </div>
              <div className="grid grid-cols-1 gap-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggested(q)}
                    className="glass-card-interactive p-3 rounded-xl text-left text-xs text-slate-200 hover:text-white flex items-center justify-between group"
                  >
                    <span>&quot;{q}&quot;</span>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          qaHistory.map((item) => (
            <div key={item.id} className="space-y-4">
              {/* User Question */}
              <div className="flex items-start justify-end gap-3">
                <div className="max-w-xl p-4 rounded-2xl bg-brand-indigo text-white text-xs font-medium shadow-md shadow-indigo-500/20">
                  <div className="text-[10px] text-indigo-200 mb-1 font-mono">You • {item.timestamp}</div>
                  <p className="leading-relaxed">{item.question}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              </div>

              {/* AI Answer with Citation Badge */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-navy-850 border border-white/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="max-w-2xl w-full glass-card p-5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-brand-indigo/15 text-indigo-300 border border-indigo-500/30">
                        ContractLens Intelligence
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                        Confidence: {item.confidence || 'High'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Powered by Gemini 1.5 Pro
                    </span>
                  </div>

                  <p className="text-xs text-slate-100 leading-relaxed font-normal">
                    {item.answer}
                  </p>

                  {/* Ground Truth Citation Badge */}
                  {item.source_section && (
                    <div className="p-3 rounded-xl bg-navy-950 border border-indigo-500/20">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 mb-1">
                        <Info className="w-3.5 h-3.5" />
                        <span>Source: {item.source_section}</span>
                      </div>
                      {item.source_text && (
                        <p className="text-[11px] font-mono text-slate-300 italic">
                          &quot;{item.source_text}&quot;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {qaLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-navy-850 border border-white/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-300 font-mono">
                Searching contract clauses & generating verified citation...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-white/10 bg-navy-900/80 backdrop-blur-md flex items-center gap-3"
      >
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="Ask a question about this contract (e.g. What happens if payment is missed?)..."
          className="flex-1 px-4 py-3 rounded-xl bg-navy-950 border border-white/15 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:border-brand-indigo transition-colors"
        />

        <button
          type="submit"
          disabled={!inputQuestion.trim() || qaLoading}
          className="px-5 py-3 rounded-xl bg-brand-indigo hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 flex items-center gap-2 transition-all"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
