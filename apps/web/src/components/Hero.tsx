import { useT } from '../i18n/useT'
import { useVideoLoop } from '../hooks/useVideoLoop'
import { Nav } from './Nav'

const VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4'

export function Hero() {
  const { t } = useT()
  const { videoRef, opacity } = useVideoLoop()
  const toConverter = () => document.getElementById('converter')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background">
      <video
        ref={videoRef}
        src={VIDEO_URL}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        style={{ position: 'absolute', top: '300px', inset: 'auto 0 0 0', opacity, transition: 'opacity 0.1s linear' }}
        className="z-0 w-full object-cover"
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-background via-transparent to-background" />
      <Nav />
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6" style={{ paddingTop: 'calc(8rem - 75px)', paddingBottom: '10rem' }}>
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
