// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { paneLimits, ResizablePanes } from './ResizablePanes';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('keeps both panes within minimum widths, adapting to constrained space', () => {
  expect(paneLimits(1012)).toEqual({ available: 1000, min: 300, max: 740 });
  expect(paneLimits(512)).toEqual({ available: 500, min: 250, max: 250 });
  expect(paneLimits(0)).toEqual({ available: 0, min: 0, max: 0 });
});
it('supports keyboard sizing, clamps at both limits, and resets the split', () => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1012);
  render(<ResizablePanes editor={<div>Editor</div>} preview={<div>Preview</div>} />);
  const divider = screen.getByRole('separator');
  fireEvent.keyDown(divider, { key: 'Home' });
  fireEvent.keyDown(divider, { key: 'ArrowLeft' });
  expect(divider.getAttribute('aria-valuenow')).toBe('300');
  fireEvent.keyDown(divider, { key: 'ArrowRight', shiftKey: true });
  expect(divider.getAttribute('aria-valuenow')).toBe('340');
  fireEvent.keyDown(divider, { key: 'End' });
  fireEvent.keyDown(divider, { key: 'ArrowRight' });
  expect(divider.getAttribute('aria-valuenow')).toBe('740');
  fireEvent.doubleClick(divider);
  expect(divider.getAttribute('aria-valuenow')).toBe('565');
});
