import { SITE_URL } from './config'

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
