import { useRef, useId, type ChangeEvent } from 'react';

type DocumentToolbarProps = {
  title: string;
  summary?: string;
  canUndo: boolean;
  canRedo: boolean;
  onTitleChange: (title: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onImport: (file: File) => Promise<void>;
  onDuplicate: () => void;
  onExport: () => void;
};

export function DocumentToolbar({
  title,
  summary,
  canUndo,
  canRedo,
  onTitleChange,
  onUndo,
  onRedo,
  onImport,
  onExport,
  onDuplicate,
}: DocumentToolbarProps) {
  const titleId = useId();
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    await onImport(file);
    input.value = '';
  }

  return (
    <>
      <div className="document-bar">
        <div>
          <input
            id={titleId}
            aria-label="Tab name"
            className="title"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
          />
        </div>
        {summary && <span className="document-count">{summary}</span>}
        <div className="actions">
          <button
            className="history-button"
            aria-label="Undo"
            title="Undo"
            disabled={!canUndo}
            onClick={onUndo}
          >
            <span aria-hidden="true">↶</span>
          </button>
          <button
            className="history-button"
            aria-label="Redo"
            title="Redo"
            disabled={!canRedo}
            onClick={onRedo}
          >
            <span aria-hidden="true">↷</span>
          </button>
          <button onClick={onDuplicate}>Duplicate tab</button>
          <button onClick={() => fileInput.current?.click()}>Import JSON</button>
          <button onClick={onExport}>Export JSON</button>
        </div>
      </div>
      <input ref={fileInput} type="file" accept=".json" hidden onChange={handleFileChange} />
    </>
  );
}
