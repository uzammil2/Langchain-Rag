"use client";

import { useRef, useState } from "react";
import { Plus, MoreHorizontal, FileText, Layers, BookOpen, Trash2, X, Moon, Sun, Notebook } from "lucide-react";
import { uploadPdf, setDocumentActive, deleteDocument, DocumentInfo, ConversationInfo } from "@/lib/api";
import { useTheme } from "@/components/ThemeContext";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Sidebar({
  documents,
  loadingDocs,
  onChange,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onCreateConversation,
}: {
  documents: DocumentInfo[];
  loadingDocs: boolean;
  onChange: () => void;
  onClose?: () => void;
  conversations: ConversationInfo[];
  activeConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onDeleteConversation: (id: number) => void;
  onCreateConversation: () => void;
}) {
  const [indexing, setIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [libraryMenuOpen, setLibraryMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIndexing(true);
    setError(null);
    try {
      await uploadPdf(file);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIndexing(false);
    }
  };

  const toggleActive = async (namespace: string, active: boolean) => {
    try {
      await setDocumentActive(namespace, active);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update document");
    }
  };

  const remove = async (namespace: string) => {
    try {
      await deleteDocument(namespace);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    }
  };

  return (
    <aside className="flex h-full w-[340px] flex-col gap-6 bg-rail p-4">
      {/* ── Header: App Title & Theme Toggle ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Notebook size={20} className="text-accent" />
          <h1 className="text-sub1 font-semibold tracking-tight">Book Assistant</h1>
        </div>
        <div className="flex items-center gap-1">
          {onClose && (
            <button
              onClick={onClose}
              className="btn-icon flex h-9 w-9 items-center justify-center lg:hidden"
            >
              <X size={18} />
            </button>
          )}
          <button
            onClick={toggleTheme}
            className="btn-icon flex h-9 w-9 items-center justify-center"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* ── Sources Section (Like NotebookLM) ── */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sub2 text-text-muted font-semibold tracking-wide">Sources</h2>
          <div className="relative">
            <button
              onClick={() => setLibraryMenuOpen((o) => !o)}
              className="btn-icon flex h-8 w-8 items-center justify-center"
            >
              <MoreHorizontal size={16} />
            </button>
            {libraryMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLibraryMenuOpen(false)} />
                <div className="absolute right-0 top-9 w-40 bg-surface rounded-xl border border-border shadow-md py-1 z-20">
                  <button
                    onClick={() => {
                      onChange();
                      setLibraryMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-body1 text-white hover:bg-surface-hover"
                  >
                    Refresh
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mb-4">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={indexing}
            className="btn-pill-primary flex w-full items-center justify-center gap-2 py-3"
          >
            <Plus size={18} />
            <span className="font-medium text-sub1">Add source</span>
          </button>
          <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
        </div>

        {indexing && (
          <p className="text-body1 text-text-muted mb-3 text-center text-sm animate-pulse">
            Uploading & Indexing…
          </p>
        )}
        {error && (
          <p className="text-body1 text-danger mb-3 text-center text-sm bg-danger/10 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Source Cards */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-4 border-b border-border">
          {loadingDocs ? (
            <p className="text-body1 text-text-muted text-center py-4">Loading sources…</p>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <FileText size={32} className="text-text-faint mb-3 opacity-50" />
              <p className="text-sub2 text-text-muted">No sources yet.</p>
              <p className="text-body1 text-text-faint text-sm mt-1">Upload a PDF to start.</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.namespace}
                className={`card-source p-3 flex flex-col gap-2 ${doc.active ? "active" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <label className="flex items-start gap-3 cursor-pointer min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={doc.active}
                      onChange={(e) => toggleActive(doc.namespace, e.target.checked)}
                      className="checkbox-md3 mt-0.5 shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-sub2 font-semibold text-white" title={doc.pdf_name}>
                        {doc.pdf_name}
                      </span>
                      <span className="text-label1 text-text-muted flex items-center gap-1 mt-0.5">
                        {doc.source_count} chunks
                        {doc.page_count != null && ` • ${doc.page_count} pages`}
                      </span>
                    </div>
                  </label>
                  <button
                    onClick={() => remove(doc.namespace)}
                    className="btn-icon h-7 w-7 shrink-0 text-text-faint hover:text-danger"
                    title="Delete source"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Recent Notebooks / Chats ── */}
        <div className="mt-4 flex-shrink-0 max-h-[40%] overflow-y-auto pr-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sub2 text-text-muted font-semibold tracking-wide">Notebooks (Chats)</h2>
            <button
              onClick={onCreateConversation}
              className="btn-icon flex h-7 w-7 items-center justify-center hover:bg-surface-hover"
              title="New Notebook"
            >
              <Plus size={16} className="text-white" />
            </button>
          </div>
          
          <div className="space-y-1">
            {conversations.length === 0 ? (
              <p className="text-body1 text-text-faint text-sm">No notebooks yet.</p>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectConversation(c.id)}
                  className={`group flex items-center justify-between rounded-full px-4 py-2 cursor-pointer transition-colors ${
                    c.id === activeConversationId
                      ? "bg-surface-active text-text-active font-medium"
                      : "text-white hover:bg-surface-hover"
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate text-sub1 text-[13px]">{c.title || "Untitled Notebook"}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(c.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 btn-icon h-6 w-6 text-text-faint hover:text-danger shrink-0"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}