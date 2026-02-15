import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Globe render error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem',
        }}>
          3D Globe failed to load — please refresh
        </div>
      )
    }
    return this.props.children
  }
}
