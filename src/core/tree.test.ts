import { describe, expect, it } from 'vitest';
import {
  assemblePrompt,
  parseDocument,
  type Block,
  type Group,
  type PromptDocument,
} from './document';
import { findBlock, moveBlock, removeBlock, ungroupBlock, updateBlock } from './tree';

const tag = (id: string, enabled = true): Block => ({ id, type: 'tag', text: id, enabled });
const group = (id: string, blocks: Block[], enabled = true): Group => ({
  id,
  type: 'group',
  name: id,
  blocks,
  enabled,
  collapsed: false,
  includeHeading: true,
});
const doc = (blocks: Block[]): PromptDocument => ({ version: 2, title: 'Nested prompt', blocks });

function fixture() {
  return [
    tag('start'),
    group('Character', [
      group('Appearance', [tag('silver hair'), tag('blue eyes', false)]),
      tag('coat'),
    ]),
    group('Scene', []),
    tag('end'),
  ];
}

describe('nested prompt documents', () => {
  it('assembles enabled descendants in tree order, with nested optional headings', () => {
    const blocks = fixture();
    expect(assemblePrompt(doc(blocks))).toBe('start,\n\nsilver hair,\n\ncoat,\n\nend');
    expect(assemblePrompt(doc(blocks), true)).toBe(
      'start,\n\n# Character\n## Appearance\nsilver hair,\n\ncoat,\n\nend',
    );
    const hiddenHeading = updateBlock(blocks, 'Character', { includeHeading: false });
    expect(assemblePrompt(doc(hiddenHeading), true)).not.toContain('# Character');
    expect(assemblePrompt(doc(hiddenHeading), true)).toContain('## Appearance');
    expect(assemblePrompt(doc(updateBlock(blocks, 'Character', { collapsed: true })))).toBe(
      assemblePrompt(doc(blocks)),
    );
  });

  it('parent exclusion preserves child toggles for re-enabling', () => {
    const blocks = updateBlock(fixture(), 'Character', { enabled: false });
    expect(assemblePrompt(doc(blocks), true)).toBe('start, end');
    expect(findBlock(blocks, 'silver hair')?.enabled).toBe(true);
    expect(findBlock(blocks, 'blue eyes')?.enabled).toBe(false);
    const restored = updateBlock(blocks, 'Character', { enabled: true });
    expect(assemblePrompt(doc(restored))).toContain('silver hair');
    expect(assemblePrompt(doc(restored))).not.toContain('blue eyes');
  });

  it('moves a subtree between groups, into empty groups, and back to the root', () => {
    const blocks = fixture();
    const moved = moveBlock(blocks, 'Appearance', 'Scene', 0);
    const scene = findBlock(moved, 'Scene') as Group;
    expect(scene.blocks[0]).toEqual(findBlock(blocks, 'Appearance'));
    expect((findBlock(moved, 'Character') as Group).blocks.map((block) => block.id)).toEqual([
      'coat',
    ]);
    expect(moveBlock(moved, 'Appearance', null, 0)[0].id).toBe('Appearance');
    expect((findBlock(blocks, 'Character') as Group).blocks).toHaveLength(2);
  });

  it('uses insertion slots consistently for sibling moves and rejects cycles or invalid targets', () => {
    const blocks = fixture();
    expect(moveBlock(blocks, 'start', null, 4).map((block) => block.id)).toEqual([
      'Character',
      'Scene',
      'end',
      'start',
    ]);
    expect(moveBlock(blocks, 'end', null, 0)[0].id).toBe('end');
    expect(moveBlock(blocks, 'start', null, 1)).toBe(blocks);
    expect(moveBlock(blocks, 'Character', 'Character', 0)).toBe(blocks);
    expect(moveBlock(blocks, 'Character', 'Appearance', 0)).toBe(blocks);
    expect(moveBlock(blocks, 'Character', 'coat', 0)).toBe(blocks);
    expect(moveBlock(blocks, 'start', 'missing', 0)).toBe(blocks);
    expect(moveBlock(blocks, 'start', null, 99)).toBe(blocks);
  });

  it('ungroups in place and deletes complete subtrees', () => {
    const blocks = fixture();
    expect(ungroupBlock(blocks, 'Character').map((block) => block.id)).toEqual([
      'start',
      'Appearance',
      'coat',
      'Scene',
      'end',
    ]);
    const ungrouped = ungroupBlock(
      updateBlock(blocks, 'Character', { enabled: false }),
      'Character',
    );
    expect(assemblePrompt(doc(ungrouped))).toBe('start, end');
    const removed = removeBlock(blocks, 'Character');
    expect(findBlock(removed, 'silver hair')).toBeUndefined();
  });

  it('migrates v1 documents without losing presentation settings or text', () => {
    const legacy = {
      version: 1,
      title: 'Legacy',
      groups: [
        {
          id: 'g',
          name: 'Original',
          enabled: false,
          collapsed: true,
          includeHeading: false,
          blocks: [tag('old tag')],
        },
      ],
    };
    const migrated = parseDocument(legacy);
    expect(migrated).toEqual({
      version: 2,
      title: 'Legacy',
      blocks: [{ ...legacy.groups[0], type: 'group' }],
    });
    expect(legacy.version).toBe(1);
    expect(parseDocument(JSON.parse(JSON.stringify(doc(fixture()))))).toEqual(doc(fixture()));
  });

  it('rejects duplicate IDs across branches and invalid nested block types', () => {
    expect(() =>
      parseDocument(doc([group('a', [tag('duplicate')]), group('b', [tag('duplicate')])])),
    ).toThrow();
    const malformed = {
      version: 2,
      title: 'Bad',
      blocks: [{ ...group('a', []), blocks: [{ id: 'b', enabled: true, type: 'unknown' }] }],
    };
    expect(() => parseDocument(malformed)).toThrow();
  });
});
