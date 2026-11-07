import React, { useState, useEffect } from 'react';
import { X, Play, CheckCircle2, RotateCcw, Code2, Sparkles, Eye } from 'lucide-react';

interface ProblemSpec {
  slug: string;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prompt: string;
  formula: string;
  starterCode: string;
  solutionCode: string;
  testCases: {
    name: string;
    inputDesc: string;
    expectedDesc: string;
    run: (fn: Function) => { passed: boolean; actual: string; expected: string };
  }[];
}

function getProblemSpec(slug: string, customTitle?: string): ProblemSpec {
  const cleanName =
    customTitle ||
    slug
      .replace(/^(probstat-|la-|calculus-|optim-|ml-|dl-|autograd-)/, '')
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  if (slug.includes('mean-median') || slug.includes('basic-statistics')) {
    return {
      slug,
      title: 'Mean, Median, and Mode from Scratch',
      category: 'Statistics',
      difficulty: 'Easy',
      prompt:
        'Implement a function computeStats(arr) that takes a numeric array and returns an object { mean, median, mode } rounded to 2 decimal places. If multiple modes tie, return the smallest one.',
      formula: 'μ = (1/n) Σ x_i   |   Median = middle value of sorted x',
      starterCode: `function solution(arr) {
  const n = arr.length;
  const sum = arr.reduce((a, b) => a + b, 0);
  const mean = Number((sum / n).toFixed(2));

  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(n / 2);
  const median = n % 2 !== 0
    ? sorted[mid]
    : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));

  const counts = {};
  for (const x of sorted) counts[x] = (counts[x] || 0) + 1;
  let mode = sorted[0], maxCount = 0;
  for (const x of sorted) {
    if (counts[x] > maxCount) {
      maxCount = counts[x];
      mode = x;
    }
  }
  return { mean, median, mode };
}`,
      solutionCode: `function solution(arr) {
  const n = arr.length;
  const mean = Number((arr.reduce((a, b) => a + b, 0) / n).toFixed(2));
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(n / 2);
  const median = n % 2 !== 0 ? sorted[mid] : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
  const counts = new Map();
  sorted.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  let mode = sorted[0], best = 0;
  for (const [k, c] of counts.entries()) {
    if (c > best) { best = c; mode = k; }
  }
  return { mean, median, mode };
}`,
      testCases: [
        {
          name: 'Symmetric bulb lifespans',
          inputDesc: '[980, 1000, 1010, 1020, 1040]',
          expectedDesc: '{ mean: 1010, median: 1010, mode: 980 }',
          run: (fn) => {
            const res = fn([980, 1000, 1010, 1020, 1040]);
            const exp = { mean: 1010, median: 1010, mode: 980 };
            return {
              passed: JSON.stringify(res) === JSON.stringify(exp),
              actual: JSON.stringify(res),
              expected: JSON.stringify(exp),
            };
          },
        },
        {
          name: 'Dataset with repeated mode & even length',
          inputDesc: '[2, 4, 4, 6, 8, 12]',
          expectedDesc: '{ mean: 6, median: 5, mode: 4 }',
          run: (fn) => {
            const res = fn([2, 4, 4, 6, 8, 12]);
            const exp = { mean: 6, median: 5, mode: 4 };
            return {
              passed: JSON.stringify(res) === JSON.stringify(exp),
              actual: JSON.stringify(res),
              expected: JSON.stringify(exp),
            };
          },
        },
      ],
    };
  }

  if (slug.includes('matrix') || slug.includes('matmul') || slug.includes('dot') || slug.includes('norm')) {
    return {
      slug,
      title: cleanName || 'Matrix & Vector Linear Algebra Lab',
      category: 'Linear Algebra',
      difficulty: 'Easy',
      prompt:
        'Implement solution(A, B) that computes the matrix product C = A @ B for two 2D arrays A (m × k) and B (k × n), where C[i][j] = Σ_p A[i][p] * B[p][j].',
      formula: 'C_{ij} = Σ_{p=1}^k A_{ip} B_{pj}',
      starterCode: `function solution(A, B) {
  const m = A.length;
  const k = A[0].length;
  const n = B[0].length;
  const C = Array.from({ length: m }, () => Array(n).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let p = 0; p < k; p++) {
        sum += A[i][p] * B[p][j];
      }
      C[i][j] = sum;
    }
  }
  return C;
}`,
      solutionCode: `function solution(A, B) {
  return A.map(row =>
    B[0].map((_, j) => row.reduce((sum, val, p) => sum + val * B[p][j], 0))
  );
}`,
      testCases: [
        {
          name: '2x2 Matrix Multiplication',
          inputDesc: 'A = [[1, 2], [3, 4]], B = [[5, 6], [7, 8]]',
          expectedDesc: '[[19, 22], [43, 50]]',
          run: (fn) => {
            const res = fn(
              [
                [1, 2],
                [3, 4],
              ],
              [
                [5, 6],
                [7, 8],
              ]
            );
            const exp = [
              [19, 22],
              [43, 50],
            ];
            return {
              passed: JSON.stringify(res) === JSON.stringify(exp),
              actual: JSON.stringify(res),
              expected: JSON.stringify(exp),
            };
          },
        },
        {
          name: '2x3 by 3x2 Transformation',
          inputDesc: 'A = [[1, 0, 2], [-1, 3, 1]], B = [[3, 1], [2, 1], [1, 0]]',
          expectedDesc: '[[5, 1], [4, 2]]',
          run: (fn) => {
            const res = fn(
              [
                [1, 0, 2],
                [-1, 3, 1],
              ],
              [
                [3, 1],
                [2, 1],
                [1, 0],
              ]
            );
            const exp = [
              [5, 1],
              [4, 2],
            ];
            return {
              passed: JSON.stringify(res) === JSON.stringify(exp),
              actual: JSON.stringify(res),
              expected: JSON.stringify(exp),
            };
          },
        },
      ],
    };
  }

  if (slug.includes('entropy') || slug.includes('kl') || slug.includes('perplexity') || slug.includes('information')) {
    return {
      slug,
      title: cleanName || 'Shannon Entropy & Information Theory',
      category: 'Information Theory',
      difficulty: 'Medium',
      prompt:
        'Implement solution(probs) that computes the Shannon Entropy H(X) = -Σ p(x) log2(p(x)) in bits, ignoring zero-probability outcomes and rounding to 4 decimal places.',
      formula: 'H(X) = - Σ_{i} p(x_i) log_2 p(x_i)',
      starterCode: `function solution(probs) {
  let entropy = 0;
  for (const p of probs) {
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  return Number(entropy.toFixed(4));
}`,
      solutionCode: `function solution(probs) {
  const h = probs.reduce((acc, p) => (p > 0 ? acc - p * Math.log2(p) : acc), 0);
  return Number(h.toFixed(4));
}`,
      testCases: [
        {
          name: 'Fair coin (maximum uncertainty)',
          inputDesc: '[0.5, 0.5]',
          expectedDesc: '1',
          run: (fn) => {
            const res = fn([0.5, 0.5]);
            return { passed: res === 1, actual: String(res), expected: '1' };
          },
        },
        {
          name: '4-symbol skewed distribution',
          inputDesc: '[0.5, 0.25, 0.125, 0.125]',
          expectedDesc: '1.75',
          run: (fn) => {
            const res = fn([0.5, 0.25, 0.125, 0.125]);
            return { passed: res === 1.75, actual: String(res), expected: '1.75' };
          },
        },
      ],
    };
  }

  // Default Calculus / Optimization / Probability numerical gradient & update problem
  return {
    slug,
    title: cleanName || 'Gradient Descent & Numerical Derivative Step',
    category: 'ML Math Practice',
    difficulty: 'Medium',
    prompt:
      'Implement solution(x, lr, steps) that minimizes f(x) = x^2 - 4x + 5 using gradient descent x_{t+1} = x_t - lr * (2*x_t - 4) for the given number of steps, returning x rounded to 4 decimal places.',
    formula: 'x_{t+1} = x_t - η ∇f(x_t),   where ∇f(x) = 2x - 4',
    starterCode: `function solution(x, lr, steps) {
  let current = x;
  for (let i = 0; i < steps; i++) {
    const grad = 2 * current - 4;
    current = current - lr * grad;
  }
  return Number(current.toFixed(4));
}`,
    solutionCode: `function solution(x, lr, steps) {
  for (let i = 0; i < steps; i++) {
    x -= lr * (2 * x - 4);
  }
  return Number(x.toFixed(4));
}`,
    testCases: [
      {
        name: 'Single step from x = 0 with lr = 0.1',
        inputDesc: 'x = 0, lr = 0.1, steps = 1',
        expectedDesc: '0.4',
        run: (fn) => {
          const res = fn(0, 0.1, 1);
          return { passed: res === 0.4, actual: String(res), expected: '0.4' };
        },
      },
      {
        name: 'Convergence toward global minimum x* = 2',
        inputDesc: 'x = -2, lr = 0.25, steps = 20',
        expectedDesc: '2',
        run: (fn) => {
          const res = fn(-2, 0.25, 20);
          return { passed: Math.abs(res - 2) < 1e-3, actual: String(res), expected: '2' };
        },
      },
    ],
  };
}

interface PracticeSandboxModalProps {
  problemSlug: string | null;
  problemTitle?: string;
  onClose: () => void;
}

export function PracticeSandboxModal({ problemSlug, problemTitle, onClose }: PracticeSandboxModalProps) {
  const spec = problemSlug ? getProblemSpec(problemSlug, problemTitle) : null;
  const [code, setCode] = useState('');
  const [results, setResults] = useState<
    { name: string; passed: boolean; actual: string; expected: string }[] | null
  >(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    if (spec) {
      setCode(spec.starterCode);
      setResults(null);
      setErrorMsg(null);
      setShowSolution(false);
    }
  }, [problemSlug, problemTitle]);

  if (!spec) return null;

  const handleRunTests = () => {
    setErrorMsg(null);
    try {
      const userFn = new Function(`${code}\nreturn solution;`)();
      if (typeof userFn !== 'function') {
        setErrorMsg('Please ensure function solution(...) is defined.');
        return;
      }
      const res = spec.testCases.map((tc) => {
        const out = tc.run(userFn);
        return { name: tc.name, ...out };
      });
      setResults(res);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Syntax or runtime error while executing code.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <Code2 className="h-5 w-5 text-emerald-500" />
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{spec.category}</span>
                <span>·</span>
                <span>{spec.difficulty}</span>
                <span>·</span>
                <span className="font-mono">{spec.slug}</span>
              </div>
              <h2 className="text-lg font-semibold text-foreground">{spec.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Close practice modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* Left: Problem statement & test cases */}
          <div className="lg:col-span-5 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-border p-6 overflow-y-auto custom-scrollbar">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Problem Statement
              </h3>
              <p className="text-sm leading-relaxed text-foreground/90">{spec.prompt}</p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-3.5">
              <div className="text-xs text-muted-foreground mb-1">Core Mathematical Formula</div>
              <div className="font-mono text-xs text-emerald-500 dark:text-emerald-400">{spec.formula}</div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                Verification Test Cases
              </h3>
              <div className="space-y-2.5">
                {spec.testCases.map((tc, i) => {
                  const res = results?.[i];
                  return (
                    <div
                      key={tc.name}
                      className="rounded-xl border border-border bg-background/60 p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-medium text-foreground">
                        <span>
                          {i + 1}. {tc.name}
                        </span>
                        {res && (
                          <span
                            className={
                              res.passed
                                ? 'text-emerald-500 font-semibold flex items-center gap-1'
                                : 'text-rose-500 font-semibold'
                            }
                          >
                            {res.passed ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                              </>
                            ) : (
                              'Failed'
                            )}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">Input: {tc.inputDesc}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        Expected: {tc.expectedDesc}
                      </div>
                      {res && !res.passed && (
                        <div className="font-mono text-[11px] text-rose-400">Actual: {res.actual}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Interactive Code Editor & Output */}
          <div className="lg:col-span-7 flex flex-col min-h-[340px] p-6 gap-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">solution.js</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSolution((prev) => !prev);
                    if (!showSolution) setCode(spec.solutionCode);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {showSolution ? 'Showing Reference' : 'Load Reference Solution'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCode(spec.starterCode);
                    setResults(null);
                    setErrorMsg(null);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="flex-1 min-h-[220px] w-full rounded-xl border border-border bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-100 focus:border-emerald-500/60 focus:outline-none resize-none"
            />

            {errorMsg && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 font-mono text-xs text-rose-400">
                {errorMsg}
              </div>
            )}

            {results && results.every((r) => r.passed) && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-400">
                <Sparkles className="h-4 w-4 shrink-0" />
                All test cases passed! You have verified the mathematical implementation.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={handleRunTests}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Run & Verify Math
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
