import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from './components/RootLayout'
import { HomePage } from './pages/HomePage'
import { FilesPage } from './pages/FilesPage'
import { AppsPage } from './pages/AppsPage'
import { DevelopersPage } from './pages/DevelopersPage'
import { ReformPage } from './pages/ReformPage'

export const routes = [
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'files', element: <FilesPage /> },
      { path: 'apps', element: <AppsPage /> },
      { path: 'developers', element: <DevelopersPage /> },
      { path: 'reform', element: <ReformPage /> },
      { path: '*', element: <HomePage /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
