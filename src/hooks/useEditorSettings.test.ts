// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { useEditorSettings } from './useEditorSettings';
import { assemblePrompt, type Block, type PromptDocument } from '../core/document';

beforeEach(() => localStorage.clear());
const tag: Block = { id: 'tag', type: 'tag', text: 'light', enabled: true };
const group: Block = {
  id: 'group',
  type: 'group',
  name: 'Scene',
  enabled: true,
  collapsed: true,
  includeHeading: true,
  blocks: [tag],
};
it('changes current visibility recursively without changing defaults; defaults affect only new blocks', () => {
  const { result, rerender } = renderHook(({ blocks }) => useEditorSettings(blocks), {
    initialProps: { blocks: [group] as Block[] },
  });
  act(() => result.current.setCurrentMovement('tag', false));
  expect(result.current.movementVisibility.tag).toBe(false);
  expect(result.current.movementVisibility.group).toBe(true);
  expect(result.current.settings.defaultMovement.tag).toBe(true);
  act(() =>
    result.current.setSettings({
      ...result.current.settings,
      defaultMovement: { tag: false, description: false, group: false },
    }),
  );
  expect(result.current.movementVisibility.group).toBe(true);
  rerender({ blocks: [group, { ...tag, id: 'new' }] });
  expect(result.current.movementVisibility.new).toBe(false);
  act(() => result.current.toggleMovement('new'));
  expect(result.current.movementVisibility.new).toBe(true);
});
it('persists preferences and safely loads malformed settings', () => {
  const { result, unmount } = renderHook(() => useEditorSettings([]));
  act(() =>
    result.current.setSettings({
      ...result.current.settings,
      commentPrefix: '//',
      twoColumns: true,
    }),
  );
  unmount();
  const restored = renderHook(() => useEditorSettings([]));
  expect(restored.result.current.settings.commentPrefix).toBe('//');
  expect(restored.result.current.settings.twoColumns).toBe(true);
  restored.unmount();
  localStorage.setItem('prompt-block-editor.settings.v1', '{invalid');
  expect(renderHook(() => useEditorSettings([])).result.current.settings.commentPrefix).toBe('#');
});
it('supports custom, repeated and empty comment prefixes without changing clean output', () => {
  const document: PromptDocument = {
    version: 2,
    title: '',
    blocks: [{ ...group, blocks: [{ ...group, id: 'inner', name: 'Light' }] }],
  };
  expect(assemblePrompt(document, true, '//', false)).toBe('// Scene\n// Light\nlight');
  expect(assemblePrompt(document, true, '#', true)).toBe('# Scene\n## Light\nlight');
  expect(assemblePrompt(document, true, '', false)).toBe('Scene\nLight\nlight');
  expect(assemblePrompt(document, false, '//', true)).toBe('light');
});

it('persists exact separators and neutral-weight options', () => {
  const { result, unmount } = renderHook(() => useEditorSettings([]));
  act(() =>
    result.current.setSettings({
      ...result.current.settings,
      separator: '',
      weights: {
        ...result.current.settings.weights,
        neutralWeightMode: 'omit-value-and-colons',
      },
    }),
  );
  unmount();
  const restored = renderHook(() => useEditorSettings([]));
  expect(restored.result.current.settings.separator).toBe('');
  expect(restored.result.current.settings.weights).toMatchObject({
    neutralWeightMode: 'omit-value-and-colons',
  });
});
