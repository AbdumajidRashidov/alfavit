import { Component, type ReactNode } from 'react'

interface Props { fallback: ReactNode; children: ReactNode }
interface State { hasError: boolean }

/** Catches render/mount errors in a subtree (e.g. a WebGL canvas that can't
 * initialize) and shows a fallback instead of crashing the whole page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError(): State { return { hasError: true } }
  componentDidCatch(): void { /* decorative subtree — swallow and degrade gracefully */ }
  render(): ReactNode { return this.state.hasError ? this.props.fallback : this.props.children }
}
