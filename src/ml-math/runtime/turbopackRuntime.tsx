import React, { createContext, useContext } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';

export interface ThemeState {
  theme: 'dark' | 'light';
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

export const ThemeBridgeContext = createContext<ThemeState>({
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => {},
});

export interface NavigationHandlers {
  onNavigate: (path: string) => void;
  onOpenProblem: (slug: string, title?: string) => void;
}

export const NavigationBridgeContext = createContext<NavigationHandlers>({
  onNavigate: () => {},
  onOpenProblem: () => {},
});

// Smart SPA Link component injected as module 504561 (next/link replacement)
const SmartLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement> & { href?: string }>(
  ({ href = '', onClick, children, ...rest }, ref) => {
    const { onNavigate, onOpenProblem } = useContext(NavigationBridgeContext);

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (onClick) onClick(e);
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const normalized = href.replace(/^https?:\/\/(www\.)?tensortonic\.com/, '');

      // Anchor scroll within current lesson
      if (normalized.startsWith('#')) {
        e.preventDefault();
        const targetId = normalized.slice(1);
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }

      // Internal /ml-math or /articles navigation
      if (normalized === '/ml-math' || normalized.startsWith('/ml-math/') || normalized.startsWith('/ml-math?') || normalized === '/articles') {
        e.preventDefault();
        onNavigate(normalized === '/articles' ? '/ml-math' : normalized);
        return;
      }

      // Real links to problems (/problems/:slug), study plans, research, and platform pages
      if (
        normalized.startsWith('/problems') ||
        normalized.startsWith('/study-plans') ||
        normalized.startsWith('/research') ||
        normalized.startsWith('/interview') ||
        normalized.startsWith('/systems') ||
        normalized.startsWith('/ml-design') ||
        normalized.startsWith('/llm-internals')
      ) {
        e.preventDefault();
        onNavigate(normalized);
        return;
      }
    };

    return (
      <a ref={ref} href={href} onClick={handleClick} {...rest}>
        {children}
      </a>
    );
  }
);
SmartLink.displayName = 'SmartLink';

// Hook injected as module 307756 (next-themes replacement)
function useThemeHook() {
  return useContext(ThemeBridgeContext);
}

// Turbopack runtime state
interface ModRecord {
  id: number;
  exports: any;
  error?: any;
  namespaceObject?: any;
  instantiated?: boolean;
}

const factories = new Map<number, Function>();
const cache: Record<number, ModRecord> = {};
let initialized = false;

const hasOwn = Object.prototype.hasOwnProperty;

function defineProp(target: any, key: string, desc: PropertyDescriptor) {
  if (!hasOwn.call(target, key)) {
    Object.defineProperty(target, key, desc);
  }
}

function getOrCreateMod(c: Record<number, ModRecord>, id: number): ModRecord {
  let r = c[id];
  if (!r) {
    r = { id, exports: {}, error: undefined, namespaceObject: undefined, instantiated: false };
    c[id] = r;
  }
  return r;
}

function defineExports(exportsObj: any, spec: any[], dontSeal?: boolean) {
  defineProp(exportsObj, '__esModule', { value: true });
  let n = 0;
  while (n < spec.length) {
    const key = spec[n++];
    const tagOrGetter = spec[n++];
    if (typeof tagOrGetter === 'number') {
      if (tagOrGetter === 0) {
        defineProp(exportsObj, key, { value: spec[n++], enumerable: true, writable: false });
      }
    } else if (typeof spec[n] === 'function') {
      defineProp(exportsObj, key, { get: tagOrGetter, set: spec[n++], enumerable: true });
    } else {
      defineProp(exportsObj, key, { get: tagOrGetter, enumerable: true });
    }
  }
  if (!dontSeal) {
    try {
      Object.seal(exportsObj);
    } catch {
      // ignore seal errors
    }
  }
}

function createNamespace(exportsObj: any, nsTarget: any, isEsModule?: boolean) {
  const spec: any[] = [];
  let defaultIdx = -1;
  for (const k of Object.getOwnPropertyNames(exportsObj || {})) {
    spec.push(k, () => exportsObj[k]);
    if (defaultIdx === -1 && k === 'default') defaultIdx = spec.length - 1;
  }
  if (!(isEsModule && defaultIdx >= 0)) {
    if (defaultIdx >= 0) spec.splice(defaultIdx, 1, 0, exportsObj);
    else spec.push('default', 0, exportsObj);
  }
  defineExports(nsTarget, spec, true);
  return nsTarget;
}

class ModuleContext {
  m: ModRecord;
  e: any;
  c = cache;
  g = globalThis;

  constructor(m: ModRecord, e: any) {
    this.m = m;
    this.e = e;
  }

  s(exportsArr: any[], optId?: number, dontSeal?: boolean) {
    let mod: ModRecord;
    let exp: any;
    if (optId != null) {
      mod = getOrCreateMod(this.c, optId);
      exp = mod.exports;
    } else {
      mod = this.m;
      exp = this.e;
    }
    mod.instantiated = true;
    mod.namespaceObject = exp;
    defineExports(exp, exportsArr, dontSeal);
  }

  v(val: any, optId?: number) {
    const mod = optId != null ? getOrCreateMod(this.c, optId) : this.m;
    mod.instantiated = true;
    mod.exports = val;
  }

  n(val: any, optId?: number) {
    const mod = optId != null ? getOrCreateMod(this.c, optId) : this.m;
    mod.instantiated = true;
    mod.exports = mod.namespaceObject = val;
  }

  i(id: number) {
    const mod = instantiateModule(id);
    if (mod.namespaceObject) return mod.namespaceObject;
    const exp = mod.exports;
    return (mod.namespaceObject = createNamespace(
      exp,
      typeof exp === 'function'
        ? function (this: any, ...args: any[]) {
            return exp.apply(this, args);
          }
        : Object.create(null),
      exp && exp.__esModule
    ));
  }

  r(id: number) {
    return instantiateModule(id).exports;
  }
}

function registerHostMod(id: number, exportsObj: any) {
  cache[id] = {
    id,
    instantiated: true,
    exports: exportsObj,
    namespaceObject: createNamespace(exportsObj, Object.create(null), true),
  };
}

function instantiateModule(id: number): ModRecord {
  initTurbopackRuntime();
  if (cache[id] && cache[id].instantiated) {
    return cache[id];
  }
  const fn = factories.get(id);
  if (!fn) {
    throw new Error(`Missing Turbopack module factory for ID ${id}`);
  }
  const mod = getOrCreateMod(cache, id);
  mod.instantiated = true;
  const ctx = new ModuleContext(mod, mod.exports);
  fn(ctx, mod, mod.exports);
  if (mod.namespaceObject && mod.exports !== mod.namespaceObject) {
    createNamespace(mod.exports, mod.namespaceObject, true);
  }
  return mod;
}

export function initTurbopackRuntime() {
  if (initialized && factories.size > 0) return;

  const tb = (globalThis as any).TURBOPACK || [];
  for (const chunk of tb) {
    if (!Array.isArray(chunk) || chunk.length === 2) continue;
    let r = 1;
    while (r < chunk.length) {
      let o = r + 1;
      while (o < chunk.length && typeof chunk[o] !== 'function') o++;
      const fn = chunk[o];
      for (let i = r; i < o; i++) {
        const modId = Number(chunk[i]);
        if (!factories.has(modId)) {
          factories.set(modId, fn);
        }
      }
      r = o + 1;
    }
  }

  registerHostMod(414294, jsxRuntime);
  registerHostMod(430878, React);
  registerHostMod(504561, { __esModule: true, default: SmartLink });
  registerHostMod(307756, { __esModule: true, useTheme: useThemeHook });
  registerHostMod(950382, { env: { NODE_ENV: 'production' } });
  if (factories.size > 0) {
    initialized = true;
  }
}

export function hasTurbopackModule(modId: number): boolean {
  initTurbopackRuntime();
  return factories.has(modId);
}

export function getTurbopackComponent(modId: number, exportName = 'default'): React.ComponentType<any> {
  initTurbopackRuntime();
  const ctx = new ModuleContext(getOrCreateMod(cache, 0), {});
  const ns = ctx.i(modId);
  return ns[exportName] || ns.default;
}

export function renderRscNode(node: any, idx: number | string = 0): React.ReactNode {
  if (node == null || typeof node === 'boolean') return null;
  if (typeof node === 'string' || typeof node === 'number') return node;
  if (Array.isArray(node)) {
    if (node[0] === '$') {
      const [, typeSpec, key, props] = node;
      let Comp: any = typeSpec;
      if (typeSpec && typeof typeSpec === 'object' && typeSpec.__c) {
        const [modId, expName] = typeSpec.__c;
        Comp = getTurbopackComponent(modId, expName);
      } else if (typeSpec === '$react.fragment' || typeSpec === '$Sreact.fragment') {
        Comp = React.Fragment;
      }
      const resolvedProps: Record<string, any> = { key: key ?? idx };
      if (props && typeof props === 'object') {
        for (const [k, v] of Object.entries(props)) {
          if (k === 'children') {
            resolvedProps.children = renderRscNode(v);
          } else {
            resolvedProps[k] = v;
          }
        }
      }
      return React.createElement(Comp, resolvedProps);
    }
    return node.map((child, i) => renderRscNode(child, i));
  }
  return null;
}
