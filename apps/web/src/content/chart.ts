import type { Locale } from '../seo/config'

/**
 * The printable alphabet chart, rendered by scripts/render-alphabet-chart.mjs.
 *
 * The basenames are the SEO payload: each is the phrase people actually search
 * in that language ("lotin alifbosi jadvali" earns 153 impressions a quarter at
 * position 4 with almost no clicks, because the page had no image to show).
 * Both the generator and the page read this module, so a rename lands in one
 * place.
 */
export const CHART_BASENAME: Record<Locale, string> = {
  uz: 'lotin-alifbosi-jadvali-2026',
  ru: 'uzbekskiy-alfavit-2026',
  en: 'uzbek-latin-alphabet-2026',
}

/**
 * Intrinsic pixel size of the PNG — A4 at 96dpi (794x1123) scaled up for
 * Google Images. These feed <img width/height>, so they must match the file
 * exactly or the page shifts as it loads; chart-assets.test.ts reads the real
 * PNG header and fails if they ever disagree.
 */
export const CHART_WIDTH = 1270
export const CHART_HEIGHT = 1796

export const chartPng = (locale: Locale) => `/chart/${CHART_BASENAME[locale]}.png`
export const chartPdf = (locale: Locale) => `/chart/${CHART_BASENAME[locale]}.pdf`
