import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { track } from './track'

/**
 * One pageview per path. Keyed on pathname rather than the whole location so a
 * query-string change (a utm-tagged link being cleaned up, say) does not double-count.
 */
export function useTrackPageview(): void {
  const { pathname } = useLocation()
  useEffect(() => {
    track('pageview')
  }, [pathname])
}
