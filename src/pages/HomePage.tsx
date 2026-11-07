import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
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
  ShieldCheck, 
  TrendingUp, 
  Play, 
  Atom, 
  FileText,
  UserPlus,
  Flame,
  GraduationCap,
  Search,
  Check
} from 'lucide-react';
import { AuthModal } from '../components/AuthModal';
import { MathView } from '../components/MathView';
import { getCurrentUser } from '../services/authService';
import { getProblemCatalog } from '../services/dataService';
import { ProblemSummary } from '../types';

export const HomePage: React.FC = () => {
  const [featuredProblems, setFeaturedProblems] = useState<ProblemSummary[]>([]);
  const [totalProblemsCount, setTotalProblemsCount] = useState<number>(1170);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    async function loadData() {
      const data = await getProblemCatalog();
      if (data && data.problems && data.problems.length > 0) {
        setTotalProblemsCount(data.total || 790);
        // Curate a set of top accessible, popular problems across categories
        const slugsToPick = [
          'linear-regression',
          'scaled-dot-product-attention',
          'k-means-clustering',
          'binary-cross-entropy-loss',
          'adam-optimizer',
          'two-sum',
          'dl-multi-head-attention',
          'dl-encoder-block'
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
    { name: 'NumPy', count: '90+', icon: '📐', desc: 'Vectorization, broadcasting & matrix tensor ops' },
    { name: 'PyTorch', count: '120+', icon: '🔥', desc: 'Tensors, autograd, custom layers & backprop' },
    { name: 'Transformers', count: '45+', icon: '⚡', desc: 'Attention, tokenization, RoPE & generation' },
    { name: 'Algorithms', count: '140+', icon: '🧠', desc: 'Data structures, dynamic programming & graphs' },
    { name: 'CUDA & Triton', count: '50+', icon: '🚀', desc: 'GPU kernels, thread blocks & memory tiling' },
    { name: 'SQL & Data', count: '60+', icon: '📊', desc: 'Window functions, cohorts & metrics aggregation' }
  ];

  return (
    <div className="h-full overflow-y-auto bg-background text-foreground custom-scrollbar">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] pointer-events-none overflow-hidden opacity-30 z-0">
        <div className="absolute top-[-80px] left-1/4 w-[400px] h-[400px] bg-[var(--palette-accent)] rounded-full blur-[140px] opacity-25" />
        <div className="absolute top-[60px] right-1/4 w-[380px] h-[380px] bg-[#38BDF8] rounded-full blur-[160px] opacity-20" />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-8 pt-8 pb-24 max-w-7xl space-y-20">
        
        {/* =================================================================== */}
        {/* 1. HERO HEADER                                                      */}
        {/* =================================================================== */}
        <section className="text-center space-y-6 pt-4 md:pt-10 max-w-4xl mx-auto">
          
          {/* Top Pill Announcement */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#93C572]/15 text-[#93C572] border border-[#93C572]/30 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#93C572] animate-pulse" />
            <span className="font-bold text-foreground">TonicLite</span>
            <span className="text-muted-foreground">·</span>
            <span>Master Machine Learning From First Principles</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.12] text-foreground">
            The Interactive Platform for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--palette-accent)] via-[#38BDF8] to-[#818CF8]">
              Machine Learning & AI Engineering
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Practice over <span className="text-foreground font-bold">1,170+ interactive code challenges</span>, derive mathematical theory, reimplement frontier research papers, and master FAANG technical interview rounds. Completely free, zero installation.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/problems"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#93C572] hover:bg-[#A4D287] text-black text-sm font-bold transition-all shadow-lg shadow-[#93C572]/20 hover:scale-[1.02]"
            >
              <Code2 className="w-4 h-4" />
              <span>Browse All Problems</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/ml-math"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-sm font-bold transition-all hover:scale-[1.02]"
            >
              <GraduationCap className="w-4 h-4" />
              <span>ML Math (67 Lessons)</span>
            </Link>

            <Link
              to="/interview"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-card hover:bg-secondary border border-border text-foreground text-sm font-semibold transition-all hover:scale-[1.02]"
            >
              <Radio className="w-4 h-4 text-[#93C572]" />
              <span>FAANG Interview Tracks</span>
            </Link>

            <Link
              to="/research"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-card hover:bg-secondary border border-border text-foreground text-sm font-semibold transition-all hover:scale-[1.02]"
            >
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Research Papers</span>
            </Link>
          </div>

          {/* Core Highlights Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-8 border-t border-border/60 max-w-3xl mx-auto">
            <div className="p-3 rounded-xl bg-card/60 border border-border/60 text-center">
              <div className="text-2xl font-black text-foreground font-mono">1,170+</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Coding Challenges</div>
            </div>
            <div className="p-3 rounded-xl bg-card/60 border border-border/60 text-center">
              <div className="text-2xl font-black text-[#93C572] font-mono">20+</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Verified Cases / Problem</div>
            </div>
            <div className="p-3 rounded-xl bg-card/60 border border-border/60 text-center">
              <div className="text-2xl font-black text-[#38BDF8] font-mono">0 ms</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Setup · In-Browser Python</div>
            </div>
            <div className="p-3 rounded-xl bg-card/60 border border-border/60 text-center">
              <div className="text-2xl font-black text-amber-400 font-mono">100%</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Free Unlocked Pro</div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 2. EXPLORE BY TOPIC & CATEGORY                                      */}
        {/* =================================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Explore by Domain
              </h2>
              <p className="text-xs text-muted-foreground">
                Targeted problem categories designed to build end-to-end engineering fluency.
              </p>
            </div>
            <Link
              to="/problems"
              className="text-xs font-semibold text-[#93C572] hover:underline flex items-center gap-1"
            >
              <span>View all categories</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to="/problems"
                className="group p-4 rounded-xl bg-card hover:bg-secondary/70 border border-border hover:border-[#93C572]/50 transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <div className="font-bold text-sm text-foreground group-hover:text-[#93C572] transition-colors">
                    {cat.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {cat.desc}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-border/40 text-[10px] font-mono text-[#93C572] font-semibold">
                  {cat.count} problems →
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* =================================================================== */}
        {/* 3. FEATURED PROBLEMS (ACTUAL CONTENT TO SOLVE IMMEDIATELY)           */}
        {/* =================================================================== */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#93C572]/15 text-[#93C572]">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Featured Problems
                </h2>
                <p className="text-xs text-muted-foreground">
                  Jump right into foundational challenges tested across hundreds of technical interviews.
                </p>
              </div>
            </div>

            <Link
              to="/problems"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              <span>See All 1,170+ Problems</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProblems.map((p, idx) => {
              const diffColor = 
                p.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' :
                p.difficulty === 'Hard' ? 'text-rose-400 bg-rose-500/10 border-rose-500/25' :
                'text-amber-400 bg-amber-500/10 border-amber-500/25';

              return (
                <div
                  key={p.slug || idx}
                  className="group bg-card hover:bg-secondary/50 border border-border hover:border-[#93C572]/40 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 shadow-xs"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${diffColor}`}>
                        {p.difficulty || 'Medium'}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">
                        {p.category || 'ML'}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-foreground group-hover:text-[#93C572] transition-colors line-clamp-1">
                      {p.title?.replace(/<[^>]*>?/gm, '')}
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {p.tags?.slice(0, 3).join(' · ') || 'Implement core mathematical invariant with 20+ verified test cases.'}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>20 Test Cases</span>
                    </span>

                    <Link
                      to={`/problems/${p.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#93C572] hover:text-[#A4D287] transition-colors"
                    >
                      <span>Solve</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =================================================================== */}
        {/* 4. THREE MAIN TRACKS                                                */}
        {/* =================================================================== */}
        <section className="space-y-6">
          <div className="text-center space-y-1.5 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Three Learning Paths
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Whether you are preparing for FAANG interviews, studying research papers, or polishing fundamentals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Track 1 */}
            <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-4 shadow-sm hover:border-[#93C572]/40 transition-all">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#93C572]/15 text-[#93C572] flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Core Problem Catalog</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  790+ problems covering linear algebra, calculus, PyTorch layers, loss functions, optimizers, and algorithms.
                </p>
              </div>
              <Link
                to="/problems"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#93C572] hover:underline"
              >
                <span>Browse catalog ({totalProblemsCount} problems) →</span>
              </Link>
            </div>

            {/* Track 2 */}
            <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-4 shadow-sm hover:border-sky-400/40 transition-all">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-400/15 text-sky-400 flex items-center justify-center">
                  <Atom className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Frontier Research Papers</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Component-by-component implementation of Attention Is All You Need, ResNet, Vision Transformer, and LoRA.
                </p>
              </div>
              <Link
                to="/research"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:underline"
              >
                <span>Explore paper syllabus (170+ topics) →</span>
              </Link>
            </div>

            {/* Track 3 */}
            <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-4 shadow-sm hover:border-amber-400/40 transition-all">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-400 flex items-center justify-center">
                  <Radio className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">FAANG Interview Tracks</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Timed technical sprints modeled after Meta, Google, OpenAI, Apple, and Anthropic. Data Scientist, Research & MLE tracks.
                </p>
              </div>
              <Link
                to="/interview"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:underline"
              >
                <span>Start mock interview sprints →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 5. CALL TO ACTION & REGISTRATION BANNER                             */}
        {/* =================================================================== */}
        <section className="p-8 sm:p-10 rounded-2xl bg-card border border-border text-center space-y-5 max-w-3xl mx-auto shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Ready to Start Solving?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Create a profile to save your solutions and track progress across devices, or start solving immediately as a guest.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              to="/problems"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#93C572] hover:bg-[#A4D287] text-black text-xs font-bold transition-all shadow-md"
            >
              <span>Explore All Problems</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {!currentUser ? (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5 text-sky-400" />
                <span>Create Free Profile</span>
              </button>
            ) : null}
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
