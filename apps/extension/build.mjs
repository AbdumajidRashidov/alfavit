import { build } from 'esbuild'
import { cpSync, mkdirSync, rmSync } from 'node:fs'

const outdir = 'dist'
rmSync(outdir, { recursive: true, force: true })
mkdirSync(outdir, { recursive: true })

await build({
  entryPoints: {
    background: 'src/background.ts',
    popup: 'src/popup.ts',
  },
  bundle: true,
  format: 'esm',
  target: 'es2022',
  outdir,
})

cpSync('manifest.json', `${outdir}/manifest.json`)
cpSync('public/popup.html', `${outdir}/popup.html`)
cpSync('public/icons', `${outdir}/icons`, { recursive: true })

console.log('built extension → dist/')
