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
import { localesForPath, type Locale } from './seo/config'

interface PageDef { path: string; Component: ComponentType; index?: boolean }

const PAGES: PageDef[] = [
  { path: '', Component: HomePage, index: true },
  { path: 'files', Component: FilesPage },
  { path: 'apps', Component: AppsPage },
  { path: 'developers', Component: DevelopersPage },
  { path: 'reform', Component: ReformPage },
  { path: 'alphabet', Component: AlphabetPage },
  { path: 'privacy', Component: PrivacyPage },
  { path: 'guide/cyrillic-to-latin', Component: GuideCyrillicPage },
  { path: 'guide/old-latin-to-new', Component: GuideOldLatinPage },
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
      { path: '*', Component: HomePage },
    ],
  },
]
