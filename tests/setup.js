import { vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Mock Chrome API globally
global.chrome = {
  runtime: {
    onMessage: { addListener: vi.fn() },
    sendMessage: vi.fn()
  },
  action: { onClicked: { addListener: vi.fn() } },
  tabs: { sendMessage: vi.fn() }
};

// Helper to load and evaluate widget.js IIFE in the current jsdom environment
export function loadWidget() {
  const widgetPath = path.resolve(__dirname, '../widget.js');
  const src = fs.readFileSync(widgetPath, 'utf8');

  // Remove the CommonJS export guard and only execute the IIFE
  const iifePart = src.replace(
    /if \(typeof module !== 'undefined' && module\.exports\)[\s\S]*$/,
    ''
  );

  // Execute in current context
  // eslint-disable-next-line no-new-func
  new Function(iifePart)();
}
