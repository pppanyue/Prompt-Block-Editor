import { describe, expect, it } from 'vitest';
import { assemblePrompt, parseDocument, starterDocument } from './document';

describe('prompt assembly', () => {
  it('omits disabled content and keeps description line breaks', () => {
    const doc = structuredClone(starterDocument);
    doc.groups[0].blocks[0].text = 'First sentence.\nSecond sentence.';
    doc.groups[1].enabled = false;
    const result = assemblePrompt(doc);
    expect(result).toBe('First sentence.\nSecond sentence.\npeaceful atmosphere, soft reflections');
  });
  it('only includes requested headings in annotated output', () => {
    const doc = structuredClone(starterDocument);
    doc.groups[1].includeHeading = false;
    expect(assemblePrompt(doc, true)).toContain('# Subject & setting');
    expect(assemblePrompt(doc, true)).not.toContain('# Light & style');
    expect(assemblePrompt(doc)).not.toContain('#');
  });
  it('collapsing changes presentation only', () => {
    const doc = structuredClone(starterDocument);
    doc.groups[0].collapsed = true;
    expect(assemblePrompt(doc)).toBe(assemblePrompt(starterDocument));
  });
  it('rejects duplicate IDs and unsupported files', () => {
    const doc = structuredClone(starterDocument);
    doc.groups[1].id = doc.groups[0].id;
    expect(() => parseDocument(doc)).toThrow();
    expect(() => parseDocument({ version: 2 })).toThrow();
    expect(parseDocument(JSON.parse(JSON.stringify(starterDocument)))).toEqual(starterDocument);
  });
});
