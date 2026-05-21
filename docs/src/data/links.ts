export interface NavLink {
  label: string
  href: string
}

export const GITHUB_URL = 'https://github.com/basisoasis/llmintel'

export const NAV_LINKS: NavLink[] = [
  { label: 'Demo',      href: '#demo'    },
  { label: 'Install',   href: '#install' },
  { label: 'Docs',      href: '#'        },
  { label: 'Changelog', href: '#'        },
]

export const FOOTER_LINKS: NavLink[] = [
  { label: 'GitHub', href: GITHUB_URL },
  { label: 'npm',    href: '#' },
  { label: 'Docs',   href: '#' },
  { label: 'Issues', href: '#' },
]