import { SITE_URL, type Locale } from './config'

export const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Alfavit',
  url: SITE_URL,
  logo: `${SITE_URL}/apple-touch-icon.png`,
}

export const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Alfavit',
  url: SITE_URL,
}

export const softwareAppLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Alfavit',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any (web browser)',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description:
    'Convert Uzbek text from Cyrillic or old Latin to the reformed 2026 new Latin script, in your browser.',
}

export function breadcrumbLd(name: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Alfavit', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name, item: url },
    ],
  }
}

export function faqPageLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  }
}

export function howToLd(name: string, steps: { heading: string; body: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    step: steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.heading, text: s.body })),
  }
}

/**
 * Describes the printable alphabet chart for Google Images.
 *
 * Unlike FAQPage and HowTo — both retired as rich results in 2023 — image
 * metadata still earns a visible badge, and the licence fields are what make a
 * result eligible for it. The chart is part of the repo, so the licence is the
 * repo's MIT.
 */
export function imageObjectLd(opts: {
  contentUrl: string
  name: string
  description: string
  width: number
  height: number
  acquireLicensePage: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: opts.contentUrl,
    url: opts.contentUrl,
    name: opts.name,
    description: opts.description,
    width: opts.width,
    height: opts.height,
    license: 'https://github.com/AbdumajidRashidov/alfavit/blob/main/LICENSE',
    acquireLicensePage: opts.acquireLicensePage,
    creditText: 'alfavit.uz',
    copyrightNotice: 'Abdumajid Rashidov',
    creator: { '@type': 'Organization', name: 'Alfavit' },
  }
}

/**
 * `dates` is not optional by accident. This site's subject is a law that has
 * not finished passing, so "when was this last true?" is the question every
 * reader and every model has. An Article with no datePublished/dateModified
 * gives them nothing to go on.
 */
export function articleLd(
  headline: string,
  description: string,
  url: string,
  meta: { published: string; updated: string; locale: Locale },
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url,
    datePublished: meta.published,
    dateModified: meta.updated,
    // The default locale writes Uzbek in Latin script, which is the whole
    // point of the site; the tag has to say so, or 'uz' reads as ambiguous
    // now that both scripts are in use.
    inLanguage: meta.locale === 'uz' ? 'uz-Latn' : meta.locale,
    publisher: { '@type': 'Organization', name: 'Alfavit' },
  }
}

/**
 * The reform as a piece of legislation.
 *
 * `legislationLegalForce` is the whole point: schema.org's ELI vocabulary has a
 * standard, machine-readable way to say "this law has not taken effect yet",
 * which is exactly what people are asking when they search "alifbo
 * yangilandimi". Better to state it in a vocabulary built for the question than
 * to leave a model inferring it from prose.
 */
export function legislationLd(opts: {
  name: string
  description: string
  url: string
  adoptedOn: string
  legalForce: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Legislation',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    legislationDate: opts.adoptedOn,
    legislationPassedBy: { '@type': 'GovernmentOrganization', name: 'Oliy Majlis' },
    legislationJurisdiction: { '@type': 'AdministrativeArea', name: 'Uzbekistan' },
    legislationLegalForce: opts.legalForce,
  }
}

/**
 * The 28 letters as structured data.
 *
 * The letter table is the site's most-cited asset and, until now, existed only
 * as visual HTML. DefinedTermSet is the schema.org type for exactly this — a
 * glossary of terms — and gives an assistant answering "what is Uzbek ş?" the
 * mapping without having to parse a table out of markup.
 */
export function definedTermSetLd(
  name: string,
  url: string,
  terms: { term: string; description: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name,
    url,
    hasDefinedTerm: terms.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.term,
      description: t.description,
      inDefinedTermSet: url,
    })),
  }
}
