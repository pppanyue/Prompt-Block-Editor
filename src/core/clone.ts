import { type Block } from './document';

/** Clone content independently, including every descendant's identity. */
export function cloneBlock(block: Block): Block {
  const copy = structuredClone(block);
  copy.id = crypto.randomUUID();
  if (copy.type === 'group') copy.blocks = copy.blocks.map(cloneBlock);
  return copy;
}

export function copyName(name: string, existing: string[]): string {
  const base = name.trim() || 'Untitled';
  const names = new Set(existing);
  let candidate = `${base} (copy)`;
  for (let number = 2; names.has(candidate); number++) candidate = `${base} (copy ${number})`;
  return candidate;
}
