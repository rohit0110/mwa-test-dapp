'use client';

import { useEffect, useState, useRef } from 'react';

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  args: any[];
}

// Global buffer to capture logs before the component mounts
const earlyLogBuffer: LogEntry[] = [];
let logIdCounter = 0;
let consoleIntercepted = false;

// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

// Function to intercept console (called immediately, before React renders)
if (typeof window !== 'undefined' && !consoleIntercepted) {
  consoleIntercepted = true;

  const addLog = (level: LogEntry['level'], args: any[]) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const message = args
      .map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');

    earlyLogBuffer.push({
      id: logIdCounter++,
      timestamp,
      level,
      message,
      args
    });

    // Keep only last 200 logs
    if (earlyLogBuffer.length > 200) {
      earlyLogBuffer.shift();
    }
  };

  console.log = (...args: any[]) => {
    originalConsole.log.apply(console, args);
    addLog('log', args);
  };

  console.info = (...args: any[]) => {
    originalConsole.info.apply(console, args);
    addLog('info', args);
  };

  console.warn = (...args: any[]) => {
    originalConsole.warn.apply(console, args);
    addLog('warn', args);
  };

  console.error = (...args: any[]) => {
    originalConsole.error.apply(console, args);
    addLog('error', args);
  };

  console.debug = (...args: any[]) => {
    originalConsole.debug.apply(console, args);
    addLog('debug', args);
  };
}

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>(earlyLogBuffer);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Component mounted, start syncing with the buffer
    const syncInterval = setInterval(() => {
      setLogs([...earlyLogBuffer]);
    }, 100);

    // Cleanup interval on unmount
    return () => {
      clearInterval(syncInterval);
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const clearLogs = () => {
    earlyLogBuffer.length = 0;
    logIdCounter = 0;
    setLogs([]);
  };

  const copyLogsToClipboard = async () => {
    if (logs.length === 0) {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
      return;
    }

    try {
      // Format logs as plain text
      const formattedLogs = logs.map(log => {
        const levelStr = log.level.toUpperCase().padEnd(5);
        return `[${log.timestamp}] ${levelStr} ${log.message}`;
      }).join('\n');

      // Add header with metadata
      const header = `=== MWA Test dApp Console Logs ===
Timestamp: ${new Date().toISOString()}
Total Logs: ${logs.length}
Environment: ${typeof window !== 'undefined' ? window.location.href : 'Unknown'}
User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'}

================================

`;

      const fullText = header + formattedLogs;

      // Copy to clipboard
      await navigator.clipboard.writeText(fullText);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to copy logs:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const getLevelStyle = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800 border-l-4 border-red-500';
      case 'warn':
        return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-l-4 border-blue-500';
      case 'debug':
        return 'bg-purple-100 text-purple-800 border-l-4 border-purple-500';
      default:
        return 'bg-gray-100 text-gray-800 border-l-4 border-gray-500';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-2xl border-t-2 border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="font-semibold hover:text-gray-300 transition"
          >
            {isExpanded ? '▼' : '▲'} Console Logs ({logs.length})
          </button>
          {isExpanded && (
            <>
              <button
                onClick={copyLogsToClipboard}
                disabled={logs.length === 0}
                className={`px-2 py-1 rounded text-xs transition ${
                  copyStatus === 'copied'
                    ? 'bg-green-600 hover:bg-green-700'
                    : copyStatus === 'error'
                    ? 'bg-red-600 hover:bg-red-700'
                    : logs.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {copyStatus === 'copied' ? '✓ Copied!' : copyStatus === 'error' ? '✗ Failed' : '📋 Copy'}
              </button>
              <button
                onClick={clearLogs}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition"
              >
                Clear
              </button>
              <label className="flex items-center space-x-1 text-xs">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded"
                />
                <span>Auto-scroll</span>
              </label>
            </>
          )}
        </div>
        <div className="text-xs text-gray-400">
          {logs.length > 0 && logs[logs.length - 1].timestamp}
        </div>
      </div>

      {/* Logs Container */}
      {isExpanded && (
        <div className="overflow-y-auto overflow-x-auto max-h-96 bg-gray-50">
          {logs.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No logs yet. Console output will appear here.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`px-3 py-2 text-xs font-mono ${getLevelStyle(log.level)}`}
                >
                  <div className="flex items-start space-x-2">
                    <span className="text-gray-600 flex-shrink-0 font-bold">
                      [{log.timestamp}]
                    </span>
                    <span className="uppercase font-bold flex-shrink-0 min-w-[50px]">
                      {log.level}:
                    </span>
                    <span className="break-all whitespace-pre-wrap flex-1">
                      {log.message}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
