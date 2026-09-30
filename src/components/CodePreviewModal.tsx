/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Play, RefreshCw, Copy, Check } from 'lucide-react';

interface CodePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
}

export const CodePreviewModal: React.FC<CodePreviewModalProps> = ({
  isOpen,
  onClose,
  code,
  language,
}) => {
  const [copied, setCopied] = useState(false);
  const [key, setKey] = useState(0);

  if (!isOpen) return null;

  const isHtml =
    language.toLowerCase() === 'html' ||
    code.includes('<html') ||
    code.includes('<!DOCTYPE') ||
    code.includes('</div>');

  const generatePreviewDocument = () => {
    if (isHtml) {
      if (code.includes('<!DOCTYPE html>') || code.includes('<html')) {
        return code;
      }
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 1.5rem; background: #0f172a; color: #f8fafc; }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
    }

    if (language === 'javascript' || language === 'js') {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: monospace; padding: 1rem; background: #090d16; color: #38bdf8; }
    #console { white-space: pre-wrap; font-size: 14px; line-height: 1.6; }
  </style>
</head>
<body>
  <h3>JavaScript Output:</h3>
  <div id="console"></div>
  <script>
    const consoleDiv = document.getElementById('console');
    const log = (...args) => {
      consoleDiv.innerHTML += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ') + '\\n';
    };
    console.log = log;
    console.error = (...args) => log('[ERROR]', ...args);
    console.warn = (...args) => log('[WARN]', ...args);
    try {
      ${code}
    } catch(err) {
      console.error(err.message);
    }
  </script>
</body>
</html>`;
    }

    return `<!DOCTYPE html>
<html>
<head><style>body { background: #0f172a; color: #e2e8f0; font-family: monospace; padding: 2rem; }</style></head>
<body>
  <pre>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#1e1f20] border border-[#2d2f31] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2d2f31] bg-[#1e1f20]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#282a2c] text-[#8ab4f8]">
              <Play className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#e3e3e3] flex items-center gap-2">
                Code Sandbox
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#282a2c] text-[#c4c7c5] font-mono">
                  {language}
                </span>
              </h3>
              <p className="text-xs text-[#8e918f]">Interactive isolated environment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setKey((k) => k + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#c4c7c5] hover:text-white bg-[#282a2c] hover:bg-[#333538] rounded-full transition-colors"
              title="Reload sandbox"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#c4c7c5] hover:text-white bg-[#282a2c] hover:bg-[#333538] rounded-full transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#81c995]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8e918f] hover:text-[#e3e3e3] rounded-lg hover:bg-[#282a2c] transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content iframe */}
        <div className="flex-1 bg-[#131314] relative">
          <iframe
            key={key}
            srcDoc={generatePreviewDocument()}
            title="Code Preview Sandbox"
            sandbox="allow-scripts allow-modals allow-forms"
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
};
