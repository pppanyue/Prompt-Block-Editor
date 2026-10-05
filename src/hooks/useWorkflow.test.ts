// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { useWorkflow } from './useWorkflow';
import { WORKFLOW_KEY, parseWorkflow } from '../core/workflow';
import { starterDocument } from '../core/document';
beforeEach(() => localStorage.clear());
afterEach(cleanup);
it('migrates the previous document and output settings without deleting either original', () => {
  localStorage.setItem('prompt-block-editor.document.v1', JSON.stringify(starterDocument));
  localStorage.setItem(
    'prompt-block-editor.settings.v1',
    JSON.stringify({
      separator: ' / ',
      commentPrefix: '//',
      weights: { enabled: true, syntax: 'section', increment: 0.25 },
    }),
  );
  const { result } = renderHook(useWorkflow);
  expect(result.current.workflow.prompts[0].document).toEqual(starterDocument);
  expect(result.current.workflow.prompts[0].output.separator).toBe(' / ');
  expect(result.current.workflow.prompts[0].output.weights).not.toHaveProperty('increment');
  expect(localStorage.getItem('prompt-block-editor.document.v1')).toBe(
    JSON.stringify(starterDocument),
  );
  expect(parseWorkflow(JSON.parse(localStorage.getItem(WORKFLOW_KEY)!))).toEqual(
    result.current.workflow,
  );
});
it('saves multiple prompts, active tab, archive state and formatting across reloads', () => {
  const { result, unmount } = renderHook(useWorkflow);
  const first = result.current.workflow.activePromptId;
  act(() => result.current.addPrompt());
  const second = result.current.workflow.activePromptId;
  act(() =>
    result.current.updatePrompt(second, {
      annotated: true,
      output: { ...result.current.workflow.prompts[1].output, separator: '\n' },
    }),
  );
  act(() => result.current.archivePrompt(first));
  act(() => result.current.renameWorkflow('Portrait workflow'));
  const saved = result.current.workflow;
  unmount();
  const restored = renderHook(useWorkflow);
  expect(restored.result.current.workflow).toEqual(saved);
  act(() => restored.result.current.restorePrompt(first));
  expect(restored.result.current.workflow.activePromptId).toBe(first);
  expect(restored.result.current.workflow.prompts[0].archived).toBe(false);
  expect(restored.result.current.workflow.prompts[0].output.separator).toBe(', ');
});
it('does not overwrite unreadable saved workflows, including after edits', () => {
  localStorage.setItem(WORKFLOW_KEY, 'unreadable');
  const { result } = renderHook(useWorkflow);
  expect(result.current.saveBlocked).toBe(true);
  act(() => result.current.addPrompt());
  expect(localStorage.getItem(WORKFLOW_KEY)).toBe('unreadable');
  act(() => result.current.allowSaving());
  expect(JSON.parse(localStorage.getItem(WORKFLOW_KEY)!).prompts).toHaveLength(2);
});

it('rejects duplicate tab IDs and refuses to archive the final open tab', () => {
  const { result } = renderHook(useWorkflow);
  const first = result.current.workflow.activePromptId;
  act(() => result.current.archivePrompt(first));
  expect(result.current.workflow.prompts[0].archived).toBe(false);
  expect(() =>
    parseWorkflow({
      ...result.current.workflow,
      prompts: [result.current.workflow.prompts[0], result.current.workflow.prompts[0]],
    }),
  ).toThrow('duplicate');
});
it('imports exported workflows, persists the selection and restores them on reopening', async () => {
  const { result, unmount } = renderHook(useWorkflow);
  act(() => result.current.addPrompt());
  const imported = structuredClone(result.current.workflow);
  imported.name = 'Imported workflow';
  imported.prompts[1].document.title = 'Imported second';
  await act(() =>
    result.current.importWorkflow({ text: async () => JSON.stringify(imported) } as File),
  );
  expect(result.current.workflow).toEqual(imported);
  expect(result.current.importRevision).toBe(1);
  unmount();
  const reopened = renderHook(useWorkflow);
  expect(reopened.result.current.workflow).toEqual(imported);
});
it('leaves the current workflow and autosave unchanged on invalid import', async () => {
  const { result } = renderHook(useWorkflow);
  const before = result.current.workflow;
  const saved = localStorage.getItem(WORKFLOW_KEY);
  await act(() => result.current.importWorkflow({ text: async () => '{"version":99}' } as File));
  expect(result.current.workflow).toBe(before);
  expect(localStorage.getItem(WORKFLOW_KEY)).toBe(saved);
  expect(result.current.status).toContain('Workflow import failed');
  expect(result.current.importRevision).toBe(0);
});
it('persists manual tab order while retaining selection and archived positions', () => {
  const { result, unmount } = renderHook(useWorkflow);
  const first = result.current.workflow.activePromptId;
  act(() => result.current.addPrompt());
  const archived = result.current.workflow.activePromptId;
  act(() => result.current.addPrompt());
  const last = result.current.workflow.activePromptId;
  act(() => result.current.archivePrompt(archived));
  act(() => result.current.reorderPrompt(last, first));
  expect(result.current.workflow.prompts.map((p) => p.id)).toEqual([last, archived, first]);
  expect(result.current.workflow.activePromptId).toBe(last);
  act(() => result.current.reorderPrompt(archived, first));
  expect(result.current.workflow.prompts.map((p) => p.id)).toEqual([last, archived, first]);
  const saved = result.current.workflow;
  unmount();
  expect(renderHook(useWorkflow).result.current.workflow).toEqual(saved);
});
