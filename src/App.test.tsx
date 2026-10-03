// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from './App';
import { WORKFLOW_KEY } from './core/workflow';
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const activePanel = () => within(screen.getByRole('tabpanel'));
const preview = () =>
  (activePanel().getByLabelText('Assembled prompt') as HTMLTextAreaElement).value;
it('keeps edits, format, movement visibility, undo/redo and preview mode scoped to named tabs', () => {
  render(<App />);
  fireEvent.change(activePanel().getByLabelText('Tab name'), {
    target: { value: 'Positive' },
  });
  fireEvent.change(activePanel().getByLabelText('Description text'), {
    target: { value: 'Original scene.' },
  });
  fireEvent.click(activePanel().getByRole('button', { name: 'Annotated' }));
  fireEvent.click(
    activePanel().getByRole('button', { name: 'Hide movement controls for peaceful atmosphere' }),
  );
  fireEvent.click(screen.getByRole('button', { name: '+ Prompt' }));
  fireEvent.change(activePanel().getByLabelText('Tab name'), {
    target: { value: 'Negative' },
  });
  fireEvent.click(activePanel().getByRole('button', { name: '+ Tag' }));
  fireEvent.change(activePanel().getByLabelText('Tag text'), { target: { value: 'blur' } });
  fireEvent.click(activePanel().getByText('Prompt output settings'));
  fireEvent.change(activePanel().getByLabelText('Exact separator'), { target: { value: ' / ' } });
  fireEvent.click(screen.getByRole('tab', { name: 'Positive' }));
  expect(preview()).toContain('# Subject & setting');
  expect(preview()).toContain('Original scene.');
  expect(
    activePanel().getByRole('button', { name: 'Show movement controls for peaceful atmosphere' }),
  ).toBeTruthy();
  fireEvent.click(activePanel().getByRole('button', { name: 'Undo' }));
  expect(preview()).not.toContain('Original scene.');
  fireEvent.click(activePanel().getByRole('button', { name: 'Redo' }));
  expect(preview()).toContain('Original scene.');
  fireEvent.click(screen.getByRole('tab', { name: 'Negative' }));
  expect(preview()).toBe('blur');
  expect((activePanel().getByLabelText('Exact separator') as HTMLTextAreaElement).value).toBe(
    ' / ',
  );
  const saved = JSON.parse(localStorage.getItem(WORKFLOW_KEY)!);
  expect(saved.prompts[0].output.separator).toBe(', ');
  expect(saved.prompts[1].output.separator).toBe(' / ');
  fireEvent.click(activePanel().getByRole('button', { name: 'Undo' }));
  expect(preview()).toBe('');
  fireEvent.click(screen.getByRole('button', { name: 'Archive Negative' }));
  expect(screen.getByRole('tab', { name: 'Positive' })).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Restore archived prompt'), {
    target: { value: saved.prompts[1].id },
  });
  fireEvent.click(activePanel().getByRole('button', { name: 'Redo' }));
  expect(preview()).toBe('blur');
});
