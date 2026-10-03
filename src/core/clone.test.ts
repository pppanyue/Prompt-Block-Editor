// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { usePromptDocument } from '../hooks/usePromptDocument';
import { useWorkflow } from '../hooks/useWorkflow';
import { type Block, type PromptDocument } from './document';
import { WORKFLOW_KEY } from './workflow';

const document: PromptDocument = {
  version: 2,
  title: 'Scene',
  blocks: [
    {
      id: 'parent',
      type: 'group',
      name: 'Parent',
      enabled: false,
      collapsed: false,
      includeHeading: true,
      blocks: [
        {
          id: 'nested',
          type: 'group',
          name: 'Style',
          enabled: true,
          collapsed: true,
          includeHeading: false,
          blocks: [{ id: 'tag', type: 'tag', text: 'film', weight: 1.4, enabled: false }],
        },
      ],
    },
  ],
};
const ids = (blocks: Block[]): string[] =>
  blocks.flatMap((block) => [block.id, ...(block.type === 'group' ? ids(block.blocks) : [])]);
afterEach(() => {
  cleanup();
  localStorage.clear();
});
it('duplicates nested groups next to the source, with new IDs and one undo step', () => {
  const { result } = renderHook(() =>
    usePromptDocument({ initialDocument: document, onChange: () => {} }),
  );
  act(() => result.current.duplicateGroup('nested'));
  const parent = result.current.document.blocks[0];
  if (parent.type !== 'group') throw Error('Expected group');
  const copy = parent.blocks[1];
  expect(parent.blocks[0].id).toBe('nested');
  expect(copy).toMatchObject({
    name: 'Style (copy)',
    collapsed: true,
    includeHeading: false,
    blocks: [{ text: 'film', weight: 1.4, enabled: false }],
  });
  expect(ids([copy]).every((id) => !ids(document.blocks).includes(id))).toBe(true);
  act(() => result.current.undo());
  expect(result.current.document).toEqual(document);
  act(() => result.current.redo());
  expect(result.current.document.blocks[0]).toEqual(parent);
});
it('duplicates tabs independently with settings, selection, numbered names and autosave', () => {
  const { result } = renderHook(useWorkflow);
  const sourceId = result.current.workflow.activePromptId;
  act(() =>
    result.current.updatePrompt(sourceId, {
      document,
      annotated: true,
      output: { ...result.current.workflow.prompts[0].output, separator: ' / ' },
    }),
  );
  act(() => result.current.duplicatePrompt(sourceId));
  const [source, copy] = result.current.workflow.prompts;
  expect(copy.document.title).toBe('Scene (copy)');
  expect(copy.id).not.toBe(source.id);
  expect(result.current.workflow.activePromptId).toBe(copy.id);
  expect(copy.output).toEqual(source.output);
  expect(copy.output).not.toBe(source.output);
  expect(copy.annotated).toBe(true);
  expect(ids(copy.document.blocks).every((id) => !ids(source.document.blocks).includes(id))).toBe(
    true,
  );
  const editor = renderHook(() =>
    usePromptDocument({ initialDocument: copy.document, onChange: () => {} }),
  );
  expect(editor.result.current.canUndo).toBe(false);
  act(() =>
    editor.result.current.updateBlock(ids(copy.document.blocks).at(-1)!, { text: 'changed' }),
  );
  expect(source.document).toEqual(document);
  act(() => result.current.duplicatePrompt(sourceId));
  expect(result.current.workflow.prompts.map((p) => p.document.title)).toEqual([
    'Scene',
    'Scene (copy 2)',
    'Scene (copy)',
  ]);
  expect(JSON.parse(localStorage.getItem(WORKFLOW_KEY)!)).toEqual(result.current.workflow);
});
