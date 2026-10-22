// /kirill — the converter page for people who read Uzbek in Cyrillic.
//
// Kun.uz's Cyrillic channel gets ~17x the views of its Latin one, and our
// Cyrillic-script search queries had impressions but no clicks: there was no
// page in their script. One page, not a fourth locale (spec B2).
//
// UNVERIFIED (drafted 2026-10-22): every string here needs the owner's
// native-speaker check before merge. Facts trace to OʻRQ-1184 (lex.uz/uz/docs/8548754):
// Article 1 (28 letters + tutuq), Article 2 (documents stay valid), Article 4 (in force
// six months after publication on 21 Oct 2026, i.e. 22 Apr 2027).

export interface KirillPage {
  metaTitle: string
  metaDesc: string
  title: string
  intro: string
  lettersHeading: string
  fromLabel: string
  oldLabel: string
  toLabel: string
  /** The converter's labels, in Cyrillic (the UI locale is Latin Uzbek). */
  converter: { heading: string; inputLabel: string; outputLabel: string; copy: string; copied: string; share: string }
  qa: { q: string; a: string }[]
  alphabetLink: string
  statusLink: string
  /** Link text on /alphabet (all locales) pointing here. */
  linkFromAlphabet: string
}

export const kirill: KirillPage = {
  metaTitle: 'Янги ўзбек алифбоси — кириллдан янги лотинга ўгириш, онлайн конвертор | Alfavit',
  metaDesc: 'Кирилл ёзувидаги ўзбекча матнни 2026 йилги янги алифбога (Ö, Ğ, Ş, Ç) бир зумда ўгиринг. Қонун 2027 йил 22 апрелдан кучга киради.',
  title: 'Янги ўзбек алифбоси: кириллдан янги лотинга ўгириш',
  intro: 'Кирилл ёзувидаги матнни қуйидаги майдонга қўйинг — у 2026 йилги янги лотин алифбосига бир зумда ўгирилади. Ҳеч нарса юкланмайди: ўгириш қурилмангизнинг ўзида бажарилади.',
  lettersHeading: 'Лотин ёзувида ўзгарган тўртта ҳарф',
  fromLabel: 'Кирилл',
  oldLabel: 'Эски лотин (1995)',
  toLabel: 'Янги лотин (2026)',
  converter: {
    heading: 'Матнингизни янги алифбога ўгиринг',
    inputLabel: 'Кирилл ёки эски лотин',
    outputLabel: 'Янги лотин',
    copy: 'Нусха олиш',
    copied: 'Нусха олинди',
    share: 'Улашиш',
  },
  qa: [
    {
      q: 'Янги алифбо қачон кучга киради?',
      a: 'ЎРҚ-1184-сон қонун 2026 йил 21 октябрда имзоланиб, ўша куни расман эълон қилинди. У эълон қилинганидан олти ой ўтиб — 2027 йил 22 апрелдан кучга киради.',
    },
    {
      q: 'Янги алифбода нечта ҳарф бор?',
      a: '28 та ҳарф ва битта тутуқ белгиси (ʼ). Илгари лотин алифбосида 26 та ҳарф ва 3 та ҳарф бирикмаси бор эди.',
    },
    {
      q: 'Эски лотин ёзувидаги ҳужжатлар кучини йўқотадими?',
      a: 'Йўқ. Қонун кучга киргунга қадар ҳарфларнинг эски шакли билан расмийлаштирилган ҳужжатлар, миллий валюта ва қимматли қоғозлар ўз кучини сақлайди.',
    },
  ],
  alphabetLink: 'Тўлиқ алифбо',
  statusLink: 'Қонуннинг ҳолати',
  linkFromAlphabet: 'Кирилл ёзувида: янги алифбога ўгириш',
}
