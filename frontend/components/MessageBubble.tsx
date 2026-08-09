"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check, ThumbsUp, ThumbsDown, Notebook } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SourceCitation } from "@/lib/api";
import { useTheme } from "@/components/ThemeContext";

function linkifyCitations(text: string): string {
  return text.replace(/\[(\d+)\]/g, (_m, num) => `[${num}](#cite-${num})`);
}

// Formats a citation sequentially (e.g., 1, 2, 3)
function buildCitationLabels(sources: SourceCitation[] | undefined): Map<number, string> {
  const map = new Map<number, string>();
  (sources ?? []).forEach((s, i) => {
    const id = s.id ?? i + 1;
    map.set(id, String(i + 1));
  });
  return map;
}

export default function MessageBubble({
  role,
  content,
  sources,
}: {
  role: "user" | "assistant";
  content: string;
  sources?: SourceCitation[];
}) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reaction, setReaction] = useState<"up" | "down" | null>(null);
  const sourceRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const sourceById = useMemo(() => {
    const map = new Map<number, SourceCitation>();
    (sources ?? []).forEach((s, i) => map.set(s.id ?? i + 1, s));
    return map;
  }, [sources]);

  const citationLabelById = useMemo(() => buildCitationLabels(sources), [sources]);

  const processedContent = useMemo(() => linkifyCitations(content || ""), [content]);

  const goToSource = (id: number) => {
    setExpanded(true);
    requestAnimationFrame(() => {
      const el = sourceRefs.current[id];
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("ring-2", "ring-accent", "bg-surface-active");
      setTimeout(() => {
        el?.classList.remove("ring-2", "ring-accent", "bg-surface-active");
      }, 1500);
    });
  };

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  /* ────────────────────────────
     USER MESSAGE — Flat MD3 Bubble
     ──────────────────────────── */
  if (role === "user") {
    return (
      <div className="flex justify-end gap-3 max-w-3xl ml-auto py-2">
        <div 
          className="rounded-3xl rounded-tr-md px-5 py-3 text-[15px] leading-relaxed shadow-sm"
          style={{ 
            backgroundColor: 'var(--color-surface-hover)', 
            color: 'var(--color-white)' 
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  /* ────────────────────────────
     ASSISTANT MESSAGE — Flat Layout
     ──────────────────────────── */
  return (
    <div className="flex gap-4 max-w-3xl py-4">
      {/* AI Avatar */}
      <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center shrink-0 mt-1">
        <Notebook size={16} className="text-accent" />
      </div>

      <div className="min-w-0 flex-1">
        {/* Markdown content */}
        <div className={`prose prose-sm max-w-none text-[15px] leading-relaxed text-white ${theme === "dark" ? "prose-invert" : ""}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                const citeMatch = href?.match(/^#cite-(\d+)$/);
                if (citeMatch) {
                  const id = Number(citeMatch[1]);
                  const source = sourceById.get(id);
                  const label = citationLabelById.get(id) ?? String(id);
                  return (
                    <button
                      onClick={() => goToSource(id)}
                      title={source ? `${source.source} — page ${source.page}` : "Source"}
                      className="citation-pill"
                    >
                      {label}
                    </button>
                  );
                }
                return (
                  <a href={href} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                    {children}
                  </a>
                );
              },
            }}
          >
            {processedContent || "…"}
          </ReactMarkdown>
        </div>

        {/* Action bar */}
        <div className="mt-4 flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
          <button
            onClick={() => setReaction((r) => (r === "up" ? null : "up"))}
            className={`btn-icon flex h-8 w-8 items-center justify-center ${reaction === 'up' ? 'text-accent' : ''}`}
            title="Good response"
          >
            <ThumbsUp size={14} />
          </button>
          <button
            onClick={() => setReaction((r) => (r === "down" ? null : "down"))}
            className={`btn-icon flex h-8 w-8 items-center justify-center ${reaction === 'down' ? 'text-danger' : ''}`}
            title="Bad response"
          >
            <ThumbsDown size={14} />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={copy}
            className="btn-icon flex items-center gap-1.5 h-8 px-2"
            title="Copy"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied && <span className="text-xs font-medium">Copied</span>}
          </button>
        </div>

        {/* ── Sources Accordion ── */}
        {sources && sources.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-white transition-colors"
            >
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              {sources.length} {sources.length === 1 ? 'Source' : 'Sources'}
            </button>
            {expanded && (
              <div className="mt-3 grid gap-2 grid-cols-1 sm:grid-cols-2">
                {sources.map((s, i) => {
                  const id = s.id ?? i + 1;
                  const label = citationLabelById.get(id) ?? String(id);
                  return (
                    <div
                      key={id}
                      ref={(el) => {
                        sourceRefs.current[id] = el;
                      }}
                      className="border border-border rounded-xl p-3 bg-surface hover:bg-surface-hover transition-colors text-sm"
                    >
                      <p className="mb-2 flex items-center gap-2 font-medium text-white">
                        <span className="citation-pill !bg-border text-white !m-0">{label}</span>
                        <span className="truncate">{s.source} (Page {s.page})</span>
                      </p>
                      <p className="text-text-muted line-clamp-3">
                        &ldquo;{s.excerpt}…&rdquo;
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}