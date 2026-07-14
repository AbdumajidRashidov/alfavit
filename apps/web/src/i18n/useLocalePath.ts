import { useT } from './useT'
import { localePath } from '../seo/config'

// Returns a fn that prefixes a locale-agnostic app path ('/reform') with the
// current locale ('/ru/reform'). '/' maps to '' | '/ru' | '/en'.
export function useLocalePath() {
  const { locale } = useT()
  return (appPath: string) => localePath(locale, appPath.replace(/^\//, ''))
}
