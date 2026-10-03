import { useLayoutEffect, useRef } from 'react';
import { type PromptTabData } from '../core/workflow';
import { summarizeBlocks } from '../core/tree';
import { downloadJson } from '../core/download';
import { type EditorSettings } from '../hooks/useEditorSettings';
import { usePromptDocument } from '../hooks/usePromptDocument';
import { DocumentToolbar } from './DocumentToolbar';
import { ResizablePanes } from './ResizablePanes';
import { TreeEditor } from './TreeEditor';
import { PromptPreview } from './PromptPreview';
import { PromptOutputSettings } from './PromptOutputSettings';

type Props = {
  prompt: PromptTabData;
  active: boolean;
  saveStatus: string;
  settings: EditorSettings;
  movementVisibility: Record<string, boolean>;
  onToggleMovement: (id: string) => void;
  onDuplicate: () => void;
  onChange: (patch: Partial<Omit<PromptTabData, 'id'>>) => void;
};
export function PromptTab({
  prompt,
  active,
  saveStatus,
  settings,
  movementVisibility,
  onToggleMovement,
  onChange,
  onDuplicate,
}: Props) {
  const editor = usePromptDocument({
    initialDocument: prompt.document,
    onChange: (document) => onChange({ document }),
  });
  const panel = useRef<HTMLDivElement>(null);
  const scrollPosition = useRef(0);
  useLayoutEffect(() => {
    if (active && panel.current) panel.current.scrollTop = scrollPosition.current;
  }, [active]);
  const weights = { ...prompt.output.weights, increment: settings.weights.increment };
  return (
    <section
      role="tabpanel"
      id={`panel-${prompt.id}`}
      aria-labelledby={`tab-${prompt.id}`}
      hidden={!active}
      className="prompt-tab-panel"
    >
      <DocumentToolbar
        title={editor.document.title}
        summary={summarizeBlocks(editor.document.blocks)}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        onTitleChange={editor.updateTitle}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onImport={editor.importDocument}
        onDuplicate={onDuplicate}
        onExport={() =>
          downloadJson(
            { ...editor.document, outputSettings: prompt.output },
            editor.document.title,
            'prompt',
          )
        }
      />
      <div className="workspace">
        <ResizablePanes
          editor={
            <div
              className="prompt-editor-scroll"
              ref={panel}
              onScroll={(event) => {
                if (active) scrollPosition.current = event.currentTarget.scrollTop;
              }}
            >
              <TreeEditor
                blocks={editor.document.blocks}
                weights={weights}
                twoColumns={settings.twoColumns}
                layoutOrder={settings.layoutOrder}
                groupAddControl={settings.groupAddControl}
                movementVisibility={movementVisibility}
                onToggleMovement={onToggleMovement}
                onAdd={editor.addBlock}
                onUpdate={editor.updateBlock}
                onRemove={editor.removeBlock}
                onMove={editor.moveBlock}
                onUngroup={editor.ungroupBlock}
                onDuplicate={editor.duplicateGroup}
              />
            </div>
          }
          preview={
            <div className="prompt-sidebar">
              <PromptPreview
                document={editor.document}
                weights={weights}
                separator={prompt.output.separator}
                separatorRules={prompt.output.separatorRules}
                commentPrefix={prompt.output.commentPrefix}
                repeatPrefix={prompt.output.repeatPrefix}
                annotated={prompt.annotated}
                onAnnotatedChange={(annotated) => onChange({ annotated })}
                onStatus={editor.setStatus}
              />
            </div>
          }
        />
        <PromptOutputSettings
          value={prompt.output}
          increment={settings.weights.increment}
          onChange={(output) => onChange({ output })}
        />
      </div>
      <footer className="workspace-status" role="status">
        <span>{saveStatus}</span>
        {editor.status !== 'Stored on this device' && <span>{editor.status}</span>}
      </footer>
    </section>
  );
}
