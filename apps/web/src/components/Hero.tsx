import { useT } from '../i18n/useT'
import { useVideoLoop } from '../hooks/useVideoLoop'
import { useHeroVideo } from '../hooks/useHeroVideo'

/** Self-hosted. Was a 29 MB file on a third-party CloudFront bucket we do not
 * control, eagerly downloaded on every homepage visit; re-encoded to 1.6 MB. */
const VIDEO_URL = '/hero.mp4'
const POSTER_URL = '/hero-poster.jpg'

export function Hero() {
  const { t } = useT()
  const showVideo = useHeroVideo()
  const { videoRef, opacity } = useVideoLoop(showVideo)
  const toConverter = () => document.getElementById('converter')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className="relative flex min-h-[calc(100vh-88px)] w-full flex-col items-center overflow-hidden bg-background">
      {/* The poster is the hero for everyone; the video fades in over it where
          it will actually be watched. Decorative, so it carries an empty alt. */}
      <img
        src={POSTER_URL}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 z-0 h-full w-full object-cover"
      />
      {showVideo && (
        <video
          ref={videoRef}
          src={VIDEO_URL}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          style={{ opacity, transition: 'opacity 0.1s linear' }}
          className="absolute inset-0 z-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/80 via-background/40 to-background" />
      <div className="relative z-10 mx-auto flex w-full flex-col items-center px-6 pt-16 pb-28 text-center">
        <h1 className="animate-fade-rise font-serif font-normal text-foreground text-5xl sm:text-7xl md:text-8xl max-w-7xl leading-[0.95] tracking-[-2.46px]">
          {t('hero.headlinePre')}<em className="italic text-muted">{t('hero.headlineEm')}</em>{t('hero.headlinePost')}
        </h1>
        <p className="animate-fade-rise-delay mt-8 max-w-2xl text-base sm:text-lg leading-relaxed text-muted">
          {t('hero.desc')}
        </p>
        <button onClick={toConverter} className="animate-fade-rise-delay-2 mt-12 rounded-full bg-foreground px-14 py-5 text-base text-background transition-transform hover:scale-[1.03]">
          {t('nav.cta')}
        </button>
      </div>
    </section>
  )
}
