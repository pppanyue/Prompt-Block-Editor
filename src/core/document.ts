export type TextBlock = {
  id: string;
  type: 'tag' | 'description';
  text: string;
  enabled: boolean;
};

export type Group = {
  id: string;
  name: string;
  enabled: boolean;
  collapsed: boolean;
  includeHeading: boolean;
  blocks: TextBlock[];
};

export type PromptDocument = {
  version: 1;
  title: string;
  groups: Group[];
};

export function assemblePrompt(document: PromptDocument, annotated = false): string {
  return document.groups
    .filter((group) => group.enabled)
    .map((group) => {
      const lines: string[] = [];
      let tags: string[] = [];
      const flush = () => {
        if (tags.length) lines.push(tags.join(', '));
        tags = [];
      };
      for (const block of group.blocks) {
        if (!block.enabled || !block.text.trim()) continue;
        if (block.type === 'tag') tags.push(block.text.trim());
        else {
          flush();
          lines.push(block.text.trim());
        }
      }
      flush();
      if (!lines.length) return '';
      if (annotated && group.includeHeading && group.name.trim())
        lines.unshift(`# ${group.name.trim()}`);
      return lines.join('\n');
    })
    .filter(Boolean)
    .join('\n\n');
}

export function parseDocument(value: unknown): PromptDocument {
  const isObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null;
  if (
    !isObject(value) ||
    value.version !== 1 ||
    typeof value.title !== 'string' ||
    !Array.isArray(value.groups)
  ) {
    throw new Error('This file is not a supported Prompt Block Editor document.');
  }
  const ids = new Set<string>();
  const validId = (v: unknown) => {
    if (typeof v !== 'string' || !v || ids.has(v)) return false;
    ids.add(v);
    return true;
  };
  for (const group of value.groups) {
    if (
      !isObject(group) ||
      !validId(group.id) ||
      typeof group.name !== 'string' ||
      typeof group.enabled !== 'boolean' ||
      typeof group.collapsed !== 'boolean' ||
      typeof group.includeHeading !== 'boolean' ||
      !Array.isArray(group.blocks)
    )
      throw new Error('Invalid group in document.');
    for (const block of group.blocks) {
      if (
        !isObject(block) ||
        !validId(block.id) ||
        !['tag', 'description'].includes(String(block.type)) ||
        typeof block.text !== 'string' ||
        typeof block.enabled !== 'boolean'
      )
        throw new Error('Invalid block in document.');
    }
  }
  return value as PromptDocument;
}

export const starterDocument: PromptDocument = {
  version: 1,
  title: 'A quiet morning',
  groups: [
    {
      id: 'subject',
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
