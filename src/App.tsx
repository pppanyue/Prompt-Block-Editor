import { DocumentToolbar } from './components/DocumentToolbar';
import { GroupEditor } from './components/GroupEditor';
import { PromptPreview } from './components/PromptPreview';
import { SortableList } from './components/SortableItem';
import { usePromptDocument } from './hooks/usePromptDocument';

export default function App() {
  const editor = usePromptDocument();
  const { document } = editor;

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
          <section aria-label="Prompt blocks" className="editor">
            <div className="section-heading">
              <h2>Building blocks</h2>
              <span>{document.groups.length} groups</span>
            </div>
            <SortableList
              ids={document.groups.map((group) => group.id)}
              onReorder={editor.reorderGroups}
            >
              {document.groups.map((group) => (
                <GroupEditor
                  key={group.id}
                  group={group}
                  onUpdate={(patch) => editor.updateGroup(group.id, patch)}
                  onRemove={() => editor.removeGroup(group.id)}
                  onAddBlock={(type) => editor.addBlock(group.id, type)}
                  onUpdateBlock={(blockId, patch) => editor.updateBlock(group.id, blockId, patch)}
                  onRemoveBlock={(blockId) => editor.removeBlock(group.id, blockId)}
                  onReorderBlocks={(activeId, overId) =>
                    editor.reorderBlocks(group.id, activeId, overId)
                  }
                />
              ))}
            </SortableList>
            <button className="add-group" onClick={editor.addGroup}>
              + Add group
            </button>
            <p className="hint">
              Drag the handles to reorder. Disabled blocks stay here for later.
            </p>
          </section>
          <PromptPreview document={document} onStatus={editor.setStatus} />
        </div>
        <footer role="status">{editor.status}</footer>
      </main>
    </div>
  );
}
