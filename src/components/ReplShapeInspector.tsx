import React, { useState, useEffect, useRef } from 'react';
import { 
  Layers, 
  Trash2, 
  CornerDownLeft, 
  Eye, 
  SlidersHorizontal, 
  RefreshCw, 
  Terminal, 
  Code2, 
  Sparkles, 
  Check, 
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { 
  runPythonRepl, 
  inspectTensorVariables, 
  TensorVariableMeta 
} from '../services/pyodideRunner';
import { BroadcastValidatorModal } from './BroadcastValidatorModal';
import { MatrixHeatmapModal } from './MatrixHeatmapModal';

export interface ReplHistoryItem {
  id: string;
  command: string;
  output: string;
  isError?: boolean;
}

export interface ReplShapeInspectorProps {
  activeInputs?: Record<string, any>;
  currentCode: string;
  isEvaluatingRepl: boolean;
  setIsEvaluatingRepl: (val: boolean) => void;
  replHistory: ReplHistoryItem[];
  setReplHistory: React.Dispatch<React.SetStateAction<ReplHistoryItem[]>>;
}

export const ReplShapeInspector: React.FC<ReplShapeInspectorProps> = ({
  activeInputs = {},
  currentCode,
  isEvaluatingRepl,
  setIsEvaluatingRepl,
  replHistory,
  setReplHistory,
}) => {
  // Input mode: single-line vs multi-line scratchpad
  const [inputMode, setInputMode] = useState<'single' | 'multiline'>('single');
  const [singleInput, setSingleInput] = useState<string>('');
  const [multilineInput, setMultilineInput] = useState<string>('import numpy as np\n# Live test case variables are already loaded!\n');

  // Command History Navigation (bash/ipython style)
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Live Tensor Scope Variables
  const [scopeVariables, setScopeVariables] = useState<TensorVariableMeta[]>([]);
  const [isLoadingScope, setIsLoadingScope] = useState<boolean>(false);

  // Modals state
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState<boolean>(false);
  const [heatmapVariable, setHeatmapVariable] = useState<TensorVariableMeta | null>(null);

  // Notification state
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Refs for console auto-scroll & focus
  const consoleRef = useRef<HTMLDivElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Refresh live scope variables whenever activeInputs changes
  const refreshScope = async () => {
    setIsLoadingScope(true);
    try {
      const vars = await inspectTensorVariables(activeInputs);
      setScopeVariables(vars);
    } catch (e) {
      console.warn('Failed to refresh scope:', e);
    } finally {
      setIsLoadingScope(false);
    }
  };

  useEffect(() => {
    refreshScope();
  }, [activeInputs]);

  // Auto-scroll console when history updates
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [replHistory, isEvaluatingRepl]);

  // Execute a REPL command
  const handleExecute = async (commandToRun?: string) => {
    const rawCmd = commandToRun !== undefined 
      ? commandToRun 
      : (inputMode === 'single' ? singleInput : multilineInput);
    
    const cmd = rawCmd.trim();
    if (!cmd || isEvaluatingRepl) return;

    if (inputMode === 'single' && commandToRun === undefined) {
      setSingleInput('');
      setCommandHistory(prev => [...prev, cmd]);
      setHistoryIndex(-1);
    }

    setIsEvaluatingRepl(true);

    try {
      const res = await runPythonRepl(cmd, currentCode, activeInputs);
      setIsEvaluatingRepl(false);

      setReplHistory(prev => [
        ...prev,
        {
          id: `repl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          command: cmd,
          output: res.error || res.output,
          isError: Boolean(res.error),
        },
      ]);

      // Re-inspect scope to detect new variables created in REPL
      refreshScope();
    } catch (err: any) {
      setIsEvaluatingRepl(false);
      setReplHistory(prev => [
        ...prev,
        {
          id: `repl-${Date.now()}`,
          command: cmd,
          output: err.message || String(err),
          isError: true,
        },
      ]);
    }

    // Refocus
    if (inputMode === 'single') {
      inputRef.current?.focus();
    }
  };

  // Up/Down History Navigation
  const handleKeyDownSingle = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      if (commandHistory.length === 0) return;
      e.preventDefault();
      const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setSingleInput(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      if (historyIndex === -1) return;
      e.preventDefault();
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandHistory.length) {
        setHistoryIndex(-1);
        setSingleInput('');
      } else {
        setHistoryIndex(nextIdx);
        setSingleInput(commandHistory[nextIdx]);
      }
    }
  };

  // Multi-line Ctrl+Enter or Shift+Enter execution
  const handleKeyDownMulti = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  // Sync editor functions feedback
  const handleSyncEditor = async () => {
    setIsEvaluatingRepl(true);
    const res = await runPythonRepl('# Sync editor code\n' + currentCode, currentCode, activeInputs);
    setIsEvaluatingRepl(false);
    setSyncFeedback('Functions Synced!');
    setTimeout(() => setSyncFeedback(null), 2500);

    setReplHistory(prev => [
      ...prev,
      {
        id: `sync-${Date.now()}`,
        command: '# Synced latest functions & classes from editor',
        output: res.error || '✓ Editor functions and classes loaded into REPL namespace.',
        isError: Boolean(res.error),
      },
    ]);
  };

  // One-click quick inspect all shapes
  const handleInspectAllShapes = () => {
    const lines = [
      'import numpy as np',
      'print("=== LIVE TENSOR SHAPES & METRIC AUDIT ===")',
    ];

    if (scopeVariables.length > 0) {
      scopeVariables.forEach(v => {
        lines.push(`print(f"${v.name}: shape={${v.name}.shape} | dtype={getattr(${v.name}, 'dtype', 'unknown')} | min={np.min(${v.name})} | max={np.max(${v.name})}")`);
      });
    } else {
      lines.push('print("No active tensor variables found.")');
    }

    handleExecute(lines.join('\n'));
  };

  // Curated ML snippet pills
  const ML_SNIPPETS = [
    { label: 'Broadcast Check', cmd: 'np.broadcast_shapes(a.shape, b.shape)' },
    { label: 'Einsum Matmul', cmd: "np.einsum('ij,jk->ik', A, B)" },
    { label: 'Softmax', cmd: 'np.exp(x - np.max(x, axis=-1, keepdims=True)) / np.sum(np.exp(x - np.max(x, axis=-1, keepdims=True)), axis=-1, keepdims=True)' },
    { label: 'Where Mask', cmd: 'np.where(mask > 0, A, 0)' },
    { label: 'SVD', cmd: 'U, S, Vt = np.linalg.svd(A)' },
    { label: 'One-Hot', cmd: 'np.eye(num_classes)[labels]' },
    { label: 'Pad', cmd: 'np.pad(x, ((0,0), (1,1)), mode="constant")' },
  ];

  return (
    <div className="flex flex-col h-full space-y-1 sm:space-y-1.5">
      {/* 1. Live Tensor Scope Bar */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap pb-1 border-b border-border/70">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 pr-1 select-none">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Scope:</span>
          </span>

          {scopeVariables.length === 0 ? (
            <span className="text-[11px] text-muted-foreground/70 italic">
              {isLoadingScope ? 'Detecting tensor scope...' : 'No variables in scope'}
            </span>
          ) : (
            scopeVariables.map(v => (
              <div
                key={v.name}
                className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg bg-[#191925] border border-border hover:border-emerald-500/40 text-xs font-mono transition-all group shadow-sm"
              >
                <button
                  onClick={() => {
                    if (inputMode === 'single') {
                      setSingleInput(`${v.name}.shape`);
                      inputRef.current?.focus();
                    } else {
                      setMultilineInput(prev => `${prev}\nprint(${v.name}.shape)`);
                    }
                  }}
                  className="font-bold text-emerald-400 hover:text-emerald-300"
                  title={`Click to inspect ${v.name}.shape`}
                >
                  {v.name}: <span className="font-normal text-foreground">{v.fullShapeStr}</span>
                </button>

                <span className="text-[10px] text-muted-foreground select-none">
                  {v.dtype}
                </span>

                {/* Mini Heatmap trigger */}
                {v.slice2D && v.slice2D.length > 0 && (
                  <button
                    onClick={() => setHeatmapVariable(v)}
                    className="p-0.5 rounded hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-400 transition-colors ml-0.5"
                    title={`View numerical matrix heatmap for ${v.name}`}
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Studio Tools & Toolbar Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Dimension & Broadcasting Studio Modal Trigger */}
          <button
            onClick={() => setIsBroadcastModalOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-sans text-xs font-semibold border border-emerald-500/30 transition-colors"
            title="Open Interactive Broadcasting & Matmul Studio"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Broadcast Studio</span>
          </button>

          {/* Quick Shape Inspector */}
          <button
            onClick={handleInspectAllShapes}
            disabled={isEvaluatingRepl}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-xs font-sans font-medium transition-colors disabled:opacity-50"
            title="Run audit on all active tensor shapes"
          >
            <Layers className="w-3 h-3" />
            <span>Audit All</span>
          </button>

          {/* Sync Editor Functions */}
          <button
            onClick={handleSyncEditor}
            disabled={isEvaluatingRepl}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-xs font-sans font-medium transition-colors disabled:opacity-50"
            title="Load your latest editor code and functions into the REPL namespace"
          >
            {syncFeedback ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            <span>{syncFeedback || 'Sync Code'}</span>
          </button>

          {/* Mode Switcher: Single-Line vs Multi-Line Scratchpad */}
          <div className="flex items-center bg-[#0E0E16] border border-border rounded-lg p-0.5">
            <button
              onClick={() => setInputMode('single')}
              className={`p-1 rounded text-xs transition-colors ${
                inputMode === 'single'
                  ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Single-line interactive terminal (>>>)"
            >
              <Terminal className="w-3 h-3" />
            </button>
            <button
              onClick={() => setInputMode('multiline')}
              className={`p-1 rounded text-xs transition-colors ${
                inputMode === 'multiline'
                  ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Multi-line Python scratchpad"
            >
              <Code2 className="w-3 h-3" />
            </button>
          </div>

          {/* Clear REPL */}
          <button
            onClick={() => setReplHistory([])}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded transition-colors"
            title="Clear REPL console history"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. REPL Output Console */}
      <div
        ref={consoleRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-2.5 rounded-lg bg-black/60 border border-white/10 font-mono text-xs space-y-1 min-h-[70px] max-h-[135px]"
      >
        {replHistory.length === 0 ? (
          <div className="text-muted-foreground/60 italic text-[11px] flex items-center gap-2">
            <span>REPL is ready. Active test case inputs are loaded. Type Python expressions or click any snippet below.</span>
          </div>
        ) : (
          replHistory.map(item => (
            <div key={item.id} className="space-y-0.5">
              <div className="flex items-center gap-2 text-emerald-400/90 font-semibold select-none text-[11px]">
                <span className="text-muted-foreground">&gt;&gt;&gt;</span>
                <span className="text-foreground font-mono">{item.command}</span>
              </div>
              <pre
                className={`whitespace-pre-wrap pl-4 text-[11px] ${
                  item.isError ? 'text-rose-400 font-semibold' : 'text-emerald-300'
                }`}
              >
                {item.output}
              </pre>
            </div>
          ))
        )}

        {isEvaluatingRepl && (
          <div className="flex items-center gap-2 text-emerald-400 pl-4 text-[11px] animate-pulse">
            <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span>Evaluating in WebAssembly Python engine...</span>
          </div>
        )}
        <div ref={outputEndRef} />
      </div>

      {/* 3. ML Snippet Quick Shelf */}
      <div className="flex items-center gap-1 overflow-x-auto py-0.5 text-[11px] font-mono custom-scrollbar no-scrollbar">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1 font-sans">
          <Sparkles className="w-2.5 h-2.5 text-emerald-400" /> Snippets:
        </span>
        {ML_SNIPPETS.map((snip, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (inputMode === 'single') {
                setSingleInput(snip.cmd);
                inputRef.current?.focus();
              } else {
                setMultilineInput(prev => `${prev}\n${snip.cmd}`);
                textareaRef.current?.focus();
              }
            }}
            className="px-2 py-0.5 rounded-md bg-[#191925] hover:bg-[#252538] text-muted-foreground hover:text-emerald-300 border border-border/60 transition-colors shrink-0"
            title={`Insert: ${snip.cmd}`}
          >
            {snip.label}
          </button>
        ))}
      </div>

      {/* 4. Input Area: Single-line vs Multi-line Scratchpad */}
      {inputMode === 'single' ? (
        <form
          onSubmit={e => {
            e.preventDefault();
            handleExecute();
          }}
          className="flex items-center gap-2 pt-0"
        >
          <div className="relative flex-1">
            <span className="absolute left-3 top-1.5 font-mono text-xs text-emerald-400 font-bold select-none">
              &gt;&gt;&gt;
            </span>
            <input
              ref={inputRef}
              type="text"
              value={singleInput}
              onChange={e => setSingleInput(e.target.value)}
              onKeyDown={handleKeyDownSingle}
              placeholder="e.g. X.shape, A @ b, np.linalg.norm(X), def f(): ... (↑/↓ for history)"
              className="w-full pl-9 pr-2.5 py-1 rounded-lg bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono text-xs text-foreground outline-none transition-all"
              spellCheck={false}
            />
          </div>
          <button
            type="submit"
            disabled={isEvaluatingRepl || !singleInput.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-sans text-xs font-bold transition-all disabled:opacity-40 shrink-0"
          >
            <span>Run</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </form>
      ) : (
        <div className="space-y-1.5">
          <div className="relative border border-border rounded-xl bg-[#0E0E16] overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
            <textarea
              ref={textareaRef}
              rows={2}
              value={multilineInput}
              onChange={e => setMultilineInput(e.target.value)}
              onKeyDown={handleKeyDownMulti}
              placeholder="# Multi-line Python scratchpad (Ctrl+Enter to run)&#10;def test():&#10;    return X.shape&#10;print(test())"
              className="w-full p-2.5 font-mono text-xs bg-transparent text-foreground outline-none resize-none custom-scrollbar"
              spellCheck={false}
            />
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#13131D] border-t border-border/60 text-[10px] text-muted-foreground font-mono">
              <span>Press <kbd className="px-1 py-0.5 bg-black/40 rounded border border-white/10">Ctrl+Enter</kbd> to run script</span>
              <button
                type="button"
                onClick={() => handleExecute()}
                disabled={isEvaluatingRepl || !multilineInput.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500 hover:bg-emerald-600 text-black font-sans text-xs font-bold transition-all disabled:opacity-40"
              >
                <span>Run Scratchpad</span>
                <CornerDownLeft className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast & Matmul Validator Studio Modal */}
      <BroadcastValidatorModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        availableInputs={scopeVariables.map(v => ({ name: v.name, shape: v.shape }))}
        onInsertRepl={expr => {
          if (inputMode === 'single') {
            setSingleInput(expr);
            inputRef.current?.focus();
          } else {
            setMultilineInput(prev => `${prev}\nprint(${expr})`);
          }
          setIsBroadcastModalOpen(false);
        }}
      />

      {/* Numerical Matrix Heatmap Modal */}
      <MatrixHeatmapModal
        isOpen={Boolean(heatmapVariable)}
        onClose={() => setHeatmapVariable(null)}
        variable={heatmapVariable}
        onInsertRepl={expr => {
          if (inputMode === 'single') {
            setSingleInput(expr);
            inputRef.current?.focus();
          } else {
            setMultilineInput(prev => `${prev}\nprint(${expr})`);
          }
        }}
      />
    </div>
  );
};
