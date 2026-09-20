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
    <div className="bg-white dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-[#27272A] flex flex-col h-[740px] overflow-hidden shadow-sm">
      {/* Chat Header */}
      <div className="p-4 lg:p-6 border-b border-zinc-200 dark:border-[#27272A] flex items-center justify-between bg-zinc-50 dark:bg-[#0E0E11]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-indigo to-cyan-400 p-[1px]">
            <div className="w-full h-full bg-white dark:bg-[#141417] rounded-[11px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-brand-indigo" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Contract Q&A Assistant</h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Ground Truth Citations
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Answers generated strictly from {activeContract?.filename || 'the active contract'} with exact clause citations.
            </p>
          </div>
        </div>

        {qaHistory.length > 0 && (
          <button
            onClick={clearQAHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
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
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-brand-indigo" />
            </div>

            <div className="max-w-md">
              <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                Ask anything about your contract
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Query liability clauses, indemnity, SLA breach penalties, cure periods, or payment milestones. Every answer cites the verbatim section.
              </p>
            </div>

            {/* Suggested Question Chips */}
            <div className="w-full max-w-lg space-y-2">
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-left pl-1">
                Suggested questions for demo:
              </div>
              <div className="grid grid-cols-1 gap-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggested(q)}
                    className="p-3 rounded-xl text-left text-xs bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] hover:border-brand-indigo text-zinc-800 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white flex items-center justify-between group transition-all"
                  >
                    <span>&quot;{q}&quot;</span>
                    <ArrowRight className="w-3.5 h-3.5 text-brand-indigo group-hover:translate-x-1 transition-transform" />
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
                <div className="max-w-xl p-4 rounded-2xl bg-brand-indigo text-white text-xs font-medium shadow-sm">
                  <div className="text-[10px] text-indigo-200 mb-1 font-mono">You • {item.timestamp}</div>
                  <p className="leading-relaxed">{item.question}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              </div>

              {/* AI Answer with Citation Badge */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] flex items-center justify-center text-brand-indigo flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="max-w-2xl w-full p-5 rounded-2xl bg-zinc-50 dark:bg-[#141417] border border-zinc-200 dark:border-[#27272A] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        ContractLens Intelligence
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                        Confidence: {item.confidence || 'High'}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                      Grounded in document text
                    </span>
                  </div>

                  <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal">
                    {item.answer}
                  </p>

                  {/* Ground Truth Citation Badge */}
                  {item.source_section && (
                    <div className="p-3 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A]">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand-indigo mb-1">
                        <Info className="w-3.5 h-3.5" />
                        <span>Source: {item.source_section}</span>
                      </div>
                      {item.source_text && (
                        <p className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 italic">
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
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] flex items-center justify-center text-brand-indigo flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#141417] border border-zinc-200 dark:border-[#27272A] flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-brand-indigo border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-zinc-600 dark:text-zinc-300 font-mono">
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
        className="p-4 border-t border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#0E0E11] flex items-center gap-3"
      >
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="Ask a question about this contract (e.g. What happens if payment is missed?)..."
          className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs focus:outline-none focus:border-brand-indigo transition-colors"
        />

        <button
          type="submit"
          disabled={!inputQuestion.trim() || qaLoading}
          className="px-5 py-3 rounded-xl bg-brand-indigo hover:bg-indigo-600 disabled:opacity-40 text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-all"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
