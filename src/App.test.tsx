// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
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
it('duplicates groups and tabs through their controls without sharing history', () => {
  render(<App />);
  fireEvent.click(activePanel().getByRole('button', { name: 'Duplicate Subject & setting' }));
  expect(activePanel().getByDisplayValue('Subject & setting (copy)')).toBeTruthy();
  fireEvent.click(activePanel().getByRole('button', { name: 'Undo' }));
  expect(activePanel().queryByDisplayValue('Subject & setting (copy)')).toBeNull();
  fireEvent.click(activePanel().getByRole('button', { name: 'Duplicate tab' }));
  expect(
    screen.getByRole('tab', { name: 'A quiet morning (copy)' }).getAttribute('aria-selected'),
  ).toBe('true');
  expect((activePanel().getByRole('button', { name: 'Undo' }) as HTMLButtonElement).disabled).toBe(
    true,
  );
  expect(activePanel().getByLabelText('Description text')).toBeTruthy();
});

it('reimports matching tab IDs with fresh document state and history', async () => {
  render(<App />);
  const saved = JSON.parse(localStorage.getItem(WORKFLOW_KEY)!);
  saved.prompts[0].document.title = 'Reimported title';
  const file = new File([], 'example.workflow.json', { type: 'application/json' });
  Object.defineProperty(file, 'text', { value: async () => JSON.stringify(saved) });
  fireEvent.change(screen.getByLabelText('Import workflow file'), { target: { files: [file] } });
  await waitFor(() =>
    expect((activePanel().getByLabelText('Tab name') as HTMLInputElement).value).toBe(
      'Reimported title',
    ),
  );
  expect((activePanel().getByRole('button', { name: 'Undo' }) as HTMLButtonElement).disabled).toBe(
    true,
  );
});
it('reorders tabs with Alt+arrows without changing the selected prompt or history', () => {
  render(<App />);
  fireEvent.change(activePanel().getByLabelText('Tab name'), { target: { value: 'First' } });
  fireEvent.click(screen.getByRole('button', { name: '+ Prompt' }));
  const second = screen.getByRole('tab', { name: 'Prompt 2' });
  fireEvent.keyDown(second, { key: 'ArrowLeft', altKey: true });
  expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Prompt 2', 'First']);
  expect(second.getAttribute('aria-selected')).toBe('true');
  fireEvent.click(screen.getByRole('tab', { name: 'First' }));
  fireEvent.click(activePanel().getByRole('button', { name: 'Undo' }));
  expect((activePanel().getByLabelText('Tab name') as HTMLInputElement).value).toBe(
    'A quiet morning',
  );
});
