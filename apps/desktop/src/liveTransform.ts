import { transliterate } from '@alfavit/engine'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'

/** Reformed new-Latin for one word, via the shared engine. */
export function transformWord(word: string): string {
  return transliterate(word).text
}

interface TransformRequest {
  id: number
  word: string
}

/** Wire the Rust observer's per-word requests to the engine. Call once at
 *  startup, only when running under Tauri (see main.tsx guard). */
export async function registerLiveTransform(): Promise<UnlistenFn> {
  return listen<TransformRequest>('alfavit://transform-request', (event) => {
    const output = transformWord(event.payload.word)
    void invoke('submit_transform', { id: event.payload.id, output })
  })
}
