import { type KeyboardEventHandler, type ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type PromptTabData } from '../core/workflow';

export function SortablePromptTab({
  prompt,
  selected,
  onSelect,
  onKeyDown,
  children,
}: {
  prompt: PromptTabData;
  selected: boolean;
  onSelect: () => void;
  onKeyDown: KeyboardEventHandler<HTMLButtonElement>;
  children: ReactNode;
}) {
  const { setNodeRef, setActivatorNodeRef, listeners, transform, transition, isDragging } =
    useSortable({ id: prompt.id });
  return (
    <div
      ref={setNodeRef}
      className={`prompt-tab-label ${isDragging ? 'tab-dragging' : ''}`}
      role="presentation"
      style={{
        transform: CSS.Translate.toString(transform ? { ...transform, y: 0 } : null),
        transition,
      }}
    >
      <button
        ref={setActivatorNodeRef}
        {...listeners}
        role="tab"
        id={`tab-${prompt.id}`}
        aria-controls={`panel-${prompt.id}`}
        aria-selected={selected}
        tabIndex={selected ? 0 : -1}
        title="Drag to reorder · Alt + Left/Right to move"
        onClick={onSelect}
        onKeyDown={onKeyDown}
      >
        {prompt.document.title || 'Untitled prompt'}
      </button>
      {children}
    </div>
  );
}
