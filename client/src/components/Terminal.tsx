import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

interface TerminalProps {
  onOutput: (cb: (sessionId: string, content: string) => void) => void;
  activeSessionId: string | null;
  theme: 'dark' | 'light';
}

const THEMES = {
  dark: {
    background: '#0a0a1a',
    foreground: '#e2e8f0',
    cursor: '#6366f1',
    cursorAccent: '#0a0a1a',
    selectionBackground: '#6366f140',
  },
  light: {
    background: '#ffffff',
    foreground: '#1e293b',
    cursor: '#4f46e5',
    cursorAccent: '#ffffff',
    selectionBackground: '#4f46e540',
  },
};

export default function TerminalComponent({ onOutput, activeSessionId, theme }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const terminal = new XTerm({
      theme: THEMES[theme],
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      cursorBlink: true,
      scrollback: 5000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(new WebLinksAddon());

    terminal.open(containerRef.current);
    fitAddon.fit();

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    const resizeObserver = new ResizeObserver(() => {
      try { fitAddon.fit(); } catch { /* container may be hidden */ }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update theme dynamically
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.theme = THEMES[theme];
    }
  }, [theme]);

  // Subscribe to output
  useEffect(() => {
    onOutput((sessionId, content) => {
      if (activeSessionId && sessionId === activeSessionId) {
        terminalRef.current?.write(content);
      }
    });
  }, [onOutput, activeSessionId]);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0"
      style={{ minHeight: '200px' }}
    />
  );
}
