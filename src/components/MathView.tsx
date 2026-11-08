import React, { useMemo } from 'react';
import katex from 'katex';
import { highlightPythonCode } from './SolutionViewer';

interface MathViewProps {
  content: string | string[] | any;
  className?: string;
  allowPureCode?: boolean;
}

export const MathView: React.FC<MathViewProps> = ({ content, className = '', allowPureCode = true }) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    let text = '';
    if (Array.isArray(content)) {
      text = content
        .map(item => (typeof item === 'string' ? `* ${item}` : `* ${JSON.stringify(item)}`))
        .join('\n');
    } else if (typeof content === 'string') {
      text = content;
    } else {
      text = JSON.stringify(content, null, 2);
    }

    // Check if entire text is raw Python code
    const isPureCode =
      allowPureCode &&
      !text.includes('```') &&
      /^\s*(?:import\s+|from\s+|def\s+|class\s+|#)/m.test(text) &&
      (text.includes('def ') || text.includes('class '));

    if (isPureCode) {
      const highlighted = highlightPythonCode(text.trim());
      return `<div class="my-3 rounded-xl bg-[#0d1117] border border-border/80 overflow-hidden shadow-sm">
        <div class="px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between text-[11px] font-mono text-muted-foreground select-none">
          <span class="text-[#93C572] font-semibold">Python</span>
          <span>${text.trim().split('\n').length} lines</span>
        </div>
        <pre class="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-[#e6edf3] whitespace-pre custom-scrollbar"><code>${highlighted}</code></pre>
      </div>`;
    }

    // Step 1: Protect and extract fenced code blocks ```python ... ```
    const codeBlocks: string[] = [];
    let formatted = text.replace(/```(?:python|py)?\s*([\s\S]*?)```/g, (_, code) => {
      const trimmed = code.trim();
      const highlighted = highlightPythonCode(trimmed);
      const placeholder = `%%%CODE_BLOCK_${codeBlocks.length}%%%`;
      codeBlocks.push(
        `<div class="my-3 rounded-xl bg-[#0d1117] border border-border/80 overflow-hidden shadow-sm not-prose">
          <div class="px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between text-[11px] font-mono text-muted-foreground select-none">
            <span class="text-[#93C572] font-semibold">Python</span>
            <span>${trimmed.split('\n').length} lines</span>
          </div>
          <pre class="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-[#e6edf3] whitespace-pre custom-scrollbar"><code>${highlighted}</code></pre>
        </div>`
      );
      return placeholder;
    });

    // Step 2: Protect and render display math $$...$$ or \[...\] inside a dedicated Equation Box
    const mathBlocks: string[] = [];
    formatted = formatted.replace(/(?:\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\])/g, (_, m1, m2) => {
      const math = (m1 || m2 || '').trim();
      if (!math) return '';
      const placeholder = `%%%MATH_BLOCK_${mathBlocks.length}%%%`;
      try {
        const rendered = katex.renderToString(math, {
          displayMode: true,
          throwOnError: false,
          output: 'html'
        });
        mathBlocks.push(
          `<div class="my-3.5 text-center overflow-x-auto">${rendered}</div>`
        );
      } catch (e) {
        mathBlocks.push(`<pre class="text-rose-400 my-2">${math}</pre>`);
      }
      return placeholder;
    });

    // Step 3: Protect inline code `...` before inline math so backticks with $ or _ aren't touched
    const inlineCodeBlocks: string[] = [];
    formatted = formatted.replace(/`([^`]+)`/g, (_, code) => {
      const placeholder = `%%%INLINE_CODE_${inlineCodeBlocks.length}%%%`;
      inlineCodeBlocks.push(
        `<code class="px-1.5 py-0.5 rounded bg-muted text-[#93C572] font-mono text-xs">${code}</code>`
      );
      return placeholder;
    });

    // Step 4: Protect and render inline math $...$ or \(...\)
    const inlineMathBlocks: string[] = [];
    formatted = formatted.replace(/(?:(?<!\$)\$(?!\$)(.*?)(?<!\$)\$(?!\$)|\\\((.*?)\\\))/g, (_, m1, m2) => {
      const math = (m1 || m2 || '').trim();
      if (!math) return '';
      const placeholder = `%%%INLINE_MATH_${inlineMathBlocks.length}%%%`;
      try {
        inlineMathBlocks.push(
          katex.renderToString(math, { displayMode: false, throwOnError: false, output: 'html' })
        );
      } catch (e) {
        inlineMathBlocks.push(`<code>${math}</code>`);
      }
      return placeholder;
    });

    // Step 5: Handle markdown formatting (headers, bold, italic, lists)
    formatted = formatted
      .replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold text-foreground mt-4 mb-1.5">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-foreground mt-6 mb-2 border-b border-border/50 pb-1">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-extrabold text-foreground mt-6 mb-2">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-foreground/90">$1</em>')
      .replace(/---/g, '<hr class="my-4 border-border/60" />')
      .replace(/^[-*]\s+(.*$)/gim, '<li class="flex items-start gap-2 my-1 text-muted-foreground leading-relaxed"><span class="text-[#93C572] select-none text-xs min-w-[0.75rem] pt-0.5">•</span><span class="flex-1">$1</span></li>')
      .replace(/^(\d+)\.\s+(.*$)/gim, '<li class="flex items-start gap-2 my-1 text-muted-foreground leading-relaxed"><span class="text-[#93C572] font-semibold text-xs min-w-[1.25rem] select-none pt-0.5">$1.</span><span class="flex-1">$2</span></li>');

    // Group contiguous <li> items into a single clean list
    formatted = formatted.replace(/((?:<li[\s\S]*?<\/li>\s*)+)/g, '<ul class="my-2 space-y-1 list-none pl-0">$1</ul>');

    // Clean up paragraph breaks and newlines without inserting <br /> after block tags
    formatted = formatted
      .replace(/\n\n+/g, '<div class="my-2.5"></div>')
      .replace(/\n/g, '<br />')
      .replace(/(<\/(?:li|ul|ol|h[1-6]|div|hr|pre)>)\s*<br\s*\/?>/gi, '$1')
      .replace(/<br\s*\/?>\s*(<(?:ul|ol|h[1-6]|div|hr|pre))/gi, '$1');

    // Step 6: Restore inline math, inline code, display math equation boxes, and code blocks
    inlineMathBlocks.forEach((block, idx) => {
      formatted = formatted.replace(`%%%INLINE_MATH_${idx}%%%`, block);
    });
    inlineCodeBlocks.forEach((block, idx) => {
      formatted = formatted.replace(`%%%INLINE_CODE_${idx}%%%`, block);
    });
    mathBlocks.forEach((block, idx) => {
      formatted = formatted.replace(`%%%MATH_BLOCK_${idx}%%%`, block);
    });
    codeBlocks.forEach((block, idx) => {
      formatted = formatted.replace(`%%%CODE_BLOCK_${idx}%%%`, block);
    });

    // Clean any stray <br /> immediately adjacent to restored display math blocks
    formatted = formatted
      .replace(/<br\s*\/?>\s*(<div class="my-3\.5 text-center overflow-x-auto">)/g, '$1')
      .replace(/(<\/div>)\s*<br\s*\/?>/g, '$1');

    return formatted;
  }, [content, allowPureCode]);

  return (
    <div
      className={`prose dark:prose-invert max-w-none text-sm text-muted-foreground leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
