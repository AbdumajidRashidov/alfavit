import type { Locale } from '../seo/config'
import type { ReformSpotlight } from './types'

export const spotlights: Record<Locale, ReformSpotlight[]> = {
  en: [
    { id: 'sh', from: 'sh', to: 'ş', body: 'The digraph sh becomes the single letter ş.', examples: [['shahar', 'şahar'], ['ishlash', 'işlaş']] },
    { id: 'ch', from: 'ch', to: 'ç', body: 'The digraph ch becomes the single letter ç.', examples: [['choy', 'çoy'], ['kecha', 'keça']] },
    { id: 'gh', from: 'gʻ', to: 'ğ', body: 'The apostrophe-letter gʻ becomes ğ.', examples: [['gʻalaba', 'ğalaba'], ['bogʻ', 'boğ']] },
    { id: 'oh', from: 'oʻ', to: 'ŏ', body: 'The apostrophe-letter oʻ becomes ŏ.', examples: [['oʻzbek', 'ŏzbek'], ['koʻl', 'kŏl']] },
    { id: 'ts', from: 'ts', to: 'c', body: 'In loanwords, ts becomes c.', examples: [['tsirk', 'cirk'], ['tsex', 'cex']] },
  ],
  uz: [
    { id: 'sh', from: 'sh', to: 'ş', body: 'sh qoʻsh harfi bitta ş harfiga aylandi.', examples: [['shahar', 'şahar'], ['ishlash', 'işlaş']] },
    { id: 'ch', from: 'ch', to: 'ç', body: 'ch qoʻsh harfi bitta ç harfiga aylandi.', examples: [['choy', 'çoy'], ['kecha', 'keça']] },
    { id: 'gh', from: 'gʻ', to: 'ğ', body: 'gʻ harfi ğ harfiga aylandi.', examples: [['gʻalaba', 'ğalaba'], ['bogʻ', 'boğ']] },
    { id: 'oh', from: 'oʻ', to: 'ŏ', body: 'oʻ harfi ŏ harfiga aylandi.', examples: [['oʻzbek', 'ŏzbek'], ['koʻl', 'kŏl']] },
    { id: 'ts', from: 'ts', to: 'c', body: 'Oʻzlashma soʻzlarda ts birikmasi c harfiga aylandi.', examples: [['tsirk', 'cirk'], ['tsex', 'cex']] },
  ],
  ru: [
    { id: 'sh', from: 'sh', to: 'ş', body: 'Диграф sh заменён одной буквой ş.', examples: [['shahar', 'şahar'], ['ishlash', 'işlaş']] },
    { id: 'ch', from: 'ch', to: 'ç', body: 'Диграф ch заменён одной буквой ç.', examples: [['choy', 'çoy'], ['kecha', 'keça']] },
    { id: 'gh', from: 'gʻ', to: 'ğ', body: 'Буква gʻ заменена на ğ.', examples: [['gʻalaba', 'ğalaba'], ['bogʻ', 'boğ']] },
    { id: 'oh', from: 'oʻ', to: 'ŏ', body: 'Буква oʻ заменена на ŏ.', examples: [['oʻzbek', 'ŏzbek'], ['koʻl', 'kŏl']] },
    { id: 'ts', from: 'ts', to: 'c', body: 'В заимствованиях ts заменяется на c.', examples: [['tsirk', 'cirk'], ['tsex', 'cex']] },
  ],
}
