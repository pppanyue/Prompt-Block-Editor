import { type Group, type TextBlock } from '../core/document';
import { BlockEditor } from './BlockEditor';
import { SortableItem, SortableList } from './SortableItem';

type GroupEditorProps = {
  group: Group;
  onUpdate: (patch: Partial<Group>) => void;
  onRemove: () => void;
  onAddBlock: (type: TextBlock['type']) => void;
  onUpdateBlock: (blockId: string, patch: Partial<TextBlock>) => void;
  onRemoveBlock: (blockId: string) => void;
  onReorderBlocks: (activeId: string, overId: string) => void;
};

export function GroupEditor({
  group,
  onUpdate,
  onRemove,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onReorderBlocks,
}: GroupEditorProps) {
  return (
    <SortableItem id={group.id} label={group.name}>
      <article className={`group ${group.enabled ? '' : 'disabled-group'}`}>
        <div className="group-header">
          <input
            type="checkbox"
            aria-label={`Enable ${group.name}`}
            checked={group.enabled}
            onChange={(event) => onUpdate({ enabled: event.target.checked })}
          />
          <input
            className="group-name"
            aria-label="Group name"
            value={group.name}
            onChange={(event) => onUpdate({ name: event.target.value })}
          />
          <button
            aria-label={`${group.collapsed ? 'Expand' : 'Collapse'} ${group.name}`}
            onClick={() => onUpdate({ collapsed: !group.collapsed })}
          >
            {group.collapsed ? '+' : '−'}
          </button>
          <button className="quiet" aria-label={`Delete ${group.name}`} onClick={onRemove}>
            ×
          </button>
        </div>
        {!group.collapsed && (
          <div className="group-body">
            <label className="heading-option">
              <input
                type="checkbox"
                checked={group.includeHeading}
                onChange={(event) => onUpdate({ includeHeading: event.target.checked })}
              />
              Include name in annotated output
            </label>
            <SortableList ids={group.blocks.map((block) => block.id)} onReorder={onReorderBlocks}>
              {group.blocks.map((block) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  onUpdate={(patch) => onUpdateBlock(block.id, patch)}
                  onRemove={() => onRemoveBlock(block.id)}
                />
              ))}
            </SortableList>
            {!group.blocks.length && <p className="empty">Add a tag or description to begin.</p>}
            <div className="add-buttons">
              <button onClick={() => onAddBlock('tag')}>+ Tag</button>
              <button onClick={() => onAddBlock('description')}>+ Description</button>
            </div>
          </div>
        )}
      </article>
    </SortableItem>
  );
}
