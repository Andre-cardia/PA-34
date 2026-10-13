import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback: ReactNode
}

interface State {
  failed: boolean
}

export default class ModelErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Falha ao carregar o modelo 3D; usando o fallback estático.', error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
