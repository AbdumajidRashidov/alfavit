import { useEffect, useRef, useState } from 'react'

export function computeVideoOpacity(currentTime: number, duration: number, fade = 0.5): number {
  if (!duration || Number.isNaN(duration)) return 1
  if (currentTime < fade) return Math.max(0, Math.min(1, currentTime / fade))
  const remaining = duration - currentTime
  if (remaining < fade) return Math.max(0, Math.min(1, remaining / fade))
  return 1
}

/**
 * `enabled` must be a dependency, not just an early return: the <video> mounts
 * after the first render (useHeroVideo decides on the client), so an effect keyed
 * on [] would run once against a null ref and never start playback.
 *
 * Reduced-motion is no longer checked here — useHeroVideo decides, and those
 * clients get the poster image instead of a video that never plays. One decision,
 * one place.
 */
export function useVideoLoop(enabled = true) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!enabled || !video) return
    let raf = 0
    let restartTimer: ReturnType<typeof setTimeout> | undefined

    const tick = () => {
      setOpacity(computeVideoOpacity(video.currentTime, video.duration))
      raf = requestAnimationFrame(tick)
    }
    const onEnded = () => {
      setOpacity(0)
      restartTimer = setTimeout(() => { video.currentTime = 0; void video.play() }, 100)
    }
    video.addEventListener('ended', onEnded)
    void video.play().catch(() => { /* autoplay may be blocked; ignore */ })
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      if (restartTimer) clearTimeout(restartTimer)
      video.removeEventListener('ended', onEnded)
    }
  }, [enabled])

  return { videoRef, opacity }
}
