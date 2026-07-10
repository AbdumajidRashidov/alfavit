import { useEffect, useRef, useState } from 'react'

export function computeVideoOpacity(currentTime: number, duration: number, fade = 0.5): number {
  if (!duration || Number.isNaN(duration)) return 1
  if (currentTime < fade) return Math.max(0, Math.min(1, currentTime / fade))
  const remaining = duration - currentTime
  if (remaining < fade) return Math.max(0, Math.min(1, remaining / fade))
  return 1
}

export function useVideoLoop() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let raf = 0
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setOpacity(1); return }

    const tick = () => {
      setOpacity(computeVideoOpacity(video.currentTime, video.duration))
      raf = requestAnimationFrame(tick)
    }
    const onEnded = () => {
      setOpacity(0)
      setTimeout(() => { video.currentTime = 0; void video.play() }, 100)
    }
    video.addEventListener('ended', onEnded)
    void video.play().catch(() => { /* autoplay may be blocked; ignore */ })
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); video.removeEventListener('ended', onEnded) }
  }, [])

  return { videoRef, opacity }
}
