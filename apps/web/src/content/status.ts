import type { Locale } from '../seo/config'

/**
 * Where the 2026 alphabet reform stands, legally, right now.
 *
 * This exists because "alifbo yangilandimi", "alifbo ozgardimi" and "yangi
 * alifbo tasdiqlandimi" are a distinct search intent from "what changed", and
 * nothing on the site answered it directly. /reform explains the letters;
 * this answers whether any of it is in force yet.
 *
 * ONE EDIT KEEPS IT TRUE: change `STAGE` and `CHECKED_ON` together. Everything
 * else — the page, the Legislation schema's legal-force value, and the build
 * guard — reads from here. statusFreshnessPlugin fails the build when
 * CHECKED_ON goes stale, so this cannot quietly rot into a wrong answer on the
 * page most likely to be quoted.
 */
export type ReformStage = 'awaiting-signature' | 'signed' | 'in-force'

export const STAGE: ReformStage = 'signed'

/** ISO date a human last verified STAGE against the sources. */
export const CHECKED_ON = '2026-10-22'

/** Build fails once CHECKED_ON is older than this. */
export const MAX_AGE_DAYS = 45

/** Key legislative dates, for the Legislation schema. */
export const ADOPTED_ON = '2026-07-07'
export const SENATE_APPROVED_ON = '2026-09-10'

/** Signed and officially published the same day: national legislation database,
 * 21.10.2026, No. 03/26/1184/1063 (https://lex.uz/uz/docs/8548754). */
export const SIGNED_ON = '2026-10-21'
export const LAW_URL = 'https://lex.uz/uz/docs/8548754'
/** The law's number as lex.uz writes it in each language. */
export const LAW_NUMBER: Record<Locale, string> = { uz: 'OʻRQ-1184', ru: 'ЗРУ-1184', en: 'LRU-1184' }

/** Article 4: "rasmiy eʼlon qilingan kundan eʼtiboran olti oy oʻtgach kuchga kiradi" —
 * six months after official publication on 21 October 2026. */
export const IN_FORCE_ON = '2027-04-22'
export const IN_FORCE_LABEL: Record<Locale, string> = {
  uz: '2027-yil 22-aprel',
  ru: '22 апреля 2027 года',
  en: '22 April 2027',
}

/** "When does it take effect?" — the question that follows "has it changed?".
 * Drafts in uz and ru, pending the owner's check like the rest of this file. */
export const WHEN_IN_FORCE: Record<Locale, { q: string; a: string }> = {
  uz: {
    q: 'Yangi alifbo qachon kuchga kiradi?',
    a: 'Yangi alifbo 2027-yil 22-apreldan kuchga kiradi: OʻRQ-1184-son qonun 2026-yil 21-oktabrda rasmiy eʼlon qilingan va eʼlon qilinganidan olti oy oʻtib kuchga kiradi.',
  },
  ru: {
    q: 'Когда вступит в силу новый алфавит?',
    a: 'Новый алфавит вступает в силу 22 апреля 2027 года: закон ЗРУ-1184 официально опубликован 21 октября 2026 года и вступает в силу через шесть месяцев после опубликования.',
  },
  en: {
    q: 'When does the new alphabet take effect?',
    a: 'The new alphabet takes effect on 22 April 2027: Law No. LRU-1184 was officially published on 21 October 2026 and enters into force six months after publication.',
  },
}

/** schema.org LegalForceStatus for the current stage. */
export function legalForce(stage: ReformStage = STAGE): string {
  return stage === 'in-force' ? 'https://schema.org/InForce' : 'https://schema.org/NotInForce'
}

export interface StatusCopy {
  /** The direct answer, as the first thing on the page. */
  headline: string
  body: string
}

// uz and ru are drafts pending a native-speaker check, like SOUNDS in
// alphabet.ts and the chart strings in translations.ts.
export const STATUS_COPY: Record<ReformStage, Record<Locale, StatusCopy>> = {
  'awaiting-signature': {
    uz: {
      headline: 'Yoʻq — qonun qabul qilingan, ammo hali imzolanmagan.',
      body: 'Qonunchilik palatasi uni 2026-yil 7-iyulda qabul qildi, Senat 10-sentabrda maʼqulladi. Qonun Prezident imzolab, rasmiy eʼlon qilingach, oʻtish davridan soʻng kuchga kiradi. Shu paytgacha amaldagi alifbo — 1995-yilgi lotin alifbosi.',
    },
    ru: {
      headline: 'Нет — закон принят, но ещё не подписан.',
      body: 'Законодательная палата приняла его 7 июля 2026 года, Сенат одобрил 10 сентября. Закон вступит в силу после подписи Президента, официального опубликования и переходного периода. До этого действует латинский алфавит 1995 года.',
    },
    en: {
      headline: 'Not yet — the law has passed, but it has not been signed.',
      body: 'The Legislative Chamber adopted it on 7 July 2026 and the Senate approved it on 10 September 2026. It enters into force once the President signs it, it is officially published, and a transition period has passed. Until then, the alphabet in force is the 1995 Latin alphabet.',
    },
  },
  signed: {
    uz: {
      headline: 'Ha — qonun imzolandi. Yangi alifbo 2027-yil 22-apreldan kuchga kiradi.',
      body: 'Prezident OʻRQ-1184-son qonunni 2026-yil 21-oktabrda imzoladi va u shu kuni rasmiy eʼlon qilindi. Qonun eʼlon qilinganidan olti oy oʻtib kuchga kiradi. Amaldagi alifboda berilgan hujjatlar, milliy valyuta va qimmatli qogʻozlar kuchini saqlaydi.',
    },
    ru: {
      headline: 'Да — закон подписан. Новый алфавит вступает в силу 22 апреля 2027 года.',
      body: 'Президент подписал закон ЗРУ-1184 21 октября 2026 года, и в тот же день он был официально опубликован. Закон вступает в силу через шесть месяцев после опубликования. Документы, национальная валюта и ценные бумаги на прежнем алфавите остаются действительными.',
    },
    en: {
      headline: 'Yes — the law is signed. The new alphabet takes effect on 22 April 2027.',
      body: 'The President signed Law No. LRU-1184 on 21 October 2026, and it was officially published the same day. It enters into force six months after publication. Documents, banknotes and securities issued in the previous alphabet remain valid.',
    },
  },
  'in-force': {
    uz: {
      headline: 'Ha — yangi alifbo kuchga kirdi.',
      body: 'OAV, davlat organlari va rasmiy yozishmalar yangi alifboga oʻtdi. Eski alifboda berilgan hujjatlar kuchini saqlaydi; shaxsiy yozishmalarda tanlov erkin.',
    },
    ru: {
      headline: 'Да — новый алфавит вступил в силу.',
      body: 'СМИ, госорганы и официальная переписка перешли на новый алфавит. Документы на прежнем алфавите остаются действительными; в личной переписке выбор свободный.',
    },
    en: {
      headline: 'Yes — the new alphabet is in force.',
      body: 'Media, state bodies and official correspondence have moved to the new alphabet. Documents issued in the old alphabet remain valid, and personal use is free.',
    },
  },
}

export const statusCopy = (locale: Locale): StatusCopy => STATUS_COPY[STAGE][locale]
