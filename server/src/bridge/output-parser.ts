import type { ClaudeCodeStatus } from 'rccb-shared/dist/types.js';

// Strip ANSI escape codes for pattern matching
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1b\][^\x07]*\x07/g, '');
}

// Patterns to detect Claude Code state
const PATTERNS = {
  waitingInput: [
    /^>\s*$/m,                     // Bare prompt ">"
    /\?\s*$/m,                     // Question mark at end of line
    /Enter your (message|response)/i,
    /What would you like/i,
    /How can I help/i,
  ],
  thinking: [
    /⠋|⠙|⠹|⠸|⠼|⠴|⠦|⠧|⠇|⠏/,   // Spinner characters
    /Thinking\.\.\./i,
    /Processing\.\.\./i,
  ],
  executing: [
    /Running:/i,
    /Executing:/i,
    /\$ .+/,                       // Shell command execution
    /Writing to /i,
    /Reading /i,
  ],
  approvalNeeded: [
    /Do you want to (proceed|continue)/i,
    /\(y\/n\)/i,
    /\[Y\/n\]/i,
    /Allow this/i,
    /Approve\?/i,
    /Press Enter to approve/i,
  ],
};

export function parseOutputStatus(rawOutput: string): ClaudeCodeStatus | null {
  const text = stripAnsi(rawOutput);

  // Check patterns in priority order (most specific first)
  for (const pattern of PATTERNS.approvalNeeded) {
    if (pattern.test(text)) return 'approval_needed';
  }

  for (const pattern of PATTERNS.executing) {
    if (pattern.test(text)) return 'executing';
  }

  for (const pattern of PATTERNS.thinking) {
    if (pattern.test(text)) return 'thinking';
  }

  for (const pattern of PATTERNS.waitingInput) {
    if (pattern.test(text)) return 'waiting_input';
  }

  return null;
}

// Extract cost information from Claude Code output
const COST_PATTERN = /\$(\d+\.?\d*)/;

export function parseCost(rawOutput: string): number | null {
  const text = stripAnsi(rawOutput);
  const match = COST_PATTERN.exec(text);
  return match ? parseFloat(match[1]) : null;
}
