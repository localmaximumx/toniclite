import React, { useState, useEffect } from 'react';
import { Award, CheckCircle, ShieldCheck, Terminal, Brain, Sparkles, Clock, ArrowRight, ChevronDown, ChevronUp, Play, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAssessments } from '../services/dataService';
import { AssessmentCategory, AssessmentItem } from '../types';

export const AssessmentsPage: React.FC = () => {
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedAssessmentId, setExpandedAssessmentId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getAssessments();
      setCategories(data);
      setLoading(false);
    }
    load();
  }, []);

  const allAssessments = categories.flatMap(cat => 
    cat.assessments.map(a => ({ ...a, categoryName: cat.name, catId: cat.id }))
  );

  const displayedAssessments = selectedCategory === 'all'
    ? allAssessments
    : allAssessments.filter(a => a.catId === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-background">
        <div className="w-8 h-8 border-2 border-[#93C572] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background text-foreground custom-scrollbar">
      <div className="container mx-auto px-4 pt-6 pb-28 sm:py-8 max-w-7xl">
        
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#93C572]/15 text-[#93C572] border border-[#93C572]/30 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>24 Technical Interview Assessments (All Unlocked)</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Machine Learning Interview Assessments
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Simulate actual FAANG, OpenAI, and Anthropic technical interview screens with timed coding challenges across Data Science, LLM Internals, CUDA, and Triton.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
              selectedCategory === 'all'
                ? 'bg-[#93C572] text-black border-[#93C572] shadow-sm'
                : 'bg-card text-muted-foreground border-border/70 hover:border-[#93C572]/40 hover:text-foreground'
            }`}
          >
            All Tracks ({allAssessments.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-[#93C572] text-black border-[#93C572] shadow-sm'
                  : 'bg-card text-muted-foreground border-border/70 hover:border-[#93C572]/40 hover:text-foreground'
              }`}
            >
              {cat.name} ({cat.assessments.length})
            </button>
          ))}
        </div>

        {/* Assessments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedAssessments.map((a) => {
            const isExpanded = expandedAssessmentId === a.id;
            const totalProblems = a.sets?.reduce((acc, s) => acc + (s.problems?.length || 0), 0) || 0;

            return (
              <div
                key={a.id}
                className="bg-card border border-border/80 rounded-2xl p-6 flex flex-col justify-between hover:border-[#93C572]/50 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {a.categoryName}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {a.durationMin} mins
                      </span>
                      {totalProblems > 0 && (
                        <span className="text-[#93C572] font-semibold">{totalProblems} Problems</span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-2">{a.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {a.description}
                  </p>

                  {/* Expandable Problem Sets */}
                  {a.sets && a.sets.length > 0 && (
                    <div className="mb-4">
                      <button
                        onClick={() => setExpandedAssessmentId(isExpanded ? null : a.id)}
                        className="flex items-center gap-1.5 text-xs text-[#93C572] hover:underline font-semibold"
                      >
                        {isExpanded ? (
                          <>Hide Questions Breakdown <ChevronUp className="w-3.5 h-3.5" /></>
                        ) : (
                          <>View Question Sets ({a.sets.length} Sets, {totalProblems} Problems) <ChevronDown className="w-3.5 h-3.5" /></>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-3 pt-3 border-t border-border/50 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                          {a.sets.map((set, sIdx) => (
                            <div key={set.id || sIdx} className="bg-secondary/40 rounded-xl p-3 border border-border/60">
                              <h5 className="text-xs font-bold text-foreground mb-2 flex items-center justify-between">
                                <span>{set.name}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">{set.problems?.length || 0} questions</span>
                              </h5>
                              <div className="space-y-1.5">
                                {set.problems?.map((prob, pIdx) => (
                                  <Link
                                    key={prob.slug || pIdx}
                                    to={`/problems/${prob.slug}`}
                                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-background/80 transition-colors text-xs group"
                                  >
                                    <span className="text-muted-foreground group-hover:text-[#93C572] truncate max-w-[260px]">
                                      {prob.title.replace(/<[^>]*>?/gm, '')}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                        prob.difficulty?.toLowerCase() === 'easy' ? 'text-emerald-400 bg-emerald-500/10' :
                                        prob.difficulty?.toLowerCase() === 'hard' ? 'text-red-400 bg-red-500/10' :
                                        'text-yellow-400 bg-yellow-500/10'
                                      }`}>
                                        {prob.difficulty}
                                      </span>
                                      <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-[#93C572] transition-colors" />
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Pro Unlocked (Free)
                  </span>
                  {a.sets && a.sets[0]?.problems?.[0] ? (
                    <Link
                      to={`/problems/${a.sets[0].problems[0].slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#93C572] hover:bg-[#A4D287] text-black text-xs font-semibold transition-colors shadow-sm"
                    >
                      Start Assessment <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      to="/problems"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#93C572] hover:bg-[#A4D287] text-black text-xs font-semibold transition-colors shadow-sm"
                    >
                      Practice Questions <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
