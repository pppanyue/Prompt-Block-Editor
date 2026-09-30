import { SettingsPanel } from './components/SettingsPanel';
import { useEditorSettings } from './hooks/useEditorSettings';
import { DocumentToolbar } from './components/DocumentToolbar';
import { TreeEditor } from './components/TreeEditor';
import { PromptPreview } from './components/PromptPreview';
import { usePromptDocument } from './hooks/usePromptDocument';

export default function App() {
  const editor = usePromptDocument();
  const { document } = editor;
  const preferences = useEditorSettings(document.blocks);

  return (
    <div className="app">
      <header>
        <div className="brand">
          <span className="logo">▤</span>
          <div>
            <strong>Prompt Block Editor</strong>
            <small>Your prompts, piece by piece.</small>
          </div>
        </div>
        <span className="version">LOCAL WORKSPACE · v0.1</span>
      </header>
      <main>
        <SettingsPanel
          settings={preferences.settings}
          onChange={preferences.setSettings}
          onSetCurrentMovement={preferences.setCurrentMovement}
        />
        <DocumentToolbar
          title={document.title}
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          onTitleChange={editor.updateTitle}
          onUndo={editor.undo}
          onRedo={editor.redo}
          onImport={editor.importDocument}
          onExport={editor.exportDocument}
        />
        <div className="workspace">
          <TreeEditor
            blocks={document.blocks}
            twoColumns={preferences.settings.twoColumns}
            layoutOrder={preferences.settings.layoutOrder}
            movementVisibility={preferences.movementVisibility}
            onToggleMovement={preferences.toggleMovement}
            onAdd={editor.addBlock}
            onUpdate={editor.updateBlock}
            onRemove={editor.removeBlock}
            onMove={editor.moveBlock}
            onUngroup={editor.ungroupBlock}
          />
          <PromptPreview
            document={document}
            onStatus={editor.setStatus}
            commentPrefix={preferences.settings.commentPrefix}
            repeatPrefix={preferences.settings.repeatPrefix}
          />
        </div>
        <footer role="status">{editor.status}</footer>
      </main>
    </div>
  );
}
