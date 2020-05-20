import * as React from 'react'

interface ErrorBoundaryProps {
  onError: (error: any, errorInfo: any) => void
}

interface ErrorBoundaryState {
  hasError: boolean
}

class TestErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public readonly state = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  public componentDidCatch(error, errorInfo) {
    this.props.onError(error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return null
    }

    return this.props.children
  }
}

export default TestErrorBoundary
