export interface NavLink {
  label: string;
  href: string;
}

export const GITHUB_URL = "https://github.com/basisoasis/llm-intel";

export const NAV_LINKS: NavLink[] = [
  { label: "Demo", href: "#demo" },
  { label: "Install", href: "#install" },
];

export const FOOTER_LINKS: NavLink[] = [
  { label: "NPM", href: "https://www.npmjs.com/package/@basisoasis/llm-intel" },
  { label: "NPMX", href: "https://npmx.dev/package/@basisoasis/llm-intel" },
  { label: "GitHub", href: GITHUB_URL },
  { label: "Issues", href: "https://github.com/basisoasis/llm-intel/issues" },
];
