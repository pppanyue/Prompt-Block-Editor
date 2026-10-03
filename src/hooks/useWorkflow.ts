import { useEffect, useState } from 'react';
import { loadWorkflow, newPrompt, WORKFLOW_KEY, type PromptTabData } from '../core/workflow';
import { downloadJson } from '../core/download';

export function useWorkflow() {
  const [initial] = useState(loadWorkflow);
  const [workflow, setWorkflow] = useState(initial.workflow);
  const [status, setStatus] = useState(initial.error ?? 'Workflow loaded on this device');
  const [saveBlocked, setSaveBlocked] = useState(Boolean(initial.error));
  useEffect(() => {
    if (saveBlocked) return;
    try {
      localStorage.setItem(WORKFLOW_KEY, JSON.stringify(workflow));
      setStatus('Workflow saved on this device');
    } catch {
      setStatus('Autosave failed. Export the workflow to keep your changes.');
    }
  }, [workflow, saveBlocked]);
  function updatePrompt(id: string, patch: Partial<Omit<PromptTabData, 'id'>>) {
    setWorkflow((previous) => ({
      ...previous,
      prompts: previous.prompts.map((prompt) =>
        prompt.id === id ? { ...prompt, ...patch } : prompt,
      ),
    }));
  }
  function addPrompt() {
    setWorkflow((previous) => {
      const active = previous.prompts.find((prompt) => prompt.id === previous.activePromptId)!;
      const prompt = newPrompt(active.output, `Prompt ${previous.prompts.length + 1}`);
      return { ...previous, activePromptId: prompt.id, prompts: [...previous.prompts, prompt] };
    });
  }
  function archivePrompt(id: string) {
    setWorkflow((previous) => {
      const remaining = previous.prompts.filter((prompt) => !prompt.archived && prompt.id !== id);
      if (!remaining.length) return previous;
      return {
        ...previous,
        activePromptId: previous.activePromptId === id ? remaining[0].id : previous.activePromptId,
        prompts: previous.prompts.map((prompt) =>
          prompt.id === id ? { ...prompt, archived: true } : prompt,
        ),
      };
    });
  }
  function restorePrompt(id: string) {
    setWorkflow((previous) => ({
      ...previous,
      activePromptId: id,
      prompts: previous.prompts.map((prompt) =>
        prompt.id === id ? { ...prompt, archived: false } : prompt,
      ),
    }));
  }
  return {
    workflow,
    status,
    saveBlocked,
    setWorkflow,
    updatePrompt,
    addPrompt,
    archivePrompt,
    restorePrompt,
    selectPrompt: (id: string) => setWorkflow((previous) => ({ ...previous, activePromptId: id })),
    renameWorkflow: (name: string) => setWorkflow((previous) => ({ ...previous, name })),
    exportWorkflow: () => downloadJson(workflow, workflow.name, 'workflow'),
    exportUnreadable: () =>
      downloadJson(
        {
          workflow: localStorage.getItem(WORKFLOW_KEY),
          legacy: localStorage.getItem('prompt-block-editor.document.v1'),
        },
        'recovery',
        'backup',
      ),
    allowSaving: () => setSaveBlocked(false),
  };
}
