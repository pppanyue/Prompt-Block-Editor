import { type TextBlock } from '../core/document';
import { SortableItem } from './SortableItem';

type BlockEditorProps = {
  block: TextBlock;
  onUpdate: (patch: Partial<TextBlock>) => void;
  onRemove: () => void;
};

export function BlockEditor({ block, onUpdate, onRemove }: BlockEditorProps) {
  return (
    <SortableItem id={block.id} label={block.type}>
      <div className={`block ${block.enabled ? '' : 'muted'}`}>
        <div className="block-meta">
          <label>
            <input
              type="checkbox"
              checked={block.enabled}
              onChange={(event) => onUpdate({ enabled: event.target.checked })}
            />
            {block.type === 'tag' ? 'TAG' : 'DESCRIPTION'}
          </label>
          <button className="quiet" aria-label={`Delete ${block.type}`} onClick={onRemove}>
            ×
          </button>
        </div>
        {block.type === 'tag' ? (
          <input
            aria-label="Tag text"
            placeholder="A word or phrase…"
            value={block.text}
            onChange={(event) => onUpdate({ text: event.target.value })}
          />
        ) : (
          <textarea
            aria-label="Description text"
            placeholder="Describe your scene…"
            value={block.text}
            onChange={(event) => onUpdate({ text: event.target.value })}
          />
        )}
      </div>
    </SortableItem>
  );
}
