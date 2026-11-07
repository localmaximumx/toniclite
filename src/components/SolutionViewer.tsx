import React, { useState, useMemo } from 'react';
import { 
  Copy, 
  Check, 
  ArrowDownToLine, 
  FileCode
} from 'lucide-react';
import { MathView } from './MathView';

interface SolutionViewerProps {
  solution: string;
  onApplySolution?: (code: string) => void;
  slug?: string;
  problemTitle?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function highlightPythonCode(code: string): string {
  const lines = code.split('\n');
  return lines
    .map(line => {
      let escaped = escapeHtml(line);

      // Extract comments
      const commentIdx = escaped.indexOf('#');
      let commentPart = '';
      if (commentIdx !== -1) {
        commentPart = `<span class="text-neutral-500 italic font-mono">${escaped.slice(commentIdx)}</span>`;
        escaped = escaped.slice(0, commentIdx);
      }

      // Strings (double or single quotes)
      escaped = escaped.replace(
        /(&quot;[\s\S]*?&quot;|&#39;[\s\S]*?&#39;)/g,
        '<span class="text-[#98c379]">$1</span>'
      );

      // Keywords
      escaped = escaped.replace(
        /\b(def|class|return|import|from|as|if|elif|else|for|while|in|try|except|finally|with|pass|continue|break|lambda|raise|yield|async|await|assert|global|nonlocal)\b/g,
        '<span class="text-[#c678dd] font-semibold">$1</span>'
      );

      // Constants / Booleans / None
      escaped = escaped.replace(
        /\b(True|False|None)\b/g,
        '<span class="text-[#d19a66] font-semibold">$1</span>'
      );

      // Built-ins and ML libraries
      escaped = escaped.replace(
        /\b(self|torch|Tensor|nn|F|np|numpy|int|float|str|bool|list|dict|set|tuple|math|range|len|enumerate|zip|print|sum|max|min|abs|round)\b/g,
        '<span class="text-[#4ec9b0] font-medium">$1</span>'
      );

      // Function definition names
      escaped = escaped.replace(
        /(def\s+)([a-zA-Z_][a-zA-Z0-9_]*)/g,
        '$1<span class="text-[#61afef] font-semibold">$2</span>'
      );

      // Numbers
      escaped = escaped.replace(
        /\b(\d+\.?\d*(?:e[+-]?\d+)?)\b/g,
        '<span class="text-[#d19a66]">$1</span>'
      );

      return (escaped + commentPart) || '&nbsp;';
    })
    .join('\n');
}

export const SolutionViewer: React.FC<SolutionViewerProps> = ({ 
  solution, 
  onApplySolution
}) => {
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  // Extract official python code
  const officialCode = useMemo(() => {
    if (!solution) return '';

    const codeBlocks = [...solution.matchAll(/```(?:python|py)?\s*([\s\S]*?)```/g)]
      .map(m => m[1].trim())
      .filter(b => b.length > 0);

    if (codeBlocks.length > 0) {
      return codeBlocks.reduce((prev, curr) => (curr.length > prev.length ? curr : prev));
    }

    const isRawCode = /^\s*(?:import\s+|from\s+|def\s+|class\s+|#)/m.test(solution) && solution.includes('def ');
    if (isRawCode) {
      return solution.trim();
    }

    return '';
  }, [solution]);

  // Extract ONLY Space and Time Complexity section
  const complexityMarkdown = useMemo(() => {
    if (!solution) return '';

    // Search for Complexity Analysis section
    const match = solution.match(/###\s*📊?\s*Complexity Analysis\s*([\s\S]*?)(?=###|$)/i);
    if (match) {
      return match[1].trim();
    }

    // Fallback: look for lines containing Time/Space complexity
    const lines = solution.split('\n');
    const compLines = lines.filter(l => /(?:time|space)\s*complexity/i.test(l));
    if (compLines.length > 0) {
      return compLines.join('\n');
    }

    return '';
  }, [solution]);

  const highlightedHtml = useMemo(() => {
    if (!officialCode) return '';
    return highlightPythonCode(officialCode);
  }, [officialCode]);

  const lineCount = useMemo(() => {
    if (!officialCode) return 0;
    return officialCode.split('\n').length;
  }, [officialCode]);

  const handleCopy = () => {
    if (!officialCode) return;
    navigator.clipboard.writeText(officialCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (!officialCode || !onApplySolution) return;
    onApplySolution(officialCode);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Space and Time Complexity Analysis */}
      {complexityMarkdown && (
        <div className="rounded-xl border border-border/70 bg-secondary/15 dark:bg-card/40 p-3 sm:p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <span className="text-sm">📊</span>
            <span>Complexity Analysis</span>
          </div>
          <div className="text-xs text-muted-foreground leading-relaxed pl-1">
            <MathView content={complexityMarkdown} allowPureCode={false} />
          </div>
        </div>
      )}

      {/* 2. Official Solution Python Code Block */}
      {officialCode ? (
        <div className="rounded-xl border border-border/80 bg-[#0d1117] overflow-hidden shadow-md">
          {/* Top header bar */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-[#161b22] border-b border-[#30363d] select-none">
            <div className="flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#93C572]" />
              <span className="font-mono text-xs font-semibold text-foreground">
                solution.py
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#93C572]/15 text-[#93C572] border border-[#93C572]/30">
                Official
              </span>
              <span className="text-[11px] text-muted-foreground/70 hidden sm:inline font-mono">
                {lineCount} {lineCount === 1 ? 'line' : 'lines'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center justify-center p-1.5 rounded-md text-xs font-medium bg-[#21262d] hover:bg-[#30363d] text-muted-foreground hover:text-foreground transition-colors border border-[#30363d]"
                title="Copy solution code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {onApplySolution && (
                <button
                  type="button"
                  onClick={handleApply}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-[#93C572] hover:bg-[#A4D287] text-black transition-colors shadow-xs"
                  title="Apply solution code to Monaco Editor"
                >
                  {applied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-black" />
                      <span>Applied!</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine className="w-3.5 h-3.5 text-black" />
                      <span>Apply to Editor</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Code Body with Line Numbers */}
          <div className="flex overflow-x-auto p-2.5 sm:p-4 custom-scrollbar bg-[#0d1117]">
            <div
              className="select-none text-right pr-2.5 sm:pr-4 text-muted-foreground/30 font-mono text-xs leading-relaxed border-r border-[#30363d]/60 flex flex-col shrink-0"
              aria-hidden="true"
            >
              {Array.from({ length: lineCount }).map((_, i) => (
                <span key={i} className="tabular-nums">
                  {i + 1}
                </span>
              ))}
            </div>

            <div className="pl-2.5 sm:pl-4 font-mono text-xs leading-relaxed overflow-x-visible shrink-0 min-w-0">
              <pre className="m-0 p-0 bg-transparent text-[#e6edf3] font-mono whitespace-pre">
                <code
                  dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                  className="font-mono text-xs"
                />
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-border/80 bg-muted/20 text-xs text-muted-foreground">
          No code solution provided.
        </div>
      )}
    </div>
  );
};
