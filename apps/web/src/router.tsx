import type { RouteRecord } from 'vite-react-ssg'
import { RootLayout } from './components/RootLayout'
import { HomePage } from './pages/HomePage'
import { FilesPage } from './pages/FilesPage'
import { AppsPage } from './pages/AppsPage'
import { DevelopersPage } from './pages/DevelopersPage'
import { ReformPage } from './pages/ReformPage'
import { PrivacyPage } from './pages/PrivacyPage'

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <RootLayout />,
    entry: 'src/components/RootLayout.tsx',
    children: [
      { index: true, Component: HomePage },
      { path: 'files', Component: FilesPage },
      { path: 'apps', Component: AppsPage },
      { path: 'developers', Component: DevelopersPage },
      { path: 'reform', Component: ReformPage },
      { path: 'privacy', Component: PrivacyPage },
      { path: '*', Component: HomePage },
    ],
  },
]
