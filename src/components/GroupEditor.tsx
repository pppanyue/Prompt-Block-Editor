import { GroupToolbarIcon } from './GroupToolbarIcon';
import { type ReactNode } from 'react';
import { type Group, type BlockPatch } from '../core/document';
import { summarizeBlocks } from '../core/tree';
import { SortableItem } from './SortableItem';

type GroupEditorProps = {
  group: Group;
  inheritedDisabled: boolean;
  onUpdate: (patch: BlockPatch) => void;
  onRemove: () => void;
  onUngroup: () => void;
  movementControls: ReactNode;
  movementControlsToggle: ReactNode;
  addElementControl: ReactNode;
  children: ReactNode;
};

export function GroupEditor({
  group,
  inheritedDisabled,
  onUpdate,
  onRemove,
  onUngroup,
  movementControls,
  movementControlsToggle,
  addElementControl,
  children,
}: GroupEditorProps) {
  return (
    <SortableItem id={group.id} label={group.name}>
      <article className={`group ${!group.enabled ? 'disabled-group' : ''}`}>
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
          {addElementControl}
          {movementControlsToggle}
          <button
            aria-label={`${group.collapsed ? 'Expand' : 'Collapse'} ${group.name}`}
            title={group.collapsed ? 'Expand group' : 'Collapse group'}
            aria-expanded={!group.collapsed}
            className="group-collapse-control"
            onClick={() => onUpdate({ collapsed: !group.collapsed })}
          >
            <GroupToolbarIcon name={group.collapsed ? 'expand' : 'collapse'} />
          </button>
          <button
            className="group-delete-control"
            title="Delete group"
            aria-label={`Delete ${group.name}`}
            onClick={onRemove}
          >
            <GroupToolbarIcon name="delete" />
          </button>
        </div>
        <div className="group-details">
          <span>{summarizeBlocks(group.blocks)}</span>
          {inheritedDisabled && <span>Excluded by parent</span>}
          <button onClick={onUngroup} aria-label={`Ungroup ${group.name}`}>
            Ungroup
          </button>
        </div>
        {movementControls}
        {!group.collapsed && (
          <label className="heading-option group-heading-option">
            <input
              type="checkbox"
              checked={group.includeHeading}
              onChange={(event) => onUpdate({ includeHeading: event.target.checked })}
            />
            Include name in annotated output
          </label>
        )}
        <div className="group-body">{children}</div>
      </article>
    </SortableItem>
  );
}
