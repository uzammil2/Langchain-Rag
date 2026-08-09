"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Search,
  MessageSquareText,
  Zap,
  Menu,
  X,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Notebook
} from "lucide-react";
import { streamChat, getConversationMessages, ChatMessageT } from "@/lib/api";
import MessageBubble from "@/components/MessageBubble";

export default function ChatPanel({
  activeConversationId,
  activeConversationTitle,
  hasActiveDocument,
  onOpenMenu,
  onRenameConversation,
  onDeleteConversation,
  onConversationUpdated,
}: {
  activeConversationId: number | null;
  activeConversationTitle: string;
  hasActiveDocument: boolean;
  onOpenMenu: () => void;
  onRenameConversation: (id: number, title: string) => Promise<void>;
  onDeleteConversation: (id: number) => Promise<void>;
  onConversationUpdated: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessageT[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchCursor, setMatchCursor] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (activeConversationId == null) {
      setMessages([]);
      setLoadingHistory(false);
      return;
    }
    setLoadingHistory(true);
    getConversationMessages(activeConversationId)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoadingHistory(false));
  }, [activeConversationId]);

  useEffect(() => {
    if (!searchOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, searchOpen]);

  const matches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return messages.reduce<number[]>((acc, m, i) => {
      if (m.content.toLowerCase().includes(q)) acc.push(i);
      return acc;
    }, []);
  }, [searchQuery, messages]);

  useEffect(() => setMatchCursor(0), [searchQuery]);

  useEffect(() => {
    if (matches.length === 0) return;
    messageRefs.current[matches[matchCursor]]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [matchCursor, matches]);

  const send = async () => {
    const question = input.trim();
    if (!question || streaming || !hasActiveDocument || activeConversationId == null) return;

    setMessages((prev) => [...prev, { role: "user", content: question }, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    await streamChat(question, activeConversationId, {
      onToken: (t) =>
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], content: next[next.length - 1].content + t };
          return next;
        }),
      onSources: (sources) =>
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], sources };
          return next;
        }),
      onError: (message) =>
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], content: `⚠️ ${message}` };
          return next;
        }),
      onDone: () => {
        onConversationUpdated();
      },
    });

    setStreaming(false);
  };

  const handleRename = () => {
    if (activeConversationId == null) return;
    const newTitle = window.prompt("Rename notebook:", activeConversationTitle);
    if (newTitle !== null && newTitle.trim() !== "") {
      onRenameConversation(activeConversationId, newTitle.trim());
    }
  };

  const handleDelete = async () => {
    if (activeConversationId == null) return;
    if (window.confirm("Are you sure you want to delete this notebook?")) {
      await onDeleteConversation(activeConversationId);
    }
  };

  const handleExport = () => {
    if (messages.length === 0) return;
    const mdContent = messages
      .map((m) => {
        const roleLabel = m.role === "user" ? "### You" : "### Assistant";
        let content = `${roleLabel}\n\n${m.content}\n`;
        if (m.sources && m.sources.length > 0) {
          content += `\n**Sources:**\n` + m.sources.map((s) => `- [${s.id}] ${s.source} (Page ${s.page}): "${s.excerpt}"`).join("\n") + "\n";
        }
        return content;
      })
      .join("\n---\n\n");

    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${activeConversationTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="flex h-full flex-1 flex-col bg-panel rounded-l-[32px] overflow-hidden lg:shadow-[-4px_0_24px_rgba(0,0,0,0.05)] border-l border-border/50">
      {/* ── Minimalist Header ── */}
      <div className="flex items-center justify-between gap-3 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={onOpenMenu}
            className="btn-icon flex h-10 w-10 shrink-0 items-center justify-center lg:hidden"
          >
            <Menu size={20} className="text-white" />
          </button>

          {searchOpen ? (
            <div className="flex flex-1 items-center gap-2 rounded-full bg-surface-hover px-4 py-2">
              <Search size={16} className="text-text-muted" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search this notebook…"
                className="w-full min-w-0 bg-transparent text-body1 text-white placeholder:text-text-faint focus:outline-none"
              />
              {matches.length > 0 && (
                <span className="shrink-0 text-sub2 text-text-muted">
                  {matchCursor + 1}/{matches.length}
                </span>
              )}
              <div className="flex items-center ml-2 border-l border-border pl-2">
                <button
                  onClick={() => setMatchCursor((c) => (c - 1 + matches.length) % matches.length)}
                  disabled={matches.length === 0}
                  className="btn-icon h-7 w-7 disabled:opacity-30"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  onClick={() => setMatchCursor((c) => (c + 1) % matches.length)}
                  disabled={matches.length === 0}
                  className="btn-icon h-7 w-7 disabled:opacity-30"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="btn-icon h-7 w-7 ml-1"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="truncate text-h1 font-medium text-white tracking-tight">{activeConversationTitle}</h2>
            </div>
          )}
        </div>

        {!searchOpen && (
          <div className="flex shrink-0 items-center gap-2 relative">
            <button
              onClick={() => setSearchOpen(true)}
              className="btn-icon flex h-10 w-10 items-center justify-center"
              title="Search conversation"
            >
              <Search size={20} />
            </button>

            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="btn-icon flex h-10 w-10 items-center justify-center"
              title="Notebook options"
            >
              <MoreVertical size={20} />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-12 w-48 bg-surface rounded-xl border border-border shadow-md py-2 z-20">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleRename();
                    }}
                    className="flex w-full items-center px-4 py-2.5 text-body1 text-white hover:bg-surface-hover text-left"
                  >
                    Rename notebook
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleExport();
                    }}
                    className="flex w-full items-center px-4 py-2.5 text-body1 text-white hover:bg-surface-hover text-left"
                  >
                    Export as Markdown
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleDelete();
                    }}
                    className="flex w-full items-center px-4 py-2.5 text-body1 text-danger hover:bg-danger/10 text-left font-medium"
                  >
                    Delete notebook
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Main Message Area ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-[800px] flex-col justify-end px-4 pb-8 sm:px-6">
          {loadingHistory ? (
            <div className="flex flex-1 items-center justify-center text-body1 text-text-faint">
              Loading…
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center pb-12">
              <div className="bg-surface-hover p-4 rounded-full mb-4">
                <Notebook size={48} className="text-accent" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-h1 font-medium text-white mb-2">Welcome to your Notebook</h1>
                <p className="text-body1 text-text-muted max-w-md mx-auto">
                  Add sources to the left, then ask questions or get summaries. I'll search your documents and cite my answers.
                </p>
              </div>
              <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                <div className="bg-surface border border-border rounded-2xl p-5 text-left flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sub1 font-medium text-white">
                    <MessageSquareText size={18} className="text-accent" />
                    Try asking
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="bg-surface-hover rounded-xl px-4 py-3 text-body1 text-text-muted hover:text-white cursor-pointer transition-colors" onClick={() => setInput("Summarize the key themes in these documents.")}>
                      "Summarize the key themes in these documents."
                    </div>
                    <div className="bg-surface-hover rounded-xl px-4 py-3 text-body1 text-text-muted hover:text-white cursor-pointer transition-colors" onClick={() => setInput("Create a study guide from these sources.")}>
                      "Create a study guide from these sources."
                    </div>
                  </div>
                </div>
                <div className="bg-surface border border-border rounded-2xl p-5 text-left flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sub1 font-medium text-white">
                    <Zap size={18} className="text-warn" />
                    Capabilities
                  </div>
                  <ul className="text-body1 text-text-muted space-y-2 list-disc pl-5">
                    <li>Synthesizes information across multiple documents</li>
                    <li>Provides inline citations [1] directly to the source</li>
                    <li>Generates study guides, FAQs, and summaries</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-8 pt-10">
              {messages.map((m, i) => {
                const isMatch = matches.includes(i) && matches[matchCursor] === i;
                const isLast = i === messages.length - 1;
                const isEmptyStreamingAssistant =
                  streaming && isLast && m.role === "assistant" && m.content === "";

                return (
                  <div
                    key={i}
                    ref={(el) => {
                      messageRefs.current[i] = el;
                    }}
                    className={`transition animate-message-in rounded-2xl p-1 ${
                      isMatch ? "bg-surface-active" : ""
                    }`}
                  >
                    {isEmptyStreamingAssistant ? (
                      <TypingIndicator />
                    ) : (
                      <MessageBubble role={m.role} content={m.content} sources={m.sources} />
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      {/* ── Input Bar (MD3 Pill Style) ── */}
      <div className="mx-auto w-full max-w-[800px] px-4 pb-8 sm:px-6">
        <div
          className={`chat-input-bar flex items-end gap-2 p-2 ${
            streaming ? "opacity-70" : ""
          }`}
        >
          <textarea
            value={input}
            disabled={!hasActiveDocument || streaming}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={
              hasActiveDocument
                ? streaming
                  ? "Thinking…"
                  : "Ask a question about your sources…"
                : "Upload and select a source to begin"
            }
            className="w-full bg-transparent px-4 py-3 text-[15px] leading-relaxed text-white placeholder:text-text-faint focus:outline-none resize-none max-h-[150px] min-h-[48px]"
            rows={1}
            style={{ overflowY: 'auto' }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || streaming || !hasActiveDocument}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 mb-0.5 mr-0.5"
            style={{ 
              backgroundColor: input.trim() && hasActiveDocument && !streaming ? 'var(--color-accent)' : 'var(--color-surface-hover)',
              color: input.trim() && hasActiveDocument && !streaming ? '#fff' : 'var(--color-text-faint)'
            }}
          >
            {streaming ? (
              <span className="flex h-5 w-5 animate-spin rounded-full border-2 border-text-faint border-t-transparent" />
            ) : (
              <ArrowUp size={20} strokeWidth={2.5} />
            )}
          </button>
        </div>
        <div className="text-center mt-3">
          <span className="text-[11px] text-text-faint">Notebooks can make mistakes. Check your sources.</span>
        </div>
      </div>
    </main>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-4 max-w-3xl py-2">
      <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center shrink-0">
        <Notebook size={16} className="text-accent" />
      </div>
      <div className="flex items-center gap-1.5 h-8">
        <span className="h-1.5 w-1.5 rounded-full bg-text-faint animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-text-faint animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-text-faint animate-bounce" />
      </div>
    </div>
  );
}