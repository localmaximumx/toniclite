import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, CheckCircle2, BookOpen } from 'lucide-react';
import { ALL_TOPICS } from '../data/mlMathCurriculum';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUrl: (url: string) => void;
  completedUrls: Set<string>;
}

export function QuickSearchModal({
  isOpen,
  onClose,
  onSelectUrl,
  completedUrls,
}: QuickSearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_TOPICS;
    return ALL_TOPICS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.moduleTitle.toLowerCase().includes(q)
    );
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/65 backdrop-blur-sm pt-16 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all 67 ML Math lessons (e.g., SVD, Bayes, Hessian, KL Divergence, Adam)..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none"
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-2 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No lessons matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item) => {
                const isDone = completedUrls.has(item.url);
                return (
                  <button
                    key={item.url}
                    onClick={() => {
                      onSelectUrl(item.url);
                      onClose();
                    }}
                    className="group flex w-full items-center justify-between gap-4 rounded-xl px-3.5 py-2.5 text-left hover:bg-accent transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                        <BookOpen className="h-3 w-3 shrink-0" />
                        <span>
                          Module {item.moduleId}: {item.moduleTitle}
                        </span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">
                          {String(item.topicIndex).padStart(2, '0')}/{String(item.moduleTotal).padStart(2, '0')}
                        </span>
                        {isDone && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
                              <CheckCircle2 className="h-3 w-3" /> Studied
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-foreground group-hover:text-emerald-400 transition-colors truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
          <span>{filtered.length} lessons available</span>
          <span>
            {completedUrls.size} / {ALL_TOPICS.length} completed
          </span>
        </div>
      </div>
    </div>
  );
}
