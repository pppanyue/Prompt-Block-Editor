import { parseDocument, starterDocument, type PromptDocument } from './document';
import { parseWeightSettings, type WeightSettings } from './weights';
import { parseSeparatorRules, type SeparatorRules } from './separators';

export type OutputSettings = {
  weights: Omit<WeightSettings, 'increment'>;
  separator: string;
  separatorRules: SeparatorRules;
  commentPrefix: string;
  repeatPrefix: boolean;
};
export type PromptTabData = {
  id: string;
  document: PromptDocument;
  output: OutputSettings;
  role: 'general' | 'positive' | 'negative';
  archived: boolean;
  annotated: boolean;
};
export type Workflow = {
  kind: 'prompt-block-editor-workflow';
  version: 1;
  id: string;
  name: string;
  activePromptId: string;
  prompts: PromptTabData[];
};
export const WORKFLOW_KEY = 'prompt-block-editor.workflow.v1';
export function parseOutputSettings(value: unknown): OutputSettings {
  const input = value as Partial<OutputSettings> | null;
  const { increment: _increment, ...weights } = parseWeightSettings(input?.weights);
  return {
    weights,
    separator: typeof input?.separator === 'string' ? input.separator : ', ',
    separatorRules: parseSeparatorRules(input?.separatorRules),
    commentPrefix: typeof input?.commentPrefix === 'string' ? input.commentPrefix : '#',
    repeatPrefix: typeof input?.repeatPrefix === 'boolean' ? input.repeatPrefix : true,
  };
}
export function newPrompt(output: OutputSettings, name = 'Untitled prompt'): PromptTabData {
  return {
    id: crypto.randomUUID(),
    document: { version: 2, title: name, blocks: [] },
    output: structuredClone(output),
    role: 'general',
    archived: false,
    annotated: false,
  };
}
export function migrateWorkflow(document: PromptDocument, settings: unknown): Workflow {
  const prompt = { ...newPrompt(parseOutputSettings(settings)), document };
  return {
    kind: 'prompt-block-editor-workflow',
    version: 1,
    id: crypto.randomUUID(),
    name: 'My workflow',
    activePromptId: prompt.id,
    prompts: [prompt],
  };
}
export function parseWorkflow(value: unknown): Workflow {
  const input = value as Workflow | null;
  if (
    !input ||
    input.kind !== 'prompt-block-editor-workflow' ||
    input.version !== 1 ||
    typeof input.id !== 'string' ||
    typeof input.name !== 'string' ||
    !Array.isArray(input.prompts) ||
    !input.prompts.length
  )
    throw new Error('Invalid saved workflow.');
  const ids = new Set<string>();
  const prompts = input.prompts.map((prompt) => {
    if (!prompt || typeof prompt.id !== 'string' || !prompt.id || ids.has(prompt.id))
      throw new Error('Invalid or duplicate prompt ID.');
    ids.add(prompt.id);
    return {
      id: prompt.id,
      document: parseDocument(prompt.document),
      output: parseOutputSettings(prompt.output),
      role: (['positive', 'negative'].includes(prompt.role)
        ? prompt.role
        : 'general') as PromptTabData['role'],
      archived: prompt.archived === true,
      annotated: prompt.annotated === true,
    };
  });
  const open = prompts.filter((prompt) => !prompt.archived);
  if (!open.length) throw new Error('A workflow needs an open prompt.');
  return {
    kind: input.kind,
    version: 1,
    id: input.id,
    name: input.name,
    prompts,
    activePromptId: open.some((prompt) => prompt.id === input.activePromptId)
      ? input.activePromptId
      : open[0].id,
  };
}
export function loadWorkflow(): { workflow: Workflow; error: string | null } {
  let settings: unknown;
  try {
    settings = JSON.parse(localStorage.getItem('prompt-block-editor.settings.v1') || 'null');
  } catch {
    /* Use defaults. */
  }
  try {
    const saved = localStorage.getItem(WORKFLOW_KEY);
    if (saved) return { workflow: parseWorkflow(JSON.parse(saved)), error: null };
    const legacy = localStorage.getItem('prompt-block-editor.document.v1');
    const document = legacy ? parseDocument(JSON.parse(legacy)) : structuredClone(starterDocument);
    return { workflow: migrateWorkflow(document, settings), error: null };
  } catch {
    return {
      workflow: migrateWorkflow(structuredClone(starterDocument), settings),
      error:
        'Saved data could not be read. It is preserved. Export it or explicitly start a new workflow before saving changes.',
    };
  }
}
