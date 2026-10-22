import { useT } from '../i18n/useT'
import { CHART_WIDTH, CHART_HEIGHT, chartPng, chartPdf } from '../content/chart'
import { track } from '../analytics/track'

/**
 * The printable alphabet chart for the current language, with PNG and A4 PDF
 * downloads. Shared by /alphabet, /reform and the keyboard guide: the image
 * ranks for "jadvali" and "rasmi" searches, which land on all three.
 *
 * Lazy and below the fold wherever it is used: a 1270px chart above the fold
 * would become the Largest Contentful Paint element.
 */
export function ChartFigure() {
  const { t, locale } = useT()
  return (
    <section className="mt-16">
      <h2 className="font-medium text-foreground">{t('alphabet.chart.heading')}</h2>
      <figure className="mt-4">
        <img
          src={chartPng(locale)}
          alt={t('alphabet.chart.alt')}
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          loading="lazy"
          decoding="async"
          className="w-full rounded-xl border border-black/10"
        />
        <figcaption className="mt-3 text-sm text-muted">{t('alphabet.chart.caption')}</figcaption>
      </figure>
      <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <a href={chartPng(locale)} download onClick={() => track('download', 'chart-png')} className="underline text-muted hover:text-foreground">
          {t('alphabet.chart.png')} ↓
        </a>
        <a href={chartPdf(locale)} download onClick={() => track('download', 'chart-pdf')} className="underline text-muted hover:text-foreground">
          {t('alphabet.chart.pdf')} ↓
        </a>
      </p>
    </section>
  )
}
