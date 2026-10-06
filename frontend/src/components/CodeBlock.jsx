import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const displayLang = language ? language.toLowerCase() : 'code';

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-block-lang">{displayLang}</span>
        <button
          className="code-copy-btn"
          onClick={handleCopy}
          type="button"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check size={14} className="text-success" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-block-content">
        <code>{value}</code>
      </pre>
    </div>
  );
}
