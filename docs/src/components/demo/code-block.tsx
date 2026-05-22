import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import CopyButton from "../copy-button";

interface CodeBlockProps {
  label: string;
  copyText: string;
  language: string;
  code: string;
}

export function CodeBlock({ label, copyText, language, code }: CodeBlockProps) {
  return (
    <div className="bg-bg border border-border-2 rounded-app overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-surface-2 border-b border-border">
        <span className="text-[10px] tracking-[0.1em] uppercase text-muted">
          {label}
        </span>
        <CopyButton text={copyText} />
      </div>
      {/* Highlighted code */}
      <SyntaxHighlighter
        language={language}
        style={atomDark}
        customStyle={{
          margin: 0,
          padding: "16px 18px",
          background: "transparent",
          fontSize: "12.5px",
          lineHeight: "1.7",
          overflowX: "hidden",
        }}
        codeTagProps={{
          style: { fontFamily: "var(--font-mono)" },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
