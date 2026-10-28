import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useSystemStore } from '../system/store'
interface State { failed: boolean }
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }
  static getDerivedStateFromError(): State { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { if (import.meta.env.DEV) console.error('Simulator app error', error, info.componentStack) }
  render() {
    if (this.state.failed) return <div className="app-root app-fallback" role="alert"><strong>Something didn't load.</strong><p>Check browser storage permissions and try again. Your other simulator apps are still available.</p><button onClick={() => { useSystemStore.getState().goHome(); this.setState({ failed: false }) }}>Return to Home</button></div>
    return this.props.children
  }
}
