import { findBlock } from '../core/tree';
// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { assemblePrompt, starterDocument } from '../core/document';
import { usePromptDocument } from './usePromptDocument';

const STORAGE_KEY = 'prompt-block-editor.document.v1';

function jsonFile(contents: string) {
  const file = new File([contents], 'test.prompt.json', { type: 'application/json' });
  // jsdom's File does not implement text(), unlike files in the browser.
  Object.defineProperty(file, 'text', { value: async () => contents });
  return file;
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('document editing and persistence', () => {
  it('persists edits, undo and redo, and restores the document on remount', () => {
    const { result, unmount } = renderHook(usePromptDocument);
    act(() => result.current.updateBlock('scene', { text: 'A new scene.' }));
    expect(assemblePrompt(result.current.document)).toContain('A new scene.');
    act(() => result.current.undo());
    expect(result.current.document).toEqual(starterDocument);
    act(() => result.current.redo());
    const edited = result.current.document;
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(edited);
    unmount();
    const restored = renderHook(usePromptDocument);
    expect(restored.result.current.document).toEqual(edited);
    expect(restored.result.current.canUndo).toBe(false);
  });

  it('reorders content and excludes disabled blocks and groups', () => {
    const { result } = renderHook(usePromptDocument);
    act(() => result.current.moveBlock('style', null, 0));
    act(() => result.current.moveBlock('film', 'style', 0));
    expect(assemblePrompt(result.current.document)).toMatch(
      /^35mm film photography, warm morning light/,
    );
    act(() => result.current.updateBlock('film', { enabled: false }));
    expect(assemblePrompt(result.current.document)).not.toContain('35mm film photography');
    act(() => result.current.updateBlock('style', { enabled: false }));
    expect(assemblePrompt(result.current.document)).not.toContain('warm morning light');
    act(() => result.current.undo());
    expect(assemblePrompt(result.current.document)).toContain('warm morning light');
  });

  it('allows removing and restoring newly added groups and blocks', () => {
    const { result } = renderHook(usePromptDocument);
    act(() => result.current.addBlock(null, 'group'));
    const groupId = result.current.document.blocks.at(-1)!.id;
    act(() => result.current.addBlock(groupId, 'description'));
    const blockId = (
      findBlock(result.current.document.blocks, groupId) as import('../core/document').Group
    ).blocks[0].id;
    act(() => result.current.updateBlock(blockId, { text: 'New description.' }));
    act(() => result.current.removeBlock(blockId));
    expect(assemblePrompt(result.current.document)).not.toContain('New description.');
    act(() => result.current.undo());
    expect(assemblePrompt(result.current.document)).toContain('New description.');
    act(() => result.current.removeBlock(groupId));
    expect(result.current.document.blocks).toHaveLength(2);
  });

  it('round-trips an exported document through import and supports undo', async () => {
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:test');
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { result } = renderHook(usePromptDocument);
    act(() => result.current.updateTitle('Round trip'));
    act(() => result.current.exportDocument());
    expect(click).toHaveBeenCalledOnce();
    expect((click.mock.instances[0] as HTMLAnchorElement).download).toBe('Round-trip.prompt.json');
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    const contents = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsText(blob);
    });
    expect(JSON.parse(contents)).toEqual(result.current.document);
    act(() => result.current.updateTitle('Before import'));
    await act(() => result.current.importDocument(jsonFile(contents)));
    expect(result.current.document.title).toBe('Round trip');
    act(() => result.current.undo());
    expect(result.current.document.title).toBe('Before import');
    const beforeInvalidImport = result.current.document;
    await act(() => result.current.importDocument(jsonFile('{"version":99}')));
    expect(result.current.document).toEqual(beforeInvalidImport);
    expect(result.current.status).toContain('not a supported');
  });

  it('preserves unreadable autosave data until an intentional edit', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid saved data');
    const { result } = renderHook(usePromptDocument);
    expect(result.current.document).toEqual(starterDocument);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('invalid saved data');
    act(() => result.current.updateTitle('Recovered document'));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).title).toBe('Recovered document');
  });
});

it('undoes subtree moves, ungrouping, and deletion as whole operations', () => {
  const { result } = renderHook(usePromptDocument);
  const original = result.current.document;
  act(() => result.current.moveBlock('style', 'subject', 0));
  const nested = result.current.document;
  expect(
    (findBlock(nested.blocks, 'subject') as import('../core/document').Group).blocks[0].id,
  ).toBe('style');
  act(() => result.current.undo());
  expect(result.current.document).toEqual(original);
  act(() => result.current.redo());
  expect(result.current.document).toEqual(nested);
  act(() => result.current.ungroupBlock('subject'));
  expect(findBlock(result.current.document.blocks, 'subject')).toBeUndefined();
  act(() => result.current.undo());
  expect(result.current.document).toEqual(nested);
  act(() => result.current.removeBlock('subject'));
  expect(result.current.document.blocks).toEqual([]);
  act(() => result.current.undo());
  expect(result.current.document).toEqual(nested);
});

it('loads legacy autosave and writes v2 only after an edit', () => {
  const legacy = { version: 1, title: 'Legacy saved', groups: starterDocument.blocks };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
  const { result } = renderHook(usePromptDocument);
  expect(result.current.document.version).toBe(2);
  expect(result.current.document.title).toBe('Legacy saved');
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).version).toBe(1);
  act(() => result.current.updateTitle('Edited legacy'));
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).version).toBe(2);
});
