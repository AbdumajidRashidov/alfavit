// Hides the Tauri panel window. Isolated here so the React tree can be unit
// tested without the Tauri runtime present — tests mock this module. The
// dynamic import keeps @tauri-apps/api out of the module graph until called.
export async function hidePanel(): Promise<void> {
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  await getCurrentWindow().hide()
}
