import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  Send, 
  RotateCcw, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  FileText, 
  Lightbulb, 
  CheckCircle2, 
  AlertCircle,
  Terminal,
  ListChecks,
  Tag,
  Star,
  PanelLeft,
  ShieldCheck,
  Plus,
  X,
  NotebookPen,
  Pencil,
  Eye,
  Trash2,
  CornerDownLeft,
  Layers,
  Zap,
  Code2


} from 'lucide-react';
import { 
  getProblemDetail, 
  getProblemCatalog, 
  getResearchPapers, 
  getAssessmentForProblem,
  getSavedCode, 
  saveCode, 
  getSavedNotes,
  saveNotes,
  markProblemSolved, 
  unmarkProblemSolved,
  getSolvedProblems 
} from '../services/dataService';
import { 
  getCurrentUser, 
  getUserSavedCode, 
  saveUserCode, 
  getUserSolvedProblems, 
  recordUserSubmission, 
  markUserProblemSolved,
  unmarkUserProblemSolved,
  UserAccount 
} from '../services/authService';
import { runPythonCode, runPythonSubmission, runPythonRepl, ExecutionReport } from '../services/pyodideRunner';
import { ProblemDetail, Difficulty, ProblemSummary, ResearchPaper } from '../types';
import { MathView } from '../components/MathView';
import { SolutionViewer } from '../components/SolutionViewer';
import { ProblemDrawer } from '../components/ProblemDrawer';
import { AuthModal } from '../components/AuthModal';



import { ProgressiveHintLadder } from '../components/ProgressiveHintLadder';
import { ReplShapeInspector } from '../components/ReplShapeInspector';

/* ======================================================== */
/* LEETCODE-STYLE PERFORMANCE PERCENTILE CHART COMPONENT   */
/* ======================================================== */
const PerformancePercentileChart: React.FC<{ runtimeMs: number; isSubmission: boolean }> = ({ runtimeMs, isSubmission }) => {
  const medianMs = 38.0;
  const ratio = runtimeMs / medianMs;
  const percentile = Math.min(99.4, Math.max(14.2, parseFloat((100 / (1 + Math.pow(ratio, 1.3))).toFixed(1))));

  const width = 360;
  const height = 90;

  const points: { x: number; y: number }[] = [];
  const steps = 36;
  for (let i = 0; i <= steps; i++) {
    const xPct = i / steps;
    const xMs = 5 + xPct * 95;
    const exponent = -Math.pow((xMs - medianMs) / 22, 2) / 2;
    const yVal = Math.exp(exponent);
    const svgX = 20 + xPct * (width - 40);
    const svgY = height - 12 - yVal * (height - 28);
    points.push({ x: svgX, y: svgY });
  }

  const pathD = points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - 10} L ${points[0].x} ${height - 10} Z`;

  const clampedUserMs = Math.min(100, Math.max(5, runtimeMs));
  const userXPct = (clampedUserMs - 5) / 95;
  const userSvgX = 20 + userXPct * (width - 40);

  const speedLabel = percentile >= 85 ? 'Optimal Vectorization ⚡' : percentile >= 60 ? 'Efficient Implementation 👍' : 'Can be further vectorized 💡';
  const speedColor = percentile >= 85 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' : percentile >= 60 ? 'text-sky-400 bg-sky-500/10 border-sky-500/25' : 'text-amber-400 bg-amber-500/10 border-amber-500/25';

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-secondary/30 dark:bg-[#0c1611] border border-border/70 dark:border-[#1d3326] space-y-3 my-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
            ⚡
          </div>
          <div>
            <div className="text-xs font-bold text-foreground dark:text-white flex items-center gap-2 flex-wrap">
              <span>Runtime Distribution</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${speedColor}`}>
                {speedLabel}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">
              Your solution ran in <strong className="text-foreground dark:text-white">{runtimeMs.toFixed(1)} ms</strong>
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right font-mono">
          <div className="text-sm font-extrabold text-[#93C572]">
            Beats {percentile}%
          </div>
          <div className="text-[10px] text-muted-foreground">
            of Python 3 submissions
          </div>
        </div>
      </div>

      {/* Bell Curve SVG */}
      <div className="relative w-full max-w-md mx-auto pt-5 pb-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
          <defs>
            <linearGradient id="runtimeCurveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#93C572" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#93C572" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Shaded Area under Bell Curve */}
          <path d={areaD} fill="url(#runtimeCurveGradient)" />

          {/* Curve Stroke */}
          <path d={pathD} fill="none" stroke="#93C572" strokeWidth="2.5" strokeLinecap="round" />

          {/* Baseline */}
          <line x1="15" y1={height - 10} x2={width - 15} y2={height - 10} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

          {/* User Marker Line */}
          <line
            x1={userSvgX}
            y1={12}
            x2={userSvgX}
            y2={height - 10}
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="3 3"
          />

          {/* User Dot */}
          <circle cx={userSvgX} cy={16} r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
        </svg>

        {/* Marker Label */}
        <div 
          className="absolute top-0 text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500 text-black font-extrabold transform -translate-x-1/2 shadow-md pointer-events-none whitespace-nowrap"
          style={{ left: `${(userSvgX / width) * 100}%` }}
        >
          You: {runtimeMs.toFixed(1)}ms
        </div>

        {/* Distribution axis labels */}
        <div className="flex justify-between text-[9px] text-muted-foreground font-mono px-4 pt-1">
          <span>Fast (5ms)</span>
          <span>Average (38ms)</span>
          <span>Slow (100ms+)</span>
        </div>
      </div>
    </div>
  );
};


interface ActiveTestCase {
  id: string;
  name: string;
  isCustom: boolean;
  rawInputs: Record<string, string>;
  rawExpectedOutput: string;
}

function parseInputValue(raw: any): any {
  if (typeof raw !== 'string') return raw;
  const trimmed = raw.trim();
  if (trimmed === '') return '';

  if (trimmed === 'True') return true;
  if (trimmed === 'False') return false;
  if (trimmed === 'None') return null;

  // 1. Try pure JSON
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2. Try single quotes replaced with double quotes
  try {
    return JSON.parse(trimmed.replace(/'/g, '"'));
  } catch {}

  // 3. Try Python tuple syntax: (1, 2, 3) -> [1, 2, 3]
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    try {
      const arrayForm = '[' + trimmed.slice(1, -1) + ']';
      return JSON.parse(arrayForm);
    } catch {}
    try {
      const arrayForm = '[' + trimmed.slice(1, -1).replace(/'/g, '"') + ']';
      return JSON.parse(arrayForm);
    } catch {}
  }

  // 4. Try numeric
  if (!isNaN(Number(trimmed))) {
    return Number(trimmed);
  }

  return trimmed;
}

const serializeValue = (val: any): string => {
  if (val === undefined || val === null) return '';
  if (typeof val === 'string') return val;
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
};

export const ProblemSolverPage: React.FC = () => {
  const { paperId, slug } = useParams<{ paperId?: string; slug?: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authPromptMessage, setAuthPromptMessage] = useState<string | undefined>(undefined);





  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'description' | 'theory' | 'solution' | 'notes'>('description');
  
  // Personal Notes state
  const [notes, setNotes] = useState<string>('');
  const [notesMode, setNotesMode] = useState<'write' | 'preview'>('write');
  const [notesCopied, setNotesCopied] = useState<boolean>(false);
  
  // Editor state
  const [code, setCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Testcase & execution state
  const [activeCaseIdx, setActiveCaseIdx] = useState<number>(0);
  const [resultCaseIdx, setResultCaseIdx] = useState<number>(0);
  const [bottomTab, setBottomTab] = useState<'testcase' | 'result' | 'repl'>('testcase');
  const [replInput, setReplInput] = useState<string>('');
  const replConsoleRef = useRef<HTMLDivElement>(null);
  const replOutputEndRef = useRef<HTMLDivElement>(null);
  const replInputRef = useRef<HTMLInputElement>(null);
  const [replHistory, setReplHistory] = useState<{ id: string; command: string; output: string; isError?: boolean }[]>([
    {
      id: 'init-1',
      command: '# Python WebAssembly REPL with NumPy & PyTorch tensors loaded',
      output: 'Ready! Type any Python expression (e.g. np.eye(3), arr.shape, x + 2) or click "Inspect Input Shapes".'
    }
  ]);
  const [isEvaluatingRepl, setIsEvaluatingRepl] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmission, setIsSubmission] = useState<boolean>(false);
  const [execReport, setExecReport] = useState<ExecutionReport | null>(null);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [solutionCopied, setSolutionCopied] = useState<boolean>(false);
  const [solutionApplied, setSolutionApplied] = useState<boolean>(false);
  const [mobileActivePanel, setMobileActivePanel] = useState<'problem' | 'code'>('problem');
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const syncDark = () => {
      setIsDarkTheme(document.documentElement.classList.contains('dark'));
    };
    window.addEventListener('toniclite_theme_change', syncDark);
    window.addEventListener('storage', syncDark);


    const observer = new MutationObserver(() => syncDark());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      window.removeEventListener('toniclite_theme_change', syncDark);
      window.removeEventListener('storage', syncDark);
      observer.disconnect();
    };
  }, []);

  // Prev / Next navigation & Drawer State
  const [prevSlug, setPrevSlug] = useState<string | null>(null);
  const [nextSlug, setNextSlug] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [currentPaper, setCurrentPaper] = useState<ResearchPaper | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<any | null>(null);
  const [catalogProblems, setCatalogProblems] = useState<ProblemSummary[]>([]);
  const [solvedSet, setSolvedSet] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Splitter resizable panel state
  const [leftWidthPct, setLeftWidthPct] = useState<number>(() => {
    const saved = localStorage.getItem('tensortonic_left_panel_width');
    return saved ? Math.max(25, Math.min(75, parseFloat(saved))) : 50;
  });
  const [bottomHeightPx, setBottomHeightPx] = useState<number>(() => {
    const saved = localStorage.getItem('tensortonic_bottom_panel_height');
    return saved ? Math.max(120, Math.min(600, parseFloat(saved))) : 260;
  });
  const [isDraggingH, setIsDraggingH] = useState<boolean>(false); // Vertical splitter (left vs right)
  const [isDraggingV, setIsDraggingV] = useState<boolean>(false); // Horizontal splitter (editor vs testcase)

  // Vertical splitter (resizing left vs right panels horizontally)
  const handleMouseDownH = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingH(true);
  }, []);

  useEffect(() => {
    if (!isDraggingH) return;
    const handleMouseMove = (e: MouseEvent) => {
      const pct = (e.clientX / window.innerWidth) * 100;
      const clamped = Math.max(20, Math.min(80, pct));
      setLeftWidthPct(clamped);
      localStorage.setItem('tensortonic_left_panel_width', clamped.toString());
    };
    const handleMouseUp = () => {
      setIsDraggingH(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingH]);

  // Horizontal splitter (resizing editor vs bottom testcase panel vertically)
  const handleMouseDownV = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDraggingV(true);
  }, []);

  useEffect(() => {
    if (!isDraggingV) return;
    const handleMove = (clientY: number) => {
      const h = window.innerHeight - clientY;
      const clamped = Math.max(100, Math.min(window.innerHeight - 140, h));
      setBottomHeightPx(clamped);
      localStorage.setItem('tensortonic_bottom_panel_height', clamped.toString());
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      setIsDraggingV(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDraggingV]);

  useEffect(() => {
    if (!slug) return;
    async function load() {
      setLoading(true);
      setActiveTab('description');
      setBottomTab('testcase');
      setActiveCaseIdx(0);
      setResultCaseIdx(0);
      const data = await getProblemDetail(slug!);
      setProblem(data);

      if (data) {
        const initialCode = data.starterCode || 'def solution():\n    pass\n';
        const u = getCurrentUser();
        setCode(u ? getUserSavedCode(slug!, initialCode, u.id) : getSavedCode(slug!, initialCode));
      }

      // Load personal notes
      const uCurrent = getCurrentUser();
      setNotes(getSavedNotes(slug!, uCurrent?.id));

      // Check solved status
      const u = getCurrentUser();
      const solved = u ? getUserSolvedProblems(u.id) : getSolvedProblems();
      setSolvedSet(solved);
      setIsSolved(solved.has(slug!));

      // Load catalog for drawer navigation
      const catalog = await getProblemCatalog();
      setCatalogProblems(catalog.problems);

      // Check if this problem belongs to an assessment (only when arriving from /interview or with ?assessment= query param)
      const urlAssessmentId = searchParams.get('assessment');
      const isInterviewRoute = location.pathname.startsWith('/interview');
      const isAssessmentMode = Boolean(urlAssessmentId || isInterviewRoute);

      const assessContext = isAssessmentMode ? await getAssessmentForProblem(slug!, urlAssessmentId) : null;

      if (assessContext) {
        setCurrentAssessment(assessContext.assessment);
        setCurrentPaper(null);
        setTotalItems(assessContext.flatProblems.length);
        setCurrentIndex(assessContext.currentIndex);
        const aId = assessContext.assessment.id;
        setPrevSlug(
          assessContext.currentIndex > 0
            ? `/interview/solve/${assessContext.flatProblems[assessContext.currentIndex - 1].slug}?assessment=${aId}`
            : null
        );
        setNextSlug(
          assessContext.currentIndex < assessContext.flatProblems.length - 1
            ? `/interview/solve/${assessContext.flatProblems[assessContext.currentIndex + 1].slug}?assessment=${aId}`
            : null
        );
      } else if (paperId) {
        setCurrentAssessment(null);
        const papers = await getResearchPapers();
        const normId = paperId.toLowerCase().replace(/[^a-z0-9]/g, '');
        const foundPaper = papers.find(p => p.id === paperId || p.id.toLowerCase().replace(/[^a-z0-9]/g, '') === normId);
        setCurrentPaper(foundPaper || null);
        if (foundPaper && foundPaper.topics) {
          setTotalItems(foundPaper.topics.length);
          const tIdx = foundPaper.topics.findIndex(t => t.problemId === slug || t.id === slug);
          setCurrentIndex(tIdx);
          if (tIdx !== -1) {
            setPrevSlug(tIdx > 0 ? `/research/${paperId}/${foundPaper.topics[tIdx - 1].problemId || foundPaper.topics[tIdx - 1].id}` : null);
            setNextSlug(tIdx < foundPaper.topics.length - 1 ? `/research/${paperId}/${foundPaper.topics[tIdx + 1].problemId || foundPaper.topics[tIdx + 1].id}` : null);
          }
        }
      } else {
        setCurrentAssessment(null);
        setCurrentPaper(null);
        setTotalItems(catalog.problems.length);
        const idx = catalog.problems.findIndex(p => p.slug === slug || p.id === slug);
        setCurrentIndex(idx);
        if (idx !== -1) {
          setPrevSlug(idx > 0 ? `/problems/${catalog.problems[idx - 1].slug}` : null);
          setNextSlug(idx < catalog.problems.length - 1 ? `/problems/${catalog.problems[idx + 1].slug}` : null);
        }
      }

      setLoading(false);
      setExecReport(null);
    }
    load();
  }, [paperId, slug, searchParams, location.pathname]);

  // Listen to profile / account changes across app
  useEffect(() => {
    const handleAuthChange = () => {
      const u = getCurrentUser();
      setCurrentUser(u);
      const solved = u ? getUserSolvedProblems(u.id) : getSolvedProblems();
      setSolvedSet(solved);
      if (slug) {
        setIsSolved(solved.has(slug));
        if (problem?.starterCode) {
          setCode(u ? getUserSavedCode(slug, problem.starterCode, u.id) : getSavedCode(slug, problem.starterCode));
        }
        setNotes(getSavedNotes(slug, u?.id));
      }
    };
    window.addEventListener('tensortonic_auth_change', handleAuthChange);
    return () => window.removeEventListener('tensortonic_auth_change', handleAuthChange);
  }, [slug, problem]);

  // Personal Notes handlers
  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (slug) {
      saveNotes(slug, value, currentUser?.id);
    }
  };

  const handleCopyNotes = () => {
    if (!notes.trim()) return;
    navigator.clipboard.writeText(notes);
    setNotesCopied(true);
    setTimeout(() => setNotesCopied(false), 2000);
  };

  const handleClearNotes = () => {
    if (!notes.trim()) return;
    if (window.confirm('Are you sure you want to clear your notes for this problem?')) {
      setNotes('');
      if (slug) {
        saveNotes(slug, '', currentUser?.id);
      }
    }
  };

  // Handle Code Change
  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    if (slug) {
      if (currentUser) {
        saveUserCode(slug, newCode, currentUser.id);
      } else {
        saveCode(slug, newCode);
      }
    }
  };

  const editorRef = useRef<any>(null);

  const handleResetCode = () => {
    if (problem?.starterCode && slug) {
      setCode(problem.starterCode);
      if (editorRef.current) {
        editorRef.current.setValue(problem.starterCode);
      }
      if (currentUser) {
        saveUserCode(slug, problem.starterCode, currentUser.id);
      } else {
        saveCode(slug, problem.starterCode);
      }
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const extractSolutionCode = (solutionText: string | undefined | null): string => {
    if (!solutionText) return '';
    const blocks = [...solutionText.matchAll(/```(?:python|py)?\s*([\s\S]*?)```/g)]
      .map(m => m[1].trim())
      .filter(b => b.length > 0);
    if (blocks.length > 0) {
      return blocks.reduce((prev, curr) => (curr.length > prev.length ? curr : prev));
    }
    return solutionText.trim();
  };

  const handleApplySolution = () => {
    if (!problem?.solution) return;
    const refCode = extractSolutionCode(problem.solution);
    if (refCode && slug) {
      setCode(refCode);
      if (editorRef.current) {
        editorRef.current.setValue(refCode);
      }
      if (currentUser) {
        saveUserCode(slug, refCode, currentUser.id);
      } else {
        saveCode(slug, refCode);
      }
      setSolutionApplied(true);
      setTimeout(() => setSolutionApplied(false), 2000);
    }
  };

  const handleCopySolution = () => {
    if (!problem?.solution) return;
    const refCode = extractSolutionCode(problem.solution);
    if (refCode) {
      navigator.clipboard.writeText(refCode);
      setSolutionCopied(true);
      setTimeout(() => setSolutionCopied(false), 2000);
    }
  };

  // Determine function name from starter code or metadata
  const getFunctionName = (): string => {
    if (problem?.functionMetadata?.name) return problem.functionMetadata.name;
    const activeCode = editorRef.current ? editorRef.current.getValue() : code;
    const match = activeCode.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
    if (match) return match[1];
    return slug?.replace(/[^a-zA-Z0-9_]/g, '_') || 'solution';
  };

  // Default sample test cases (strictly 1 or 2 test cases)
  const defaultSampleCases = useMemo<ActiveTestCase[]>(() => {
    if (!problem?.testCases || problem.testCases.length === 0) {
      return [{
        id: 'case-1',
        name: 'Case 1',
        isCustom: false,
        rawInputs: { x: '[0, 2, -2]' },
        rawExpectedOutput: '[0.5, 0.880797, 0.119203]'
      }];
    }
    const pub = problem.testCases.filter(tc => tc.isPublic !== false);
    const selected = pub.length > 0 ? pub.slice(0, 2) : problem.testCases.slice(0, 2);
    return selected.map((tc, idx) => ({
      id: tc.id || `case-${idx + 1}`,
      name: tc.name || `Case ${idx + 1}`,
      isCustom: false,
      rawInputs: Object.fromEntries(
        Object.entries(tc.inputs || {}).map(([k, v]) => [k, serializeValue(v)])
      ),
      rawExpectedOutput: serializeValue(tc.expectedOutput)
    }));
  }, [problem]);

  const [activeTestCases, setActiveTestCases] = useState<ActiveTestCase[]>([]);

  useEffect(() => {
    if (!slug) return;
    try {
      const saved = localStorage.getItem(`toniclite_user_cases_${slug}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setActiveTestCases(parsed);
          setActiveCaseIdx(0);
          return;
        }
      }
    } catch {}
    setActiveTestCases(defaultSampleCases);
    setActiveCaseIdx(0);
  }, [slug, defaultSampleCases]);

  const parsedActiveInputs = useMemo(() => {
    const currentCases = activeTestCases.length > 0 ? activeTestCases : defaultSampleCases;
    const activeCase = currentCases[activeCaseIdx] || currentCases[0];
    if (!activeCase?.rawInputs) return {};
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(activeCase.rawInputs)) {
      res[k] = parseInputValue(v);
    }
    return res;
  }, [activeTestCases, activeCaseIdx, defaultSampleCases]);

  const saveTestCases = (cases: ActiveTestCase[]) => {
    setActiveTestCases(cases);
    if (slug) {
      try {
        localStorage.setItem(`toniclite_user_cases_${slug}`, JSON.stringify(cases));
      } catch {}
    }
  };

  const handleAddTestCase = () => {
    const current = activeTestCases.length > 0 ? activeTestCases : defaultSampleCases;
    const templateCase = current[0] || defaultSampleCases[0];
    const initialInputs: Record<string, string> = {};

    if (templateCase && Object.keys(templateCase.rawInputs).length > 0) {
      for (const [k, v] of Object.entries(templateCase.rawInputs)) {
        initialInputs[k] = v;
      }
    } else if (problem?.functionMetadata?.parameters?.length) {
      for (const p of problem.functionMetadata.parameters) {
        initialInputs[p.name] = '[]';
      }
    } else {
      initialInputs['input'] = '[]';
    }

    const nextIndex = current.length + 1;
    const newCase: ActiveTestCase = {
      id: `custom-case-${Date.now()}`,
      name: `Case ${nextIndex}`,
      isCustom: true,
      rawInputs: initialInputs,
      rawExpectedOutput: ''
    };

    const updated = [...current, newCase];
    saveTestCases(updated);
    setActiveCaseIdx(updated.length - 1);
  };

  const handleRemoveTestCase = (indexToRemove: number) => {
    const current = activeTestCases.length > 0 ? activeTestCases : defaultSampleCases;
    const updated = current.filter((_, idx) => idx !== indexToRemove);
    saveTestCases(updated);
    setActiveCaseIdx(prev => Math.max(0, Math.min(prev, updated.length - 1)));
  };

  const handleResetTestCases = () => {
    saveTestCases(defaultSampleCases);
    if (slug) {
      try {
        localStorage.removeItem(`toniclite_user_cases_${slug}`);
      } catch {}
    }
    setActiveCaseIdx(0);
  };

  const handleUpdateInput = (paramKey: string, newValue: string) => {
    const current = activeTestCases.length > 0 ? activeTestCases : defaultSampleCases;
    const updated = current.map((tc, idx) => {
      if (idx !== activeCaseIdx) return tc;
      return {
        ...tc,
        rawInputs: {
          ...tc.rawInputs,
          [paramKey]: newValue
        }
      };
    });
    saveTestCases(updated);
  };

  const handleUpdateExpected = (newValue: string) => {
    const current = activeTestCases.length > 0 ? activeTestCases : defaultSampleCases;
    const updated = current.map((tc, idx) => {
      if (idx !== activeCaseIdx) return tc;
      return {
        ...tc,
        rawExpectedOutput: newValue
      };
    });
    saveTestCases(updated);
  };

  const handleAddParam = () => {
    const paramName = window.prompt('Enter parameter name:');
    if (!paramName || !paramName.trim()) return;
    const cleanName = paramName.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!cleanName) return;

    const current = activeTestCases.length > 0 ? activeTestCases : defaultSampleCases;
    const updated = current.map((tc, idx) => {
      if (idx !== activeCaseIdx) return tc;
      return {
        ...tc,
        rawInputs: {
          ...tc.rawInputs,
          [cleanName]: '[]'
        }
      };
    });
    saveTestCases(updated);
  };

  const handleRemoveParam = (paramKey: string) => {
    const current = activeTestCases.length > 0 ? activeTestCases : defaultSampleCases;
    const updated = current.map((tc, idx) => {
      if (idx !== activeCaseIdx) return tc;
      const nextInputs = { ...tc.rawInputs };
      delete nextInputs[paramKey];
      return {
        ...tc,
        rawInputs: nextInputs
      };
    });
    saveTestCases(updated);
  };

  // Run sample & custom test cases
  const handleRun = async () => {
    if (!problem || isRunning) return;
    setIsRunning(true);
    setIsSubmission(false);
    setBottomTab('result');
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileActivePanel('code');
    }

    const currentCode = editorRef.current ? editorRef.current.getValue() : code;
    const casesToRun = (activeTestCases.length > 0 ? activeTestCases : defaultSampleCases).map((tc, idx) => {
      const parsedInputs: Record<string, any> = {};
      for (const [k, v] of Object.entries(tc.rawInputs || {})) {
        parsedInputs[k] = parseInputValue(v);
      }
      const parsedExpected = tc.rawExpectedOutput && tc.rawExpectedOutput.trim() !== ''
        ? parseInputValue(tc.rawExpectedOutput)
        : undefined;

      return {
        id: tc.id || `case-${idx + 1}`,
        name: tc.name || `Case ${idx + 1}`,
        inputs: parsedInputs,
        expectedOutput: parsedExpected
      };
    });

    const report = await runPythonCode(currentCode, getFunctionName(), casesToRun);
    setExecReport(report);
    const firstFail = report.results.findIndex(r => !r.passed);
    setResultCaseIdx(firstFail !== -1 ? firstFail : 0);
    setIsRunning(false);
  };

  // Submit against comprehensive suite (7 test cases)
  const handleSubmit = async () => {
    if (!problem || isRunning) return;
    setIsRunning(true);
    setIsSubmission(true);
    setBottomTab('result');
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileActivePanel('code');
    }

    const baseTestCases = problem.testCases && problem.testCases.length > 0
      ? problem.testCases
      : (activeTestCases.length > 0 ? activeTestCases.map((tc, idx) => ({
          id: tc.id || `case-${idx + 1}`,
          name: tc.name || `Case ${idx + 1}`,
          inputs: Object.fromEntries(Object.entries(tc.rawInputs).map(([k, v]) => [k, parseInputValue(v)])),
          expectedOutput: tc.rawExpectedOutput ? parseInputValue(tc.rawExpectedOutput) : undefined,
          isPublic: true
        })) : []);

    const currentCode = editorRef.current ? editorRef.current.getValue() : code;
    const report = await runPythonSubmission(currentCode, getFunctionName(), baseTestCases, problem.solution, 7);
    setExecReport(report);

    const firstFail = report.results.findIndex(r => !r.passed);
    setResultCaseIdx(firstFail !== -1 ? firstFail : 0);
    setIsRunning(false);

    const passedCount = report.results.filter(r => r.passed).length;
    const totalCount = report.results.length;

    if (currentUser && slug) {
      recordUserSubmission(slug, report.success, report.totalTimeMs, passedCount, totalCount, currentUser.id);
    }

    if (report.success && slug) {
      markProblemSolved(slug);
      setIsSolved(true);
      setSolvedSet((prev) => new Set([...prev, slug]));
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#93C572', '#10B981', '#34D399', '#6EE7B7']
      });
    }
  };

  // Interactive Python REPL executor
  const handleExecuteRepl = async (commandToRun?: string) => {
    const cmd = (commandToRun !== undefined ? commandToRun : replInput).trim();
    if (!cmd) return;

    if (commandToRun === undefined) {
      setReplInput('');
    }

    setIsEvaluatingRepl(true);
    // Instant scroll to bottom when evaluation starts so user sees the spinner/progress
    setTimeout(() => {
      if (replConsoleRef.current) {
        replConsoleRef.current.scrollTop = replConsoleRef.current.scrollHeight;
      }
      replOutputEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 10);

    const currentCode = editorRef.current ? editorRef.current.getValue() : code;

    const res = await runPythonRepl(cmd, currentCode);
    setIsEvaluatingRepl(false);

    setReplHistory(prev => [
      ...prev,
      {
        id: `repl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        command: cmd,
        output: res.error || res.output,
        isError: Boolean(res.error)
      }
    ]);

    // Keep focus on input for fast rapid-fire typing
    setTimeout(() => {
      replInputRef.current?.focus();
      if (replConsoleRef.current) {
        replConsoleRef.current.scrollTop = replConsoleRef.current.scrollHeight;
      }
      replOutputEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  // Auto-scroll REPL console to show the newest response whenever history or evaluation state updates
  useEffect(() => {
    if (bottomTab === 'repl' || isEvaluatingRepl) {
      const scrollDown = () => {
        if (replConsoleRef.current) {
          replConsoleRef.current.scrollTop = replConsoleRef.current.scrollHeight;
        }
        replOutputEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
      scrollDown();
      const t = setTimeout(scrollDown, 60);
      return () => clearTimeout(t);
    }
  }, [replHistory, isEvaluatingRepl, bottomTab]);

  const handleInspectShapesQuickly = () => {
    const currentCases = activeTestCases.length > 0 ? activeTestCases : defaultSampleCases;
    const activeCase = currentCases[activeCaseIdx] || currentCases[0];
    const inputKeys = Object.keys(activeCase?.rawInputs || {});

    const lines: string[] = ['import numpy as np', 'print("=== TENSOR SHAPES & TYPES ===")'];
    if (inputKeys.length > 0) {
      inputKeys.forEach(k => {
        lines.push(`__raw_${k} = ${activeCase.rawInputs[k]}`);
        lines.push(`__arr_${k} = np.asarray(__raw_${k}) if not hasattr(__raw_${k}, 'shape') else __raw_${k}`);
        lines.push(`print("${k}: shape =", getattr(__arr_${k}, 'shape', 'scalar'), "| type =", type(__arr_${k}).__name__)`);
      });
    } else {
      lines.push('print("No inputs defined in current test case.")');
    }

    handleExecuteRepl(lines.join('\n'));
  };

  // Navigation refs & handlers for Alt+Left / Alt+Right question switching
  const prevSlugRef = useRef(prevSlug);
  prevSlugRef.current = prevSlug;

  const nextSlugRef = useRef(nextSlug);
  nextSlugRef.current = nextSlug;

  const navigateToPrev = useCallback(() => {
    const target = prevSlugRef.current;
    if (!target) return;
    setActiveTab('description');
    navigate(target.startsWith('/') ? target : `/problems/${target}`);
  }, [navigate]);

  const navigateToNext = useCallback(() => {
    const target = nextSlugRef.current;
    if (!target) return;
    setActiveTab('description');
    navigate(target.startsWith('/') ? target : `/problems/${target}`);
  }, [navigate]);

  // Stable refs & debounced triggers for keyboard shortcuts
  const handleRunRef = useRef(handleRun);
  handleRunRef.current = handleRun;

  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  const lastActionTimeRef = useRef<number>(0);

  const triggerRun = useCallback(() => {
    const now = Date.now();
    if (now - lastActionTimeRef.current < 400) return;
    lastActionTimeRef.current = now;
    handleRunRef.current();
  }, []);

  const triggerSubmit = useCallback(() => {
    const now = Date.now();
    if (now - lastActionTimeRef.current < 400) return;
    lastActionTimeRef.current = now;
    handleSubmitRef.current();
  }, []);

  // Global keyboard shortcuts: Alt+Left / Alt+Right (Navigate) & Ctrl+Enter (Run) & Ctrl+Alt+Enter (Submit)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Alt + Left Arrow -> Previous Question
      if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'ArrowLeft' || e.code === 'ArrowLeft')) {
        e.preventDefault();
        navigateToPrev();
        return;
      }

      // Alt + Right Arrow -> Next Question
      if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'ArrowRight' || e.code === 'ArrowRight')) {
        e.preventDefault();
        navigateToNext();
        return;
      }

      // Enter keys for Run / Submit
      if (e.key !== 'Enter' && e.code !== 'Enter' && e.code !== 'NumpadEnter') return;
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (!isCtrlOrCmd) return;

      if (e.altKey) {
        e.preventDefault();
        triggerSubmit();
      } else if (!e.shiftKey) {
        e.preventDefault();
        triggerRun();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [triggerRun, triggerSubmit, navigateToPrev, navigateToNext]);

  // Monaco editor mount handler: registers editor-level actions & keybindings
  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;

    // Previous Problem: Alt + Left
    editor.addAction({
      id: 'prev-problem',
      label: 'Previous Problem (Alt+Left)',
      keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.LeftArrow],
      run: () => {
        navigateToPrev();
      }
    });

    // Next Problem: Alt + Right
    editor.addAction({
      id: 'next-problem',
      label: 'Next Problem (Alt+Right)',
      keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.RightArrow],
      run: () => {
        navigateToNext();
      }
    });

    // Run Code: Ctrl/Cmd + Enter
    editor.addAction({
      id: 'run-code',
      label: 'Run Code (Ctrl+Enter)',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        triggerRun();
      }
    });

    // Submit Solution: Ctrl/Cmd + Alt/Option + Enter
    editor.addAction({
      id: 'submit-solution',
      label: 'Submit Solution (Ctrl+Alt+Enter)',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Enter],
      run: () => {
        triggerSubmit();
      }
    });
  }, [triggerRun, triggerSubmit, navigateToPrev, navigateToNext]);

  const getDifficultyBadge = (diff: Difficulty) => {
    switch (diff) {
      case 'Easy':
        return (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80" />
            Easy
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium border-amber-500/20 bg-amber-500/10 text-amber-400">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80" />
            Medium
          </span>
        );
      case 'Hard':
        return (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium border-rose-500/20 bg-rose-500/10 text-rose-400">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80" />
            Hard
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#93C572] border-t-transparent rounded-full animate-spin" />
          <div className="text-sm text-muted-foreground font-mono">Loading problem specification...</div>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-background gap-4">
        <h2 className="text-xl font-bold">Problem not found</h2>
        <Link 
          to={paperId ? `/research?paper=${paperId}` : "/problems"} 
          className="px-4 py-2 rounded-lg bg-[#93C572] text-black font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          {paperId ? "Return to Paper Curriculum" : "Return to Problems Catalog"}
        </Link>
      </div>
    );
  }

  const testCases = problem.testCases || [{ id: 'case-1', name: 'Case 1', inputs: { x: [0, 2, -2] } }];

  return (
    <>
      {/* Problem Quick-Navigation Sidebar Drawer */}
      <ProblemDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentSlug={slug}
        problems={catalogProblems}
        solvedSet={solvedSet}
        paperId={paperId}
        currentPaper={currentPaper}
        currentAssessment={currentAssessment}
      />

      <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden bg-background relative">
        {(isDraggingH || isDraggingV) && (
          <div
            className={`fixed inset-0 z-50 select-none ${
              isDraggingH ? 'cursor-col-resize' : 'cursor-row-resize'
            }`}
            style={{ pointerEvents: 'auto' }}
          />
        )}

        {/* Mobile View Selector & Action Bar (< md) */}
        <div className="md:hidden flex items-center justify-between px-3 sm:px-4 py-2 bg-card border-b border-border/80 text-xs shrink-0 z-20">
          <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-lg border border-border/60">
            <button
              onClick={() => setMobileActivePanel('problem')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                mobileActivePanel === 'problem'
                  ? 'bg-background text-[#93C572] shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setMobileActivePanel('code')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                mobileActivePanel === 'code'
                  ? 'bg-background text-[#38BDF8] shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Code
            </button>
          </div>

          <div className="flex items-center gap-2 pr-1.5">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-secondary hover:bg-accent border border-border text-foreground text-xs font-medium disabled:opacity-50"
              title="Run code (Ctrl + Enter)"
            >
              <Play className="w-3 h-3 fill-current text-[#93C572]" />
              <span>Run</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={isRunning}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md bg-[#93C572] hover:bg-[#85b964] text-black text-xs font-bold disabled:opacity-50 shadow-xs mr-1"
              title="Submit code (Ctrl + Alt + Enter)"
            >
              <Send className="w-3 h-3" />
              <span>Submit</span>
            </button>
          </div>
        </div>
        
        {/* LEFT PANEL: Problem Info, Theory, Solution */}
        <div
          className={`${
            mobileActivePanel === 'problem' ? 'flex' : 'hidden md:flex'
          } w-full md:w-auto h-full flex-col border-r border-border bg-card flex-shrink-0 overflow-hidden`}
          style={{ width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${leftWidthPct}%` : undefined }}
        >
          
          {/* Navigation / Tab bar */}
          <nav className="flex items-center justify-between px-3 md:px-4 h-12 border-b border-border text-xs sm:text-sm bg-secondary/30 flex-shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-3 h-full">
              {/* Browse Problems Sidebar Button (Handles Assessment, Research paper, and Problems catalog) */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/80 bg-background/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors text-xs font-medium shadow-xs"
                title={
                  currentAssessment
                    ? `Assessment: ${currentAssessment.name}`
                    : paperId
                    ? (currentPaper?.title || "Paper Syllabus")
                    : "Browse problems catalog"
                }
              >
                {currentAssessment ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#93C572]" />
                ) : (
                  <PanelLeft className="w-3.5 h-3.5 text-[#93C572]" />
                )}
                <span className="hidden sm:inline font-semibold truncate max-w-[170px]">
                  {currentAssessment ? currentAssessment.name : paperId ? (currentPaper?.title || 'Paper') : 'Problems'}
                </span>
                {currentIndex !== -1 && (
                  <span className="hidden sm:inline-block text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border/40">
                    #{currentIndex + 1}/{totalItems || (paperId || currentAssessment ? '' : catalogProblems.length || 790)}
                  </span>
                )}
              </button>

              <div className="h-4 w-px bg-border/60" />

              <button
                onClick={() => setActiveTab('description')}
                className={`h-full border-b-2 font-medium transition-colors flex items-center gap-1 sm:gap-1.5 px-2 sm:px-1 ${
                  activeTab === 'description'
                    ? 'border-[#93C572] text-foreground font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Description</span>
              </button>
              <button
                onClick={() => setActiveTab('theory')}
                className={`h-full border-b-2 font-medium transition-colors flex items-center gap-1 sm:gap-1.5 px-2 sm:px-1 ${
                  activeTab === 'theory'
                    ? 'border-[#93C572] text-foreground font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Theory</span>
              </button>
              <button
                onClick={() => setActiveTab('solution')}
                className={`h-full border-b-2 font-medium transition-colors flex items-center gap-1 sm:gap-1.5 px-2 sm:px-1 ${
                  activeTab === 'solution'
                    ? 'border-[#93C572] text-foreground font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Solution</span>
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`h-full border-b-2 font-medium transition-colors flex items-center gap-1 sm:gap-1.5 px-2 sm:px-1 relative ${
                  activeTab === 'notes'
                    ? 'border-[#93C572] text-foreground font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                title="Personal Notes"
              >
                <NotebookPen className="w-3.5 h-3.5" />
                <span>Notes</span>
                {notes.trim().length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#93C572] ml-0.5" title="Has notes" />
                )}
              </button>
            </div>

            {/* Prev / Next controls in side panel */}
            <div className="flex items-center gap-1">
              {prevSlug ? (
                <Link
                  to={prevSlug.startsWith('/') ? prevSlug : `/problems/${prevSlug}`}
                  onClick={() => setActiveTab('description')}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title="Previous problem (Alt + Left)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              ) : (
                <span className="p-1 text-muted-foreground/30"><ChevronLeft className="w-4 h-4" /></span>
              )}

              {nextSlug ? (
                <Link
                  to={nextSlug.startsWith('/') ? nextSlug : `/problems/${nextSlug}`}
                  onClick={() => setActiveTab('description')}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title="Next problem (Alt + Right)"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <span className="p-1 text-muted-foreground/30"><ChevronRight className="w-4 h-4" /></span>
              )}
            </div>
          </nav>

          {/* Tab Content */}
          <div className={`flex-1 overflow-y-auto problem-scrollbar ${
            activeTab === 'notes'
              ? 'p-2.5 sm:p-3.5 md:p-4 pb-2.5 sm:pb-3 md:pb-3 flex flex-col'
              : 'p-3 sm:p-4 md:p-5 pb-6 sm:pb-5 md:pb-4'
          }`}>
            {activeTab === 'description' && (
              <div className="space-y-4 sm:space-y-6">
                
                {/* Header: Title, Tags, Difficulty */}
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                      {problem.title.replace(/^#\s*/, '').replace(/<[^>]+>/g, '')}
                    </h1>
                    <div className="mt-2 sm:mt-2.5 flex flex-wrap gap-1.5 items-center">
                      {(problem.tags || []).map(t => (
                        <span key={t} className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-secondary/50 px-2 sm:px-2.5 py-0.5 text-xs text-muted-foreground">
                          <Tag className="w-3 h-3 text-muted-foreground" />
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getDifficultyBadge(problem.difficulty || 'Medium')}
                    {isSolved && (
                      <button
                        onClick={() => {
                          if (slug) {
                            unmarkProblemSolved(slug);
                            unmarkUserProblemSolved(slug, currentUser?.id);
                            setIsSolved(false);
                            setSolvedSet((prev) => {
                              const next = new Set(prev);
                              next.delete(slug);
                              return next;
                            });
                          }
                        }}
                        title="Click to mark as unsolved"
                        className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-red-400 bg-emerald-500/10 hover:bg-red-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 hover:border-red-500/30 font-medium transition-colors cursor-pointer group"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 group-hover:hidden" />
                        <span className="group-hover:hidden">Solved</span>
                        <span className="hidden group-hover:inline">Unmark</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-b border-border/60" />

              {/* Problem Description & Math */}
              <div>
                <MathView
                  content={(problem.description || '')
                    .replace(/^#+\s+[^\n]+\n*/, '')
                    .replace(/^###\s+Overview\s*\n+/i, '')}
                  allowPureCode={false}
                />
              </div>

              {/* Examples */}
              {problem.examples && problem.examples.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-3">Examples</h3>
                  <div className="space-y-3">
                    {problem.examples.map((ex, i) => {
                      let formattedEx = '';
                      if (typeof ex === 'string') {
                        formattedEx = ex;
                      } else if (ex && typeof ex === 'object') {
                        const parts: string[] = [];
                        if (ex.input !== undefined) parts.push(`Input: ${typeof ex.input === 'object' ? JSON.stringify(ex.input) : ex.input}`);
                        if (ex.output !== undefined) parts.push(`Output: ${typeof ex.output === 'object' ? JSON.stringify(ex.output) : ex.output}`);
                        if (ex.explanation) parts.push(`Explanation: ${ex.explanation}`);
                        formattedEx = parts.length > 0 ? parts.join('\n') : JSON.stringify(ex, null, 2);
                      } else {
                        formattedEx = String(ex);
                      }
                      return (
                        <div key={i} className="bg-muted/40 border border-border/80 rounded-lg p-3 font-mono text-xs">
                          <pre className="whitespace-pre-wrap text-muted-foreground">{formattedEx}</pre>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {problem.requirements && (
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">Requirements</h3>
                  <MathView content={problem.requirements} />
                </div>
              )}

              {/* Constraints */}
              {problem.constraints && (
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">Constraints</h3>
                  <MathView content={problem.constraints} />
                </div>
              )}

              {/* 3-Stage Progressive Hint Ladder */}
              <div className="pt-3 border-t border-border/60">
                <ProgressiveHintLadder
                  slug={problem.id || slug || 'problem'}
                  hints={problem.hints}
                  theory={problem.theory}
                  requirements={Array.isArray(problem.requirements) ? problem.requirements.join('\n') : problem.requirements}
                />
              </div>
            </div>
          )}

          {activeTab === 'theory' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <BookOpen className="w-4 h-4 text-[#93C572]" />
                <h2 className="text-base font-bold text-foreground">Theory & Mathematical Derivation</h2>
              </div>
              {problem.theory ? (
                <MathView content={problem.theory} allowPureCode={false} />
              ) : (
                <p className="text-sm text-muted-foreground">Theory notes are available in the course curriculum.</p>
              )}
            </div>
          )}

          {activeTab === 'solution' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">Reference Solution & Walkthrough</h2>
                    <p className="text-[11px] text-muted-foreground">Optimal vectorized Python & NumPy implementation</p>
                  </div>
                </div>
              </div>

              {problem.solution ? (
                <SolutionViewer
                  solution={problem.solution}
                  onApplySolution={handleApplySolution}
                  slug={(problem as any).slug || slug || 'problem'}
                  problemTitle={problem.title}
                />
              ) : (
                <div className="p-4 rounded-xl border border-border/80 bg-muted/20">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Solution walkthrough is being formulated for this problem.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="flex flex-col flex-1 min-h-0 space-y-2.5">
              {/* Notes Toolbar: Write, Preview, Copy, Delete */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60 flex-shrink-0">
                {/* Write / Preview segmented switch */}
                <div className="flex items-center bg-secondary/60 border border-border/70 rounded-md p-0.5 text-xs">
                  <button
                    onClick={() => setNotesMode('write')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all text-xs ${
                      notesMode === 'write'
                        ? 'bg-card text-foreground font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Write</span>
                  </button>
                  <button
                    onClick={() => setNotesMode('preview')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all text-xs ${
                      notesMode === 'preview'
                        ? 'bg-card text-foreground font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Preview</span>
                  </button>
                </div>

                {/* Right controls: Copy and Delete */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyNotes}
                    disabled={!notes.trim()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border/70 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title={notesCopied ? 'Copied to clipboard' : 'Copy notes'}
                  >
                    {notesCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{notesCopied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleClearNotes}
                    disabled={!notes.trim()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border/70 text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Delete notes"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>

              {/* Mode Views */}
              {notesMode === 'write' ? (
                <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
                  <textarea
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder={`Write your personal notes, reminders, edge cases, or LaTeX formulas here...\n\nExample:\n### Edge Cases to Remember\n- Ensure eps > 0 to prevent division by zero in $\\sqrt{\\hat{v}_t} + \\epsilon$\n- When axis=None, preserve flat vector dimensions\n\n### Math\n$$L_{BCE} = -\\frac{1}{N} \\sum_{i=1}^N \\left[ y_i \\log(\\hat{y}_i) + (1 - y_i) \\log(1 - \\hat{y}_i) \\right]$$`}
                    className="w-full flex-1 min-h-[200px] p-3 rounded-lg border border-border/80 bg-background/60 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#93C572] focus:border-[#93C572] resize-y leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5 flex-shrink-0">
                    <span className="flex items-center gap-1.5">
                      <span>💡 <strong>Tip:</strong> Use <code className="px-1 py-0.5 bg-secondary/80 rounded text-[10px]">$...$</code> for inline math and <code className="px-1 py-0.5 bg-secondary/80 rounded text-[10px]">$$...$$</code> for blocks.</span>
                    </span>
                    <span>
                      {notes.trim().split(/\s+/).filter(Boolean).length} words · {notes.length} characters
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-h-[200px] p-3 rounded-lg border border-border/80 bg-card/40 overflow-y-auto">
                  {notes.trim() ? (
                    <div className="prose prose-invert max-w-none text-xs sm:text-sm">
                      <MathView content={notes} allowPureCode={false} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 text-muted-foreground">
                      <NotebookPen className="w-7 h-7 opacity-40 mb-1" />
                      <p className="text-xs font-medium">No notes written yet</p>
                      <p className="text-[11px] max-w-sm">
                        Switch to <strong>Write</strong> mode to jot down your notes, edge case observations, or mathematical formulas.
                      </p>
                      <button
                        onClick={() => setNotesMode('write')}
                        className="mt-2 px-2.5 py-1 text-xs rounded-md bg-[#93C572]/15 text-[#93C572] hover:bg-[#93C572]/25 border border-[#93C572]/30 transition-colors"
                      >
                        Start writing notes
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* VERTICAL SPLITTER: Left Panel (Problems/Theory/Notes) vs Right Panel (Editor/TestCases) */}
      <div
        onMouseDown={handleMouseDownH}
        className={`hidden md:flex w-1.5 hover:w-2 cursor-col-resize bg-border/60 hover:bg-[#93C572] transition-colors items-center justify-center select-none z-20 group relative flex-shrink-0 ${
          isDraggingH ? 'bg-[#93C572] w-2' : ''
        }`}
        title="Drag to resize problem description and code editor panels"
      >
        <div className="w-0.5 h-8 bg-muted-foreground/40 group-hover:bg-black rounded-full" />
      </div>

      {/* RIGHT PANEL: Code Editor & Test Cases */}
      <div
        className={`${
          mobileActivePanel !== 'problem' ? 'flex' : 'hidden md:flex'
        } w-full md:w-auto flex-1 h-full flex-col bg-[#1e1e1e] overflow-hidden min-w-0`}
        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${100 - leftWidthPct}%` : undefined }}
      >
        
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 border-b border-border/80 bg-card flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetCode}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent transition-colors"
              title="Reset to starter code"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#93C572]/15 text-[#93C572] border border-[#93C572]/30">
              Py3
            </span>

            {/* Profile / Guest Status Badge */}
            {currentUser ? (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#93C572]/10 border border-[#93C572]/20 text-[11px] text-[#93C572] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#93C572]" />
                <span className="truncate max-w-[120px]">{currentUser.username}</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthPromptMessage('Create a profile or sign in with username and password to save your solutions and track solved problems.');
                  setIsAuthModalOpen(true);
                }}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-[11px] text-amber-300 font-medium transition-colors"
                title="Click to sign in or create an account"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Guest · Sign In</span>
              </button>
            )}
          </div>


          {/* Run & Submit (Hidden on mobile < md because the top mobile bar has them!) */}
          <div className="hidden md:flex items-center gap-2">
            {/* Run Button */}
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-input bg-card hover:bg-accent text-foreground transition-colors disabled:opacity-50"
              title="Run code (Ctrl + Enter)"
            >
              <Play className="w-3.5 h-3.5 text-[#93C572] fill-current" />
              <span>Run</span>
            </button>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#93C572] hover:bg-[#A4D287] text-black transition-colors shadow-sm disabled:opacity-50"
              title="Submit code (Ctrl + Alt + Enter)"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit</span>
            </button>
          </div>
        </div>

        {/* Monaco Editor (Flex Grow) */}
        <div className="flex-1 min-h-[120px] overflow-hidden">
          <Editor
            height="100%"
            language="python"
            theme={isDarkTheme ? "vs-dark" : "light"}
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', Consolas, monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              roundedSelection: true,
              automaticLayout: true,
              padding: { top: 8, bottom: 8 }
            }}
          />
        </div>

        {/* HORIZONTAL SPLITTER: Code Editor vs Test Cases */}
        <div
          onMouseDown={handleMouseDownV}
          onTouchStart={handleMouseDownV}
          className={`flex h-2.5 sm:h-1.5 hover:h-2 cursor-row-resize bg-border/60 hover:bg-[#93C572] transition-colors items-center justify-center select-none z-20 group relative flex-shrink-0 touch-none ${
            isDraggingV ? 'bg-[#93C572] h-2.5 sm:h-2' : ''
          }`}
          title="Drag to resize code editor and test case panels"
        >
          <div className="h-1 w-10 sm:h-0.5 sm:w-8 bg-muted-foreground/50 group-hover:bg-black rounded-full" />
        </div>

        {/* BOTTOM PANEL: Test Cases & Test Result */}
        <div
          className="flex flex-col border-t border-border bg-card flex-shrink-0 overflow-hidden"
          style={{ height: `${bottomHeightPx}px` }}
        >
          
          {/* Bottom Tabs */}
          <div className="flex items-center gap-4 px-3 sm:px-4 h-9 border-b border-border/80 bg-secondary/20 flex-shrink-0 text-xs">
            <button
              onClick={() => setBottomTab('testcase')}
              className={`flex items-center gap-1.5 h-full border-b-2 font-medium transition-colors ${
                bottomTab === 'testcase'
                  ? 'border-[#93C572] text-foreground font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              Testcase
            </button>
            <button
              onClick={() => setBottomTab('result')}
              className={`flex items-center gap-1.5 h-full border-b-2 font-medium transition-colors ${
                bottomTab === 'result'
                  ? 'border-[#93C572] text-foreground font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Test Result
              {execReport && (
                <span className={`w-2 h-2 rounded-full ${execReport.success ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              )}
            </button>
            <button
              onClick={() => setBottomTab('repl')}
              className={`flex items-center gap-1.5 h-full border-b-2 font-medium transition-colors ${
                bottomTab === 'repl'
                  ? 'border-[#93C572] text-foreground font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Python REPL & Shapes</span>
            </button>
          </div>

          {/* Bottom Panel Content */}
          <div className={`flex-1 overflow-y-auto problem-scrollbar font-mono text-xs ${
            bottomTab === 'repl' ? 'p-1.5 sm:p-2 pb-1.5' : 'p-2.5 sm:p-3 pb-3 md:pb-3'
          }`}>
            {bottomTab === 'testcase' && (() => {
              const currentCases = activeTestCases.length > 0 ? activeTestCases : defaultSampleCases;
              const activeCase = currentCases[activeCaseIdx] || currentCases[0];
              const hasModifications = JSON.stringify(currentCases) !== JSON.stringify(defaultSampleCases);

              return (
                <div className="space-y-3">
                  {/* Test Cases Tabs + Add Icon Button */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {currentCases.map((tc, idx) => (
                        <div key={tc.id || idx} className="relative group/tab">
                          <button
                            onClick={() => setActiveCaseIdx(idx)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                              activeCaseIdx === idx
                                ? 'bg-secondary text-foreground font-semibold border border-border shadow-xs'
                                : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground border border-transparent'
                            }`}
                          >
                            <span>Case {idx + 1}</span>
                            {tc.isCustom && (
                              <span className="text-[10px] px-1 py-0.2 rounded bg-[#93C572]/15 text-[#93C572] font-sans font-medium">
                                Custom
                              </span>
                            )}
                          </button>
                          {tc.isCustom && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTestCase(idx);
                              }}
                              className="opacity-0 group-hover/tab:opacity-100 absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-opacity shadow-xs"
                              title="Delete test case"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      ))}

                      {/* + Icon beside the list of cases */}
                      <button
                        onClick={handleAddTestCase}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-dashed border-border hover:border-[#93C572] text-muted-foreground hover:text-[#93C572] hover:bg-[#93C572]/10 transition-colors"
                        title="Add your own test case"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {hasModifications && (
                      <button
                        onClick={handleResetTestCases}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                        title="Reset to default sample test cases"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Cases</span>
                      </button>
                    )}
                  </div>

                  {/* Active Test Case Inputs & Expected Output */}
                  {activeCase && (
                    <div className="space-y-3 mt-3">
                      {/* Inputs List */}
                      <div className="space-y-2.5">
                        <div className="text-[11px] text-muted-foreground font-sans font-semibold uppercase tracking-wider">
                          Inputs
                        </div>
                        {Object.entries(activeCase.rawInputs || {}).map(([key, val]) => (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground font-mono font-medium">{key} =</span>
                              {activeCase.isCustom && Object.keys(activeCase.rawInputs).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveParam(key)}
                                  className="text-muted-foreground/50 hover:text-rose-400 text-[11px] transition-colors"
                                  title={`Remove parameter ${key}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <textarea
                              value={val}
                              onChange={(e) => handleUpdateInput(key, e.target.value)}
                              rows={typeof val === 'string' && val.includes('\n') ? 3 : 1}
                              className="w-full px-3 py-1.5 rounded-md bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border focus:border-[#93C572] focus:ring-1 focus:ring-[#93C572] font-mono text-xs text-foreground outline-none transition-all resize-y min-h-[32px]"
                              placeholder={`Enter value for ${key}...`}
                              spellCheck={false}
                            />
                          </div>
                        ))}

                        {activeCase.isCustom && (
                          <div className="pt-0.5">
                            <button
                              type="button"
                              onClick={handleAddParam}
                              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-[#93C572] font-medium transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add parameter</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Expected Output */}
                      <div className="space-y-1.5 pt-3 border-t border-border/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-mono font-medium">Expected Output =</span>
                          <span className="text-[10px] text-muted-foreground/60 font-sans">(optional, compares when Run)</span>
                        </div>
                        <textarea
                          value={activeCase.rawExpectedOutput}
                          onChange={(e) => handleUpdateExpected(e.target.value)}
                          rows={typeof activeCase.rawExpectedOutput === 'string' && activeCase.rawExpectedOutput.includes('\n') ? 3 : 1}
                          className="w-full px-3 py-1.5 rounded-md bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border focus:border-[#93C572] focus:ring-1 focus:ring-[#93C572] font-mono text-xs text-foreground outline-none transition-all resize-y min-h-[32px]"
                          placeholder="e.g. [0.5, 0.88, 0.12] or (w, b) or 42"
                          spellCheck={false}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {bottomTab === 'result' && (
              <div>
                {isRunning ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-[#93C572] border-t-transparent rounded-full animate-spin" />
                    <span>
                      {isSubmission 
                        ? 'Evaluating against 7 comprehensive test cases in Python WebAssembly engine...' 
                        : 'Executing sample test cases in WebAssembly Python engine...'}
                    </span>
                  </div>
                ) : !execReport ? (
                  <div className="text-muted-foreground">Click "Run" for sample checks or "Submit" to evaluate over 7 test cases.</div>
                ) : execReport.stderr ? (
                  <div className="space-y-2 text-rose-400">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      Runtime Error
                    </div>
                    <pre className="whitespace-pre-wrap bg-rose-950/20 p-3 rounded border border-rose-800/40 text-[11px]">
                      {execReport.stderr}
                    </pre>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div className="flex items-center gap-2">
                        {execReport.success ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="font-bold text-sm text-emerald-400">
                              {isSubmission
                                ? `Accepted (${execReport.results.length}/${execReport.results.length} test cases passed)`
                                : `Sample Test Cases Passed (${execReport.results.length}/${execReport.results.length})`}
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                            <span className="font-bold text-sm text-rose-400">
                              {isSubmission
                                ? `Wrong Answer (${execReport.results.filter(r => r.passed).length}/${execReport.results.length} test cases passed)`
                                : `Sample Test Failed`}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-muted-foreground text-[11px] flex items-center gap-2">
                        {isSubmission && (
                          <span className="px-2 py-0.5 rounded bg-[#93C572]/15 text-[#93C572] border border-[#93C572]/30 font-semibold font-mono">
                            {execReport.results.length} Test Cases Evaluated
                          </span>
                        )}
                        <span>Runtime: {execReport.totalTimeMs.toFixed(1)} ms</span>
                      </div>
                    </div>

                    {/* LeetCode-Style Performance Percentile Distribution */}
                    {execReport.success && (
                      <PerformancePercentileChart
                        runtimeMs={execReport.totalTimeMs}
                        isSubmission={isSubmission}
                      />
                    )}

                    {/* Test Case Selector Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-0.5">
                      {execReport.results.map((res, idx) => (
                        <button
                          key={res.id || idx}
                          onClick={() => setResultCaseIdx(idx)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
                            resultCaseIdx === idx
                              ? res.passed
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold'
                                : 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-bold'
                              : res.passed
                              ? 'bg-secondary/40 border-border/50 text-muted-foreground hover:text-foreground'
                              : 'bg-rose-950/20 border-rose-800/40 text-rose-400 hover:text-rose-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${res.passed ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <span>Case {idx + 1}</span>
                        </button>
                      ))}
                    </div>

                    {/* Active Test Case Result Details */}
                    {execReport.results[resultCaseIdx] && (() => {
                      const activeRes = execReport.results[resultCaseIdx];
                      return (
                        <div className="space-y-3">
                          {/* Inputs */}
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-1 font-semibold">Inputs:</div>
                            <div className="p-2.5 rounded-lg bg-muted/40 border border-border space-y-1">
                              {Object.entries(activeRes.inputs || {}).map(([k, v]) => (
                                <div key={k} className="text-xs">
                                  <span className="text-muted-foreground font-semibold">{k} = </span>
                                  <span className="text-foreground">{JSON.stringify(v)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Output vs Expected */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <div className="text-[11px] text-muted-foreground mb-1 font-semibold flex items-center justify-between">
                                <span>Your Output:</span>
                                <span className={activeRes.passed ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                                  {activeRes.passed ? 'Passed' : 'Failed'}
                                </span>
                              </div>
                              <div className={`p-2.5 rounded-lg font-mono text-xs border ${
                                activeRes.passed ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                              }`}>
                                {activeRes.actualOutput !== undefined && activeRes.actualOutput !== null
                                  ? JSON.stringify(activeRes.actualOutput)
                                  : <span className="italic opacity-70">None</span>
                                }
                              </div>
                            </div>

                            <div>
                              <div className="text-[11px] text-muted-foreground mb-1 font-semibold">
                                Expected Output:
                              </div>
                              <div className="p-2.5 rounded-lg bg-muted/40 border border-border font-mono text-xs text-foreground">
                                {activeRes.expectedOutput !== undefined
                                  ? JSON.stringify(activeRes.expectedOutput)
                                  : <span className="text-muted-foreground italic">N/A</span>
                                }
                              </div>
                            </div>
                          </div>

                          {/* Error / Failure Message */}
                          {activeRes.error && (
                            <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-800/40 text-rose-400 text-xs">
                              <span className="font-semibold">Reason: </span>
                              {activeRes.error}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {execReport.stdout && (
                      <div>
                        <div className="text-muted-foreground mb-1">Standard Output:</div>
                        <pre className="p-2 rounded bg-muted/30 border border-border whitespace-pre-wrap text-[11px]">
                          {execReport.stdout}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Interactive Python REPL & Shape Inspector Tab */}
            {bottomTab === 'repl' && (
              <ReplShapeInspector
                activeInputs={parsedActiveInputs}
                currentCode={editorRef.current ? editorRef.current.getValue() : code}
                isEvaluatingRepl={isEvaluatingRepl}
                setIsEvaluatingRepl={setIsEvaluatingRepl}
                replHistory={replHistory}
                setReplHistory={setReplHistory}
              />
            )}
          </div>

        </div>

      </div>

    </div>

    {/* Authentication & Profile Modal */}
    <AuthModal
      isOpen={isAuthModalOpen}
      onClose={() => setIsAuthModalOpen(false)}
      promptMessage={authPromptMessage}
    />
  </>
  );
};
