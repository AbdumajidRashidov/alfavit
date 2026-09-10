import type { Locale } from '../seo/config'
import type { TimelineItem } from './types'

// Verified against gazeta.uz / spot.uz / daryo.uz (10 Sep 2026) and zamin.uz (textbooks).
export const timeline: Record<Locale, TimelineItem[]> = {
  en: [
    { date: '7 July 2026', body: 'The Legislative Chamber adopts the law changing the Latin-based Uzbek alphabet.' },
    { date: '10 September 2026', body: 'The Senate approves the law and sends it to the President.' },
    { date: 'Next', body: 'Presidential signature and official publication; the law enters into force after a transition period.' },
    { date: 'After entry into force', body: 'Media, state bodies and official correspondence switch to the new alphabet. Documents issued in the current alphabet stay valid; personal use is free.' },
    { date: '2027/28 school year', body: 'First-grade textbooks are printed in the new alphabet.' },
    { date: '2031', body: 'All school textbooks are converted.' },
  ],
  uz: [
    { date: '2026-yil 7-iyul', body: 'Qonunchilik palatasi lotin yozuviga asoslangan oʻzbek alifbosini oʻzgartirish haqidagi qonunni qabul qildi.' },
    { date: '2026-yil 10-sentabr', body: 'Senat qonunni maʼqullab, Prezidentga yubordi.' },
    { date: 'Keyingi qadam', body: 'Prezident imzosi va rasmiy eʼlon qilinishi; qonun oʻtish davridan soʻng kuchga kiradi.' },
    { date: 'Kuchga kirgach', body: 'OAV, davlat organlari va rasmiy yozishmalar yangi alifboga oʻtadi. Amaldagi alifboda berilgan hujjatlar kuchini saqlaydi; shaxsiy yozishmalarda tanlov erkin.' },
    { date: '2027/28 oʻquv yili', body: '1-sinf darsliklari yangi alifboda chop etiladi.' },
    { date: '2031', body: 'Barcha maktab darsliklari yangi alifboga oʻtkaziladi.' },
  ],
  ru: [
    { date: '7 июля 2026', body: 'Законодательная палата принимает закон об изменении узбекского алфавита на основе латиницы.' },
    { date: '10 сентября 2026', body: 'Сенат одобряет закон и направляет его Президенту.' },
    { date: 'Далее', body: 'Подпись Президента и официальное опубликование; закон вступает в силу после переходного периода.' },
    { date: 'После вступления в силу', body: 'СМИ, госорганы и официальная переписка переходят на новый алфавит. Документы на действующем алфавите остаются в силе; в личной переписке выбор свободный.' },
    { date: '2027/28 учебный год', body: 'Учебники для 1-го класса печатаются на новом алфавите.' },
    { date: '2031', body: 'Все школьные учебники переведены на новый алфавит.' },
  ],
}
