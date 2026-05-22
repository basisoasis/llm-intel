import { useState } from "react";

interface CopyButtonProps {
  text: string;
}

export default function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        text-[10px] tracking-[0.08em] uppercase font-mono
        border px-2 py-0.5 rounded-sm transition-colors
        ${
          copied
            ? "text-accent border-accent-dim"
            : "text-text-dim border-border-2 hover:text-accent hover:border-accent-dim"
        }
      `}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
