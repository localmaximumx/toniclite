import React, { useState } from 'react';
import { 
  Cpu, 
  Layers, 
  Sparkles, 
  Search, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Server, 
  Activity, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';

interface MLSystem {
  id: string;
  name: string;
  company: string;
  category: 'Recommendation' | 'LLM & RAG' | 'Distributed Systems' | 'Computer Vision' | 'Real-Time';
  logo: string;
  description: string;
  latencyConstraint: string;
  scaleMetric: string;
  keyComponents: string[];
  keyTradeoff: string;
}

const systemsData: MLSystem[] = [
  {
    id: 'netflix-recommendation',
    name: 'Netflix Recommendation',
    company: 'Netflix',
    category: 'Recommendation',
    logo: '/images/companies/netflix_new.jpg',
    description: 'Two-stage retrieval and ranking architecture generating personalized home page rows for 260M+ subscribers with multi-armed bandit exploration.',
    latencyConstraint: '< 100ms p99',
    scaleMetric: '260M+ users, 1B+ impressions/day',
    keyComponents: ['Candidate Generation (Two-Tower)', 'Ranking (Wide & Deep / DLRM)', 'Page Composition Bandit', 'Offline Evall (NDCG@10)'],
    keyTradeoff: 'Diversity vs. Relevance in horizontal row generation'
  },
  {
    id: 'anthropic-rag',
    name: 'Anthropic RAG System',
    company: 'Anthropic',
    category: 'LLM & RAG',
    logo: '/images/companies/anthropic.svg',
    description: 'High-precision contextual retrieval with prompt-caching, BM25 + dense hybrid search, reranking, and citation-grounded generation.',
    latencyConstraint: '< 1500ms TTFT',
    scaleMetric: 'Millions of 200k-token documents',
    keyComponents: ['Contextual Embeddings', 'Hybrid Search (Reciprocal Rank Fusion)', 'Cross-Encoder Reranker', 'KV-Cache Sharing'],
    keyTradeoff: 'Retrieval recall vs. context window cost and latency'
  },
  {
    id: 'amazon-product-rec',
    name: 'Amazon Product Recommendation',
    company: 'Amazon',
    category: 'Recommendation',
    logo: '/images/companies/icons8-amazon-48.png',
    description: 'Item-to-item collaborative filtering and session-based transformers recommending "Frequently Bought Together" across hundreds of millions of ASINs.',
    latencyConstraint: '< 50ms p99',
    scaleMetric: '350M+ items, 100k QPS peak',
    keyComponents: ['Co-purchase Graph (GraphSAGE)', 'Item-to-Item Similarity Index', 'Session Recurrent Attention', 'Real-time Redis Cache'],
    keyTradeoff: 'Real-time cart responsiveness vs. global catalog coverage'
  },
  {
    id: 'youtube-recommendation',
    name: 'Youtube Recommendation',
    company: 'YouTube / Google',
    category: 'Recommendation',
    logo: '/images/companies/youtube.png',
    description: 'Deep neural candidate generation filtering billions of videos down to hundreds, followed by watch-time prediction scoring ranking.',
    latencyConstraint: '< 80ms p99',
    scaleMetric: '2B+ users, 500 hours uploaded/min',
    keyComponents: ['Deep Candidate Generation', 'Deep Ranking (Weighted Logistic)', 'Freshness Feature Boosting', 'Sparsely-Gated MoE'],
    keyTradeoff: 'Watch-time maximization vs. clickbait reduction'
  },
  {
    id: 'openai-distributed-training',
    name: 'OpenAI Distributed Training',
    company: 'OpenAI',
    category: 'Distributed Systems',
    logo: '/images/companies/icons8-chatgpt-50.png',
    description: 'Cluster-scale 3D parallelism (Megatron Tensor Parallel, Pipeline Parallel, and ZeRO-3 / FSDP) across tens of thousands of InfiniBand-connected GPUs.',
    latencyConstraint: 'Sub-microsecond AllReduce sync',
    scaleMetric: '100,000+ H100/B200 GPUs',
    keyComponents: ['Tensor Parallelism (Megatron)', 'Pipeline Parallel (1F1B schedule)', 'ZeRO-3 Optimizer Sharding', 'Checkpoint Asynchronous Offloading'],
    keyTradeoff: 'Inter-node communication overhead vs. memory headroom'
  },
  {
    id: 'pinterest-visual-search',
    name: 'Pinterest Visual Search',
    company: 'Pinterest',
    category: 'Computer Vision',
    logo: '/images/companies/Pinterest.svg.png',
    description: 'Visual similarity search mapping billions of pins into a metric embedding space with HNSW approximate nearest neighbors for camera lens and related pins.',
    latencyConstraint: '< 120ms p99',
    scaleMetric: '5B+ images, 50k QPS',
    keyComponents: ['Multi-task Metric Learning CNN/ViT', 'HNSW Vector Index', 'Bounding Box Object Cropper', 'Two-Pass Re-Ranking'],
    keyTradeoff: 'Image visual similarity vs. user semantic intent'
  },
  {
    id: 'facebook-news-feed',
    name: 'Facebook News Feed',
    company: 'Meta',
    category: 'Recommendation',
    logo: '/images/companies/icons8-meta-48.png',
    description: 'Multi-stage ranking pipeline scoring thousands of candidate posts per user based on integrity, social graphs, meaningful social interactions, and engagement.',
    latencyConstraint: '< 200ms p95',
    scaleMetric: '3B+ DAU, 1M+ candidate pool',
    keyComponents: ['Integrity Filter (Bad content filter)', 'Early-stage Light Ranking', 'Heavy Ranking (DLRM)', 'Diversity & Freshness Re-ranking'],
    keyTradeoff: 'Engagement vs. content integrity and diversity'
  },
  {
    id: 'stripe-fraud-detection',
    name: 'Stripe Fraud Detection (Radar)',
    company: 'Stripe',
    category: 'Real-Time',
    logo: '/images/companies/stripe.webp',
    description: 'Ultra-low-latency synchronous scoring of card transactions evaluating identity graphs, behavioral velocity, and merchant risk.',
    latencyConstraint: '< 30ms p99.9 hard deadline',
    scaleMetric: 'Trillions of dollars processed',
    keyComponents: ['Real-time Streaming Feature Store', 'Gradient Boosted Decision Trees', 'Dynamic Graph Neural Network', 'Fallback Rule Engine'],
    keyTradeoff: 'False Positive rate (declining good users) vs. Fraud losses'
  },
  {
    id: 'spotify-music-rec',
    name: 'Spotify Music Recommendation',
    company: 'Spotify',
    category: 'Recommendation',
    logo: '/images/companies/spotify_new.jpeg',
    description: 'Discover Weekly and Daylist generation combining collaborative filtering, raw audio spectrogram CNN analysis, and contextual playlist embeddings.',
    latencyConstraint: '< 150ms p95',
    scaleMetric: '600M+ users, 100M+ tracks',
    keyComponents: ['Word2Vec Track Embeddings', 'Raw Audio Waveform CNN', 'Matrix Factorization (ALS)', 'Annoy (Approximate Nearest Neighbors)'],
    keyTradeoff: 'Familiarity (safe tracks) vs. Discovery (new artists)'
  },
  {
    id: 'google-autocomplete',
    name: 'Google Autocomplete',
    company: 'Google',
    category: 'Real-Time',
    logo: '/images/companies/icons8-google-48.png',
    description: 'Instant keystroke query completion using partitioned distributed Tries, n-gram language models, and user geographic/session personalization.',
    latencyConstraint: '< 15ms p99',
    scaleMetric: '100,000+ QPS global keystrokes',
    keyComponents: ['Distributed In-Memory Trie', 'N-gram Probability Scoring', 'Real-time Trending Spike Detection', 'Query Policy & SafeSearch Filter'],
    keyTradeoff: 'Per-keystroke speed vs. personalized freshness'
  },
  {
    id: 'meta-ad-click',
    name: 'Meta Ad Click Prediction',
    company: 'Meta',
    category: 'Recommendation',
    logo: '/images/companies/icons8-meta-48.png',
    description: 'pCTR (probability of click) and pCVR (probability of conversion) estimation using massive embedding tables and real-time online learning.',
    latencyConstraint: '< 40ms p99',
    scaleMetric: 'Tens of billions of daily auction bids',
    keyComponents: ['Embedding Table Sharding across GPUs', 'DLRM (Deep Learning Recommendation Model)', 'Online Calibration Layer', 'Streaming Gradient Updates'],
    keyTradeoff: 'Exploration in ad auctions vs. immediate revenue yield'
  },
  {
    id: 'tiktok-content-moderation',
    name: 'TikTok Content Moderation',
    company: 'TikTok / ByteDance',
    category: 'Computer Vision',
    logo: '/images/companies/tiktok.webp',
    description: 'Multimodal safety classification scanning video frames, audio waveforms, OCR on text, and metadata before distribution to the "For You" feed.',
    latencyConstraint: '< 3s asynchronous upload queue',
    scaleMetric: '1B+ videos uploaded daily',
    keyComponents: ['Video Keyframe Extraction', 'Audio ASR Transcription', 'Multimodal Vision-Language Transformer', 'Human-in-the-Loop Escalation'],
    keyTradeoff: 'Over-moderation false flags vs. harmful content leakage'
  },
  {
    id: 'linkedin-pymk',
    name: 'LinkedIn People You May Know',
    company: 'LinkedIn',
    category: 'Recommendation',
    logo: '/images/companies/linkedin.webp',
    description: 'Social graph link prediction scoring triangle-closing probabilities and professional affinity across 1B+ member vertices.',
    latencyConstraint: '< 120ms p95',
    scaleMetric: '1B+ members, trillions of edges',
    keyComponents: ['Ego-network Expansion', 'Graph Neural Network (Link Prediction)', 'Second-Degree Connection Index', 'Multi-objective Ranking'],
    keyTradeoff: 'Popular member hub dominance vs. mutual professional value'
  },
  {
    id: 'uber-eta',
    name: 'Uber ETA Prediction (DeepETA)',
    company: 'Uber',
    category: 'Real-Time',
    logo: '/images/companies/uber.png',
    description: 'Accurate travel time estimation accounting for road topologies, real-time traffic speeds, weather conditions, and driver pick-up delays.',
    latencyConstraint: '< 20ms p99',
    scaleMetric: 'Hundreds of thousands of trip calculations/sec',
    keyComponents: ['Hexagonal H3 Spatial Indexing', 'Linear Graph Routing Engine', 'Deep Transformer Calibration', 'Real-time Streaming Traffic Updates'],
    keyTradeoff: 'Point-to-point graph accuracy vs. dynamic urban traffic surges'
  },
  {
    id: 'airbnb-smart-pricing',
    name: 'Airbnb Smart Pricing',
    company: 'Airbnb',
    category: 'Real-Time',
    logo: '/images/companies/airbnb.png',
    description: 'Dynamic price recommendation predicting booking probability curves conditioned on lead time, seasonality, local events, and comparable listings.',
    latencyConstraint: '< 100ms p95',
    scaleMetric: '7M+ listings globally',
    keyComponents: ['Listing Embedding Vector Space', 'Booking Probability Surface Estimator', 'Lead-time Decay Functions', 'Host Price Boundary Guardrails'],
    keyTradeoff: 'Host revenue maximization vs. guest affordability & occupancy'
  },
  {
    id: 'tesla-autopilot-perception',
    name: 'Tesla Autopilot Perception',
    company: 'Tesla',
    category: 'Computer Vision',
    logo: '/images/companies/tesla.png',
    description: 'HydraNet multi-task vision backbone fusing 8 camera video streams into a unified 3D vector space occupancy grid in real time on custom FSD hardware.',
    latencyConstraint: '< 30ms deterministic latency (36 FPS)',
    scaleMetric: '8 camera streams at 1280x960 36Hz',
    keyComponents: ['Multi-Camera Temporal Transformer', 'Bird\'s Eye View (BEV) Projection', '3D Occupancy Voxel Grid', 'HydraNet Task Heads (Lane, Object, Sign)'],
    keyTradeoff: 'Inference latency budget on 72W FSD chip vs. 3D depth fidelity'
  },
  {
    id: 'gmail-spam-filter',
    name: 'Gmail Spam & Phishing Filter',
    company: 'Google',
    category: 'LLM & RAG',
    logo: '/images/companies/gmail.svg',
    description: 'Defense-in-depth classification blocking 99.9% of spam, malware, and phishing attempts using on-device and server NLP models.',
    latencyConstraint: '< 50ms per email ingress',
    scaleMetric: '1.8B+ accounts, billions of emails/day',
    keyComponents: ['Reputation Graph Analysis (SPF/DKIM/DMARC)', 'Contextual NLP Transformer', 'Sender Domain Heuristics', 'Zero-Day URL Sandbox Scanner'],
    keyTradeoff: 'Zero false positives on crucial emails vs. spam catch rate'
  },
  {
    id: 'apple-notification-ranking',
    name: 'Apple Notification Ranking',
    company: 'Apple',
    category: 'Real-Time',
    logo: '/images/companies/apple.png',
    description: 'On-device private ML ranking notifications and generating summaries for Focus Modes and Notification Center without raw data leaving the device.',
    latencyConstraint: '< 10ms on Apple Neural Engine',
    scaleMetric: '2B+ active devices',
    keyComponents: ['Apple Neural Engine (ANE) Quantized Model', 'On-device Behavioral Feature Store', 'Differential Privacy Aggregation', 'Focus Mode Policy'],
    keyTradeoff: 'Strict on-device privacy & battery usage vs. model size'
  },
  {
    id: 'instagram-visual-tagging',
    name: 'Instagram Visual Product Tagging',
    company: 'Meta',
    category: 'Computer Vision',
    logo: '/images/companies/instagram_new.jpeg',
    description: 'Automatic detection and linking of commercial products in posts and reels to merchant shopping catalogs using zero-shot multimodal embeddings.',
    latencyConstraint: '< 500ms upload background job',
    scaleMetric: 'Hundreds of millions of photos/day',
    keyComponents: ['Object Detection (YOLO/DINO)', 'Visual Embedding Contrastive Model', 'Catalog Nearest Neighbor Index', 'Merchant Catalog Matching'],
    keyTradeoff: 'Recall of subtle product variations vs. precision of exact product SKU'
  },
  {
    id: 'x-trending-topics',
    name: 'X Trending Topics',
    company: 'X / Twitter',
    category: 'Real-Time',
    logo: '/images/companies/twitter.png',
    description: 'Real-time anomaly detection identifying sudden velocity surges in hashtag, phrase, and entity mentions normalized by baseline volume.',
    latencyConstraint: '< 30s sliding aggregation window',
    scaleMetric: '500M+ tweets/day, 50k tweets/sec burst',
    keyComponents: ['Streaming Heavy Hitters (Count-Min Sketch)', 'Poisson Anomaly Velocity Model', 'Entity Disambiguation & Grouping', 'Spam & Bot Shielding'],
    keyTradeoff: 'Immediate breaking news detection vs. bot campaign suppression'
  },
  {
    id: 'bytedance-cost-pipeline',
    name: 'ByteDance Cost-Optimize Pipeline',
    company: 'ByteDance',
    category: 'Distributed Systems',
    logo: '/images/companies/bytedance.png',
    description: 'Massive multi-tenant training and inference scheduling optimizing GPU memory pooling, kernel fusion, and continuous batching across data centers.',
    latencyConstraint: 'Dynamic autoscaling in seconds',
    scaleMetric: '1M+ concurrent model replicas',
    keyComponents: ['GPU Memory Virtualization', 'Continuous Token Batching', 'Kernel Fusion & Auto-tuning', 'Spot Instance Preemption Migration'],
    keyTradeoff: 'Infrastructure compute cost reduction vs. tail latency SLOs'
  }
];

export const MLDesignPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSystem, setSelectedSystem] = useState<MLSystem | null>(null);

  const categories = ['All', 'Recommendation', 'LLM & RAG', 'Distributed Systems', 'Computer Vision', 'Real-Time'];

  const filteredSystems = systemsData.filter((sys) => {
    if (selectedCategory !== 'All' && sys.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = sys.name.toLowerCase().includes(q);
      const matchCompany = sys.company.toLowerCase().includes(q);
      const matchDesc = sys.description.toLowerCase().includes(q);
      const matchComp = sys.keyComponents.some(c => c.toLowerCase().includes(q));
      if (!matchName && !matchCompany && !matchDesc && !matchComp) return false;
    }
    return true;
  });

  return (
    <div className="h-full overflow-y-auto bg-background text-foreground custom-scrollbar">
      <div className="container mx-auto px-4 pt-6 pb-28 sm:py-8 max-w-7xl">
        
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#93C572]/15 text-[#93C572] border border-[#93C572]/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>21 Production ML Architectures</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            ML System Design: Interview Framework & Real-World Examples
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-3xl leading-relaxed">
            Deconstruct production machine learning architectures asked in top AI engineering interviews. Learn how Netflix, Anthropic, OpenAI, Meta, Google, and Stripe solve latency constraints, distributed training, candidate retrieval, and real-time streaming.
          </p>
        </div>

        {/* Framework 4-Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border/80 rounded-xl p-4">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs mb-2">
              1
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Problem & Metrics</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Formulate business goals into ML tasks. Define online metrics (CTR, NDCG) and offline loss objectives.
            </p>
          </div>

          <div className="bg-card border border-border/80 rounded-xl p-4">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs mb-2">
              2
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Data & Features</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Design feature stores, streaming pipelines (Kafka, Flink), negative sampling, and label delay handling.
            </p>
          </div>

          <div className="bg-card border border-border/80 rounded-xl p-4">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold text-xs mb-2">
              3
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Architecture & Scale</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Two-stage candidate retrieval (ANN / HNSW), heavy ranking models, multi-task heads, and model parallelism.
            </p>
          </div>

          <div className="bg-card border border-border/80 rounded-xl p-4">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold text-xs mb-2">
              4
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Serving & Feedback</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Meet strict latency budgets (p99 &lt; 50ms), continuous batching, A/B testing, and data drift monitoring.
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#93C572] text-black font-semibold'
                    : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search systems by company or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs placeholder-muted-foreground focus:outline-none focus:border-[#93C572]/50 transition-colors"
            />
          </div>
        </div>

        {/* Systems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSystems.map((sys) => (
            <div
              key={sys.id}
              onClick={() => setSelectedSystem(sys)}
              className="bg-card border border-border/80 hover:border-[#93C572]/50 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-lg hover:shadow-black/20 group cursor-pointer"
            >
              <div>
                {/* Top Company & Tag */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/50 p-1.5 border border-border flex items-center justify-center">
                      <img
                        src={sys.logo}
                        alt={sys.company}
                        className="w-7 h-7 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground group-hover:text-[#93C572] transition-colors">
                        {sys.name}
                      </h3>
                      <span className="text-xs text-muted-foreground">{sys.company}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-secondary text-muted-foreground border border-border">
                    {sys.category}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  {sys.description}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-4 p-2.5 rounded-lg bg-secondary/30 border border-border/50 text-xs">
                  <div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" /> Latency Budget
                    </div>
                    <div className="font-mono text-[11px] font-semibold text-foreground mt-0.5">
                      {sys.latencyConstraint}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Activity className="w-3 h-3 text-[#93C572]" /> Scale Metric
                    </div>
                    <div className="font-mono text-[11px] font-semibold text-foreground mt-0.5 truncate">
                      {sys.scaleMetric}
                    </div>
                  </div>
                </div>

                {/* Key Components Pills */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {sys.keyComponents.map((comp) => (
                    <span
                      key={comp}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-secondary/80 text-foreground/80 border border-border/60"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                  Tradeoff: {sys.keyTradeoff}
                </span>
                <span className="text-xs text-[#93C572] font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0">
                  Inspect Spec <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal for System Detail */}
        {selectedSystem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
              onClick={() => setSelectedSystem(null)}
            />
            <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary/60 p-2 border border-border flex items-center justify-center">
                    <img
                      src={selectedSystem.logo}
                      alt={selectedSystem.company}
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{selectedSystem.name}</h2>
                    <span className="text-xs text-muted-foreground">{selectedSystem.company} • {selectedSystem.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSystem(null)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">Architecture Overview</h4>
                  <p className="text-muted-foreground leading-relaxed">{selectedSystem.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-secondary/30 border border-border">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Latency Constraint</span>
                    <strong className="text-foreground font-mono">{selectedSystem.latencyConstraint}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Scale & Volume</span>
                    <strong className="text-foreground font-mono">{selectedSystem.scaleMetric}</strong>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-2">Core System Components</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedSystem.keyComponents.map((comp) => (
                      <div key={comp} className="p-2.5 rounded-lg bg-secondary/50 border border-border flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-[#93C572]" />
                        <span className="font-medium text-foreground">{comp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <h5 className="font-semibold text-amber-400 mb-1">Core Engineering Trade-off</h5>
                  <p className="text-muted-foreground leading-relaxed">{selectedSystem.keyTradeoff}</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
