import { Component } from "react";
import { Compass, RefreshCw } from "lucide-react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("Storefront ErrorBoundary caught:", error, info);
    }
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-paper">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-card border border-ink/10">
            <div className="w-14 h-14 rounded-full bg-trail-50 text-trail-600 flex items-center justify-center mx-auto mb-5">
              <Compass className="w-7 h-7" />
            </div>
            <h1 className="font-display text-3xl tracking-wide text-ink mb-2">OFF THE TRAIL</h1>
            <p className="text-sm text-stone leading-relaxed mb-6">
              Something unexpected happened while loading this screen. Refresh to get right back on your path.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink text-white px-6 py-3 text-sm font-semibold hover:bg-ink-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
