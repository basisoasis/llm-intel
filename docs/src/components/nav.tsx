import { NAV_LINKS, GITHUB_URL } from "../data/links";

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between h-[52px] px-12 bg-bg/90 backdrop-blur-md border-b border-border">
      {/* Left — brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 flex items-center justify-center border border-accent rounded-sm">
          <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
            <rect x="1" y="1" width="4" height="4" fill="#a8ff78" />
            <rect
              x="7"
              y="1"
              width="4"
              height="4"
              fill="#a8ff78"
              opacity="0.5"
            />
            <rect
              x="1"
              y="7"
              width="4"
              height="4"
              fill="#a8ff78"
              opacity="0.5"
            />
            <rect
              x="7"
              y="7"
              width="4"
              height="4"
              fill="#a8ff78"
              opacity="0.25"
            />
          </svg>
        </div>
        <span className="font-sans text-[13px] font-semibold text-text-bright">
          LLM <span className="text-accent">Intel</span>
        </span>
        <div className="w-px h-4 bg-border-2 mx-1" />
        <span className="text-[11px] text-muted tracking-wide">llm-intel</span>
      </div>

      {/* Right — links */}
      <div className="flex items-center gap-1">
        {NAV_LINKS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className="text-[11px] text-text-dim hover:text-text-bright px-2.5 py-1.5 rounded-app tracking-wider transition-colors"
          >
            {label}
          </a>
        ))}
        <a
          href={GITHUB_URL}
          className="ml-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-bg bg-accent px-3.5 py-1.5 rounded-app tracking-wider hover:opacity-85 transition-opacity"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          GitHub
        </a>
      </div>
    </nav>
  );
}
