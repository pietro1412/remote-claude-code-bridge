import { describe, it, expect } from 'vitest';
import { parseOutputStatus, parseCost } from './output-parser.js';

describe('parseOutputStatus', () => {
  it('should detect approval needed', () => {
    expect(parseOutputStatus('Do you want to proceed? (y/n)')).toBe('approval_needed');
    expect(parseOutputStatus('Allow this action? [Y/n]')).toBe('approval_needed');
    expect(parseOutputStatus('Press Enter to approve')).toBe('approval_needed');
  });

  it('should detect executing state', () => {
    expect(parseOutputStatus('Running: npm install')).toBe('executing');
    expect(parseOutputStatus('$ git status')).toBe('executing');
    expect(parseOutputStatus('Writing to /path/file.ts')).toBe('executing');
  });

  it('should detect thinking state', () => {
    expect(parseOutputStatus('Thinking...')).toBe('thinking');
    expect(parseOutputStatus('Processing...')).toBe('thinking');
    // Spinner characters
    expect(parseOutputStatus('\u280B')).toBe('thinking');
  });

  it('should detect waiting input', () => {
    expect(parseOutputStatus('> ')).toBe('waiting_input');
    expect(parseOutputStatus('What would you like?')).toBe('waiting_input');
    expect(parseOutputStatus('How can I help you?')).toBe('waiting_input');
  });

  it('should return null for unknown output', () => {
    expect(parseOutputStatus('Hello world')).toBeNull();
    expect(parseOutputStatus('')).toBeNull();
  });

  it('should strip ANSI codes before matching', () => {
    expect(parseOutputStatus('\x1b[32mRunning:\x1b[0m test')).toBe('executing');
    expect(parseOutputStatus('\x1b[1mThinking...\x1b[0m')).toBe('thinking');
  });

  it('should prioritize approval over other states', () => {
    expect(parseOutputStatus('Running: Do you want to proceed? (y/n)')).toBe('approval_needed');
  });
});

describe('parseCost', () => {
  it('should extract dollar amounts', () => {
    expect(parseCost('Total cost: $1.42')).toBe(1.42);
    expect(parseCost('$0.05 spent')).toBe(0.05);
  });

  it('should return null when no cost found', () => {
    expect(parseCost('No cost here')).toBeNull();
    expect(parseCost('')).toBeNull();
  });

  it('should handle ANSI codes', () => {
    expect(parseCost('\x1b[33m$2.50\x1b[0m')).toBe(2.5);
  });
});
