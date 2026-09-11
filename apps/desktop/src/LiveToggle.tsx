import { useEffect, useState } from 'react'
import { getLiveEnabled, setLiveEnabled } from './liveControl'
import { isWindows } from './platform'

/** In-panel master switch for system-wide live transform. Reflects the Rust
 *  observer's state and turns it on/off. Rendered at the top of the panel so
 *  it is reachable without the (easily-hidden) menu-bar icon. */
export function LiveToggle() {
  const [on, setOn] = useState(false)
  const [needsPermission, setNeedsPermission] = useState(false)

  useEffect(() => {
    void getLiveEnabled().then(setOn)
  }, [])

  async function toggle() {
    const next = !on
    const result = await setLiveEnabled(next)
    setOn(result)
    // Tried to enable but it didn't turn on => macOS: Accessibility not granted; Windows: hook failed to install.
    setNeedsPermission(next && !result)
  }

  return (
    <div className="live">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Live transform"
        className={on ? 'live-switch live-switch--on' : 'live-switch'}
        onClick={toggle}
      >
        <span className="live-knob" />
      </button>
      <span className="live-label">Live transform · {on ? 'On' : 'Off'}</span>
      {needsPermission && (
        <span className="live-hint" data-testid="live-hint">
          {isWindows()
            ? "Couldn't start live transform. Try again or restart Alfavit."
            : 'Enable Alfavit in System Settings → Accessibility, then toggle again.'}
        </span>
      )}
    </div>
  )
}
