import { type Workflow } from '../core/workflow';

type Props = {
  workflow: Workflow;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
};
export function WorkflowTabs({ workflow, onSelect, onAdd, onArchive, onRestore }: Props) {
  const open = workflow.prompts.filter((prompt) => !prompt.archived);
  const archived = workflow.prompts.filter((prompt) => prompt.archived);
  return (
    <div className="workflow-tabs">
      <div role="tablist" aria-label="Prompt tabs" className="prompt-tabs">
        {open.map((prompt, index) => (
          <div key={prompt.id} className="prompt-tab-label" role="presentation">
            <button
              role="tab"
              id={`tab-${prompt.id}`}
              aria-controls={`panel-${prompt.id}`}
              aria-selected={workflow.activePromptId === prompt.id}
              tabIndex={workflow.activePromptId === prompt.id ? 0 : -1}
              onClick={() => onSelect(prompt.id)}
              onKeyDown={(event) => {
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
              {prompt.document.title || 'Untitled prompt'}
              {prompt.role !== 'general' && <small>{prompt.role}</small>}
            </button>
            <button
              className="tab-close"
              disabled={open.length === 1}
              aria-label={`Archive ${prompt.document.title || 'Untitled prompt'}`}
              title="Archive prompt (can be restored)"
              onClick={() => onArchive(prompt.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button onClick={onAdd}>+ Prompt</button>
      {archived.length > 0 && (
        <select
          aria-label="Restore archived prompt"
          value=""
          onChange={(event) => onRestore(event.target.value)}
        >
          <option value="" disabled>
            Restore archived…
          </option>
          {archived.map((prompt) => (
            <option key={prompt.id} value={prompt.id}>
              {prompt.document.title || 'Untitled prompt'}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
