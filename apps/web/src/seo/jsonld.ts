import { SITE_URL } from './config'

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

export function articleLd(headline: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url,
    publisher: { '@type': 'Organization', name: 'Alfavit' },
  }
}
