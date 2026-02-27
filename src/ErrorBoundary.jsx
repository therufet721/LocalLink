import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-zinc-900 text-zinc-100 p-4 font-sans flex flex-col items-center justify-center">
          <h1 className="text-xl font-semibold text-zinc-200 mb-2">
            Something went wrong
          </h1>
          <p className="text-amber-400 text-sm mb-4 text-center max-w-md">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-sm px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
          >
            Try again
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
