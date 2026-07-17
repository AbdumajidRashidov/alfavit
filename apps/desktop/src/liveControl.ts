import { invoke } from '@tauri-apps/api/core'

/** True only when running inside the Tauri app (not a plain browser or tests). */
export function inTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/** Whether live transform is currently on (false outside Tauri). */
export async function getLiveEnabled(): Promise<boolean> {
  if (!inTauri()) return false
  try {
    return await invoke<boolean>('live_transform_enabled')
  } catch {
    return false
  }
}

/** Turn live transform on/off; resolves to the resulting state. Turning it on
 *  without Accessibility permission returns false (the Rust side opens the
 *  Accessibility pane so the user can grant it). */
export async function setLiveEnabled(on: boolean): Promise<boolean> {
  if (!inTauri()) return false
  try {
    return await invoke<boolean>('set_live_transform', { on })
  } catch {
    return false
  }
}
