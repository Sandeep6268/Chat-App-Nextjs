// components/LiveLogs.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success' | 'warning';
}

export default function LiveLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new logs arrive
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Capture console logs
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleInfo = console.info;

    const addLog = (message: any, type: LogEntry['type'] = 'info') => {
      const logEntry: LogEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        message: typeof message === 'object' ? JSON.stringify(message, null, 2) : String(message),
        type
      };

      setLogs(prev => [...prev.slice(-99), logEntry]); // Keep last 100 logs
    };

    // Override console methods
    console.log = (...args) => {
      originalConsoleLog.apply(console, args);
      addLog(args.join(' '), 'info');
    };

    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      addLog(args.join(' '), 'error');
    };

    console.warn = (...args) => {
      originalConsoleWarn.apply(console, args);
      addLog(args.join(' '), 'warning');
    };

    console.info = (...args) => {
      originalConsoleInfo.apply(console, args);
      addLog(args.join(' '), 'info');
    };

    // Add initial log
    addLog('🔍 Live Logs Started - Monitoring console...', 'info');

    // Restore original console methods on cleanup
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.info = originalConsoleInfo;
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
    console.log('🧹 Logs cleared');
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };

  const getBgColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'bg-red-900/20';
      case 'success': return 'bg-green-900/20';
      case 'warning': return 'bg-yellow-900/20';
      default: return 'bg-gray-800/20';
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors"
      >
        {isVisible ? '📋 Hide Logs' : '📋 Show Logs'}
      </button>

      {/* Logs Panel */}
      {isVisible && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-96 h-96 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b border-gray-700 bg-gray-800 rounded-t-lg">
            <h3 className="text-white font-semibold text-sm">🔍 Live Console Logs</h3>
            <div className="flex space-x-2">
              <button
                onClick={clearLogs}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Logs Content */}
          <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No logs yet...</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`mb-1 p-2 rounded border-l-4 ${
                    log.type === 'error' ? 'border-l-red-500' :
                    log.type === 'success' ? 'border-l-green-500' :
                    log.type === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'
                  } ${getBgColor(log.type)}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-medium ${getLogColor(log.type)}`}>
                      {log.type === 'error' ? '❌' : 
                       log.type === 'success' ? '✅' : 
                       log.type === 'warning' ? '⚠️' : 'ℹ️'} {log.type.toUpperCase()}
                    </span>
                    <span className="text-gray-400 text-xs">{log.timestamp}</span>
                  </div>
                  <div className="text-gray-300 whitespace-pre-wrap break-words">
                    {log.message}
                  </div>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-700 bg-gray-800 rounded-b-lg text-xs text-gray-400">
            {logs.length} logs • Auto-scroll
          </div>
        </div>
      )}
    </div>
  );
}