import { Component, type ReactNode } from 'react'
import HeroStaticFallback from './HeroStaticFallback'

interface Props {
  children: ReactNode
}

interface State {
  failed: boolean
}

export default class HeroErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Falha ao carregar o visual 3D do hero; usando o fallback estático.', error)
  }

  render() {
    return this.state.failed ? <HeroStaticFallback reason="runtime" /> : this.props.children
  }
}
