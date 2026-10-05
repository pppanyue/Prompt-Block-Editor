import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { SortablePromptTab } from './SortablePromptTab';
import { type Workflow } from '../core/workflow';

type Props = {
  workflow: Workflow;
  onReorder: (id: string, overId: string) => void;
  onSelect: (id: string) => void;
  onImportText: () => void;
  onAdd: () => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
};
export function WorkflowTabs({
  workflow,
  onSelect,
  onReorder,
  onAdd,
  onImportText,
  onArchive,
  onRestore,
}: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const open = workflow.prompts.filter((prompt) => !prompt.archived);
  const archived = workflow.prompts.filter((prompt) => prompt.archived);
  return (
    <div className="workflow-tabs">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={({ active, over }) => {
          if (over && active.id !== over.id) onReorder(String(active.id), String(over.id));
        }}
      >
        <SortableContext
          items={open.map((prompt) => prompt.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div role="tablist" aria-label="Prompt tabs" className="prompt-tabs">
            {open.map((prompt, index) => (
              <SortablePromptTab
                key={prompt.id}
                prompt={prompt}
                selected={workflow.activePromptId === prompt.id}
                onSelect={() => onSelect(prompt.id)}
                onKeyDown={(event) => {
                  if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
                    event.preventDefault();
                    const target = index + (event.key === 'ArrowLeft' ? -1 : 1);
                    if (open[target]) onReorder(prompt.id, open[target].id);
                    return;
                  }
                  const next =
                    event.key === 'ArrowRight'
                      ? (index + 1) % open.length
                      : event.key === 'ArrowLeft'
                        ? (index + open.length - 1) % open.length
                        : event.key === 'Home'
                          ? 0
                          : event.key === 'End'
                            ? open.length - 1
                            : -1;
                  if (next < 0) return;
                  event.preventDefault();
                  onSelect(open[next].id);
                  document.getElementById(`tab-${open[next].id}`)?.focus();
                }}
              >
                <button
                  className="tab-close"
                  disabled={open.length === 1}
                  aria-label={`Archive ${prompt.document.title || 'Untitled prompt'}`}
                  title="Archive prompt (can be restored)"
                  onClick={() => onArchive(prompt.id)}
                >
                  ×
                </button>
              </SortablePromptTab>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="tab-actions">
        {archived.length > 0 && (
          <select
            aria-label="Restore archived prompt"
            value=""
            onChange={(event) => onRestore(event.target.value)}
          >
            <option value="" disabled>
              Restore…
            </option>
            {archived.map((prompt) => (
              <option key={prompt.id} value={prompt.id}>
                {prompt.document.title || 'Untitled prompt'}
              </option>
            ))}
          </select>
        )}
        <button onClick={onAdd}>+ Prompt</button>
        <button onClick={onImportText}>Import text</button>
      </div>
    </div>
  );
}
