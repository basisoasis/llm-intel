export default function Hero() {
  return (
    <section className="relative max-w-[1200px] mx-auto px-12 pt-20 pb-16 overflow-hidden">

      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--color-border) 1px, transparent 1px),
                            linear-gradient(90deg, var(--color-border) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)',
        }}
      />

      {/* Headline */}
      <h1 className="relative font-sans text-[clamp(36px,5vw,56px)] font-semibold text-text-bright leading-[1.1] tracking-tight mb-5 max-w-[720px]">
        Real-time pricing intelligence<br />
        for <span className="text-accent">every LLM</span>.
      </h1>

      {/* Subheading */}
      <p className="relative font-sans text-[16px] font-light text-text-dim leading-relaxed max-w-[540px] mb-9">
        LLM Intel fetches live token costs across all major model providers — OpenAI,
        Anthropic, Google, Meta, Mistral, and more — so your app always bills accurately.
      </p>

      {/* CTAs */}
      <div className="relative flex items-center gap-3 flex-wrap">
        <a
          href="#install"
          className="font-mono text-[12px] font-medium tracking-wider text-bg bg-accent px-5 py-2.5 rounded-app hover:opacity-85 hover:shadow-glow transition-all"
        >
          Get Started
        </a>
        <a
          href="#demo"
          className="inline-flex items-center gap-2 font-mono text-[12px] tracking-wider text-text-dim border border-border-2 px-5 py-2.5 rounded-app hover:border-text-dim hover:text-text-bright transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
            <polygon points="5,3 13,8 5,13" />
          </svg>
          Try the Demo
        </a>
      </div>

      {/* Stats */}
      <div className="relative flex gap-10 mt-12 pt-7 border-t border-border">
        {[
          { value: '18+', label: 'Models' },
          { value: '7',   label: 'Providers' },
          { value: '0',   label: 'Dependencies' },
          { value: 'MIT', label: 'License' },
        ].map(({ value, label }) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="font-sans text-[22px] font-semibold text-text-bright tracking-tight">
              <span className="text-accent">{value}</span>
            </span>
            <span className="text-[10px] tracking-[0.1em] uppercase text-muted">{label}</span>
          </div>
        ))}
      </div>

    </section>
  )
}