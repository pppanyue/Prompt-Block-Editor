import { type ReactNode } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

type SortableItemProps = { id: string; label: string; children: ReactNode };

export function SortableItem({ id, label, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`sortable ${isDragging ? 'dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform) }}
    >
      <button className="handle" aria-label={`Reorder ${label}`} {...attributes} {...listeners}>
        ⠿
      </button>
      {children}
    </div>
  );
}

type DropSlotProps = {
  parentId: string | null;
  index: number;
  label: string;
  dragging: boolean;
  disabled: boolean;
};

export function DropSlot({ parentId, index, label, dragging, disabled }: DropSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: JSON.stringify(['slot', parentId, index]),
    data: { parentId, index },
    disabled,
  });
  return (
    <div
      ref={setNodeRef}
      className={`drop-slot ${dragging && !disabled ? 'available' : ''} ${isOver ? 'over' : ''}`}
    >
      {dragging && !disabled && <span>{label}</span>}
    </div>
  );
}
