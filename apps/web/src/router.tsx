import type { RouteRecord } from 'vite-react-ssg'
import type { ComponentType } from 'react'
import { RootLayout } from './components/RootLayout'
import { HomePage } from './pages/HomePage'
import { FilesPage } from './pages/FilesPage'
import { AppsPage } from './pages/AppsPage'
import { DevelopersPage } from './pages/DevelopersPage'
import { ReformPage } from './pages/ReformPage'
import { AlphabetPage } from './pages/AlphabetPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { GuideCyrillicPage } from './pages/GuideCyrillicPage'
import { GuideOldLatinPage } from './pages/GuideOldLatinPage'
import { GuideKeyboardPage } from './pages/GuideKeyboardPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { StatusPage } from './pages/StatusPage'
import { localesForPath, type Locale } from './seo/config'

interface PageDef { path: string; Component: ComponentType; index?: boolean }

const PAGES: PageDef[] = [
  { path: '', Component: HomePage, index: true },
  { path: 'files', Component: FilesPage },
  { path: 'apps', Component: AppsPage },
  { path: 'developers', Component: DevelopersPage },
  { path: 'reform', Component: ReformPage },
  { path: 'alphabet', Component: AlphabetPage },
  { path: 'status', Component: StatusPage },
  { path: 'privacy', Component: PrivacyPage },
  { path: 'guide/cyrillic-to-latin', Component: GuideCyrillicPage },
  { path: 'guide/old-latin-to-new', Component: GuideOldLatinPage },
  { path: 'guide/keyboard', Component: GuideKeyboardPage },
]

function childrenFor(locale: Locale): RouteRecord[] {
  return PAGES.filter((p) => localesForPath(p.path).includes(locale)).map((p) =>
    p.index ? { index: true, Component: p.Component } : { path: p.path, Component: p.Component },
  )
}

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <RootLayout />,
    entry: 'src/components/RootLayout.tsx',
    children: [
      ...childrenFor('uz'),
      { path: 'ru', children: childrenFor('ru') },
      { path: 'en', children: childrenFor('en') },
      // Prerenders to dist/404.html, which Cloudflare Pages serves with a real
      // 404 for unmatched paths. Kept out of PAGE_PATHS so it stays out of the
      // sitemap.
      { path: '404', Component: NotFoundPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
]
