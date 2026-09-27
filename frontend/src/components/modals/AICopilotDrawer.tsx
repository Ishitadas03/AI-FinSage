import React, { useState, useRef, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export const AICopilotDrawer: React.FC = () => {
  const {
    isChatOpen,
    setIsChatOpen,
    chatMessages,
    sendChatMessage,
    clearChat,
    loadChatHistory,
    isLoadingChat,
    chatError,
    netWorth,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    isAuthenticated,
  } = useFinance();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      loadChatHistory();
      scrollToBottom();
    }
  }, [isChatOpen, loadChatHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isLoadingChat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoadingChat) return;
    const query = input.trim();
    setInput('');
    await sendChatMessage(query);
  };

  const handleChipClick = async (suggestion: string) => {
    if (isLoadingChat) return;
    await sendChatMessage(suggestion);
  };

  const netFlow = monthlyIncome - monthlyExpenses;

  return (
    <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg p-0 bg-white border-l border-slate-200">
        {/* Header */}
        <SheetHeader className="border-b border-slate-100 p-4 bg-slate-50/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  FinSage AI Copilot
                  <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                    Grounded Live
                  </span>
                </SheetTitle>
                <p className="text-[11px] text-slate-500">
                  Grounded on your verified financial ledger
                </p>
              </div>
            </div>

            <button
              onClick={clearChat}
              title="Clear chat history"
              aria-label="Clear chat history"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Real Context Metrics Strip */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-white p-2.5 border border-slate-200/80 text-[11px] text-slate-600">
            <div>
              <span className="text-slate-400">Net Worth:</span>{' '}
              <strong className="text-slate-900 font-semibold">{formatCurrency(netWorth)}</strong>
            </div>
            <div>
              <span className="text-slate-400">Savings Rate:</span>{' '}
              <strong className="text-emerald-600 font-semibold">{savingsRate}%</strong>
            </div>
            <div>
              <span className="text-slate-400">Monthly Net:</span>{' '}
              <strong className={cn("font-semibold", netFlow >= 0 ? "text-slate-900" : "text-rose-600")}>
                {netFlow >= 0 ? '+' : ''}{formatCurrency(netFlow)}
              </strong>
            </div>
          </div>
        </SheetHeader>

        {/* Message stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col gap-1 max-w-[90%]",
                msg.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                {msg.sender === 'assistant' ? (
                  <>
                    <Bot className="h-3.5 w-3.5 text-teal-600" />
                    <span className="font-medium text-teal-900">FinSage AI</span>
                  </>
                ) : (
                  <>
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-medium text-slate-600">You</span>
                  </>
                )}
                <span>• {msg.timestamp}</span>
              </div>

              <div
                className={cn(
                  "rounded-2xl p-3.5 text-[13px] leading-relaxed shadow-sm",
                  msg.sender === 'user'
                    ? "bg-teal-700 text-white font-medium rounded-tr-none"
                    : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none prose-sm whitespace-pre-line"
                )}
              >
                {msg.text}
              </div>

              {/* Suggestions chips */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-2 space-y-1.5 w-full">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                    Suggested Inquiries
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {msg.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleChipClick(suggestion)}
                        disabled={isLoadingChat}
                        className="flex items-center justify-between rounded-xl bg-white border border-teal-200/80 px-3 py-2 text-xs font-medium text-teal-800 hover:bg-teal-50/70 hover:border-teal-300 transition-all text-left group disabled:opacity-50"
                      >
                        <span className="truncate">{suggestion}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-teal-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoadingChat && (
            <div className="mr-auto items-start flex flex-col gap-1 max-w-[85%]">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                <Bot className="h-3.5 w-3.5 text-teal-600 animate-pulse" />
                <span className="font-medium text-teal-900">FinSage AI is verifying calculations...</span>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200/80 rounded-tl-none p-3.5 shadow-sm flex items-center gap-2 text-xs text-slate-600">
                <Loader2 className="h-4 w-4 text-teal-600 animate-spin" />
                <span>Auditing ledger context and generating grounded answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-200 bg-white p-3">
          {chatError && (
            <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] text-rose-700 border border-rose-200">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{chatError}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoadingChat}
              placeholder="Ask anything about your savings, budget, EMI, bills..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoadingChat}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm hover:bg-teal-800 disabled:opacity-40 transition-all"
              aria-label="Send message"
            >
              {isLoadingChat ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
          <p className="mt-2 text-center text-[10px] text-slate-400">
            🔒 Grounded exclusively in verified personal financial transactions.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
