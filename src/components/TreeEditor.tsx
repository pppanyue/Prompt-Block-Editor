import { Fragment, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  type DragEndEvent,
} from '@dnd-kit/core';
import { type Block, type BlockPatch } from '../core/document';
import { canMoveBlock, findBlock, summarizeBlocks } from '../core/tree';
import { BlockEditor } from './BlockEditor';
import { GroupEditor } from './GroupEditor';
import { DropSlot } from './SortableItem';

export type TreeEditorProps = {
  blocks: Block[];
  onAdd: (parentId: string | null, type: Block['type']) => void;
  onUpdate: (id: string, patch: BlockPatch) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, parentId: string | null, index: number) => void;
  onUngroup: (id: string) => void;
};

type Destination = { id: string | null; label: string };
function destinations(blocks: Block[], path = ''): Destination[] {
  return blocks.flatMap((block) => {
    if (block.type !== 'group') return [];
    const label = path ? `${path} / ${block.name}` : block.name;
    return [{ id: block.id, label }, ...destinations(block.blocks, label)];
  });
}

export function TreeEditor(props: TreeEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const targets: Destination[] = [
    { id: null, label: 'Document (top level)' },
    ...destinations(props.blocks),
  ];

  function finishDrag({ active, over }: DragEndEvent) {
    setActiveId(null);
    const target = over?.data.current;
    if (
      target &&
      (target.parentId === null || typeof target.parentId === 'string') &&
      typeof target.index === 'number'
    ) {
      props.onMove(String(active.id), target.parentId, target.index);
    }
  }

  return (
    <section aria-label="Prompt blocks" className={`editor ${activeId ? 'tree-dragging' : ''}`}>
      <div className="section-heading">
        <h2>Building blocks</h2>
        <span>{summarizeBlocks(props.blocks)}</span>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={(args) => {
          const hits = pointerWithin(args);
          return hits.length ? hits : rectIntersection(args);
        }}
        onDragStart={({ active }) => setActiveId(String(active.id))}
        onDragEnd={finishDrag}
        onDragCancel={() => setActiveId(null)}
      >
        <BlockList
          {...props}
          items={props.blocks}
          parentId={null}
          parentName="document"
          inheritedDisabled={false}
          activeId={activeId}
          targets={targets}
        />
      </DndContext>
      <p className="hint">
        Drag a handle to an insertion line or into a group. Use the arrows or Move to menu for
        keyboard placement. Disabled parents exclude all descendants.
      </p>
    </section>
  );
}

type BlockListProps = TreeEditorProps & {
  items: Block[];
  parentId: string | null;
  parentName: string;
  inheritedDisabled: boolean;
  activeId: string | null;
  targets: Destination[];
};

function BlockList(props: BlockListProps) {
  const { items, parentId, parentName, inheritedDisabled, activeId } = props;
  const dropDisabled = activeId === null || !canMoveBlock(props.blocks, activeId, parentId);
  function slot(index: number, label: string) {
    return (
      <DropSlot
        parentId={parentId}
        index={index}
        label={label}
        dragging={activeId !== null}
        disabled={dropDisabled}
      />
    );
  }
  function moveTo(id: string, destination: string) {
    const targetId = JSON.parse(destination) as string | null;
    const target = targetId === null ? undefined : findBlock(props.blocks, targetId);
    const count = target?.type === 'group' ? target.blocks.length : props.blocks.length;
    props.onMove(id, targetId, count);
  }
  return (
    <div className="block-list">
      {items.map((block, index) => {
        const label = block.type === 'group' ? block.name : block.text || block.type;
        const tools = (
          <div className="placement-tools">
            <button
              aria-label={`Move ${label} up`}
              disabled={index === 0}
              onClick={() => props.onMove(block.id, parentId, index - 1)}
            >
              ↑
            </button>
            <button
              aria-label={`Move ${label} down`}
              disabled={index === items.length - 1}
              onClick={() => props.onMove(block.id, parentId, index + 2)}
            >
              ↓
            </button>
            <select
              aria-label={`Move ${label} to group`}
              value=""
              onChange={(event) => moveTo(block.id, event.target.value)}
            >
              <option value="" disabled>
                Move to…
              </option>
              {props.targets
                .filter(
                  (target) =>
                    target.id !== parentId && canMoveBlock(props.blocks, block.id, target.id),
                )
                .map((target) => (
                  <option key={JSON.stringify(target.id)} value={JSON.stringify(target.id)}>
                    {target.label}
                  </option>
                ))}
            </select>
          </div>
        );
        return (
          <Fragment key={block.id}>
            {slot(index, `Insert before ${label}`)}
            {block.type === 'group' ? (
              <GroupEditor
                group={block}
                inheritedDisabled={inheritedDisabled}
                tools={tools}
                onUpdate={(patch) => props.onUpdate(block.id, patch)}
                onRemove={() => props.onRemove(block.id)}
                onUngroup={() => props.onUngroup(block.id)}
              >
                {block.collapsed ? (
                  <DropSlot
                    parentId={block.id}
                    index={block.blocks.length}
                    label={`Move into ${block.name}`}
                    dragging={activeId !== null}
                    disabled={activeId === null || !canMoveBlock(props.blocks, activeId, block.id)}
                  />
                ) : (
                  <BlockList
                    {...props}
                    items={block.blocks}
                    parentId={block.id}
                    parentName={block.name}
                    inheritedDisabled={inheritedDisabled || !block.enabled}
                  />
                )}
              </GroupEditor>
            ) : (
              <BlockEditor
                block={block}
                tools={tools}
                inheritedDisabled={inheritedDisabled}
                onUpdate={(patch) => props.onUpdate(block.id, patch)}
                onRemove={() => props.onRemove(block.id)}
              />
            )}
          </Fragment>
        );
      })}
      {slot(
        items.length,
        parentId === null ? 'Move to end of document' : `Move into ${parentName}`,
      )}
      {!items.length && <p className="empty">Add a block or drop one here.</p>}
      <div className="add-buttons" role="group" aria-label={`Add to ${parentName}`}>
        <button onClick={() => props.onAdd(parentId, 'tag')}>+ Tag</button>
        <button onClick={() => props.onAdd(parentId, 'description')}>+ Description</button>
        <button onClick={() => props.onAdd(parentId, 'group')}>+ Group</button>
      </div>
    </div>
  );
}
