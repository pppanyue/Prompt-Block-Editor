import { useMemo, useState } from 'react';
import { TextImportDialog } from './components/TextImportDialog';
import { type Block } from './core/document';
import { SettingsPanel } from './components/SettingsPanel';
import { PromptTab } from './components/PromptTab';
import { WorkflowTabs } from './components/WorkflowTabs';
import { useEditorSettings } from './hooks/useEditorSettings';
import { useWorkflow } from './hooks/useWorkflow';

// Imported documents may reuse block IDs. UI preferences must stay scoped to their tab.
function scopedBlocks(blocks: Block[], tabId: string): Block[] {
  return blocks.map((block) =>
    block.type === 'group'
      ? { ...block, id: `${tabId}/${block.id}`, blocks: scopedBlocks(block.blocks, tabId) }
      : { ...block, id: `${tabId}/${block.id}` },
  );
}
export default function App() {
  const workspace = useWorkflow();
  const [importOpen, setImportOpen] = useState(false);
  const { workflow } = workspace;
  const blocks = useMemo(
    () => workflow.prompts.flatMap((prompt) => scopedBlocks(prompt.document.blocks, prompt.id)),
    [workflow.prompts],
  );
  const preferences = useEditorSettings(blocks);
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
        <div className="header-controls">
          <div className="workflow-toolbar">
            <label>
              Workflow{' '}
              <input
                aria-label="Workflow name"
                value={workflow.name}
                onChange={(event) => workspace.renameWorkflow(event.target.value)}
              />
            </label>
            <button onClick={workspace.exportWorkflow}>Export workflow</button>
          </div>
          <SettingsPanel
            settings={preferences.settings}
            onChange={preferences.setSettings}
            onSetCurrentMovement={preferences.setCurrentMovement}
          />
        </div>
      </header>
      <main>
        {workspace.saveBlocked && (
          <div className="recovery-notice" role="alert">
            <p>{workspace.status}</p>
            <button onClick={workspace.exportUnreadable}>Export recovery data</button>{' '}
            <button onClick={workspace.allowSaving}>Use current workflow and enable saving</button>
          </div>
        )}

        <WorkflowTabs
          workflow={workflow}
          onSelect={workspace.selectPrompt}
          onAdd={workspace.addPrompt}
          onImportText={() => setImportOpen(true)}
          onArchive={workspace.archivePrompt}
          onRestore={workspace.restorePrompt}
        />
        {workflow.prompts.map((prompt) => (
          <PromptTab
            key={prompt.id}
            prompt={prompt}
            onDuplicate={() => workspace.duplicatePrompt(prompt.id)}
            saveStatus={workspace.status}
            active={prompt.id === workflow.activePromptId && !prompt.archived}
            settings={preferences.settings}
            movementVisibility={Object.fromEntries(
              Object.entries(preferences.movementVisibility)
                .filter(([key]) => key.startsWith(`${prompt.id}/`))
                .map(([key, value]) => [key.slice(prompt.id.length + 1), value]),
            )}
            onToggleMovement={(id) => preferences.toggleMovement(`${prompt.id}/${id}`)}
            onChange={(patch) => workspace.updatePrompt(prompt.id, patch)}
          />
        ))}
      </main>
      {importOpen && (
        <TextImportDialog
          defaults={
            workflow.prompts.find((prompt) => prompt.id === workflow.activePromptId)!.output
          }
          onClose={() => setImportOpen(false)}
          onImport={(document, output) => {
            workspace.importPrompt(document, output);
            setImportOpen(false);
          }}
        />
      )}
    </div>
  );
}
