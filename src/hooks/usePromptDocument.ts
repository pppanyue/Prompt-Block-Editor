import { useEffect, useReducer, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import {
  parseDocument,
  starterDocument,
  type Group,
  type PromptDocument,
  type TextBlock,
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
  let present = structuredClone(starterDocument);
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) present = parseDocument(JSON.parse(saved));
  } catch {
    // Leave invalid storage untouched until the user makes an edit.
  }
  return { past: [], present, future: [] };
}

export function usePromptDocument() {
  const [history, dispatch] = useReducer(historyReducer, undefined, loadInitialHistory);
  const [status, setStatus] = useState('Stored on this device');
  const document = history.present;

  useEffect(() => {
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

  function updateGroup(groupId: string, patch: Partial<Group>) {
    edit({
      ...document,
      groups: document.groups.map((group) =>
        group.id === groupId ? { ...group, ...patch } : group,
      ),
    });
  }

  function addGroup() {
    const group: Group = {
      id: crypto.randomUUID(),
      name: 'Untitled group',
      enabled: true,
      collapsed: false,
      includeHeading: true,
      blocks: [],
    };
    edit({ ...document, groups: [...document.groups, group] });
  }

  function removeGroup(groupId: string) {
    edit({ ...document, groups: document.groups.filter((group) => group.id !== groupId) });
  }

  function reorderGroups(activeId: string, overId: string) {
    const from = document.groups.findIndex((group) => group.id === activeId);
    const to = document.groups.findIndex((group) => group.id === overId);
    if (from < 0 || to < 0 || from === to) return;
    edit({ ...document, groups: arrayMove(document.groups, from, to) });
  }

  function addBlock(groupId: string, type: TextBlock['type']) {
    const group = document.groups.find((group) => group.id === groupId);
    if (!group) return;
    const block: TextBlock = { id: crypto.randomUUID(), type, text: '', enabled: true };
    updateGroup(groupId, { blocks: [...group.blocks, block] });
  }

  function updateBlock(groupId: string, blockId: string, patch: Partial<TextBlock>) {
    const group = document.groups.find((group) => group.id === groupId);
    if (!group) return;
    updateGroup(groupId, {
      blocks: group.blocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block)),
    });
  }

  function removeBlock(groupId: string, blockId: string) {
    const group = document.groups.find((group) => group.id === groupId);
    if (!group) return;
    updateGroup(groupId, { blocks: group.blocks.filter((block) => block.id !== blockId) });
  }

  function reorderBlocks(groupId: string, activeId: string, overId: string) {
    const group = document.groups.find((group) => group.id === groupId);
    if (!group) return;
    const from = group.blocks.findIndex((block) => block.id === activeId);
    const to = group.blocks.findIndex((block) => block.id === overId);
    if (from < 0 || to < 0 || from === to) return;
    updateGroup(groupId, { blocks: arrayMove(group.blocks, from, to) });
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
    updateGroup,
    addGroup,
    removeGroup,
    reorderGroups,
    addBlock,
    updateBlock,
    removeBlock,
    reorderBlocks,
    importDocument,
    exportDocument,
  };
}
