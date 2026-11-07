import React, { useState, useEffect } from 'react';
import { Layers, Sparkles, Code2, ArrowUpRight, Cpu, Bot, Network, Wrench } from 'lucide-react';
import { getProjects } from '../services/dataService';
import { Project } from '../types';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
      setLoading(false);
    }
    load();
  }, []);

  const getProjectIcon = (index: number) => {
    const icons = [Bot, Network, Wrench, Layers, Cpu, Code2];
    const IconComp = icons[index % icons.length];
    return <IconComp className="w-5 h-5 text-[#93C572]" />;
  };

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
            <Sparkles className="w-3.5 h-3.5" />
            <span>24 Production Machine Learning Projects</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            End-to-End Machine Learning Projects
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Practical systems engineering challenges. Wire up RAG pipelines, write Triton GPU kernels, build serving schedulers with paged KV-cache, train reasoning models with GRPO, and optimize large architectures.
          </p>
        </div>

        {/* Grid of Projects */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj, idx) => (
            <div
              key={idx}
              className="bg-card border border-border/80 hover:border-[#93C572]/50 rounded-2xl p-6 flex flex-col justify-between transition-all hover:shadow-lg hover:shadow-black/20 group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-secondary/60 border border-border group-hover:bg-[#93C572]/10 group-hover:border-[#93C572]/30 transition-colors">
                    {getProjectIcon(idx)}
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    Project #{idx + 1}
                  </span>
                </div>

                <h3 className="font-bold text-base text-foreground group-hover:text-[#93C572] transition-colors mb-2">
                  {proj.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {proj.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Unlocked & Free
                </span>
                <span className="text-xs text-[#93C572] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Explore Spec <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
