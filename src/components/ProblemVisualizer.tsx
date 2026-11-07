import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Sliders,
  Layers,
  Eye,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Cpu,
  Activity,
  Grid,
  GitBranch,
  Database
} from 'lucide-react';
import { ProblemDetail } from '../types';
import {
  ThemeBridgeContext,
  NavigationBridgeContext,
  getTurbopackComponent,
  hasTurbopackModule,
  initTurbopackRuntime
} from '../ml-math/runtime/turbopackRuntime';

/* ============================================================================
 * 1. SIMPLE / TRIVIAL PROBLEMS EXCLUSION LIST
 * User requested skipping simple/elementary problems like matrix transpose,
 * mean-median-mode, etc., while providing rich ML-Math-style interactive
 * visualizations for all original TensorTonic visualized problems & complex problems.
 * ============================================================================ */
const SIMPLE_EXCLUDED_SLUGS = new Set([
  'matrix-transpose',
  'mean-median-mode',
  'argmax',
  'argmin',
  'make-diagonal',
  'matrix-trace',
  'percent-change',
  'word-count-dict',
  'remove-stopwords',
  'color-to-grayscale',
  'dot-product',
  'euclidean-distance',
  'manhattan-distance',
  'vector-norm-3d',
  'normalize-3d',
  'angle-between-3d',
  'bag-of-words',
  'ds-py-two-sum',
  'ds-py-valid-anagram',
  'ds-py-valid-parentheses',
  'ds-py-first-unique-char',
  'ds-py-group-anagrams',
  'ds-py-Move-zeroes',
  'ml-valid-palindrome-2',
  'ds1-py-mean-stddev',
  'ds11-nlp-whitespace-tokenize',
  'ds11-nlp-text-normalize',
  'nlp-tokenization',
  'nlp-text-normalization',
  'numpy-zeros-ones',
  'numpy-array-creation',
  'numpy-basic-indexing',
  'pytorch-tensor-creation',
  'pytorch-tensor-From-numpy',
  'pandas-series-creation',
  'pandas-dataframe-creation',
  'pandas-head-tail',
  'sql-basic-select',
  'sql-distinct-values',
  'sql-order-by',
  'sql-limit-offset',
  'sql-where-clauses'
]);

/* ============================================================================
 * 2. MAPPING TO PRE-BUILT ML MATH INTERACTIVE TURBOPACK MODULES
 * Connects problem slugs / concepts directly to the 135+ interactive widgets
 * inside public/tt-modules-bundle.js + their /ml-math lesson URLs.
 * ============================================================================ */
interface MLMathWidgetMatch {
  modId: number;
  title: string;
  lessonUrl: string;
  lessonName: string;
}

function getMatchingMLMathWidget(slug: string, vizComp: string, title: string, tags: string[]): MLMathWidgetMatch | null {
  const s = `${slug} ${vizComp} ${title} ${tags.join(' ')}`.toLowerCase();

  if (s.includes('batch-norm') || s.includes('batchnorm')) {
    return { modId: 246110, title: 'Internal Covariate Shift & BatchNorm Simulator', lessonUrl: '/ml-math/optimization/batch-normalization', lessonName: 'Batch Normalization' };
  }
  if (s.includes('dropout')) {
    return { modId: 463613, title: 'Inverted Dropout Masking Simulator', lessonUrl: '/ml-math/optimization/regularization', lessonName: 'Regularization & Dropout' };
  }
  if (s.includes('binary-cross-entropy') || s.includes('bce') || s.includes('log-loss')) {
    return { modId: 908398, title: 'Binary Cross-Entropy Loss Explorer', lessonUrl: '/ml-math/information-theory/cross-entropy', lessonName: 'Cross-Entropy Loss' };
  }
  if (s.includes('cross-entropy') || s.includes('label-smoothing')) {
    return { modId: 327528, title: 'Binary vs Categorical Cross-Entropy Simulator', lessonUrl: '/ml-math/information-theory/cross-entropy', lessonName: 'Cross-Entropy Loss' };
  }
  if (s.includes('kl-divergence') || s.includes('kldiv')) {
    return { modId: 377288, title: 'KL Divergence Distribution Matching Lab', lessonUrl: '/ml-math/information-theory/kl-divergence', lessonName: 'KL Divergence' };
  }
  if (s.includes('jensen-shannon') || s.includes('gan-')) {
    return { modId: 131016, title: 'Generator vs Real Distribution (JS Divergence)', lessonUrl: '/ml-math/information-theory/jensen-shannon', lessonName: 'Jensen-Shannon Divergence' };
  }
  if (s.includes('gini') || s.includes('information-gain') || s.includes('entropy') || s.includes('decision-tree')) {
    return { modId: 941385, title: 'Gini Impurity vs Shannon Entropy Split Explorer', lessonUrl: '/ml-math/information-theory/information-gain', lessonName: 'Information Gain' };
  }
  if (s.includes('perplexity')) {
    return { modId: 504017, title: 'Perplexity & Distribution Sharpness Simulator', lessonUrl: '/ml-math/information-theory/perplexity', lessonName: 'Perplexity' };
  }
  if (s.includes('adam') || s.includes('rmsprop') || s.includes('adagrad') || s.includes('adadelta') || s.includes('nadam') || s.includes('muon')) {
    return { modId: 467836, title: 'Adaptive Learning Rate Trajectory Lab', lessonUrl: '/ml-math/optimization/adaptive-rates', lessonName: 'Adaptive Learning Rates' };
  }
  if (s.includes('momentum') || s.includes('nesterov')) {
    return { modId: 389520, title: 'Momentum & Nesterov Acceleration Lab', lessonUrl: '/ml-math/optimization/momentum-nesterov', lessonName: 'Momentum & Nesterov' };
  }
  if (s.includes('warmup') || s.includes('cosine-annealing') || s.includes('lr-schedule') || s.includes('learning-rate')) {
    return { modId: 264082, title: 'Learning Rate Schedule Convergence Lab', lessonUrl: '/ml-math/optimization/sgd-variants', lessonName: 'LR Schedules & SGD' };
  }
  if (s.includes('autograd') || s.includes('computational-graph') || s.includes('reverse-mode') || s.includes('vjp') || s.includes('backprop')) {
    return { modId: 765558, title: 'Step-by-Step Computational Graph Backprop', lessonUrl: '/ml-math/graph-theory/computational-graphs', lessonName: 'Computational Graphs' };
  }
  if (s.includes('chain-rule') || s.includes('vanishing-grad')) {
    return { modId: 148838, title: 'Deep Chain Rule & Gradient Flow Simulator', lessonUrl: '/ml-math/calculus/chain-rule', lessonName: 'The Chain Rule' };
  }
  if (s.includes('jacobian') || s.includes('hessian') || s.includes('newton')) {
    return { modId: 849514, title: 'Hessian Curvature & Second-Order Step Lab', lessonUrl: '/ml-math/calculus/jacobian-hessian', lessonName: 'Jacobian & Hessian' };
  }
  if (s.includes('taylor')) {
    return { modId: 972691, title: 'Taylor Series Polynomial Approximation Lab', lessonUrl: '/ml-math/calculus/taylor-series', lessonName: 'Taylor Series' };
  }
  if (s.includes('saddle') || s.includes('nonconvex') || s.includes('loss-curvature')) {
    return { modId: 23442, title: '3D Saddle Point & Curvature Explorer', lessonUrl: '/ml-math/calculus/local-vs-saddle', lessonName: 'Local Minima vs Saddle Points' };
  }
  if (s.includes('pca') || s.includes('covariance')) {
    return { modId: 560711, title: 'PCA & Covariance Eigen-Projection Explorer', lessonUrl: '/ml-math/linear-algebra/pca', lessonName: 'Principal Component Analysis' };
  }
  if (s.includes('svd') || s.includes('low-rank') || s.includes('lora')) {
    return { modId: 326067, title: 'SVD Low-Rank Matrix Reconstruction Lab', lessonUrl: '/ml-math/linear-algebra/svd', lessonName: 'Singular Value Decomposition' };
  }
  if (s.includes('eigen')) {
    return { modId: 262120, title: 'Eigenvalue & Eigenvector Transformation Lab', lessonUrl: '/ml-math/linear-algebra/eigenvalue-eigenvector', lessonName: 'Eigenvalues & Eigenvectors' };
  }
  if (s.includes('ridge') || s.includes('lasso') || s.includes('regularization') || s.includes('elastic')) {
    return { modId: 979868, title: 'L1 (Diamond) vs L2 (Circle) Constraint Geometry', lessonUrl: '/ml-math/optimization/regularization', lessonName: 'Regularization (L1, L2)' };
  }
  if (s.includes('linear-regression') || s.includes('least-squares') || s.includes('linreg')) {
    return { modId: 440963, title: 'Orthogonal Projection & Least Squares Lab', lessonUrl: '/ml-math/linear-algebra/projections-least-squares', lessonName: 'Projections & Least Squares' };
  }
  if (s.includes('bayes')) {
    return { modId: 274026, title: 'Bayesian Posterior & Sensitivity Simulator', lessonUrl: '/ml-math/probability/bayes-theorem', lessonName: "Bayes' Theorem" };
  }
  if (s.includes('bootstrap')) {
    return { modId: 611953, title: 'Bootstrap Resampling With Replacement Lab', lessonUrl: '/ml-math/statistics/resampling', lessonName: 'Resampling & Bootstrap' };
  }
  if (s.includes('t-test') || s.includes('p-value') || s.includes('ab-test') || s.includes('chi2')) {
    return { modId: 699653, title: 'Interactive Hypothesis & T-Statistic Calculator', lessonUrl: '/ml-math/statistics/t-test', lessonName: 'Hypothesis Testing & T-Test' };
  }
  if (s.includes('correlation') || s.includes('cosine-similarity')) {
    return { modId: 417298, title: 'Interactive Correlation & Vector Alignment Lab', lessonUrl: '/ml-math/statistics/correlation', lessonName: 'Correlation' };
  }
  if (s.includes('gradient-descent') || s.includes('sgd')) {
    return { modId: 299522, title: 'Gradient Descent Step & Learning Rate Lab', lessonUrl: '/ml-math/calculus/backpropagation', lessonName: 'Gradient Descent & Backprop' };
  }
  return null;
}

/* Error boundary so embedded Turbopack components never break the problem page */
class SafeWidgetBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/* ============================================================================
 * ENGINE 1: INTERACTIVE ACTIVATION & NONLINEARITY VISUALIZER
 * Covers Sigmoid, ReLU, LeakyReLU, GELU, Swish/SiLU, Tanh, SELU, ELU, Softmax
 * ============================================================================ */
const ActivationLab: React.FC<{ slug: string; title: string }> = ({ slug, title }) => {
  const s = `${slug} ${title}`.toLowerCase();
  const initialMode = useMemo(() => {
    if (s.includes('softmax')) return 'softmax';
    if (s.includes('gelu')) return 'gelu';
    if (s.includes('swish') || s.includes('silu') || s.includes('glu')) return 'swish';
    if (s.includes('leaky')) return 'leaky_relu';
    if (s.includes('selu')) return 'selu';
    if (s.includes('elu')) return 'elu';
    if (s.includes('tanh')) return 'tanh';
    if (s.includes('relu')) return 'relu';
    return 'sigmoid';
  }, [s]);

  const [xVal, setXVal] = useState<number>(0.8);
  const [param, setParam] = useState<number>(initialMode === 'leaky_relu' ? 0.1 : 1.0);
  const [logits, setLogits] = useState<number[]>([2.2, 1.1, 0.3, -0.8]);

  const evalFn = (x: number): { y: number; dy: number } => {
    switch (initialMode) {
      case 'relu':
        return { y: Math.max(0, x), dy: x > 0 ? 1 : 0 };
      case 'leaky_relu':
        return { y: x >= 0 ? x : param * x, dy: x >= 0 ? 1 : param };
      case 'elu':
        return { y: x >= 0 ? x : param * (Math.exp(x) - 1), dy: x >= 0 ? 1 : param * Math.exp(x) };
      case 'selu': {
        const scale = 1.0507;
        const alpha = 1.67326;
        return {
          y: x >= 0 ? scale * x : scale * alpha * (Math.exp(x) - 1),
          dy: x >= 0 ? scale : scale * alpha * Math.exp(x)
        };
      }
      case 'tanh': {
        const t = Math.tanh(x);
        return { y: t, dy: 1 - t * t };
      }
      case 'gelu': {
        const k = Math.sqrt(2 / Math.PI);
        const inner = k * (x + 0.044715 * x * x * x);
        const t = Math.tanh(inner);
        const y = 0.5 * x * (1 + t);
        const sech2 = 1 - t * t;
        const dy = 0.5 * (1 + t) + 0.5 * x * sech2 * k * (1 + 3 * 0.044715 * x * x);
        return { y, dy };
      }
      case 'swish': {
        const sig = 1 / (1 + Math.exp(-param * x));
        const y = x * sig;
        const dy = sig + param * x * sig * (1 - sig);
        return { y, dy };
      }
      default: {
        const sig = 1 / (1 + Math.exp(-param * x));
        return { y: sig, dy: param * sig * (1 - sig) };
      }
    }
  };

  if (initialMode === 'softmax') {
    const temp = Math.max(0.15, param);
    const scaled = logits.map(z => z / temp);
    const maxZ = Math.max(...scaled);
    const exps = scaled.map(z => Math.exp(z - maxZ));
    const sumExp = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map(e => e / sumExp);

    return (
      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 bg-secondary/20 border border-border/70 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Input Logits $z_i$ & Temperature $\tau$</span>
              <span className="font-mono text-[#93C572] tabular-nums">τ = {temp.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.05"
              value={temp}
              onChange={e => setParam(parseFloat(e.target.value))}
              className="w-full accent-[#93C572]"
            />
            <div className="space-y-2 pt-1">
              {logits.map((val, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="font-mono w-10 text-muted-foreground">z[{idx}]</span>
                  <input
                    type="range"
                    min="-3"
                    max="4"
                    step="0.1"
                    value={val}
                    onChange={e => {
                      const next = [...logits];
                      next[idx] = parseFloat(e.target.value);
                      setLogits(next);
                    }}
                    className="flex-1 accent-sky-400"
                  />
                  <span className="font-mono w-11 text-right tabular-nums text-foreground">{val.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 bg-secondary/20 border border-border/70 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Normalized Softmax Distribution $P(y=i)$</span>
              <span className="font-mono text-muted-foreground tabular-nums">∑ P = 1.000</span>
            </div>
            <div className="space-y-2.5 my-auto">
              {probs.map((p, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono tabular-nums">
                    <span className="text-muted-foreground">
                      Class {idx} · exp({(scaled[idx] - maxZ).toFixed(2)}) = {exps[idx].toFixed(3)}
                    </span>
                    <span className="font-bold text-[#93C572]">{(p * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-background/80 rounded-md overflow-hidden border border-border/50">
                    <div
                      className="h-full bg-gradient-to-r from-[#93C572] to-sky-400 transition-all duration-150"
                      style={{ width: `${Math.max(2, p * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-muted-foreground font-mono pt-1 border-t border-border/50">
              Max-shift stabilization: max(z/τ) = {maxZ.toFixed(2)} subtracted before exp()
            </div>
          </div>
        </div>
      </div>
    );
  }

  const width = 440;
  const height = 185;
  const toSvgX = (x: number) => 36 + ((x + 4) / 8) * (width - 56);
  const toSvgY = (y: number) => height - 28 - ((y + 1.5) / 4.5) * (height - 44);

  const { pathY, pathDy } = useMemo(() => {
    let py = '';
    let pdy = '';
    for (let i = 0; i <= 80; i++) {
      const x = -4 + (i / 80) * 8;
      const { y, dy } = evalFn(x);
      const sx = toSvgX(x);
      const sy = toSvgY(Math.max(-1.4, Math.min(2.9, y)));
      const sdy = toSvgY(Math.max(-1.4, Math.min(2.9, dy)));
      py += `${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)} `;
      pdy += `${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sdy.toFixed(1)} `;
    }
    return { pathY: py, pathDy: pdy };
  }, [initialMode, param]);

  const current = evalFn(xVal);
  const cx = toSvgX(xVal);
  const cy = toSvgY(Math.max(-1.4, Math.min(2.9, current.y)));

  return (
    <div className="p-4 sm:p-5 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-7 bg-secondary/20 border border-border/70 rounded-xl p-3">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
            {/* Axes */}
            <line x1={36} y1={toSvgY(0)} x2={width - 20} y2={toSvgY(0)} stroke="currentColor" className="text-border" strokeWidth="1" />
            <line x1={toSvgX(0)} y1={14} x2={toSvgX(0)} y2={height - 20} stroke="currentColor" className="text-border" strokeWidth="1" />
            {/* Derivative curve */}
            <path d={pathDy} fill="none" stroke="#f59e0b" strokeWidth="1.75" strokeDasharray="4 3" />
            {/* Activation curve */}
            <path d={pathY} fill="none" stroke="#93C572" strokeWidth="2.5" />
            {/* Active point */}
            <line x1={cx} y1={toSvgY(0)} x2={cx} y2={cy} stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="2 2" />
            <circle cx={cx} cy={cy} r="5" fill="#93C572" stroke="#0f172a" strokeWidth="2" />
            <text x={42} y={24} className="fill-muted-foreground text-[10px] font-mono">
              Solid: f(x) · Dashed: f'(x)
            </text>
          </svg>
        </div>

        <div className="lg:col-span-5 space-y-3">
          <div className="space-y-1.5 bg-secondary/20 border border-border/70 rounded-xl p-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-medium">Input Value $x$</span>
              <span className="font-mono font-bold text-foreground tabular-nums">{xVal.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-3.8"
              max="3.8"
              step="0.05"
              value={xVal}
              onChange={e => setXVal(parseFloat(e.target.value))}
              className="w-full accent-[#93C572]"
            />
            {(initialMode === 'leaky_relu' || initialMode === 'elu' || initialMode === 'swish' || initialMode === 'sigmoid') && (
              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-medium">
                    {initialMode === 'leaky_relu' || initialMode === 'elu' ? 'Slope α' : 'Gain β'}
                  </span>
                  <span className="font-mono font-bold text-sky-400 tabular-nums">{param.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={initialMode === 'leaky_relu' ? '0.01' : '0.2'}
                  max={initialMode === 'leaky_relu' ? '0.5' : '3.0'}
                  step="0.02"
                  value={param}
                  onChange={e => setParam(parseFloat(e.target.value))}
                  className="w-full accent-sky-400"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 font-mono text-xs tabular-nums">
            <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/70">
              <div className="text-[10px] text-muted-foreground">Activation f(x)</div>
              <div className="text-sm font-bold text-[#93C572] mt-0.5">{current.y.toFixed(4)}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/70">
              <div className="text-[10px] text-muted-foreground">Gradient f'(x)</div>
              <div className="text-sm font-bold text-amber-400 mt-0.5">{current.dy.toFixed(4)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * ENGINE 2: INTERACTIVE ATTENTION, MULTI-HEAD, ROPE & TRANSFORMER LAB
 * Covers Scaled Dot-Product Attention, Causal Mask, Multi-Head, RoPE, MoE, Norm
 * ============================================================================ */
const TransformerAttentionLab: React.FC<{ slug: string; title: string }> = ({ slug, title }) => {
  const s = `${slug} ${title}`.toLowerCase();
  const isMoE = s.includes('moe') || s.includes('router');
  const isRoPE = s.includes('rope') || s.includes('rotary') || s.includes('positional');

  const [selectedQuery, setSelectedQuery] = useState<number>(2);
  const [causalMask, setCausalMask] = useState<boolean>(s.includes('causal') || s.includes('gpt') || s.includes('decode'));
  const [scaleDk, setScaleDk] = useState<number>(64);
  const [activeHead, setActiveHead] = useState<number>(0);
  const [ropePos, setRopePos] = useState<number>(3);
  const [topKExperts, setTopKExperts] = useState<number>(2);

  const tokens = ['[BOS]', 'The', 'model', 'learns'];
  const baseScores = [
    [
      [1.8, 0.6, 0.2, 0.1],
      [0.7, 2.1, 0.9, 0.3],
      [0.4, 1.2, 2.4, 1.1],
      [0.3, 0.8, 1.9, 2.5]
    ],
    [
      [2.2, 0.3, 0.1, 0.2],
      [0.4, 1.5, 1.7, 0.5],
      [0.2, 1.9, 1.3, 1.4],
      [0.5, 0.4, 2.3, 1.8]
    ]
  ];

  if (isMoE) {
    const expertScores = [1.85, 0.42, 2.35, -0.3, 1.12, 0.15];
    const exps = expertScores.map(v => Math.exp(v));
    const sumE = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map(e => e / sumE);
    const sortedIdx = probs
      .map((p, i) => ({ p, i }))
      .sort((a, b) => b.p - a.p)
      .slice(0, topKExperts)
      .map(x => x.i);
    const topSum = sortedIdx.reduce((acc, idx) => acc + probs[idx], 0);

    return (
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Sparse Mixture-of-Experts (MoE) routes each token to the <strong className="text-foreground">Top-{topKExperts}</strong> experts and renormalizes gate weights.
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Active Experts (k):</span>
            {[1, 2, 3].map(k => (
              <button
                key={k}
                onClick={() => setTopKExperts(k)}
                className={`px-2.5 py-1 rounded-md font-mono font-semibold border transition-colors ${
                  topKExperts === k
                    ? 'bg-[#93C572] text-black border-[#93C572]'
                    : 'bg-secondary/40 text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                k={k}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 font-mono text-xs tabular-nums">
          {probs.map((p, i) => {
            const isSelected = sortedIdx.includes(i);
            const normWeight = isSelected ? p / topSum : 0;
            return (
              <div
                key={i}
                className={`p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-[#93C572]/15 border-[#93C572]/50 text-foreground'
                    : 'bg-secondary/20 border-border/60 text-muted-foreground opacity-60'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold">Expert {i}</span>
                  <span>{isSelected ? 'ACTIVE' : 'MASKED'}</span>
                </div>
                <div className="text-sm font-bold mt-1.5 text-[#93C572]">
                  {isSelected ? `${(normWeight * 100).toFixed(1)}%` : '0.0%'}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  raw: {(p * 100).toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (isRoPE) {
    const theta = ropePos * 0.45;
    const vx = Math.cos(theta);
    const vy = Math.sin(theta);
    return (
      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5 flex flex-col items-center bg-secondary/20 border border-border/70 rounded-xl p-3">
            <svg viewBox="0 0 180 180" className="w-40 h-40">
              <circle cx="90" cy="90" r="64" fill="none" stroke="currentColor" className="text-border" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="16" y1="90" x2="164" y2="90" stroke="currentColor" className="text-border" strokeWidth="1" />
              <line x1="90" y1="16" x2="90" y2="164" stroke="currentColor" className="text-border" strokeWidth="1" />
              {/* Reference vector at m=0 */}
              <line x1="90" y1="90" x2="154" y2="90" stroke="#64748b" strokeWidth="2" />
              {/* Rotated vector at position m */}
              <line
                x1="90"
                y1="90"
                x2={90 + 64 * vx}
                y2={90 - 64 * vy}
                stroke="#93C572"
                strokeWidth="3"
              />
              <circle cx={90 + 64 * vx} cy={90 - 64 * vy} r="4.5" fill="#93C572" />
              <text x="12" y="20" className="fill-muted-foreground text-[10px] font-mono">
                2D Complex Plane Rotation
              </text>
            </svg>
          </div>
          <div className="md:col-span-7 space-y-3">
            <div className="bg-secondary/20 border border-border/70 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-foreground">Token Sequence Position $m$</span>
                <span className="font-mono text-[#93C572] tabular-nums">m = {ropePos} · mθ = {(theta * (180 / Math.PI)).toFixed(0)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={ropePos}
                onChange={e => setRopePos(parseInt(e.target.value, 10))}
                className="w-full accent-[#93C572]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs tabular-nums">
              <div className="p-3 rounded-xl bg-secondary/20 border border-border/70">
                <div className="text-[10px] text-muted-foreground">cos(m · θ_i)</div>
                <div className="text-sm font-bold text-[#93C572] mt-0.5">{vx.toFixed(4)}</div>
              </div>
              <div className="p-3 rounded-xl bg-secondary/20 border border-border/70">
                <div className="text-[10px] text-muted-foreground">sin(m · θ_i)</div>
                <div className="text-sm font-bold text-sky-400 mt-0.5">{vy.toFixed(4)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const scaleFactor = 1 / Math.sqrt(scaleDk);
  const rawMatrix = baseScores[activeHead % baseScores.length];
  const attnMatrix = rawMatrix.map((row, qi) => {
    const scaled = row.map((val, ki) => {
      if (causalMask && ki > qi) return -Infinity;
      return val * (8 * scaleFactor);
    });
    const finiteMax = Math.max(...scaled.filter(v => Number.isFinite(v)));
    const exps = scaled.map(v => (Number.isFinite(v) ? Math.exp(v - finiteMax) : 0));
    const sum = exps.reduce((a, b) => a + b, 0) || 1;
    return exps.map(e => e / sum);
  });

  return (
    <div className="p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveHead(0)}
            className={`px-2.5 py-1 rounded-md font-mono font-semibold border transition-colors ${
              activeHead === 0 ? 'bg-[#93C572] text-black border-[#93C572]' : 'bg-secondary/40 text-muted-foreground border-border'
            }`}
          >
            Head 0 (Local)
          </button>
          <button
            onClick={() => setActiveHead(1)}
            className={`px-2.5 py-1 rounded-md font-mono font-semibold border transition-colors ${
              activeHead === 1 ? 'bg-[#93C572] text-black border-[#93C572]' : 'bg-secondary/40 text-muted-foreground border-border'
            }`}
          >
            Head 1 (Syntactic)
          </button>
          <button
            onClick={() => setCausalMask(v => !v)}
            className={`px-2.5 py-1 rounded-md font-mono font-semibold border transition-colors ${
              causalMask
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                : 'bg-secondary/40 text-muted-foreground border-border'
            }`}
          >
            Causal Mask: {causalMask ? 'ON (-∞)' : 'OFF'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono">d_k = {scaleDk}</span>
          <input
            type="range"
            min="16"
            max="256"
            step="16"
            value={scaleDk}
            onChange={e => setScaleDk(parseInt(e.target.value, 10))}
            className="w-24 accent-[#93C572]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* 4x4 Attention Matrix Heatmap */}
        <div className="md:col-span-7 bg-secondary/20 border border-border/70 rounded-xl p-3">
          <div className="text-[11px] font-mono text-muted-foreground mb-2">
            Click a Query row ($Q_i$) to inspect Softmax($Q_i K^T / \sqrt{'{d_k}'}$) weights:
          </div>
          <div className="grid grid-cols-5 gap-1.5 font-mono text-xs tabular-nums items-center">
            <div className="text-[10px] text-muted-foreground text-right pr-1">Q \ K</div>
            {tokens.map((t, ki) => (
              <div key={ki} className="text-center text-[11px] font-semibold text-muted-foreground truncate">
                {t}
              </div>
            ))}

            {attnMatrix.map((row, qi) => (
              <React.Fragment key={qi}>
                <button
                  onClick={() => setSelectedQuery(qi)}
                  className={`text-right pr-2 py-1.5 rounded text-[11px] font-bold transition-colors ${
                    selectedQuery === qi ? 'text-[#93C572] bg-[#93C572]/10' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tokens[qi]}
                </button>
                {row.map((w, ki) => {
                  const isMasked = causalMask && ki > qi;
                  return (
                    <button
                      key={ki}
                      onClick={() => setSelectedQuery(qi)}
                      className={`h-10 rounded-lg border text-xs font-mono font-bold transition-all flex items-center justify-center ${
                        selectedQuery === qi ? 'ring-1 ring-[#93C572]' : ''
                      } ${isMasked ? 'bg-background/40 border-border/40 text-muted-foreground/40' : 'border-border/60 text-foreground'}`}
                      style={
                        !isMasked
                          ? { backgroundColor: `rgba(147, 197, 114, ${Math.max(0.08, w * 0.85)})` }
                          : undefined
                      }
                    >
                      {isMasked ? '-∞' : w.toFixed(2)}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Selected Query Attention Distribution */}
        <div className="md:col-span-5 bg-secondary/20 border border-border/70 rounded-xl p-3.5 space-y-2.5">
          <div className="text-xs font-semibold text-foreground">
            Query Token <span className="font-mono text-[#93C572]">"{tokens[selectedQuery]}"</span> Attention Breakdown
          </div>
          <div className="space-y-2">
            {attnMatrix[selectedQuery].map((w, ki) => (
              <div key={ki} className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono tabular-nums">
                  <span className="text-muted-foreground">→ Key "{tokens[ki]}"</span>
                  <span className="font-bold text-foreground">{(w * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-background/80 rounded overflow-hidden">
                  <div
                    className="h-full bg-[#93C572] transition-all duration-150"
                    style={{ width: `${w * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono pt-1 border-t border-border/50">
            Scale 1/√d_k = {(1 / Math.sqrt(scaleDk)).toFixed(4)} prevents softmax saturation
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * ENGINE 3: INTERACTIVE 2D CONVOLUTION, POOLING, IOU/NMS & CNN ARCHITECTURE LAB
 * Covers Conv2D, MaxPool, AvgPool, IoU, NMS, ResNet Skip Connection, UNet, VGG
 * ============================================================================ */
const VisionCnnLab: React.FC<{ slug: string; title: string }> = ({ slug, title }) => {
  const s = `${slug} ${title}`.toLowerCase();
  const isIoU = s.includes('iou') || s.includes('nms') || s.includes('suppression') || s.includes('anchor');
  const isResNet = s.includes('resnet') || s.includes('skip-connection') || s.includes('residual') || s.includes('bottleneck') || s.includes('identity-block');

  const [stepIdx, setStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [mode, setMode] = useState<'conv' | 'maxpool' | 'avgpool'>(
    s.includes('max-pool') || s.includes('maxpool') ? 'maxpool' : s.includes('avg') || s.includes('average') ? 'avgpool' : 'conv'
  );
  const [boxOffset, setBoxOffset] = useState<number>(18);
  const [resInput, setResInput] = useState<number>(1.4);
  const [resWeight, setResWeight] = useState<number>(-0.6);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setStepIdx(prev => (prev + 1) % 9);
    }, 650);
    return () => clearInterval(timer);
  }, [isPlaying]);

  if (isIoU) {
    // Box A fixed at (30, 25, 80, 70), Box B shifted by boxOffset
    const ax1 = 30, ay1 = 25, ax2 = 110, ay2 = 95;
    const bx1 = 30 + boxOffset, by1 = 25 + Math.round(boxOffset * 0.6), bx2 = bx1 + 80, by2 = by1 + 70;
    const ix1 = Math.max(ax1, bx1), iy1 = Math.max(ay1, by1);
    const ix2 = Math.min(ax2, bx2), iy2 = Math.min(ay2, by2);
    const iw = Math.max(0, ix2 - ix1), ih = Math.max(0, iy2 - iy1);
    const interArea = iw * ih;
    const areaA = (ax2 - ax1) * (ay2 - ay1);
    const areaB = (bx2 - bx1) * (by2 - by1);
    const unionArea = areaA + areaB - interArea;
    const iou = unionArea > 0 ? interArea / unionArea : 0;

    return (
      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-6 bg-secondary/20 border border-border/70 rounded-xl p-3 flex justify-center">
            <svg viewBox="0 0 220 145" className="w-full max-w-[280px] h-40">
              {/* Box A */}
              <rect x={ax1} y={ay1} width={80} height={70} fill="rgba(56, 189, 248, 0.14)" stroke="#38bdf8" strokeWidth="2" rx="4" />
              {/* Box B */}
              <rect x={bx1} y={by1} width={80} height={70} fill="rgba(245, 158, 11, 0.14)" stroke="#f59e0b" strokeWidth="2" rx="4" />
              {/* Intersection */}
              {interArea > 0 && (
                <rect x={ix1} y={iy1} width={iw} height={ih} fill="rgba(147, 197, 114, 0.55)" stroke="#93C572" strokeWidth="2" />
              )}
              <text x={ax1 + 4} y={ay1 + 13} className="fill-sky-400 text-[9px] font-mono font-bold">Box A</text>
              <text x={bx2 - 34} y={by2 - 6} className="fill-amber-400 text-[9px] font-mono font-bold">Box B</text>
            </svg>
          </div>
          <div className="md:col-span-6 space-y-3">
            <div className="bg-secondary/20 border border-border/70 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-foreground">Bounding Box B Displacement</span>
                <span className="font-mono text-[#93C572] tabular-nums">Δx = {boxOffset}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="85"
                step="1"
                value={boxOffset}
                onChange={e => setBoxOffset(parseInt(e.target.value, 10))}
                className="w-full accent-[#93C572]"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs tabular-nums">
              <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/70">
                <div className="text-[10px] text-muted-foreground">Intersection</div>
                <div className="font-bold text-[#93C572] mt-0.5">{interArea}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/70">
                <div className="text-[10px] text-muted-foreground">Union</div>
                <div className="font-bold text-sky-400 mt-0.5">{unionArea}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/70">
                <div className="text-[10px] text-muted-foreground">IoU Score</div>
                <div className="font-bold text-amber-400 mt-0.5">{iou.toFixed(3)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isResNet) {
    const fx = Math.max(0, resInput * resWeight);
    const out = Math.max(0, fx + resInput);
    return (
      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-7 bg-secondary/20 border border-border/70 rounded-xl p-4">
            <div className="flex items-center justify-between gap-2 font-mono text-xs tabular-nums">
              <div className="p-2.5 rounded-lg bg-background border border-border text-center">
                <div className="text-[10px] text-muted-foreground">Input x</div>
                <div className="font-bold text-sky-400">{resInput.toFixed(2)}</div>
              </div>
              <span className="text-muted-foreground">→</span>
              <div className="p-2.5 rounded-lg bg-background border border-border text-center">
                <div className="text-[10px] text-muted-foreground">Residual F(x)</div>
                <div className="font-bold text-amber-400">{fx.toFixed(2)}</div>
              </div>
              <span className="text-muted-foreground">+ x →</span>
              <div className="p-2.5 rounded-lg bg-[#93C572]/15 border border-[#93C572]/40 text-center">
                <div className="text-[10px] text-muted-foreground">ReLU(F(x)+x)</div>
                <div className="font-bold text-[#93C572]">{out.toFixed(2)}</div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground font-mono">
              Identity shortcut preserves gradient highway: ∂y/∂x = ∂F(x)/∂x + 1 (even when F(x) saturates at 0)
            </div>
          </div>
          <div className="md:col-span-5 space-y-2.5 bg-secondary/20 border border-border/70 rounded-xl p-3.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Activation x</span>
              <span className="font-mono font-bold text-sky-400 tabular-nums">{resInput.toFixed(2)}</span>
            </div>
            <input type="range" min="-1.5" max="3.0" step="0.1" value={resInput} onChange={e => setResInput(parseFloat(e.target.value))} className="w-full accent-sky-400" />
            <div className="flex justify-between text-xs pt-1">
              <span className="text-muted-foreground">Block Weight W</span>
              <span className="font-mono font-bold text-amber-400 tabular-nums">{resWeight.toFixed(2)}</span>
            </div>
            <input type="range" min="-1.5" max="1.5" step="0.1" value={resWeight} onChange={e => setResWeight(parseFloat(e.target.value))} className="w-full accent-amber-400" />
          </div>
        </div>
      </div>
    );
  }

  const inputGrid = [
    [1, 2, 0, 1, 3],
    [0, 3, 2, 1, 0],
    [2, 1, 4, 0, 2],
    [1, 0, 2, 3, 1],
    [0, 2, 1, 0, 2]
  ];
  const kernel = [
    [1, 0, -1],
    [1, 0, -1],
    [1, 0, -1]
  ];

  const rRow = Math.floor(stepIdx / 3);
  const rCol = stepIdx % 3;

  const computeCell = (r: number, c: number) => {
    const vals: number[] = [];
    let convSum = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const v = inputGrid[r + i][c + j];
        vals.push(v);
        convSum += v * kernel[i][j];
      }
    }
    if (mode === 'maxpool') return Math.max(...vals);
    if (mode === 'avgpool') return Number((vals.reduce((a, b) => a + b, 0) / 9).toFixed(1));
    return convSum;
  };

  return (
    <div className="p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          {(['conv', 'maxpool', 'avgpool'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 rounded-md font-mono font-semibold border transition-colors ${
                mode === m ? 'bg-[#93C572] text-black border-[#93C572]' : 'bg-secondary/40 text-muted-foreground border-border'
              }`}
            >
              {m === 'conv' ? 'Conv2D (3×3)' : m === 'maxpool' ? 'MaxPool (3×3)' : 'AvgPool (3×3)'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPlaying(p => !p)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary border border-border text-foreground font-semibold"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-[#93C572]" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setStepIdx(prev => (prev + 1) % 9);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary border border-border text-foreground font-semibold"
          >
            <StepForward className="w-3.5 h-3.5 text-sky-400" />
            <span>Step</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center font-mono text-xs tabular-nums">
        {/* 5x5 Input Grid */}
        <div className="md:col-span-5 bg-secondary/20 border border-border/70 rounded-xl p-3">
          <div className="text-[11px] text-muted-foreground mb-2">Input Tensor (5×5) · Window ({rRow}, {rCol})</div>
          <div className="grid grid-cols-5 gap-1">
            {inputGrid.map((row, ri) =>
              row.map((val, ci) => {
                const inWindow = ri >= rRow && ri < rRow + 3 && ci >= rCol && ci < rCol + 3;
                return (
                  <div
                    key={`${ri}-${ci}`}
                    className={`h-8 rounded flex items-center justify-center font-bold border transition-all ${
                      inWindow
                        ? 'bg-[#93C572]/25 border-[#93C572] text-foreground'
                        : 'bg-background/60 border-border/50 text-muted-foreground'
                    }`}
                  >
                    {val}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3x3 Kernel */}
        <div className="md:col-span-3 bg-secondary/20 border border-border/70 rounded-xl p-3">
          <div className="text-[11px] text-muted-foreground mb-2">
            {mode === 'conv' ? 'Filter Kernel W' : mode === 'maxpool' ? 'Max Operator' : 'Mean Operator'}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {kernel.map((row, ri) =>
              row.map((val, ci) => (
                <div
                  key={`${ri}-${ci}`}
                  className="h-8 rounded flex items-center justify-center font-bold bg-sky-500/15 border border-sky-500/40 text-sky-400"
                >
                  {mode === 'conv' ? val : mode === 'maxpool' ? 'max' : '1/9'}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3x3 Output Feature Map */}
        <div className="md:col-span-4 bg-secondary/20 border border-border/70 rounded-xl p-3">
          <div className="text-[11px] text-muted-foreground mb-2">Output Feature Map (3×3)</div>
          <div className="grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map(ri =>
              [0, 1, 2].map(ci => {
                const isCurrent = ri === rRow && ci === rCol;
                return (
                  <button
                    key={`${ri}-${ci}`}
                    onClick={() => {
                      setIsPlaying(false);
                      setStepIdx(ri * 3 + ci);
                    }}
                    className={`h-9 rounded-lg flex items-center justify-center font-bold border transition-all ${
                      isCurrent
                        ? 'bg-[#93C572] text-black border-[#93C572] scale-105'
                        : 'bg-background/70 border-border/60 text-foreground hover:border-[#93C572]/50'
                    }`}
                  >
                    {computeCell(ri, ci)}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * ENGINE 4: INTERACTIVE SEQUENCE GATES (RNN, LSTM, GRU) & GENERATIVE LAB (VAE, DDPM)
 * ============================================================================ */
const SequenceAndGenerativeLab: React.FC<{ slug: string; title: string }> = ({ slug, title }) => {
  const s = `${slug} ${title}`.toLowerCase();
  const isVAE = s.includes('vae') || s.includes('reparameter') || s.includes('elbo');
  const isDiffusion = s.includes('ddpm') || s.includes('diffusion');

  const [xt, setXt] = useState<number>(0.9);
  const [htPrev, setHtPrev] = useState<number>(0.4);
  const [ctPrev, setCtPrev] = useState<number>(0.7);
  const [forgetBias, setForgetBias] = useState<number>(0.5);
  const [diffStep, setDiffStep] = useState<number>(350);

  const sig = (z: number) => 1 / (1 + Math.exp(-z));

  if (isDiffusion) {
    const alphaBar = Math.exp(-3.5 * (diffStep / 1000));
    const sigScale = Math.sqrt(alphaBar);
    const noiseScale = Math.sqrt(1 - alphaBar);
    return (
      <div className="p-4 sm:p-5 space-y-4">
        <div className="bg-secondary/20 border border-border/70 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-foreground">Diffusion Timestep $t \in [0, 1000]$</span>
            <span className="font-mono text-[#93C572] tabular-nums">t = {diffStep}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1000"
            step="10"
            value={diffStep}
            onChange={e => setDiffStep(parseInt(e.target.value, 10))}
            className="w-full accent-[#93C572]"
          />
        </div>
        <div className="grid grid-cols-3 gap-3 font-mono text-xs tabular-nums">
          <div className="p-3 rounded-xl bg-secondary/20 border border-border/70">
            <div className="text-[10px] text-muted-foreground">Cumulative ᾱ_t</div>
            <div className="text-sm font-bold text-foreground mt-0.5">{alphaBar.toFixed(4)}</div>
          </div>
          <div className="p-3 rounded-xl bg-secondary/20 border border-border/70">
            <div className="text-[10px] text-muted-foreground">Signal √ᾱ_t · x_0</div>
            <div className="text-sm font-bold text-[#93C572] mt-0.5">{(sigScale * 100).toFixed(1)}%</div>
          </div>
          <div className="p-3 rounded-xl bg-secondary/20 border border-border/70">
            <div className="text-[10px] text-muted-foreground">Noise √(1-ᾱ_t) · ε</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5">{(noiseScale * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    );
  }

  if (isVAE) {
    const mu = xt;
    const sigma = Math.exp(0.5 * htPrev);
    const kl = -0.5 * (1 + htPrev - mu * mu - sigma * sigma);
    return (
      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 bg-secondary/20 border border-border/70 rounded-xl p-3.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Latent Mean μ</span>
              <span className="font-mono font-bold text-[#93C572] tabular-nums">{mu.toFixed(2)}</span>
            </div>
            <input type="range" min="-2.5" max="2.5" step="0.1" value={xt} onChange={e => setXt(parseFloat(e.target.value))} className="w-full accent-[#93C572]" />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Log-Variance log(σ²)</span>
              <span className="font-mono font-bold text-sky-400 tabular-nums">{htPrev.toFixed(2)} (σ={sigma.toFixed(2)})</span>
            </div>
            <input type="range" min="-2.0" max="1.5" step="0.1" value={htPrev} onChange={e => setHtPrev(parseFloat(e.target.value))} className="w-full accent-sky-400" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 font-mono text-xs tabular-nums">
            <div className="p-3 rounded-xl bg-secondary/20 border border-border/70 flex flex-col justify-center">
              <div className="text-[10px] text-muted-foreground">Reparameterized z (ε=0.5)</div>
              <div className="text-base font-bold text-[#93C572] mt-1">{(mu + sigma * 0.5).toFixed(4)}</div>
              <div className="text-[10px] text-muted-foreground mt-1">z = μ + σ ⊙ ε</div>
            </div>
            <div className="p-3 rounded-xl bg-secondary/20 border border-border/70 flex flex-col justify-center">
              <div className="text-[10px] text-muted-foreground">KL(q(z|x) || N(0,1))</div>
              <div className="text-base font-bold text-amber-400 mt-1">{Math.max(0, kl).toFixed(4)}</div>
              <div className="text-[10px] text-muted-foreground mt-1">Min 0 at μ=0, σ=1</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ft = sig(xt + htPrev + forgetBias);
  const it = sig(xt * 0.8 + htPrev * 0.5);
  const cTilde = Math.tanh(xt * 0.9 + htPrev * 0.6);
  const ct = ft * ctPrev + it * cTilde;
  const ot = sig(xt * 0.7 + htPrev * 0.7);
  const ht = ot * Math.tanh(ct);

  return (
    <div className="p-4 sm:p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-5 space-y-2.5 bg-secondary/20 border border-border/70 rounded-xl p-3.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Input Signal $x_t$</span>
            <span className="font-mono font-bold text-foreground tabular-nums">{xt.toFixed(2)}</span>
          </div>
          <input type="range" min="-2.5" max="2.5" step="0.1" value={xt} onChange={e => setXt(parseFloat(e.target.value))} className="w-full accent-[#93C572]" />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Prev Cell State $c_{'{t-1}'}$</span>
            <span className="font-mono font-bold text-sky-400 tabular-nums">{ctPrev.toFixed(2)}</span>
          </div>
          <input type="range" min="-2.0" max="2.0" step="0.1" value={ctPrev} onChange={e => setCtPrev(parseFloat(e.target.value))} className="w-full accent-sky-400" />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Forget Gate Bias $b_f$</span>
            <span className="font-mono font-bold text-amber-400 tabular-nums">{forgetBias.toFixed(2)}</span>
          </div>
          <input type="range" min="-2.0" max="2.5" step="0.1" value={forgetBias} onChange={e => setForgetBias(parseFloat(e.target.value))} className="w-full accent-amber-400" />
        </div>

        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs tabular-nums">
          <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/70">
            <div className="text-[10px] text-muted-foreground">Forget Gate f_t</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5">{ft.toFixed(3)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/70">
            <div className="text-[10px] text-muted-foreground">Input Gate i_t</div>
            <div className="text-sm font-bold text-sky-400 mt-0.5">{it.toFixed(3)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/70">
            <div className="text-[10px] text-muted-foreground">Candidate c̃_t</div>
            <div className="text-sm font-bold text-foreground mt-0.5">{cTilde.toFixed(3)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/70">
            <div className="text-[10px] text-muted-foreground">New Cell c_t</div>
            <div className="text-sm font-bold text-[#93C572] mt-0.5">{ct.toFixed(3)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/70">
            <div className="text-[10px] text-muted-foreground">Output Gate o_t</div>
            <div className="text-sm font-bold text-purple-400 mt-0.5">{ot.toFixed(3)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#93C572]/15 border border-[#93C572]/40">
            <div className="text-[10px] text-muted-foreground">Hidden State h_t</div>
            <div className="text-sm font-bold text-[#93C572] mt-0.5">{ht.toFixed(3)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * ENGINE 5: INTERACTIVE REINFORCEMENT LEARNING & ALPHAGO PUCT / MCTS LAB
 * ============================================================================ */
const ReinforcementLearningLab: React.FC<{ slug: string; title: string }> = ({ slug, title }) => {
  const [cPuct, setCPuct] = useState<number>(1.25);
  const [gamma, setGamma] = useState<number>(0.95);
  const [visits, setVisits] = useState<number[]>([12, 4, 2]);
  const qVals = [0.52, 0.46, 0.25];
  const priors = [0.25, 0.50, 0.25];

  const totalN = visits.reduce((a, b) => a + b, 0);
  const scores = qVals.map((q, i) => {
    const u = cPuct * priors[i] * (Math.sqrt(totalN) / (1 + visits[i]));
    return { q, u, total: q + u };
  });
  const bestIdx = scores.reduce((best, cur, i) => (cur.total > scores[best].total ? i : best), 0);

  return (
    <div className="p-4 sm:p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-5 space-y-3 bg-secondary/20 border border-border/70 rounded-xl p-3.5">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-foreground">Exploration Coefficient (c_puct)</span>
            <span className="font-mono text-[#93C572] tabular-nums">{cPuct.toFixed(2)}</span>
          </div>
          <input type="range" min="0.1" max="3.5" step="0.05" value={cPuct} onChange={e => setCPuct(parseFloat(e.target.value))} className="w-full accent-[#93C572]" />
          <div className="flex justify-between text-xs pt-1">
            <span className="font-semibold text-foreground">Discount Factor (γ)</span>
            <span className="font-mono text-sky-400 tabular-nums">{gamma.toFixed(2)}</span>
          </div>
          <input type="range" min="0.5" max="0.99" step="0.01" value={gamma} onChange={e => setGamma(parseFloat(e.target.value))} className="w-full accent-sky-400" />
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                const next = [...visits];
                next[bestIdx] += 1;
                setVisits(next);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#93C572] text-black text-xs font-bold"
            >
              Simulate MCTS Visit (+1 to Action {bestIdx})
            </button>
            <button
              onClick={() => setVisits([12, 4, 2])}
              className="px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="md:col-span-7 space-y-2.5 font-mono text-xs tabular-nums">
          {scores.map((sc, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border transition-all ${
                i === bestIdx ? 'bg-[#93C572]/12 border-[#93C572]/50' : 'bg-secondary/20 border-border/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">
                  Action {i} (N={visits[i]}, P={priors[i].toFixed(2)}) {i === bestIdx ? '★ SELECTED' : ''}
                </span>
                <span className="font-bold text-[#93C572]">
                  Q+U = {sc.total.toFixed(3)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                <span>Exploit Q={sc.q.toFixed(2)}</span>
                <span>·</span>
                <span>Explore U={sc.u.toFixed(3)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * ENGINE 6: INTERACTIVE GPU KERNEL, QUANTIZATION & DATA/SQL LAB
 * Covers Quantization (INT8/INT4), CUDA/Triton Thread Blocks, SQL/Pandas, Metrics
 * ============================================================================ */
const SystemsAndDataLab: React.FC<{ slug: string; title: string }> = ({ slug, title }) => {
  const s = `${slug} ${title}`.toLowerCase();
  const isQuant = s.includes('quant') || s.includes('int4') || s.includes('int8') || s.includes('mxfp4');
  const isGpu = s.includes('cuda') || s.includes('triton') || s.includes('gpu') || s.includes('kernel');
  const isSql = s.includes('sql') || s.includes('pandas') || s.includes('join') || s.includes('window') || s.includes('group-by');

  const [numBits, setNumBits] = useState<number>(4);
  const [blockSize, setBlockSize] = useState<number>(4);
  const [activePid, setActivePid] = useState<number>(0);
  const [threshold, setThreshold] = useState<number>(0.5);

  if (isQuant) {
    const weights = [1.24, -2.40, 0.62, -0.35, 1.85];
    const qMax = Math.pow(2, numBits - 1) - 1;
    const qMin = -Math.pow(2, numBits - 1);
    const maxAbs = Math.max(...weights.map(Math.abs));
    const scale = maxAbs / qMax;
    const quantized = weights.map(w => Math.max(qMin, Math.min(qMax, Math.round(w / scale))));
    const dequant = quantized.map(q => q * scale);

    return (
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">
            Symmetric Integer Quantization: <span className="font-mono text-foreground">scale = max|W| / (2^(b-1) - 1) = {scale.toFixed(5)}</span>
          </span>
          <div className="flex items-center gap-1.5">
            {[2, 4, 8].map(b => (
              <button
                key={b}
                onClick={() => setNumBits(b)}
                className={`px-2.5 py-1 rounded-md font-mono font-semibold border ${
                  numBits === b ? 'bg-[#93C572] text-black border-[#93C572]' : 'bg-secondary/40 text-muted-foreground border-border'
                }`}
              >
                INT{b} ([{-(1 << (b - 1))}, {(1 << (b - 1)) - 1}])
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 font-mono text-xs tabular-nums">
          {weights.map((w, i) => (
            <div key={i} className="p-2.5 rounded-xl bg-secondary/20 border border-border/70 text-center space-y-1">
              <div className="text-[10px] text-muted-foreground">FP32: {w.toFixed(2)}</div>
              <div className="text-sm font-bold text-[#93C572]">q = {quantized[i]}</div>
              <div className="text-[10px] text-sky-400">Ŵ: {dequant[i].toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isGpu) {
    const N = 10;
    const numBlocks = Math.ceil(N / blockSize);
    return (
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="font-mono text-muted-foreground">
            global_idx = program_id(0) * BLOCK_SIZE + tl.arange(0, BLOCK_SIZE) · mask = global_idx &lt; {N}
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: numBlocks }).map((_, pid) => (
              <button
                key={pid}
                onClick={() => setActivePid(pid)}
                className={`px-2.5 py-1 rounded-md font-mono font-semibold border ${
                  activePid === pid ? 'bg-[#93C572] text-black border-[#93C572]' : 'bg-secondary/40 text-muted-foreground border-border'
                }`}
              >
                Block {pid}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5 font-mono text-xs tabular-nums">
          {Array.from({ length: numBlocks * blockSize }).map((_, idx) => {
            const pid = Math.floor(idx / blockSize);
            const inActiveBlock = pid === activePid;
            const valid = idx < N;
            return (
              <div
                key={idx}
                className={`p-2 rounded-lg border text-center transition-all ${
                  inActiveBlock
                    ? valid
                      ? 'bg-[#93C572]/20 border-[#93C572] text-foreground font-bold'
                      : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                    : 'bg-secondary/20 border-border/50 text-muted-foreground opacity-60'
                }`}
              >
                <div className="text-[10px]">idx {idx}</div>
                <div className="text-[10px] mt-0.5">{valid ? 'LOAD' : 'MASK'}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (isSql) {
    const rows = [
      { dept: 'AI Research', emp: 'Alice', score: 94, rank: 1 },
      { dept: 'AI Research', emp: 'Bob', score: 88, rank: 2 },
      { dept: 'Systems', emp: 'Carol', score: 91, rank: 1 },
      { dept: 'Systems', emp: 'Dan', score: 85, rank: 2 }
    ];
    return (
      <div className="p-4 sm:p-5 space-y-3">
        <div className="text-xs text-muted-foreground font-mono">
          Relational Window Partitioning: PARTITION BY dept ORDER BY score DESC
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs tabular-nums">
          {['AI Research', 'Systems'].map(dept => (
            <div key={dept} className="p-3 rounded-xl bg-secondary/20 border border-border/70 space-y-2">
              <div className="text-[11px] font-bold text-[#93C572]">Partition: {dept}</div>
              {rows
                .filter(r => r.dept === dept)
                .map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-background/60 border border-border/50">
                    <span>{r.emp}</span>
                    <span className="text-sky-400">score: {r.score}</span>
                    <span className="text-amber-400 font-bold">rank: #{r.rank}</span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default Classification / Ranking / Loss Threshold Interactive Lab
  const samples = [
    { score: 0.92, label: 1 },
    { score: 0.78, label: 1 },
    { score: 0.64, label: 0 },
    { score: 0.53, label: 1 },
    { score: 0.38, label: 0 },
    { score: 0.19, label: 0 }
  ];
  let tp = 0, fp = 0, tn = 0, fn = 0;
  samples.forEach(item => {
    const pred = item.score >= threshold ? 1 : 0;
    if (pred === 1 && item.label === 1) tp++;
    else if (pred === 1 && item.label === 0) fp++;
    else if (pred === 0 && item.label === 0) tn++;
    else fn++;
  });
  const prec = tp + fp > 0 ? tp / (tp + fp) : 1;
  const rec = tp + fn > 0 ? tp / (tp + fn) : 0;

  return (
    <div className="p-4 sm:p-5 space-y-4">
      <div className="bg-secondary/20 border border-border/70 rounded-xl p-3.5 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="font-semibold text-foreground">Decision / Operating Threshold $\tau$</span>
          <span className="font-mono text-[#93C572] tabular-nums">τ = {threshold.toFixed(2)}</span>
        </div>
        <input type="range" min="0.1" max="0.95" step="0.05" value={threshold} onChange={e => setThreshold(parseFloat(e.target.value))} className="w-full accent-[#93C572]" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs tabular-nums">
        <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/70">
          <div className="text-[10px] text-muted-foreground">True Pos / False Pos</div>
          <div className="text-sm font-bold text-[#93C572] mt-0.5">TP={tp} · FP={fp}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/70">
          <div className="text-[10px] text-muted-foreground">True Neg / False Neg</div>
          <div className="text-sm font-bold text-sky-400 mt-0.5">TN={tn} · FN={fn}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/70">
          <div className="text-[10px] text-muted-foreground">Precision</div>
          <div className="text-sm font-bold text-foreground mt-0.5">{(prec * 100).toFixed(1)}%</div>
        </div>
        <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/70">
          <div className="text-[10px] text-muted-foreground">Recall (TPR)</div>
          <div className="text-sm font-bold text-amber-400 mt-0.5">{(rec * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * ENGINE 7: INTERACTIVE LOSS, OPTIMIZER & LR SCHEDULE LAB
 * Covers BCE, Focal, Huber, Hinge, Triplet, Cosine Loss, Adam, SGD, Warmup/Cosine LR
 * ============================================================================ */
const LossAndOptimizerLab: React.FC<{ slug: string; title: string }> = ({ slug, title }) => {
  const s = `${slug} ${title}`.toLowerCase();
  const isScheduler = s.includes('warmup') || s.includes('cosine-annealing') || s.includes('scheduler') || s.includes('wsd') || s.includes('lr-');
  const isOptimizer = !isScheduler && (s.includes('adam') || s.includes('rmsprop') || s.includes('adagrad') || s.includes('adadelta') || s.includes('nadam') || s.includes('momentum') || s.includes('nesterov') || s.includes('sgd') || s.includes('lbfgs') || s.includes('muon') || s.includes('clipping') || s.includes('gradient-descent'));

  const [pred, setPred] = useState<number>(0.72);
  const [gamma, setGamma] = useState<number>(2.0);
  const [lr, setLr] = useState<number>(0.1);
  const [beta1, setBeta1] = useState<number>(0.9);
  const [stepNum, setStepNum] = useState<number>(18);
  const [warmupSteps, setWarmupSteps] = useState<number>(15);

  if (isScheduler) {
    const totalSteps = 100;
    const lrAt = (t: number) => {
      if (t < warmupSteps) return lr * (t / Math.max(1, warmupSteps));
      const progress = (t - warmupSteps) / Math.max(1, totalSteps - warmupSteps);
      return lr * 0.5 * (1 + Math.cos(Math.PI * progress));
    };
    const width = 420, height = 150;
    let pathD = '';
    for (let t = 0; t <= totalSteps; t += 2) {
      const x = 30 + (t / totalSteps) * (width - 45);
      const y = height - 22 - (lrAt(t) / Math.max(0.01, lr)) * (height - 40);
      pathD += `${t === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
    }
    const curX = 30 + (stepNum / totalSteps) * (width - 45);
    const curY = height - 22 - (lrAt(stepNum) / Math.max(0.01, lr)) * (height - 40);

    return (
      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-7 bg-secondary/20 border border-border/70 rounded-xl p-3">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
              <line x1="30" y1={height - 22} x2={width - 15} y2={height - 22} stroke="currentColor" className="text-border" strokeWidth="1" />
              <path d={pathD} fill="none" stroke="#93C572" strokeWidth="2.5" />
              <line x1={curX} y1={16} x2={curX} y2={height - 22} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx={curX} cy={curY} r="4.5" fill="#93C572" stroke="#0f172a" strokeWidth="1.5" />
              <text x="34" y="16" className="fill-muted-foreground text-[10px] font-mono">
                Warmup (0..{warmupSteps}) → Cosine Annealing ({warmupSteps}..100)
              </text>
            </svg>
          </div>
          <div className="md:col-span-5 space-y-2.5 bg-secondary/20 border border-border/70 rounded-xl p-3.5 font-mono text-xs tabular-nums">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Training Step t</span>
              <span className="font-bold text-foreground">{stepNum} / 100</span>
            </div>
            <input type="range" min="0" max="100" step="1" value={stepNum} onChange={e => setStepNum(parseInt(e.target.value, 10))} className="w-full accent-[#93C572]" />
            <div className="flex justify-between pt-1">
              <span className="text-muted-foreground">Warmup Steps</span>
              <span className="font-bold text-sky-400">{warmupSteps}</span>
            </div>
            <input type="range" min="5" max="40" step="1" value={warmupSteps} onChange={e => setWarmupSteps(parseInt(e.target.value, 10))} className="w-full accent-sky-400" />
            <div className="pt-2 border-t border-border/50 flex justify-between items-center">
              <span className="text-muted-foreground">Active LR η(t):</span>
              <span className="text-sm font-bold text-[#93C572]">{lrAt(stepNum).toFixed(5)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isOptimizer) {
    const g = 1.6;
    const m1 = (1 - beta1) * g;
    const mHat = m1 / (1 - Math.pow(beta1, Math.max(1, stepNum)));
    const v1 = (1 - 0.999) * g * g;
    const vHat = v1 / (1 - Math.pow(0.999, Math.max(1, stepNum)));
    const stepDelta = (lr * mHat) / (Math.sqrt(vHat) + 1e-8);

    return (
      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5 space-y-2.5 bg-secondary/20 border border-border/70 rounded-xl p-3.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Learning Rate η</span>
              <span className="font-mono font-bold text-[#93C572] tabular-nums">{lr.toFixed(3)}</span>
            </div>
            <input type="range" min="0.005" max="0.5" step="0.005" value={lr} onChange={e => setLr(parseFloat(e.target.value))} className="w-full accent-[#93C572]" />
            <div className="flex justify-between pt-1">
              <span className="text-muted-foreground">Momentum β₁</span>
              <span className="font-mono font-bold text-sky-400 tabular-nums">{beta1.toFixed(2)}</span>
            </div>
            <input type="range" min="0.5" max="0.99" step="0.01" value={beta1} onChange={e => setBeta1(parseFloat(e.target.value))} className="w-full accent-sky-400" />
          </div>
          <div className="md:col-span-7 grid grid-cols-3 gap-2.5 font-mono text-xs tabular-nums">
            <div className="p-3 rounded-xl bg-secondary/20 border border-border/70">
              <div className="text-[10px] text-muted-foreground">1st Moment m̂_t</div>
              <div className="text-sm font-bold text-sky-400 mt-1">{mHat.toFixed(4)}</div>
            </div>
            <div className="p-3 rounded-xl bg-secondary/20 border border-border/70">
              <div className="text-[10px] text-muted-foreground">2nd Moment √v̂_t</div>
              <div className="text-sm font-bold text-amber-400 mt-1">{Math.sqrt(vHat).toFixed(4)}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#93C572]/15 border border-[#93C572]/40">
              <div className="text-[10px] text-muted-foreground">Step Update Δw</div>
              <div className="text-sm font-bold text-[#93C572] mt-1">-{stepDelta.toFixed(4)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loss curve explorer (BCE vs Focal / Margin Loss)
  const bce = -Math.log(Math.max(1e-4, pred));
  const focal = Math.pow(1 - pred, gamma) * bce;
  const modulatingFactor = Math.pow(1 - pred, gamma);

  return (
    <div className="p-4 sm:p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-5 space-y-2.5 bg-secondary/20 border border-border/70 rounded-xl p-3.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Predicted Probability $p_t$</span>
            <span className="font-mono font-bold text-[#93C572] tabular-nums">{pred.toFixed(2)}</span>
          </div>
          <input type="range" min="0.05" max="0.99" step="0.01" value={pred} onChange={e => setPred(parseFloat(e.target.value))} className="w-full accent-[#93C572]" />
          <div className="flex justify-between pt-1">
            <span className="text-muted-foreground">Focusing / Margin Param γ</span>
            <span className="font-mono font-bold text-sky-400 tabular-nums">{gamma.toFixed(1)}</span>
          </div>
          <input type="range" min="0.0" max="4.0" step="0.2" value={gamma} onChange={e => setGamma(parseFloat(e.target.value))} className="w-full accent-sky-400" />
        </div>
        <div className="md:col-span-7 grid grid-cols-3 gap-2.5 font-mono text-xs tabular-nums">
          <div className="p-3 rounded-xl bg-secondary/20 border border-border/70">
            <div className="text-[10px] text-muted-foreground">Standard BCE -log(p_t)</div>
            <div className="text-sm font-bold text-foreground mt-1">{bce.toFixed(4)}</div>
          </div>
          <div className="p-3 rounded-xl bg-secondary/20 border border-border/70">
            <div className="text-[10px] text-muted-foreground">Modulating (1-p_t)^γ</div>
            <div className="text-sm font-bold text-sky-400 mt-1">{modulatingFactor.toFixed(4)}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#93C572]/15 border border-[#93C572]/40">
            <div className="text-[10px] text-muted-foreground">Weighted / Focal Loss</div>
            <div className="text-sm font-bold text-[#93C572] mt-1">{focal.toFixed(4)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * ENGINE 8: INTERACTIVE AUTOGRAD & COMPUTATIONAL GRAPH LAB
 * ============================================================================ */
const AutogradGraphLab: React.FC<{ slug: string; title: string }> = () => {
  const [a, setA] = useState<number>(2.0);
  const [b, setB] = useState<number>(-3.0);
  const [c, setC] = useState<number>(4.0);

  const u = a * b;
  const v = u + c;
  const out = Math.tanh(v);
  const dOutDv = 1 - out * out;
  const dOutDu = dOutDv * 1.0;
  const dOutDc = dOutDv * 1.0;
  const dOutDa = dOutDu * b;
  const dOutDb = dOutDu * a;

  return (
    <div className="p-4 sm:p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-4 space-y-2 bg-secondary/20 border border-border/70 rounded-xl p-3.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Node a</span>
            <span className="font-mono font-bold text-foreground tabular-nums">{a.toFixed(1)}</span>
          </div>
          <input type="range" min="-4" max="4" step="0.5" value={a} onChange={e => setA(parseFloat(e.target.value))} className="w-full accent-[#93C572]" />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Node b</span>
            <span className="font-mono font-bold text-foreground tabular-nums">{b.toFixed(1)}</span>
          </div>
          <input type="range" min="-4" max="4" step="0.5" value={b} onChange={e => setB(parseFloat(e.target.value))} className="w-full accent-sky-400" />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Node c</span>
            <span className="font-mono font-bold text-foreground tabular-nums">{c.toFixed(1)}</span>
          </div>
          <input type="range" min="-4" max="6" step="0.5" value={c} onChange={e => setC(parseFloat(e.target.value))} className="w-full accent-amber-400" />
        </div>

        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs tabular-nums">
          <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/70">
            <div className="text-[10px] text-muted-foreground">Leaf a (val / grad)</div>
            <div className="font-bold text-[#93C572] mt-0.5">v={a.toFixed(2)}</div>
            <div className="text-amber-400 text-[11px]">∂L/∂a = {dOutDa.toFixed(3)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/70">
            <div className="text-[10px] text-muted-foreground">Leaf b (val / grad)</div>
            <div className="font-bold text-[#93C572] mt-0.5">v={b.toFixed(2)}</div>
            <div className="text-amber-400 text-[11px]">∂L/∂b = {dOutDb.toFixed(3)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/70">
            <div className="text-[10px] text-muted-foreground">u = a · b</div>
            <div className="font-bold text-sky-400 mt-0.5">v={u.toFixed(2)}</div>
            <div className="text-amber-400 text-[11px]">∂L/∂u = {dOutDu.toFixed(3)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/70">
            <div className="text-[10px] text-muted-foreground">Leaf c (val / grad)</div>
            <div className="font-bold text-[#93C572] mt-0.5">v={c.toFixed(2)}</div>
            <div className="text-amber-400 text-[11px]">∂L/∂c = {dOutDc.toFixed(3)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/20 border border-border/70">
            <div className="text-[10px] text-muted-foreground">v = u + c</div>
            <div className="font-bold text-sky-400 mt-0.5">v={v.toFixed(2)}</div>
            <div className="text-amber-400 text-[11px]">∂L/∂v = {dOutDv.toFixed(3)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#93C572]/15 border border-[#93C572]/40">
            <div className="text-[10px] text-muted-foreground">Output L = tanh(v)</div>
            <div className="font-bold text-[#93C572] mt-0.5">L={out.toFixed(4)}</div>
            <div className="text-amber-400 text-[11px]">∂L/∂L = 1.000</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * MAIN EXPORT: ProblemVisualizer
 * Renders inside ProblemSolverPage's Description tab for all non-trivial problems.
 * ============================================================================ */
export const ProblemVisualizer: React.FC<{ problem: ProblemDetail; isDarkTheme: boolean }> = ({
  problem,
  isDarkTheme
}) => {
  const navigate = useNavigate();
  const slug = ((problem as any).slug || problem.id || '').toLowerCase();
  const vizComp = problem.visualizationComponent || '';
  const title = problem.title || '';
  const tags = problem.tags || [];

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<'custom' | 'mlmath'>('custom');

  useEffect(() => {
    initTurbopackRuntime();
  }, []);

  const combinedKey = `${slug} ${vizComp} ${title} ${tags.join(' ')}`.toLowerCase();
  const isSkippedSimple = SIMPLE_EXCLUDED_SLUGS.has(slug);
  const isConceptualDomain =
    !isSkippedSimple &&
    (Boolean(vizComp) ||
      problem.difficulty === 'Medium' ||
      problem.difficulty === 'Hard' ||
      /attention|transformer|autograd|backprop|conv|pool|lstm|gru|rnn|vae|gan|diffusion|ddpm|puct|mcts|alphago|adam|rmsprop|momentum|scheduler|warmup|quantiz|cuda|triton|softmax|sigmoid|gelu|swish|relu|loss|entropy|kl-div|pca|svd|eigen|bayes|markov|window|join|iou|nms|rope|moe|lora|bpe/.test(
        combinedKey
      ));

  const mlMathMatch = useMemo(
    () => getMatchingMLMathWidget(slug, vizComp, title, tags),
    [slug, vizComp, title, tags]
  );

  // Determine which custom interactive engine fits this problem best
  const engineType = useMemo(() => {
    if (
      /sigmoid|relu|leaky|gelu|swish|silu|tanh|selu|elu|softmax|activation|smebu|glu/.test(combinedKey) &&
      !/attention|transformer|encoder|cross-entropy/.test(combinedKey)
    ) {
      return 'activation';
    }
    if (
      /attention|multi-head|causal-mask|positional|rope|rotary|transformer|encoder-block|moe|router|bert|gpt|llama|glm|vit|kv-cache|mla|attn/.test(
        combinedKey
      )
    ) {
      return 'attention';
    }
    if (
      /conv2d|cnn|pool|iou|suppression|nms|anchor|sobel|blur|morpholog|histogram|alexnet|vgg|resnet|densenet|unet|skip-connection|bottleneck|identity-block|fpn|bilinear/.test(
        combinedKey
      )
    ) {
      return 'vision';
    }
    if (/rnn|lstm|gru|bptt|vanishing|vae|reparameter|elbo|ddpm|diffusion/.test(combinedKey)) {
      return 'sequence';
    }
    if (/q-learning|sarsa|td-value|value-iteration|policy|gae|advantage|alphago|puct|mcts|replay|discount-return|epsilon-greedy|rl-/.test(combinedKey)) {
      return 'rl';
    }
    if (/autograd|backprop|chain-rule|jvp|vjp|dual-number|finite-difference|gradient-check|topological-sort/.test(combinedKey)) {
      return 'autograd';
    }
    if (/loss|cross-entropy|focal|hinge|huber|triplet|contrastive|info-nce|kl-divergence|adam|rmsprop|adagrad|adadelta|nadam|momentum|nesterov|sgd|lbfgs|muon|warmup|cosine-annealing|scheduler|wsd|gradient-clipping|gradient-descent/.test(combinedKey)) {
      return 'loss_optim';
    }
    return 'systems_data';
  }, [combinedKey]);

  const MLMathDynamicComp = useMemo(() => {
    if (!mlMathMatch) return null;
    try {
      if (hasTurbopackModule(mlMathMatch.modId)) {
        return getTurbopackComponent(mlMathMatch.modId, 'default');
      }
    } catch {
      return null;
    }
    return null;
  }, [mlMathMatch]);

  const themeBridgeVal = useMemo(
    () => ({
      theme: (isDarkTheme ? 'dark' : 'light') as 'dark' | 'light',
      resolvedTheme: (isDarkTheme ? 'dark' : 'light') as 'dark' | 'light',
      setTheme: () => {}
    }),
    [isDarkTheme]
  );

  const navBridgeVal = useMemo(
    () => ({
      onNavigate: (path: string) => navigate(path),
      onOpenProblem: (targetSlug: string) => navigate(`/problems/${targetSlug}`)
    }),
    [navigate]
  );

  if (!isConceptualDomain) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm my-4">
      {/* Top Header Bar (Matches ML Math Interactive Card Aesthetic) */}
      <div className="px-4 py-3 border-b border-border bg-secondary/30 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#93C572]/15 border border-[#93C572]/30 flex items-center justify-center text-[#93C572] shrink-0">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-foreground truncate">
              Interactive Visual Intuition
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              Explore parameters, tensor transformations, and edge cases interactively
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {MLMathDynamicComp && mlMathMatch && (
            <div className="flex items-center bg-background/80 border border-border rounded-lg p-0.5 text-[11px]">
              <button
                onClick={() => {
                  setCollapsed(false);
                  setActiveMode('custom');
                }}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                  activeMode === 'custom' ? 'bg-[#93C572] text-black' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Problem Explorer
              </button>
              <button
                onClick={() => {
                  setCollapsed(false);
                  setActiveMode('mlmath');
                }}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                  activeMode === 'mlmath' ? 'bg-[#93C572] text-black' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                ML Math Lab
              </button>
            </div>
          )}

          {mlMathMatch && (
            <Link
              to={mlMathMatch.lessonUrl}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-background/70 hover:bg-secondary text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              title={`Open ${mlMathMatch.lessonName} in ML Math`}
            >
              <BookOpen className="w-3 h-3 text-[#93C572]" />
              <span>{mlMathMatch.lessonName}</span>
            </Link>
          )}

          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg border border-border/70 bg-background/70 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title={collapsed ? 'Expand visualization' : 'Collapse visualization'}
          >
            {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div>
          {activeMode === 'mlmath' && MLMathDynamicComp ? (
            <SafeWidgetBoundary>
              <ThemeBridgeContext.Provider value={themeBridgeVal}>
                <NavigationBridgeContext.Provider value={navBridgeVal}>
                  <div className="p-3 sm:p-4 bg-background/40">
                    <MLMathDynamicComp />
                  </div>
                </NavigationBridgeContext.Provider>
              </ThemeBridgeContext.Provider>
            </SafeWidgetBoundary>
          ) : (
            <>
              {engineType === 'activation' && <ActivationLab slug={slug} title={title} />}
              {engineType === 'attention' && <TransformerAttentionLab slug={slug} title={title} />}
              {engineType === 'vision' && <VisionCnnLab slug={slug} title={title} />}
              {engineType === 'sequence' && <SequenceAndGenerativeLab slug={slug} title={title} />}
              {engineType === 'rl' && <ReinforcementLearningLab slug={slug} title={title} />}
              {engineType === 'autograd' && <AutogradGraphLab slug={slug} title={title} />}
              {engineType === 'loss_optim' && <LossAndOptimizerLab slug={slug} title={title} />}
              {engineType === 'systems_data' && <SystemsAndDataLab slug={slug} title={title} />}
            </>
          )}
        </div>
      )}
    </div>
  );
};
