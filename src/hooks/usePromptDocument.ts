import { useEffect, useReducer, useRef, useState } from 'react';
import * as tree from '../core/tree';
import {
  parseDocument,
  starterDocument,
  type PromptDocument,
  type Block,
  type BlockPatch,
} from '../core/document';

const STORAGE_KEY = 'prompt-block-editor.document.v1';
const HISTORY_LIMIT = 100;

type History = {
  past: PromptDocument[];
  present: PromptDocument;
  future: PromptDocument[];
};
type Action = { type: 'edit'; document: PromptDocument } | { type: 'undo' | 'redo' };

function historyReducer(state: History, action: Action): History {
  switch (action.type) {
    case 'edit':
      return {
        past: [...state.past.slice(-(HISTORY_LIMIT - 1)), state.present],
        present: action.document,
        future: [],
      };
    case 'undo':
      if (!state.past.length) return state;
      return {
        past: state.past.slice(0, -1),
        present: state.past.at(-1)!,
        future: [state.present, ...state.future],
      };
    case 'redo':
      if (!state.future.length) return state;
      return {
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
      };
  }
}

function loadInitialHistory(): History {
  let present: PromptDocument = structuredClone(starterDocument);
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) present = parseDocument(JSON.parse(saved));
  } catch {
    // Leave invalid storage untouched until the user makes an edit.
  }
  return { past: [], present, future: [] };
}

type ManagedDocument = {
  initialDocument: PromptDocument;
  onChange: (document: PromptDocument) => void;
};
export function usePromptDocument(managed?: ManagedDocument) {
  const [history, dispatch] = useReducer(historyReducer, undefined, () =>
    managed
      ? { past: [], present: structuredClone(managed.initialDocument), future: [] }
      : loadInitialHistory(),
  );
  const managedRef = useRef(managed);
  managedRef.current = managed;
  const lastPublished = useRef(history.present);
  const [status, setStatus] = useState('Stored on this device');
  const document = history.present;

  useEffect(() => {
    if (managedRef.current) {
      if (lastPublished.current !== document) {
        lastPublished.current = document;
        managedRef.current.onChange(document);
      }
      return;
    }
    // Opening the app should not overwrite an unreadable saved document.
    if (!history.past.length && !history.future.length) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
      setStatus('Saved on this device');
    } catch {
      setStatus('Autosave failed. Export a backup to keep your changes.');
    }
  }, [document, history.past.length, history.future.length]);

  function edit(nextDocument: PromptDocument) {
    dispatch({ type: 'edit', document: nextDocument });
  }

  function updateTitle(title: string) {
    edit({ ...document, title });
  }

  function updateBlock(blockId: string, patch: BlockPatch) {
    if (!tree.findBlock(document.blocks, blockId)) return;
    edit({ ...document, blocks: tree.updateBlock(document.blocks, blockId, patch) });
  }

  function addBlock(parentId: string | null, type: Block['type']) {
    const parent = parentId === null ? null : tree.findBlock(document.blocks, parentId);
    if (parentId !== null && parent?.type !== 'group') return;
    const base = { id: crypto.randomUUID(), enabled: true };
    const block: Block =
      type === 'group'
        ? {
            ...base,
            type,
            name: 'Untitled group',
            collapsed: false,
            includeHeading: true,
            blocks: [],
          }
        : { ...base, type, text: '', weight: 1 };
    const siblings = parent?.type === 'group' ? parent.blocks : document.blocks;
    edit({
      ...document,
      blocks: tree.insertBlock(document.blocks, parentId, siblings.length, block),
    });
  }

  function removeBlock(blockId: string) {
    if (!tree.findBlock(document.blocks, blockId)) return;
    edit({ ...document, blocks: tree.removeBlock(document.blocks, blockId) });
  }

  function moveBlock(blockId: string, parentId: string | null, index: number) {
    const blocks = tree.moveBlock(document.blocks, blockId, parentId, index);
    if (blocks !== document.blocks) edit({ ...document, blocks });
  }

  function duplicateGroup(blockId: string) {
    const blocks = tree.duplicateGroup(document.blocks, blockId);
    if (blocks !== document.blocks) edit({ ...document, blocks });
  }

  function ungroupBlock(blockId: string) {
    if (tree.findBlock(document.blocks, blockId)?.type !== 'group') return;
    edit({ ...document, blocks: tree.ungroupBlock(document.blocks, blockId) });
  }
  async function importDocument(file: File) {
    try {
      edit(parseDocument(JSON.parse(await file.text())));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Import failed.');
    }
  }

  function exportDocument() {
    const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const fileName = document.title.replace(/[^a-z0-9-_]/gi, '-').slice(0, 80) || 'prompt';
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${fileName}.prompt.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return {
    document,
    status,
    setStatus,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo: () => dispatch({ type: 'undo' }),
    redo: () => dispatch({ type: 'redo' }),
    updateTitle,
    addBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    ungroupBlock,
    duplicateGroup,
    importDocument,
    exportDocument,
  };
}
