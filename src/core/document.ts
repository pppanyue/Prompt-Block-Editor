export type TextBlock = {
  id: string;
  type: 'tag' | 'description';
  text: string;
  enabled: boolean;
};

export type Group = {
  id: string;
  type: 'group';
  name: string;
  enabled: boolean;
  collapsed: boolean;
  includeHeading: boolean;
  blocks: Block[];
};

export type Block = TextBlock | Group;
export type PromptDocument = { version: 2; title: string; blocks: Block[] };
export type BlockPatch = Partial<
  Pick<TextBlock, 'text' | 'enabled'> & Pick<Group, 'name' | 'collapsed' | 'includeHeading'>
>;

function separatorAfter(text: string): string {
  return /[,.;:!?…。！？；：，]["'’”\)\]\}]*$/u.test(text.trimEnd()) ? '' : ',';
}

export function assemblePrompt(
  document: PromptDocument,
  annotated = false,
  commentPrefix = '#',
  repeatPrefix = true,
): string {
  function renderBlocks(blocks: Block[], depth: number): string {
    let output = '';
    let previousType: Block['type'] | undefined;
    for (const block of blocks) {
      if (!block.enabled) continue;
      let content: string;
      if (block.type === 'group') {
        content = renderBlocks(block.blocks, depth + 1);
        if (!content) continue;
        if (annotated && block.includeHeading && block.name.trim()) {
          const prefix = commentPrefix.trim().repeat(repeatPrefix ? depth + 1 : 1);
          content = `${prefix ? prefix + ' ' : ''}${block.name.trim()}\n${content}`;
        }
      } else {
        content = block.text.trim();
        if (!content) continue;
      }
      if (output) {
        const whitespace =
          previousType === 'group' || block.type === 'group'
            ? '\n\n'
            : previousType === 'tag' && block.type === 'tag'
              ? ' '
              : '\n';
        output += separatorAfter(output) + whitespace;
      }
      output += content;
      previousType = block.type;
    }
    return output;
  }
  return renderBlocks(document.blocks, 0);
}

// Validate and copy input instead of trusting JSON's shape. v1 groups migrate in place
// in the tree, preserving IDs, order, text, and all enabled/presentation settings.
export function parseDocument(value: unknown): PromptDocument {
  const isObject = (item: unknown): item is Record<string, unknown> =>
    typeof item === 'object' && item !== null;
  if (
    !isObject(value) ||
    ![1, 2].includes(Number(value.version)) ||
    typeof value.title !== 'string'
  ) {
    throw new Error('This file is not a supported Prompt Block Editor document.');
  }
  const legacy = value.version === 1;
  if (value.version !== 1 && value.version !== 2) throw new Error('Unsupported document version.');
  const roots = legacy ? value.groups : value.blocks;
  if (!Array.isArray(roots)) throw new Error('Invalid document blocks.');
  const ids = new Set<string>();
  function readBlock(item: unknown, depth: number, legacyGroup = false): Block {
    if (depth > 100) throw new Error('Document nesting exceeds the supported import depth (100).');
    if (
      !isObject(item) ||
      typeof item.id !== 'string' ||
      !item.id ||
      ids.has(item.id) ||
      typeof item.enabled !== 'boolean'
    ) {
      throw new Error('Invalid block or duplicate ID in document.');
    }
    ids.add(item.id);
    const base = { id: item.id, enabled: item.enabled };
    if (legacyGroup || item.type === 'group') {
      if (
        typeof item.name !== 'string' ||
        typeof item.collapsed !== 'boolean' ||
        typeof item.includeHeading !== 'boolean' ||
        !Array.isArray(item.blocks)
      ) {
        throw new Error('Invalid group in document.');
      }
      return {
        ...base,
        type: 'group',
        name: item.name,
        collapsed: item.collapsed,
        includeHeading: item.includeHeading,
        blocks: item.blocks.map((child) => readBlock(child, depth + 1)),
      };
    }
    if ((item.type !== 'tag' && item.type !== 'description') || typeof item.text !== 'string') {
      throw new Error('Invalid text block in document.');
    }
    return { ...base, type: item.type, text: item.text };
  }
  return {
    version: 2,
    title: value.title,
    blocks: roots.map((item) => readBlock(item, 0, legacy)),
  };
}

export const starterDocument: PromptDocument = {
  version: 2,
  title: 'A quiet morning',
  blocks: [
    {
      id: 'subject',
      type: 'group',
      name: 'Subject & setting',
      enabled: true,
      collapsed: false,
      includeHeading: true,
      blocks: [
        {
          id: 'scene',
          type: 'description',
          enabled: true,
          text: 'A small cabin beside a still lake, surrounded by pine trees. A thin layer of mist hangs above the water.',
        },
        { id: 'mood', type: 'tag', enabled: true, text: 'peaceful atmosphere' },
        { id: 'detail', type: 'tag', enabled: true, text: 'soft reflections' },
      ],
    },
    {
      id: 'style',
      type: 'group',
      name: 'Light & style',
      enabled: true,
      collapsed: false,
      includeHeading: true,
      blocks: [
        { id: 'light', type: 'tag', enabled: true, text: 'warm morning light' },
        { id: 'film', type: 'tag', enabled: true, text: '35mm film photography' },
        { id: 'rain', type: 'tag', enabled: false, text: 'gentle rain' },
      ],
    },
  ],
};
