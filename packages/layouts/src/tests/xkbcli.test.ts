// Behaviour, not syntax: libxkbcommon compiles the drop-in exactly the way a
// Wayland desktop would after `tar -xzf alfavit-xkb.tar.gz -C ~/.config`.
// CI sets REQUIRE_XKBCLI=1 so a missing tool fails instead of skipping.
import { expect, test } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const need = process.env.REQUIRE_XKBCLI === '1'
const has = spawnSync('sh', ['-c', 'command -v xkbcli']).status === 0
const tarball = fileURLToPath(new URL('../../../../apps/web/public/download/alfavit-xkb.tar.gz', import.meta.url))

test.skipIf(!has && !need)('AltGr gives the five characters, untouched keys stay US, and uz(latin) still compiles', () => {
  const cfg = mkdtempSync(join(tmpdir(), 'xkb-'))
  execFileSync('tar', ['-xzf', tarball, '-C', cfg])
  const compile = (variant: string) =>
    execFileSync('xkbcli', ['compile-keymap', '--include', `${cfg}/xkb`, '--include-defaults', '--layout', 'uz', '--variant', variant], { encoding: 'utf8' })

  const km = compile('alfavit')
  expect(km).toMatch(/key <AD09>\s*{[^}]*odiaeresis,\s*Odiaeresis/)
  expect(km).toMatch(/key <AC05>\s*{[^}]*gbreve,\s*Gbreve/)
  expect(km).toMatch(/key <AC02>\s*{[^}]*scedilla,\s*Scedilla/)
  expect(km).toMatch(/key <AB03>\s*{[^}]*ccedilla,\s*Ccedilla/)
  expect(km).toMatch(/key <AC11>\s*{[^}]*U02BC/)
  expect(km).toMatch(/key <AD01>\s*{[^}]*\bq,\s*Q\b/)
  expect(compile('latin')).toMatch(/key <AC11>\s*{[^}]*U02BB/)

  const list = execFileSync('xkbcli', ['list', '--skip-default-paths', `${cfg}/xkb`, '/usr/share/X11/xkb'], { encoding: 'utf8' })
  expect(list).toContain('alfavit')
})
