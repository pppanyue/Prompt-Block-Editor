import {
  defaultSeparatorRules,
  parseSeparatorRules,
  type SeparatorRules,
} from '../core/separators';
import { defaultWeights, parseWeightSettings, type WeightSettings } from '../core/weights';
import { useEffect, useState } from 'react';
import { type Block } from '../core/document';

export type EditorSettings = {
  weights: WeightSettings;
  separator: string;
  separatorRules: SeparatorRules;
  commentPrefix: string;
  repeatPrefix: boolean;
  twoColumns: boolean;
  layoutOrder: 'rows' | 'columns';
  groupAddControl: 'toggle' | 'dropdown';
  defaultMovement: Record<Block['type'], boolean>;
};
const defaults: EditorSettings = {
  weights: defaultWeights,
  separator: ', ',
  separatorRules: defaultSeparatorRules,
  commentPrefix: '#',
  repeatPrefix: true,
  twoColumns: false,
  layoutOrder: 'rows',
  groupAddControl: 'toggle',
  defaultMovement: { tag: true, description: true, group: true },
};
const storageKey = 'prompt-block-editor.settings.v1';
function loadSettings(): EditorSettings {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || 'null');
    return {
      weights: parseWeightSettings(value?.weights),
      separatorRules: parseSeparatorRules(value?.separatorRules),
      separator: typeof value?.separator === 'string' ? value.separator : ', ',
      commentPrefix:
        typeof value?.commentPrefix === 'string' ? value.commentPrefix : defaults.commentPrefix,
      repeatPrefix:
        typeof value?.repeatPrefix === 'boolean' ? value.repeatPrefix : defaults.repeatPrefix,
      twoColumns: typeof value?.twoColumns === 'boolean' ? value.twoColumns : defaults.twoColumns,
      layoutOrder: value?.layoutOrder === 'columns' ? 'columns' : 'rows',
      groupAddControl: value?.groupAddControl === 'dropdown' ? 'dropdown' : 'toggle',
      defaultMovement: Object.fromEntries(
        (['tag', 'description', 'group'] as const).map((type) => [
          type,
          typeof value?.defaultMovement?.[type] === 'boolean' ? value.defaultMovement[type] : true,
        ]),
      ) as EditorSettings['defaultMovement'],
    };
  } catch {
    return defaults;
  }
}
export function useEditorSettings(blocks: Block[]) {
  const [settings, setSettings] = useState(loadSettings);
  const [movementVisibility, setMovementVisibility] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch {
      /* Preferences remain usable in memory. */
    }
  }, [settings]);
  useEffect(() => {
    setMovementVisibility((previous) => {
      const next = { ...previous };
      let changed = false;
      function visit(items: Block[]) {
        for (const block of items) {
          if (!Object.hasOwn(next, block.id)) {
            next[block.id] = settings.defaultMovement[block.type];
            changed = true;
          }
          if (block.type === 'group') visit(block.blocks);
        }
      }
      visit(blocks);
      return changed ? next : previous;
    });
  }, [blocks, settings.defaultMovement]);
  function setCurrentMovement(type: Block['type'], visible: boolean) {
    setMovementVisibility((previous) => {
      const next = { ...previous };
      function visit(items: Block[]) {
        for (const block of items) {
          if (block.type === type) next[block.id] = visible;
          if (block.type === 'group') visit(block.blocks);
        }
      }
      visit(blocks);
      return next;
    });
  }
  function toggleMovement(id: string) {
    setMovementVisibility((previous) => ({ ...previous, [id]: !previous[id] }));
  }
  return { settings, setSettings, movementVisibility, toggleMovement, setCurrentMovement };
}
