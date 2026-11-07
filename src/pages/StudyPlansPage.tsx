import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Code2, 
  Layers, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { getStudyPlans, getProblemCatalog, getSolvedProblems } from '../services/dataService';
import { StudyPlan } from '../types';

/* ======================================================== */
/* CUSTOM VECTOR / ISOMETRIC ARTWORK MATCHING SCREENSHOT   */
/* ======================================================== */

// 1. LLM "the next word" 3D Block Art
const LLMArt: React.FC = () => (
  <div className="w-20 h-20 relative flex items-center justify-center shrink-0">
    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#2a334a] via-[#1c2333] to-[#121620] border border-[#3b4866] shadow-xl transform -rotate-6 flex flex-col p-1.5 justify-between">
      <div className="bg-[#e2e8f0] text-[#0f172a] text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs text-center font-mono">
        the
      </div>
      <div className="flex gap-1">
        <div className="bg-[#cbd5e1] text-[#0f172a] text-[9px] font-bold px-1 py-0.5 rounded shadow-xs text-center font-mono flex-1">
          next
        </div>
        <div className="bg-[#f97316] text-white text-[9px] font-bold px-1 py-0.5 rounded shadow-xs text-center font-mono flex-1">
          word
        </div>
      </div>
    </div>
  </div>
);

// 2. Micrograd 2 * 3 = 6 Graph Art
const MicrogradArt: React.FC = () => (
  <div className="w-20 h-20 relative flex flex-col items-center justify-center shrink-0">
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded bg-[#f1f5f9] text-[#0f172a] font-bold text-xs flex items-center justify-center shadow-md border border-white">
        2
      </div>
      <div className="w-6 h-6 rounded bg-[#f1f5f9] text-[#0f172a] font-bold text-xs flex items-center justify-center shadow-md border border-white">
        3
      </div>
    </div>
    {/* Connecting lines & multiply */}
    <div className="relative my-0.5 flex items-center justify-center">
      <div className="w-4 h-4 rounded-full bg-[#0ea5e9] text-white font-bold text-[9px] flex items-center justify-center shadow-xs">
        ×
      </div>
    </div>
    {/* Result node */}
    <div className="w-7 h-7 rounded-lg bg-[#0284c7] text-white font-extrabold text-xs flex items-center justify-center shadow-lg border border-[#38bdf8]/50">
      6
    </div>
  </div>
);

// 3. AlphaGo Isometric Go Board Art
const AlphaGoArt: React.FC = () => (
  <div className="w-20 h-20 relative flex items-center justify-center shrink-0">
    <div className="w-16 h-16 rounded-lg bg-[#b48348] border-2 border-[#805523] shadow-xl transform rotate-6 relative p-1.5 overflow-hidden">
      {/* Grid lines */}
      <div className="w-full h-full grid grid-cols-4 grid-rows-4 border-t border-l border-[#6b471c]/50">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="border-r border-b border-[#6b471c]/40 relative flex items-center justify-center">
            {/* Stones */}
            {i === 5 && <div className="w-2.5 h-2.5 rounded-full bg-black shadow-xs transform -translate-x-1 -translate-y-1" />}
            {i === 6 && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-xs border border-gray-300 transform -translate-x-1 -translate-y-1" />}
            {i === 9 && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-xs border border-gray-300 transform -translate-x-1 -translate-y-1" />}
            {i === 10 && <div className="w-2.5 h-2.5 rounded-full bg-black shadow-xs transform -translate-x-1 -translate-y-1" />}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// 4. Pandas DataFrame Art
const PandasArt: React.FC = () => (
  <div className="w-16 h-16 relative flex items-center justify-center shrink-0">
    <div className="w-14 h-14 rounded-lg bg-[#1f2633] border border-[#374151] shadow-lg flex p-1 gap-1">
      <div className="flex-1 flex flex-col gap-1">
        <div className="h-2 rounded bg-gray-600/50" />
        <div className="h-2 rounded bg-gray-700/50" />
        <div className="h-2 rounded bg-gray-700/50" />
        <div className="h-2 rounded bg-gray-700/50" />
      </div>
      <div className="flex-1 flex flex-col gap-1 bg-rose-500/20 border border-rose-500/40 rounded p-0.5">
        <div className="h-1.5 rounded bg-rose-500" />
        <div className="h-1.5 rounded bg-rose-400" />
        <div className="h-1.5 rounded bg-rose-400" />
        <div className="h-1.5 rounded bg-rose-400" />
      </div>
      <div className="flex-1 flex flex-col gap-1">
        <div className="h-2 rounded bg-gray-600/50" />
        <div className="h-2 rounded bg-gray-700/50" />
        <div className="h-2 rounded bg-gray-700/50" />
        <div className="h-2 rounded bg-gray-700/50" />
      </div>
    </div>
  </div>
);

// 5. NumPy 3D Cube Art
const NumPyArt: React.FC = () => (
  <div className="w-16 h-16 relative flex items-center justify-center shrink-0">
    <div className="w-14 h-14 relative flex items-center justify-center">
      <svg className="w-14 h-14" viewBox="0 0 60 60" fill="none">
        {/* Isometric 3D Cube */}
        <polygon points="30,5 52,18 30,31 8,18" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
        <polygon points="8,18 30,31 30,55 8,42" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
        <polygon points="30,31 52,18 52,42 30,55" fill="#0369a1" stroke="#075985" strokeWidth="1.5" />
        {/* Internal grid subdivs */}
        <line x1="19" y1="11.5" x2="41" y2="24.5" stroke="#bae6fd" strokeWidth="1" strokeOpacity="0.7" />
        <line x1="41" y1="11.5" x2="19" y2="24.5" stroke="#bae6fd" strokeWidth="1" strokeOpacity="0.7" />
        <line x1="19" y1="24.5" x2="19" y2="48.5" stroke="#0c4a6e" strokeWidth="1" strokeOpacity="0.7" />
        <line x1="41" y1="24.5" x2="41" y2="48.5" stroke="#0c4a6e" strokeWidth="1" strokeOpacity="0.7" />
      </svg>
    </div>
  </div>
);

// 6. PyTorch Flame Ring Art
const PyTorchArt: React.FC = () => (
  <div className="w-16 h-16 relative flex items-center justify-center shrink-0">
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#241a1a] via-[#1a1414] to-[#0f0c0c] border border-[#ee4c2c]/40 shadow-xl flex items-center justify-center transform -rotate-3 hover:rotate-0 transition-transform">
      <svg className="w-8 h-8 text-[#ee4c2c]" viewBox="0 0 40 40" fill="none">
        <circle cx="28" cy="12" r="3" fill="#ee4c2c" />
        <path
          d="M26 18 C 24 15, 20 14, 16 16 C 11 18, 9 24, 11 29 C 13 34, 19 36, 24 34 C 29 32, 31 27, 29 22"
          stroke="#ee4c2c"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  </div>
);

// 7. SQL Database Cylinder & Gold Key Art
const SQLArt: React.FC = () => (
  <div className="w-16 h-16 relative flex flex-col items-center justify-center shrink-0">
    {/* Floating Gold Key */}
    <div className="absolute -top-1 z-10">
      <svg className="w-6 h-6 text-amber-400 filter drop-shadow(0 2px 4px rgba(0,0,0,0.8))" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 14C5.9 14 5 13.1 5 12C5 10.9 5.9 10 7 10C8.1 10 9 10.9 9 12C9 13.1 8.1 14 7 14ZM12.6 10C11.8 7.6 9.6 6 7 6C3.7 6 1 8.7 1 12C1 15.3 3.7 18 7 18C9.6 18 11.8 16.4 12.6 14H16V18H20V14H23V10H12.6Z" />
      </svg>
    </div>
    {/* 3D Database Cylinder */}
    <div className="w-11 h-11 rounded-lg bg-gradient-to-b from-[#242b38] to-[#12161f] border border-amber-500/40 shadow-lg flex flex-col justify-between p-1 mt-2">
      <div className="h-1.5 w-full rounded-full bg-amber-400/80" />
      <div className="h-1 w-full rounded-full bg-amber-500/40" />
      <div className="h-1.5 w-full rounded-full bg-amber-400/80" />
    </div>
  </div>
);

export const StudyPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [solvedSet, setSolvedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getStudyPlans();
      setPlans(data);
      setSolvedSet(getSolvedProblems());
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#0b0d11]">
        <div className="w-8 h-8 border-2 border-[#93C572] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Filter study plans for the sections
  const buildFromScratchPlans = [
    {
      id: 'build-llm-from-scratch',
      title: 'Build LLM from Scratch',
      subtitle: 'Tokenization to alignment',
      problemCount: 62,
      tags: ['PyTorch', 'NumPy', 'CUDA', 'Triton'],
      art: <LLMArt />,
      targetQuery: 'Transformers'
    },
    {
      id: 'build-micrograd-from-scratch',
      title: 'Build Micrograd from Scratch',
      subtitle: 'Scalar autograd and neural networks',
      problemCount: 25,
      tags: ['NumPy', 'PyTorch'],
      art: <MicrogradArt />,
      targetQuery: 'Neural Networks'
    },
    {
      id: 'build-alphago-from-scratch',
      title: 'Build AlphaGo from Scratch',
      subtitle: 'Policy networks, MCTS, and self-play',
      problemCount: 18,
      tags: ['NumPy', 'PyTorch', 'MCTS'],
      art: <AlphaGoArt />,
      targetQuery: 'Reinforcement Learning'
    }
  ];

  const foundationPlans = [
    {
      id: 'pandas-sheet',
      title: 'Pandas Sheet',
      subtitle: 'Data Manipulation Essentials',
      problemCount: 25,
      art: <PandasArt />,
      category: 'pandas'
    },
    {
      id: 'numpy-sheet',
      title: 'NumPy Sheet',
      subtitle: 'Array Computing from Scratch',
      problemCount: 25,
      art: <NumPyArt />,
      category: 'numpy'
    },
    {
      id: 'pytorch-sheet',
      title: 'PyTorch Sheet',
      subtitle: 'Tensors, Autograd, and Models',
      problemCount: 30,
      art: <PyTorchArt />,
      category: 'pytorch'
    },
    {
      id: 'sql-sheet',
      title: 'SQL Sheet',
      subtitle: 'Query Data Like a Pro',
      problemCount: 25,
      art: <SQLArt />,
      category: 'sql'
    }
  ];

  // Find other remaining plans
  const otherPlans = plans.filter(p => 
    !['pandas-sheet', 'numpy-sheet', 'pytorch-sheet', 'sql-sheet', 'build-llm-from-scratch', 'build-micrograd-from-scratch', 'build-alphago-from-scratch'].includes(p.id)
  );

  return (
    <div className="h-full overflow-y-auto bg-[#0b0e14] text-foreground font-sans custom-scrollbar selection:bg-[#93C572]/20 selection:text-[#93C572]">
      <div className="container mx-auto px-4 md:px-8 pt-6 pb-28 sm:py-8 max-w-7xl">
        
        {/* ======================================================== */}
        {/* PAGE HEADER (Matching study_plans.png)                   */}
        {/* ======================================================== */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#14261f] border border-[#10b981]/30 flex items-center justify-center text-[#10b981] shadow-md shadow-[#10b981]/10">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Study Plans
            </h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mt-2 leading-relaxed">
            Structured roadmaps to master ML concepts. Pick a plan, solve problems daily, and track your progress.
          </p>
        </div>

        {/* ======================================================== */}
        {/* SECTION 1: </> Build from Scratch                        */}
        {/* ======================================================== */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-emerald-400 font-extrabold text-lg">&lt;/&gt;</span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Build from Scratch
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            Rebuild influential algorithms one tested primitive at a time
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {buildFromScratchPlans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => navigate(`/problems?search=${encodeURIComponent(plan.targetQuery)}`)}
                className="bg-[#121620] hover:bg-[#151b27] border border-[#202738] hover:border-[#38435a] rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 group shadow-md hover:shadow-xl hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-4">
                  {plan.art}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-white group-hover:text-[#93C572] transition-colors leading-snug">
                      {plan.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {plan.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#1e2536] flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 font-mono">
                    {plan.problemCount} problems
                  </span>

                  <div className="flex flex-wrap gap-1.5 items-center">
                    {plan.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono text-gray-300 bg-[#1c2333] border border-[#2d374d]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION 2: Foundations                                   */}
        {/* ======================================================== */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Foundations
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            Essential tools for data science and ML
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {foundationPlans.map((sheet) => (
              <div
                key={sheet.id}
                onClick={() => navigate(`/problems?category=${sheet.category}`)}
                className="bg-[#121620] hover:bg-[#151b27] border border-[#202738] hover:border-[#38435a] rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 group shadow-md hover:shadow-xl hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  {sheet.art}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-[#93C572] transition-colors">
                      {sheet.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                      {sheet.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#1e2536] flex items-center justify-between text-xs text-gray-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    {sheet.problemCount} problems
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-1 group-hover:text-emerald-400 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION 3: Domain Deep Dives & Curricula                */}
        {/* ======================================================== */}
        {otherPlans.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                Curated Roadmaps
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mb-5">
              Comprehensive interview prep and specialized ML domain curriculums
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {otherPlans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => navigate(`/problems?plan=${plan.id}`)}
                  className="bg-[#10141d] hover:bg-[#141924] border border-[#1d2433] hover:border-[#2f3a52] rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 group shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{plan.icon || '📚'}</span>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-[#93C572] transition-colors">
                          {plan.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {plan.subtitle || plan.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1a212e] flex items-center justify-between text-xs text-gray-400">
                    <span className="font-mono text-emerald-400">
                      {plan.problemCount} problems
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#18202c] text-gray-300">
                      {plan.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
