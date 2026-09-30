/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Check, Play, Terminal } from 'lucide-react';
import katex from 'katex';
import { CodePreviewModal } from './CodePreviewModal';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [previewCode, setPreviewCode] = useState<{ code: string; lang: string } | null>(null);

  const codeBlockRegex = /```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let blockCounter = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push(
        <div key={`section-${lastIndex}`} className="markdown-prose space-y-2">
          {renderTextWithMathAndFormatting(textBefore)}
        </div>
      );
    }

    const language = match[1]?.trim() || 'plaintext';
    const code = match[2];
    const currentIndex = blockCounter++;
    const isRunnable = ['html', 'htm', 'javascript', 'js', 'svg', 'css'].includes(
      language.toLowerCase()
    );

    parts.push(
      <div
        key={`code-${currentIndex}`}
        className="my-3.5 rounded-2xl border border-[#2d2f31] bg-[#1e1f20] overflow-hidden group text-left"
      >
        <div className="flex items-center justify-between px-4 py-2 bg-[#282a2c] border-b border-[#2d2f31] text-xs text-[#8e918f]">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#8e918f]" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#c4c7c5] font-medium">
              {language}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {isRunnable && (
              <button
                onClick={() => setPreviewCode({ code, lang: language })}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1e1f20] hover:bg-[#333538] text-[#8ab4f8] text-xs font-medium transition-colors border border-[#3c4043]"
              >
                <Play className="w-3 h-3 fill-current" />
                Run / Preview
              </button>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(code);
                setCopiedIndex(currentIndex);
                setTimeout(() => setCopiedIndex(null), 2000);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-[#333538] text-[#c4c7c5] hover:text-white text-xs transition-colors"
              title="Copy code"
            >
              {copiedIndex === currentIndex ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#81c995]" />
                  <span className="text-[#81c995] text-[11px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed text-[#e3e3e3] bg-[#1e1f20]">
          <pre className="m-0 font-mono">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    );

    lastIndex = codeBlockRegex.lastIndex;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    const unclosedMatch = remainingText.match(/```([a-zA-Z0-9_\-+]*)\n([\s\S]*)$/);
    if (unclosedMatch) {
      const textBefore = remainingText.substring(0, unclosedMatch.index);
      if (textBefore) {
        parts.push(
          <div key={`section-pre-unclosed`} className="markdown-prose space-y-2">
            {renderTextWithMathAndFormatting(textBefore)}
          </div>
        );
      }
      const language = unclosedMatch[1]?.trim() || 'plaintext';
      const code = unclosedMatch[2];
      const currentIndex = blockCounter++;
      parts.push(
        <div
          key={`code-unclosed-${currentIndex}`}
          className="my-3.5 rounded-2xl border border-[#2d2f31] bg-[#1e1f20] overflow-hidden text-left"
        >
          <div className="flex items-center justify-between px-4 py-2 bg-[#282a2c] border-b border-[#2d2f31] text-xs text-[#8e918f]">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#8e918f]" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#c4c7c5] font-medium">
                {language}
              </span>
            </div>
            <span className="text-[10px] text-[#8ab4f8] animate-pulse">Streaming...</span>
          </div>
          <div className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed text-[#e3e3e3] bg-[#1e1f20]">
            <pre className="m-0 font-mono">
              <code>{code}</code>
            </pre>
          </div>
        </div>
      );
    } else {
      parts.push(
        <div key={`section-remaining`} className="markdown-prose space-y-2">
          {renderTextWithMathAndFormatting(remainingText)}
        </div>
      );
    }
  }

  return (
    <div className="text-[14.5px] leading-relaxed break-words space-y-2 text-[#e3e3e3]">
      {parts.length > 0 ? parts : content}
      {previewCode && (
        <CodePreviewModal
          isOpen={true}
          onClose={() => setPreviewCode(null)}
          code={previewCode.code}
          language={previewCode.lang}
        />
      )}
    </div>
  );
};

function renderTextWithMathAndFormatting(rawText: string): React.ReactNode {
  const normalizedText = rawText.replace(/<br\s*\/?>/gi, '\n');
  const displayMathRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g;
  const segments: React.ReactNode[] = [];
  let lastPos = 0;
  let match: RegExpExecArray | null;
  let segmentId = 0;

  while ((match = displayMathRegex.exec(normalizedText)) !== null) {
    const textBefore = normalizedText.substring(lastPos, match.index);
    if (textBefore) {
      segments.push(
        <React.Fragment key={`seg-${segmentId++}`}>
          {renderParagraphsAndLists(textBefore)}
        </React.Fragment>
      );
    }

    const rawEquation = match[1];
    let mathContent = rawEquation;
    if (rawEquation.startsWith('$$') && rawEquation.endsWith('$$')) {
      mathContent = rawEquation.slice(2, -2).trim();
    } else if (rawEquation.startsWith('\\[') && rawEquation.endsWith('\\]')) {
      mathContent = rawEquation.slice(2, -2).trim();
    }

    try {
      const html = katex.renderToString(mathContent, {
        displayMode: true,
        throwOnError: false,
      });
      segments.push(
        <div
          key={`math-disp-${segmentId++}`}
          className="my-3.5 px-4 py-3 rounded-2xl bg-[#1e1f20] border border-[#2d2f31] overflow-x-auto text-[#e3e3e3] text-center"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch {
      segments.push(
        <div
          key={`math-err-${segmentId++}`}
          className="my-3 px-4 py-2.5 rounded-2xl bg-[#1e1f20] border border-[#2d2f31] font-mono text-sm text-[#e3e3e3] overflow-x-auto"
        >
          {mathContent}
        </div>
      );
    }

    lastPos = displayMathRegex.lastIndex;
  }

  const remaining = normalizedText.substring(lastPos);
  if (remaining) {
    segments.push(
      <React.Fragment key={`seg-rem-${segmentId++}`}>
        {renderParagraphsAndLists(remaining)}
      </React.Fragment>
    );
  }

  return <>{segments}</>;
}

function renderParagraphsAndLists(text: string): React.ReactNode {
  const lines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      renderedElements.push(<div key={`empty-${i}`} className="h-1.5" />);
      continue;
    }

    if (line.startsWith('### ')) {
      renderedElements.push(
        <h3 key={`h3-${i}`} className="text-base font-semibold text-[#e3e3e3] mt-3.5 mb-1.5 flex items-center gap-2">
          {renderInlineFormatting(line.slice(4))}
        </h3>
      );
      continue;
    }

    if (line.startsWith('## ')) {
      renderedElements.push(
        <h2 key={`h2-${i}`} className="text-lg font-semibold text-[#e3e3e3] mt-4 mb-2 flex items-center gap-2 border-b border-[#2d2f31] pb-1">
          {renderInlineFormatting(line.slice(3))}
        </h2>
      );
      continue;
    }

    if (line.startsWith('# ')) {
      renderedElements.push(
        <h1 key={`h1-${i}`} className="text-xl font-bold text-[#e3e3e3] mt-4 mb-2 border-b border-[#2d2f31] pb-1.5">
          {renderInlineFormatting(line.slice(2))}
        </h1>
      );
      continue;
    }

    if (line.startsWith('> ')) {
      renderedElements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-2 border-[#444746] pl-3 py-1.5 my-2 text-[#c4c7c5] italic text-sm"
        >
          {renderInlineFormatting(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      renderedElements.push(
        <li key={`li-${i}`} className="ml-5 list-disc text-[#e3e3e3] my-0.5">
          {renderInlineFormatting(trimmed.slice(2))}
        </li>
      );
      continue;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      renderedElements.push(
        <div key={`num-${i}`} className="ml-4 flex items-start gap-2 my-1">
          <span className="text-[#8e918f] font-normal text-xs mt-0.5">{numMatch[1]}.</span>
          <span className="text-[#e3e3e3]">{renderInlineFormatting(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    if (/^\d+\.$/.test(trimmed)) {
      renderedElements.push(
        <div key={`num-solo-${i}`} className="text-[#8e918f] font-medium text-xs mt-2 mb-0.5">
          {trimmed}
        </div>
      );
      continue;
    }

    renderedElements.push(
      <p key={`p-${i}`} className="my-1 text-[#e3e3e3] leading-relaxed">
        {renderInlineFormatting(line)}
      </p>
    );
  }

  return <>{renderedElements}</>;
}

function renderInlineFormatting(str: string): React.ReactNode {
  const inlineMathRegex = /(\\\([\s\S]*?\\\)|(?<!\\)\$([^$\n]+)\$)/g;
  const parts: React.ReactNode[] = [];
  let lastPos = 0;
  let match: RegExpExecArray | null;
  let pIdx = 0;

  while ((match = inlineMathRegex.exec(str)) !== null) {
    const beforeText = str.substring(lastPos, match.index);
    if (beforeText) {
      parts.push(
        <React.Fragment key={`txt-${pIdx++}`}>
          {formatBasicInline(beforeText)}
        </React.Fragment>
      );
    }

    let math = match[0];
    if (math.startsWith('\\(') && math.endsWith('\\)')) {
      math = math.slice(2, -2).trim();
    } else if (math.startsWith('$') && math.endsWith('$')) {
      math = math.slice(1, -1).trim();
    }

    try {
      const html = katex.renderToString(math, {
        displayMode: false,
        throwOnError: false,
      });
      segmentsPush:
      parts.push(
        <span
          key={`math-inline-${pIdx++}`}
          className="mx-1 px-1.5 py-0.5 rounded-md bg-[#282a2c] text-[#e3e3e3] text-sm inline-block align-baseline"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch {
      parts.push(
        <code key={`math-raw-${pIdx++}`} className="px-1.5 py-0.5 rounded-md bg-[#282a2c] text-[#e3e3e3] font-mono text-xs border border-[#3c4043]">
          {math}
        </code>
      );
    }

    lastPos = inlineMathRegex.lastIndex;
  }

  const remaining = str.substring(lastPos);
  if (remaining) {
    parts.push(
      <React.Fragment key={`txt-rem-${pIdx++}`}>
        {formatBasicInline(remaining)}
      </React.Fragment>
    );
  }

  return <>{parts}</>;
}

function formatBasicInline(str: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = str;
  let keyIndex = 0;

  while (remaining.length > 0) {
    const brMatch = remaining.match(/<br\s*\/?>/i);
    const codeMatch = remaining.match(/`([^`]+)`/);
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

    let firstType = null;
    let firstIndex = Infinity;

    if (brMatch && brMatch.index !== undefined && brMatch.index < firstIndex) {
      firstType = 'br';
      firstIndex = brMatch.index;
    }
    if (codeMatch && codeMatch.index !== undefined && codeMatch.index < firstIndex) {
      firstType = 'code';
      firstIndex = codeMatch.index;
    }
    if (boldMatch && boldMatch.index !== undefined && boldMatch.index < firstIndex) {
      firstType = 'bold';
      firstIndex = boldMatch.index;
    }
    if (italicMatch && italicMatch.index !== undefined && italicMatch.index < firstIndex) {
      firstType = 'italic';
      firstIndex = italicMatch.index;
    }
    if (linkMatch && linkMatch.index !== undefined && linkMatch.index < firstIndex) {
      firstType = 'link';
      firstIndex = linkMatch.index;
    }

    if (!firstType || firstIndex === Infinity) {
      parts.push(remaining);
      break;
    }

    if (firstIndex > 0) {
      parts.push(remaining.substring(0, firstIndex));
    }

    if (firstType === 'br' && brMatch) {
      parts.push(<br key={`br-${keyIndex++}`} />);
      remaining = remaining.substring(firstIndex + brMatch[0].length);
    } else if (firstType === 'code' && codeMatch) {
      parts.push(
        <code
          key={`code-inline-${keyIndex++}`}
          className="px-1.5 py-0.5 rounded-md bg-[#282a2c] text-[#e3e3e3] font-mono text-[13px] border border-[#3c4043]"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.substring(firstIndex + codeMatch[0].length);
    } else if (firstType === 'bold' && boldMatch) {
      parts.push(
        <strong key={`bold-${keyIndex++}`} className="font-semibold text-white">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.substring(firstIndex + boldMatch[0].length);
    } else if (firstType === 'italic' && italicMatch) {
      parts.push(
        <em key={`italic-${keyIndex++}`} className="italic text-[#c4c7c5]">
          {italicMatch[1]}
        </em>
      );
      remaining = remaining.substring(firstIndex + italicMatch[0].length);
    } else if (firstType === 'link' && linkMatch) {
      parts.push(
        <a
          key={`link-${keyIndex++}`}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#8ab4f8] hover:text-[#a8c7fa] underline underline-offset-2 decoration-[#8ab4f8]/40"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.substring(firstIndex + linkMatch[0].length);
    }
  }

  return <>{parts}</>;
}
