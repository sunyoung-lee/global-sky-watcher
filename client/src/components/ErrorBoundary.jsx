import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem',
          gap: '12px', padding: '20px', textAlign: 'center',
        }}>
          <div>3D Globe failed to load</div>
          <pre style={{
            color: 'rgba(255,100,100,0.7)', fontSize: '0.7rem',
            maxWidth: '80vw', overflow: 'auto', whiteSpace: 'pre-wrap',
          }}>
            {this.state.error?.toString()}
            {'\n'}
            {this.state.error?.stack?.split('\n').slice(0, 5).join('\n')}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
