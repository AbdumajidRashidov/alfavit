import { useEffect, useState } from 'react'

/**
 * Whether this client should download and play the decorative hero video.
 *
 * The video is 1.6 MB and purely ornamental, so only clients that will actually
 * see it motion should pay for it: wide viewports, motion not reduced. Two thirds
 * of our visitors are on phones, often on mobile data — they get the poster image
 * instead, which they were going to see as the first frame anyway.
 *
 * Returns false during prerender, so the <video> element never reaches the static
 * HTML and no browser starts fetching it before this decision is made.
 */
export function useHeroVideo(minWidth = 768): boolean {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const wide = window.matchMedia(`(min-width: ${minWidth}px)`)
    const still = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setShow(wide.matches && !still.matches)
    update()
    wide.addEventListener('change', update)
    still.addEventListener('change', update)
    return () => {
      wide.removeEventListener('change', update)
      still.removeEventListener('change', update)
    }
  }, [minWidth])

  return show
}
