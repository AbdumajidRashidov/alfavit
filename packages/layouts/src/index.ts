// Browser-safe on purpose: apps/web bundles this module. Nothing here, or in
// anything it imports, may touch node: APIs — those live in cli.ts only.
export { KEY_TABLE, LAYOUT_NAME, LINUX_LAYOUT, LINUX_VARIANT, LINUX_DESCRIPTION, DOWNLOADS } from './keys.js'
export type { KeyBase, KeyAssignment } from './keys.js'
export { macDisplaced } from './macos/model.js'
