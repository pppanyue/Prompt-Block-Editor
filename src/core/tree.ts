import { cloneBlock, copyName } from './clone';
import { type Block, type BlockPatch } from './document';

export function findBlock(blocks: Block[], id: string): Block | undefined {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.type === 'group') {
      const found = findBlock(block.blocks, id);
      if (found) return found;
    }
  }
}

export function updateBlock(blocks: Block[], id: string, patch: BlockPatch): Block[] {
  return blocks.map((block) => {
    if (block.id === id) return { ...block, ...patch };
    return block.type === 'group'
      ? { ...block, blocks: updateBlock(block.blocks, id, patch) }
      : block;
  });
}

export function removeBlock(blocks: Block[], id: string): Block[] {
  return blocks
    .filter((block) => block.id !== id)
    .map((block) =>
      block.type === 'group' ? { ...block, blocks: removeBlock(block.blocks, id) } : block,
    );
}

export function insertBlock(
  blocks: Block[],
  parentId: string | null,
  index: number,
  block: Block,
): Block[] {
  if (parentId === null) {
    const next = [...blocks];
    next.splice(index, 0, block);
    return next;
  }
  return blocks.map((item) =>
    item.type === 'group'
      ? {
          ...item,
          blocks: insertBlock(item.blocks, item.id === parentId ? null : parentId, index, block),
        }
      : item,
  );
}

function locate(
  blocks: Block[],
  id: string,
  parentId: string | null = null,
): { parentId: string | null; index: number } | undefined {
  for (const [index, block] of blocks.entries()) {
    if (block.id === id) return { parentId, index };
    if (block.type === 'group') {
      const found = locate(block.blocks, id, block.id);
      if (found) return found;
    }
  }
}

export function canMoveBlock(blocks: Block[], id: string, parentId: string | null): boolean {
  const block = findBlock(blocks, id);
  if (!block) return false;
  if (parentId === null) return true;
  if (parentId === id || findBlock(blocks, parentId)?.type !== 'group') return false;
  return block.type !== 'group' || !findBlock(block.blocks, parentId);
}

// index refers to the insertion slot BEFORE removal, including for sibling moves.
export function moveBlock(
  blocks: Block[],
  id: string,
  parentId: string | null,
  index: number,
): Block[] {
  if (!canMoveBlock(blocks, id, parentId)) return blocks;
  const source = locate(blocks, id)!;
  const destination =
    parentId === null
      ? blocks
      : (findBlock(blocks, parentId) as Extract<Block, { type: 'group' }>).blocks;
  if (!Number.isInteger(index) || index < 0 || index > destination.length) return blocks;
  const adjusted = source.parentId === parentId && source.index < index ? index - 1 : index;
  if (source.parentId === parentId && source.index === adjusted) return blocks;
  const block = findBlock(blocks, id)!;
  return insertBlock(removeBlock(blocks, id), parentId, adjusted, block);
}

export function ungroupBlock(blocks: Block[], id: string): Block[] {
  return blocks.flatMap((block) => {
    if (block.type !== 'group') return [block];
    if (block.id === id) {
      // Ungrouping a disabled container must not unexpectedly enable its contents.
      return block.enabled
        ? block.blocks
        : block.blocks.map((child) => ({ ...child, enabled: false }));
    }
    return [{ ...block, blocks: ungroupBlock(block.blocks, id) }];
  });
}

export function summarizeBlocks(blocks: Block[]): string {
  let groups = 0;
  let texts = 0;
  function visit(items: Block[]) {
    for (const item of items) {
      if (item.type === 'group') {
        groups++;
        visit(item.blocks);
      } else texts++;
    }
  }
  visit(blocks);
  return `${groups} ${groups === 1 ? 'group' : 'groups'} · ${texts} text ${texts === 1 ? 'block' : 'blocks'}`;
}

export function duplicateGroup(blocks: Block[], id: string): Block[] {
  const original = findBlock(blocks, id);
  const position = locate(blocks, id);
  if (original?.type !== 'group' || !position) return blocks;
  const parent = position.parentId === null ? null : findBlock(blocks, position.parentId);
  const siblings = parent?.type === 'group' ? parent.blocks : blocks;
  const copy = cloneBlock(original);
  if (copy.type !== 'group') return blocks;
  copy.name = copyName(
    original.name,
    siblings.filter((item) => item.type === 'group').map((item) => item.name),
  );
  return insertBlock(blocks, position.parentId, position.index + 1, copy);
}
