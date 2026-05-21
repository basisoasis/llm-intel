import { FOOTER_LINKS } from '../data/links'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="max-w-[1200px] mx-auto px-12 h-14 flex items-center justify-between">

        {/* Left */}
        <p className="text-[11px] text-muted">
          <span className="text-text-dim font-medium">LLM Intel</span>
          {' · '}MIT License{' · '}Made for developers
        </p>

        {/* Right */}
        <nav className="flex items-center gap-5">
          {FOOTER_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-[11px] text-muted hover:text-text tracking-wide transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

      </div>
    </footer>
  )
}