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

export const STAGE: ReformStage = 'awaiting-signature'

/** ISO date a human last verified STAGE against the sources. */
export const CHECKED_ON = '2026-09-13'

/** Build fails once CHECKED_ON is older than this. */
export const MAX_AGE_DAYS = 45

/** Key legislative dates, for the Legislation schema. */
export const ADOPTED_ON = '2026-07-07'
export const SENATE_APPROVED_ON = '2026-09-10'

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
      headline: 'Ha — Prezident qonunni imzoladi.',
      body: 'Qonun imzolandi va rasmiy eʼlon qilindi. U oʻtish davri tugagach toʻliq kuchga kiradi; amaldagi alifboda berilgan hujjatlar kuchini saqlaydi.',
    },
    ru: {
      headline: 'Да — Президент подписал закон.',
      body: 'Закон подписан и официально опубликован. Он вступит в полную силу по окончании переходного периода; документы на прежнем алфавите остаются действительными.',
    },
    en: {
      headline: 'Yes — the President has signed the law.',
      body: 'The law is signed and officially published. It takes full effect once the transition period ends; documents issued in the previous alphabet remain valid.',
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
