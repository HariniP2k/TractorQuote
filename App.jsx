import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from './components/ui/Toaster'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import ProcessingQueue from './pages/ProcessingQueue'
import History from './pages/History'
import Settings from './pages/Settings'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  useEffect(() => {
    // Console logging setup for iframe communication
    ["log", "warn", "error"].forEach((level) => {
      const original = console[level];

      console[level] = (...args) => {
        // keep normal console output
        original.apply(console, args);

        // sanitize args for postMessage
        const safeArgs = args.map((a) => {
          if (a instanceof Error) {
            return {
              message: a.message,
              stack: a.stack,
              name: a.name,
            };
          }
          try {
            JSON.stringify(a);
            return a;
          } catch {
            return String(a);
          }
        });

        try {
          window.parent?.postMessage(
            { type: "iframe-console", level, args: safeArgs },
            "*"
          );
        } catch (e) {
          // use original, not the wrapped one (avoid recursion)
          original("Failed to postMessage:", e);
        }
      };
    });

    // Global error handler
    window.onerror = (msg, url, line, col, error) => {
      window.parent?.postMessage(
        {
          type: "iframe-console",
          level: "error",
          args: [
            msg,
            url,
            line,
            col,
            error ? { message: error.message, stack: error.stack } : null,
          ],
        },
        "*"
      );
    };

    // Unhandled promise rejections
    window.onunhandledrejection = (event) => {
      const reason =
        event.reason instanceof Error
          ? { message: event.reason.message, stack: event.reason.stack }
          : event.reason;

      window.parent?.postMessage(
        {
          type: "iframe-console",
          level: "error",
          args: ["Unhandled Promise Rejection:", reason],
        },
        "*"
      );
    };
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/processing" element={<ProcessingQueue />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
          <Toaster />
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App