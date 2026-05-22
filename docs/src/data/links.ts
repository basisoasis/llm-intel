export interface NavLink {
  label: string;
  href: string;
}

export const GITHUB_URL = "https://github.com/basisoasis/llmintel";

export const NAV_LINKS: NavLink[] = [
  { label: "Demo", href: "#demo" },
  { label: "Install", href: "#install" },
];

export const FOOTER_LINKS: NavLink[] = [
  { label: "GitHub", href: GITHUB_URL },
  { label: "NPM", href: "https://www.npmjs.com/org/basisoasis" },
  { label: "Issues", href: "https://github.com/basisoasis/llmintel/issues" },
];
