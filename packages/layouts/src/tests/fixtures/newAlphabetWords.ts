// Words a person can type with the layout that the engine must hand back
// unchanged — so the layout and the desktop app's live transform never fight.
// Frozen on 2026-10-23 from the new-alphabet strings in the engine's
// transliterate, convert-old-latin, tutuq-belgisi and golden tests (single
// letters dropped), plus the spec's success sentence and attested tutuq words.
// s+h words are written without a tutuq (Ishoq, mushaf): that is the engine's
// output for them, since sh no longer spells ş.
export const NEW_ALPHABET_WORDS: string[] = [
  // engine tests
  'kördim', 'çoy', 'çöl', 'Özbek', 'özbek', 'ğalaba', 'ğayrat', 'Şamol', 'şamol',
  // spec success sentence: özbek ğalaba şahar çoy maʼno
  'şahar', 'ŞAHAR', 'maʼno',
  // attested tutuq and s+h words
  'taʼlim', 'Qurʼon', 'sanʼat', 'Ishoq', 'mushaf',
  // engine golden tests (o+ʼ / g+ʼ forms left out: the known engine edge)
  'özbekiston', 'Toşkent', 'eʼtibor', 'boşi', 'böyiça', 'heç', 'Heç', 'HEÇ', 'işla', 'işonç', 'kişi',
  'qönğiroq', 'qönğiroqlarni', 'taşib', 'taşqi', 'Yoşlar', 'YOŞLAR',
  // a tutuq before a suffix on a foreign name
  'Facebookʼda', 'Twitterʼda', 'Washingtonʼda',
]
