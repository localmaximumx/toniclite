import React, { useEffect, useState, useMemo } from 'react';
import {
  ThemeBridgeContext,
  getTurbopackComponent,
  initTurbopackRuntime,
} from '../ml-math/runtime/turbopackRuntime';

interface VizManifestEntry {
  loaderId: number;
  moduleId: number;
  chunks: string[];
}

type VizManifest = Record<string, VizManifestEntry>;

let manifestPromise: Promise<VizManifest> | null = null;
const loadedScripts = new Map<string, Promise<void>>();

function fetchVizManifest(): Promise<VizManifest> {
  if (!manifestPromise) {
    manifestPromise = fetch('/data/viz_manifest.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .catch(() => ({}));
  }
  return manifestPromise;
}

function loadChunkScript(src: string): Promise<void> {
  const existing = loadedScripts.get(src);
  if (existing) return existing;

  const p = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load chunk ${src}`));
    document.head.appendChild(script);
  });

  loadedScripts.set(src, p);
  return p;
}

class VizErrorBoundary extends React.Component<
  { children: React.ReactNode; resetKey?: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; resetKey?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: { resetKey?: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

interface ProblemVisualizationProps {
  componentName?: string | null;
}

export const ProblemVisualization: React.FC<ProblemVisualizationProps> = ({
  componentName,
}) => {
  const [Comp, setComp] = useState<React.ComponentType<any> | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const syncTheme = () => {
      setTheme(
        document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      );
    };
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    window.addEventListener('toniclite_theme_change', syncTheme);
    return () => {
      observer.disconnect();
      window.removeEventListener('toniclite_theme_change', syncTheme);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setComp(null);

    if (!componentName) return;

    (async () => {
      try {
        const manifest = await fetchVizManifest();
        const entry = manifest[componentName];
        if (!entry || cancelled) return;

        await Promise.all([
          loadChunkScript('/viz_chunks/shared_deps.js'),
          ...entry.chunks.map((ch) => loadChunkScript(`/viz_chunks/${ch}`)),
        ]);

        if (cancelled) return;
        initTurbopackRuntime();
        const LoadedComp = getTurbopackComponent(entry.moduleId, 'default');
        if (!cancelled && LoadedComp) {
          setComp(() => LoadedComp);
        }
      } catch {
        // Ignore missing/failed visualization chunks gracefully
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [componentName]);

  const themeContextValue = useMemo(
    () => ({
      theme,
      resolvedTheme: theme,
      setTheme: () => {},
    }),
    [theme]
  );

  if (!componentName || !Comp) return null;

  return (
    <VizErrorBoundary resetKey={componentName}>
      <ThemeBridgeContext.Provider value={themeContextValue}>
        <div className="my-4">
          <Comp />
        </div>
      </ThemeBridgeContext.Provider>
    </VizErrorBoundary>
  );
};
