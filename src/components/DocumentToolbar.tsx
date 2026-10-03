import { useRef, useId, type ChangeEvent } from 'react';

type DocumentToolbarProps = {
  title: string;
  canUndo: boolean;
  canRedo: boolean;
  onTitleChange: (title: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onImport: (file: File) => Promise<void>;
  onExport: () => void;
};

export function DocumentToolbar({
  title,
  canUndo,
  canRedo,
  onTitleChange,
  onUndo,
  onRedo,
  onImport,
  onExport,
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
          <label className="eyebrow" htmlFor={titleId}>
            PROMPT NAME / TAB NAME
          </label>
          <input
            id={titleId}
            className="title"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
          />
        </div>
        <div className="actions">
          <button disabled={!canUndo} onClick={onUndo}>
            Undo
          </button>
          <button disabled={!canRedo} onClick={onRedo}>
            Redo
          </button>
          <button onClick={() => fileInput.current?.click()}>Import JSON</button>
          <button onClick={onExport}>Export JSON</button>
        </div>
      </div>
      <input ref={fileInput} type="file" accept=".json" hidden onChange={handleFileChange} />
    </>
  );
}
