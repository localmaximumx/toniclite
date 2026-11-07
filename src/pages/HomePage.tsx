import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Terminal,
  Brain,
  Code2,
  Cpu,
  Layers,
  Radio,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Play,
  Atom,
  UserPlus,
  Flame,
  GraduationCap,
  Sliders,
  Compass,
  Clock,
  Sparkles,
  Database,
  GitBranch,
  Award,
  FileCode2,
  Eye
} from 'lucide-react';
import { AuthModal } from '../components/AuthModal';
import { getCurrentUser, getUserStreak } from '../services/authService';
import { getDailyChallenge, DailyChallengeInfo } from '../services/dailyChallengeService';
import { getProblemCatalog, getSolvedProblems } from '../services/dataService';
import { ProblemSummary } from '../types';

interface OnboardingStep {
  step: string;
  title: string;
  subtitle: string;
  route: string;
  ctaLabel: string;
  accentColor: string;
  description: string;
  highlights: string[];
  starterLinks: { label: string; to: string; meta: string }[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    step: 'STAGE 01',
    title: 'Build Visual & Mathematical Intuition',
    subtitle: '67 Interactive ML Math Lessons',
    route: '/ml-math',
    ctaLabel: 'Open ML Math Curriculum',
    accentColor: '#10B981',
    description:
      'Before memorizing formulas, manipulate vectors, eigenspaces, Jacobian matrices, probability distributions, and loss surfaces directly on interactive canvases.',
    highlights: [
      '10 modules from Linear Algebra & Calculus to Transformers & Optimization',
      'Interactive parameter sliders, 2D/3D geometric projections, and step-by-step derivations',
      'Linked directly inside coding challenges so theory and code stay connected'
    ],
    starterLinks: [
      { label: 'Dot Product & Cosine Similarity', to: '/ml-math/linear-algebra/dot-product', meta: 'Linear Algebra' },
      { label: 'Chain Rule & Backpropagation', to: '/ml-math/calculus/chain-rule', meta: 'Calculus' },
      { label: 'Cross-Entropy & KL Divergence', to: '/ml-math/information-theory/cross-entropy', meta: 'Info Theory' }
    ]
  },
  {
    step: 'STAGE 02',
    title: 'Implement Core ML & Deep Learning From Scratch',
    subtitle: '1,173 Verified Coding Problems',
    route: '/problems',
    ctaLabel: 'Explore Problem Catalog',
    accentColor: '#93C572',
    description:
      'Translate mathematical definitions into clean, vectorized NumPy, PyTorch, and SQL implementations. Complex problems feature embedded interactive visualizations right inside the description panel.',
    highlights: [
      'In-browser WebAssembly execution for Python, NumPy, PyTorch, CUDA/Triton & SQLite',
      'Interactive Visual Intuition Labs for activations, attention, CNNs, RL, and optimizers',
      'Automated verification against public sample cases and hidden boundary conditions'
    ],
    starterLinks: [
      { label: 'Sigmoid & Softmax Activations', to: '/problems/sigmoid-numpy', meta: 'Visual Lab · Easy' },
      { label: 'Scaled Dot-Product Attention', to: '/problems/scaled-dot-product-attention', meta: 'Visual Lab · Medium' },
      { label: 'Adam Optimizer Step', to: '/problems/adam-optimizer', meta: 'Visual Lab · Medium' }
    ]
  },
  {
    step: 'STAGE 03',
    title: 'Reimplement Landmark Research Papers',
    subtitle: '170+ Paper Modules & Guided Projects',
    route: '/research',
    ctaLabel: 'Browse Research Papers',
    accentColor: '#38BDF8',
    description:
      'Bridge the gap between academic papers and production engineering by building seminal architectures module-by-module with unit tests at every layer.',
    highlights: [
      'Attention Is All You Need (Tokenization, RoPE, Multi-Head Attention, Encoder/Decoder)',
      'ResNet, Vision Transformer (ViT), LoRA Fine-Tuning, DDPM Diffusion & DPO Alignment',
      'End-to-end guided projects for building Mini-GPT and Autograd engines'
    ],
    starterLinks: [
      { label: 'Multi-Head Attention', to: '/problems/dl-multi-head-attention', meta: 'Transformer Paper' },
      { label: 'Layer Normalization', to: '/problems/dl-layer-normalization', meta: 'Architecture' },
      { label: 'Positional Encoding', to: '/problems/positional-encoding', meta: 'Sequence Modeling' }
    ]
  },
  {
    step: 'STAGE 04',
    title: 'Benchmark Under Real Interview Conditions',
    subtitle: 'FAANG & Frontier AI Lab Tracks',
    route: '/interview',
    ctaLabel: 'Launch Interview Sprints',
    accentColor: '#F59E0B',
    description:
      'Test your speed and accuracy with timed multi-problem technical rounds modeled after Machine Learning Engineer, Research Scientist, and Data Science interviews.',
    highlights: [
      'Company-aligned tracks for OpenAI, Anthropic, Google DeepMind, Meta & NVIDIA',
      'Structured Study Plans (Foundations, Deep Learning, NLP/LLMs, and SQL Analytics)',
      'Instant complexity grading, solution walkthroughs, and personal markdown notes'
    ],
    starterLinks: [
      { label: 'Structured Study Plans', to: '/study-plans', meta: 'Guided Roadmaps' },
      { label: 'Timed Technical Assessments', to: '/interview', meta: 'Mock Interviews' },
      { label: 'End-to-End ML Projects', to: '/projects', meta: 'Portfolio' }
    ]
  }
];

const VISUALIZED_SHOWCASE = [
  {
    slug: 'scaled-dot-product-attention',
    title: 'Scaled Dot-Product Attention',
    category: 'Transformers',
    difficulty: 'Medium',
    vizBadge: 'Interactive Q·Kᵀ Heatmap & Temperature Lab',
    summary: 'Inspect how query-key similarity scores scale by 1/√d_k and pass through causal masking and softmax.'
  },
  {
    slug: 'adam-optimizer',
    title: 'Adam Optimizer',
    category: 'Optimization',
    difficulty: 'Medium',
    vizBadge: 'Loss Landscape & Momentum Trajectory Lab',
    summary: 'Compare Vanilla SGD, Momentum, and Adam with bias-corrected first and second moment estimates.'
  },
  {
    slug: 'conv2d-image-filtering',
    title: '2D Convolution & Image Filtering',
    category: 'Computer Vision',
    difficulty: 'Medium',
    vizBadge: 'Receptive Field & Stride Geometry Explorer',
    summary: 'Step a sliding kernel across an input feature map while adjusting kernel size, padding, stride, and dilation.'
  },
  {
    slug: 'binary-cross-entropy',
    title: 'Binary Cross-Entropy Loss',
    category: 'Loss Functions',
    difficulty: 'Easy',
    vizBadge: 'Log-Loss & Gradient Steepness Curve',
    summary: 'Visualize how BCE penalizes confident wrong predictions and why numerical clipping prevents log(0) blowups.'
  },
  {
    slug: 'dl-multi-head-attention',
    title: 'Multi-Head Attention',
    category: 'Deep Learning',
    difficulty: 'Medium',
    vizBadge: 'Subspace Head Splitting & Concatenation Lab',
    summary: 'Project embeddings into parallel attention heads to capture syntactic and semantic relationships simultaneously.'
  },
  {
    slug: 'q-learning-update',
    title: 'Tabular Q-Learning TD Update',
    category: 'Reinforcement Learning',
    difficulty: 'Medium',
    vizBadge: 'Bellman Backup & TD Error Inspector',
    summary: 'Tune learning rate α, discount factor γ, and exploration ε to see temporal-difference value convergence.'
  },
  {
    slug: 'linear-regression-closed-form',
    title: 'Linear Regression (Normal Equation)',
    category: 'Classical ML',
    difficulty: 'Easy',
    vizBadge: 'Interactive Least-Squares Residual Explorer',
    summary: 'Solve for optimal weights θ = (XᵀX)⁻¹Xᵀy and inspect orthogonal projection onto the feature column space.'
  },
  {
    slug: 'dl-encoder-block',
    title: 'Transformer Encoder Block',
    category: 'Architectures',
    difficulty: 'Hard',
    vizBadge: 'Residual Stream & LayerNorm Flow Lab',
    summary: 'Combine multi-head self-attention, residual skip connections, layer normalization, and position-wise FFN.'
  }
];

export const HomePage: React.FC = () => {
  const [featuredProblems, setFeaturedProblems] = useState<ProblemSummary[]>([]);
  const [totalProblemsCount, setTotalProblemsCount] = useState<number>(1173);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [mlMathCompletedCount, setMlMathCompletedCount] = useState<number>(0);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallengeInfo | null>(null);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const currentUser = getCurrentUser();
  const streak = getUserStreak();

  useEffect(() => {
    const refreshStats = () => {
      const solved = getSolvedProblems();
      setSolvedCount(solved.size);

      try {
        const rawMath = localStorage.getItem('tt-ml-math-progress');
        if (rawMath) {
          const parsed = JSON.parse(rawMath);
          if (Array.isArray(parsed)) {
            setMlMathCompletedCount(parsed.length);
          } else if (parsed && typeof parsed === 'object') {
            setMlMathCompletedCount(Object.keys(parsed).filter(k => parsed[k]).length);
          }
        }
      } catch {
        setMlMathCompletedCount(0);
      }
    };

    refreshStats();
    window.addEventListener('tensortonic_auth_change', refreshStats);
    return () => window.removeEventListener('tensortonic_auth_change', refreshStats);
  }, []);

  useEffect(() => {
    async function loadData() {
      const [data, daily] = await Promise.all([
        getProblemCatalog(),
        getDailyChallenge()
      ]);
      setDailyChallenge(daily);

      if (data && data.problems && data.problems.length > 0) {
        setTotalProblemsCount(Math.max(data.total || 1173, 1173));
        const slugsToPick = [
          'scaled-dot-product-attention',
          'adam-optimizer',
          'linear-regression',
          'k-means-clustering',
          'binary-cross-entropy-loss',
          'dl-multi-head-attention',
          'dl-encoder-block',
          'two-sum'
        ];
        const picked = slugsToPick
          .map(slug => data.problems.find(p => p.slug === slug))
          .filter((p): p is ProblemSummary => p !== undefined);

        if (picked.length > 0) {
          setFeaturedProblems(picked);
        } else {
          setFeaturedProblems(data.problems.slice(0, 8));
        }
      }
    }
    loadData();
  }, []);

  const categories = [
    {
      name: 'NumPy & Linear Algebra',
      count: '190+',
      tag: 'VECTORS & MATRICES',
      desc: 'Broadcasting, decompositions, cosine distance, and zero-loop array manipulation.',
      sampleSlug: 'cosine-similarity'
    },
    {
      name: 'PyTorch & Autograd',
      count: '240+',
      tag: 'TENSORS & GRADIENTS',
      desc: 'Custom neural layers, backward passes, loss functions, and optimizer step rules.',
      sampleSlug: 'adam-optimizer'
    },
    {
      name: 'Transformers & LLMs',
      count: '130+',
      tag: 'SEQUENCE MODELING',
      desc: 'Scaled dot-product attention, RoPE, KV-caching, tokenization, and beam search.',
      sampleSlug: 'scaled-dot-product-attention'
    },
    {
      name: 'Computer Vision & CNNs',
      count: '110+',
      tag: 'SPATIAL FILTERS',
      desc: '2D convolutions, receptive fields, IoU, non-max suppression, and ViT patch embeddings.',
      sampleSlug: 'conv2d-image-filtering'
    },
    {
      name: 'CUDA, Triton & Systems',
      count: '95+',
      tag: 'GPU KERNELS',
      desc: 'Thread indexing, shared memory tiling, Roofline bandwidth, and quantization.',
      sampleSlug: 'gpu-roofline-Arithmetic-intensity'
    },
    {
      name: 'SQL & Data Engineering',
      count: '85+',
      tag: 'ANALYTICS & ETL',
      desc: 'Window functions, retention cohorts, feature pipelines, and real SQLite execution.',
      sampleSlug: 'sql-Duplicate-Emails'
    }
  ];

  const activeStage = ONBOARDING_STEPS[activeStageIndex];
  const solvedPercentage = Math.min(100, Math.round((solvedCount / totalProblemsCount) * 100));
  const mathPercentage = Math.min(100, Math.round((mlMathCompletedCount / 67) * 100));

  return (
    <div className="h-full overflow-y-auto bg-background text-foreground custom-scrollbar">
      {/* Subtle architectural top radial wash */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-gradient-to-b from-[#93C572]/[0.06] via-[#38BDF8]/[0.02] to-transparent z-0" />

      <div className="relative z-10 container mx-auto px-4 md:px-8 pt-6 pb-24 max-w-7xl space-y-16">
        
        {/* =================================================================== */}
        {/* 1. HERO + PERSONAL TELEMETRY DASHBOARD                              */}
        {/* =================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pt-2">
          
          {/* Left 7 Cols: Editorial Positioning & Core Entry Actions */}
          <div className="lg:col-span-7 rounded-2xl bg-card border border-border p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#93C572]">
                <span>FIRST-PRINCIPLES AI & ML WORKBENCH</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">ZERO SETUP · IN-BROWSER RUNTIME</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-[1.1] text-foreground">
                Understand the Math.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#93C572] via-[#38BDF8] to-[#818CF8]">
                  Implement the Tensors.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                TonicLite combines <strong className="text-foreground font-semibold">67 interactive mathematical intuition labs</strong> with{' '}
                <strong className="text-foreground font-semibold">{totalProblemsCount.toLocaleString()} verified coding challenges</strong> in NumPy, PyTorch, Transformers, and SQL. Every complex problem includes an interactive visual simulator right inside the problem description so you can see the geometry before writing code.
              </p>

              {/* Primary Navigation Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/problems"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#93C572] hover:bg-[#A4D287] text-black text-xs sm:text-sm font-bold transition-all shadow-sm"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Start Solving Problems</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/ml-math"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-bold transition-all"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>ML Math Visual Textbook</span>
                </Link>

                <Link
                  to="/research"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary/70 hover:bg-secondary border border-border text-foreground text-xs sm:text-sm font-semibold transition-all"
                >
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <span>Research Papers</span>
                </Link>
              </div>
            </div>

            {/* Bottom Key Platform Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-border/70">
              <div>
                <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-foreground">
                  {totalProblemsCount.toLocaleString()}
                </div>
                <div className="text-[11px] text-muted-foreground">Verified Challenges</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-400">
                  67
                </div>
                <div className="text-[11px] text-muted-foreground">Interactive Math Labs</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-sky-400">
                  270+
                </div>
                <div className="text-[11px] text-muted-foreground">Visualized Problems</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-amber-400">
                  100%
                </div>
                <div className="text-[11px] text-muted-foreground">In-Browser · Unlocked</div>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Live Learner Progress & Daily Challenge Card */}
          <div className="lg:col-span-5 rounded-2xl bg-card border border-border p-6 flex flex-col justify-between gap-5 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    YOUR WORKSPACE STATUS
                  </div>
                  <h2 className="text-base font-bold text-foreground mt-0.5">
                    {currentUser ? `Welcome back, ${currentUser.username}` : 'Local Session Progress'}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-mono font-bold tabular-nums flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{streak.currentStreak}d streak</span>
                  </div>
                  {!currentUser && (
                    <button
                      onClick={() => setIsAuthOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-foreground transition-colors"
                    >
                      Sync Profile
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/70 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Problems Solved</span>
                    <span className="font-mono font-bold tabular-nums text-[#93C572]">
                      {solvedCount} / {totalProblemsCount}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-background overflow-hidden">
                    <div
                      className="h-full bg-[#93C572] transition-all duration-300"
                      style={{ width: `${Math.max(solvedCount > 0 ? 2 : 0, solvedPercentage)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Auto-saved in browser</span>
                    <Link to="/problems" className="text-[#93C572] hover:underline font-medium">
                      Continue →
                    </Link>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/70 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">ML Math Lessons</span>
                    <span className="font-mono font-bold tabular-nums text-emerald-400">
                      {mlMathCompletedCount} / 67
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-background overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-300"
                      style={{ width: `${Math.max(mlMathCompletedCount > 0 ? 3 : 0, mathPercentage)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>10 core math tracks</span>
                    <Link to="/ml-math" className="text-emerald-400 hover:underline font-medium">
                      Open lessons →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Challenge Spotlight or Recommended First Problem */}
            {dailyChallenge && dailyChallenge.problem ? (
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#93C572]/10 via-secondary/40 to-sky-500/5 border border-[#93C572]/30 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#93C572] font-bold">
                    TODAY&apos;S DAILY CHALLENGE
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Resets in {dailyChallenge.timeRemainingFormatted}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-foreground truncate">
                      {dailyChallenge.problem.title?.replace(/<[^>]*>?/gm, '')}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-[11px] text-amber-400">
                        {dailyChallenge.problem.difficulty || 'Medium'}
                      </span>
                      <span>·</span>
                      <span className="truncate">
                        {dailyChallenge.problem.category?.toUpperCase() || 'MACHINE LEARNING'}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/problems/${dailyChallenge.problem.slug}`}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#93C572] hover:bg-[#A4D287] text-black text-xs font-bold transition-colors"
                  >
                    <span>{dailyChallenge.isCompleted ? 'Review' : 'Solve Now'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-secondary/40 border border-border flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-foreground">New to TonicLite?</div>
                  <div className="text-[11px] text-muted-foreground">
                    Start with Scaled Dot-Product Attention with live heatmap visualization.
                  </div>
                </div>
                <Link
                  to="/problems/scaled-dot-product-attention"
                  className="px-3.5 py-2 rounded-lg bg-[#93C572] text-black text-xs font-bold"
                >
                  Try It →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* =================================================================== */}
        {/* 2. NEW USER ORIENTATION: HOW TO USE TONICLITE (4-STAGE ROADMAP)     */}
        {/* =================================================================== */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#93C572]">
                NEW USER GUIDE &amp; LEARNING ARCHITECTURE
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
                How TonicLite Works — A 4-Stage Engineering Path
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              Select any stage below to see what is inside and jump straight into curated starter topics.
            </p>
          </div>

          {/* 4-Stage Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ONBOARDING_STEPS.map((item, idx) => {
              const isSelected = idx === activeStageIndex;
              return (
                <button
                  key={item.step}
                  onClick={() => setActiveStageIndex(idx)}
                  className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-card border-[#93C572] shadow-md'
                      : 'bg-card/50 hover:bg-card border-border/80'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className="text-[11px] font-mono font-bold tracking-wider"
                      style={{ color: item.accentColor }}
                    >
                      {item.step}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {item.subtitle}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground leading-snug">
                      {item.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stage Detailed Walkthrough Panel */}
          <div className="rounded-2xl bg-card border border-border p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-sm">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider" style={{ color: activeStage.accentColor }}>
                <span>{activeStage.step}</span>
                <span>·</span>
                <span>{activeStage.subtitle}</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {activeStage.title}
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {activeStage.description}
              </p>

              <ul className="space-y-2 pt-1">
                {activeStage.highlights.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: activeStage.accentColor }} />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <Link
                  to={activeStage.route}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#93C572] hover:bg-[#A4D287] text-black text-xs font-bold transition-all"
                >
                  <span>{activeStage.ctaLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right 5 Cols: Recommended First Steps for this Stage */}
            <div className="lg:col-span-5 rounded-xl bg-secondary/40 border border-border p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  RECOMMENDED STARTING POINTS
                </span>
                <Compass className="w-4 h-4 text-[#93C572]" />
              </div>

              <div className="space-y-2.5">
                {activeStage.starterLinks.map((linkItem) => (
                  <Link
                    key={linkItem.to}
                    to={linkItem.to}
                    className="group p-3.5 rounded-xl bg-card hover:bg-secondary border border-border hover:border-[#93C572]/50 transition-all flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-foreground group-hover:text-[#93C572] transition-colors">
                        {linkItem.label}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                        {linkItem.meta}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#93C572] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 3. INTERACTIVE VISUALIZED PROBLEMS SHOWCASE                         */}
        {/* =================================================================== */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-emerald-400">
                INTERACTIVE VISUAL INTUITION LABS
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
                Problems with Built-In Interactive Visualizations
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Complex problems include an interactive geometric or mathematical simulator inside the problem description—plus a direct toggle to the full ML Math lab.
              </p>
            </div>
            <Link
              to="/problems"
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-secondary transition-colors"
            >
              <span>Browse All {totalProblemsCount.toLocaleString()} Problems</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {VISUALIZED_SHOWCASE.map((item) => {
              const diffColor =
                item.difficulty === 'Easy'
                  ? 'text-emerald-400'
                  : item.difficulty === 'Hard'
                  ? 'text-rose-400'
                  : 'text-amber-400';

              return (
                <Link
                  key={item.slug}
                  to={`/problems/${item.slug}`}
                  className="group rounded-xl bg-card hover:bg-secondary/40 border border-border hover:border-[#93C572]/50 p-4 flex flex-col justify-between transition-all shadow-xs"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-muted-foreground uppercase">{item.category}</span>
                      <span className={`font-bold ${diffColor}`}>{item.difficulty}</span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground group-hover:text-[#93C572] transition-colors">
                      {item.title}
                    </h3>

                    <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                      <Sliders className="w-3 h-3 shrink-0" />
                      <span className="truncate">{item.vizBadge}</span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {item.summary}
                    </p>
                  </div>

                  <div className="pt-3 mt-4 border-t border-border/50 flex items-center justify-between text-xs font-bold text-[#93C572]">
                    <span>Launch Problem &amp; Lab</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* =================================================================== */}
        {/* 4. INSIDE THE WORKBENCH: WHAT EVERY PROBLEM PAGE GIVES YOU          */}
        {/* =================================================================== */}
        <section className="rounded-2xl bg-card border border-border p-6 sm:p-8 space-y-6">
          <div className="max-w-2xl space-y-1.5">
            <div className="text-xs font-mono uppercase tracking-wider text-sky-400">
              INSIDE THE CODING ENVIRONMENT
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Everything You Need Inside One Browser Tab
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              No local conda environments, GPU drivers, or database servers required. Here is what is built into every problem page:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                1. Visual Intuition &amp; ML Math Bridge
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Adjust sliders for temperature, learning rate, kernel stride, or discount factor directly in the Description tab, and toggle between the Problem Explorer and the full ML Math module.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/40 border border-border/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#93C572]/15 text-[#93C572] flex items-center justify-center">
                <Terminal className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                2. WebAssembly Python, PyTorch &amp; SQL
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Run real Python 3, NumPy, SciPy, PyTorch tensors, CUDA/Triton kernel simulations, and SQLite queries in-browser with zero network latency.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/40 border border-border/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                3. Mathematical Proofs &amp; Reference Code
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every challenge includes a dedicated LaTeX-rendered Theory tab explaining the derivation and edge cases, plus a full verified reference implementation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/40 border border-border/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <FileCode2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                4. Custom Test Cases &amp; Personal Notes
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add custom input tensors in the test runner to inspect outputs and shapes, or write LaTeX-enabled study notes that persist automatically.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 5. EXPLORE BY ENGINEERING DOMAIN                                    */}
        {/* =================================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Explore by Technical Domain
              </h2>
              <p className="text-xs text-muted-foreground">
                Jump into the full catalog or launch a representative starter challenge in any domain.
              </p>
            </div>
            <Link
              to="/problems"
              className="text-xs font-semibold text-[#93C572] hover:underline flex items-center gap-1"
            >
              <span>Open Full Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="p-5 rounded-xl bg-card border border-border hover:border-[#93C572]/40 transition-all flex flex-col justify-between gap-4 shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-muted-foreground">{cat.tag}</span>
                    <span className="text-[#93C572] font-bold tabular-nums">{cat.count} problems</span>
                  </div>
                  <h3 className="text-base font-bold text-foreground">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{cat.desc}</p>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                  <Link
                    to={`/problems/${cat.sampleSlug}`}
                    className="font-semibold text-foreground hover:text-[#93C572] transition-colors"
                  >
                    Try starter problem →
                  </Link>
                  <Link
                    to="/problems"
                    className="font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View all
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialTab="register"
        promptMessage="Create an account to save your solved challenges and code drafts across sessions."
      />
    </div>
  );
};
