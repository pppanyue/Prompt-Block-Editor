import { describe, expect, it } from 'vitest';
import { assemblePrompt, parseDocument, starterDocument, type TextBlock } from './document';

describe('prompt assembly', () => {
  it.each([
    ['tag', 'tag', 'first, second'],
    ['tag', 'description', 'first,\nsecond'],
    ['description', 'tag', 'first,\nsecond'],
    ['description', 'description', 'first,\nsecond'],
  ] as const)('separates %s followed by %s without a trailing comma', (first, second, expected) => {
    const doc = structuredClone(starterDocument);
    doc.groups = [doc.groups[0]];
    doc.groups[0].blocks = [
      { id: 'first', type: first, text: 'first', enabled: true },
      { id: 'second', type: second, text: 'second', enabled: true },
    ];
    expect(assemblePrompt(doc)).toBe(expected);
  });

  it.each([
    'A sentence.',
    'An exclamation!',
    'A question?',
    'A phrase;',
    'A tag,',
    '“A sentence.”',
  ])('preserves existing ending punctuation in %s', (text) => {
    const doc = structuredClone(starterDocument);
    doc.groups = [doc.groups[0]];
    doc.groups[0].blocks = [
      { id: 'first', type: 'description', text, enabled: true },
      { id: 'second', type: 'tag', text: 'next', enabled: true },
    ];
    expect(assemblePrompt(doc)).toBe(`${text}\nnext`);
  });

  it('separates nonempty groups in clean and annotated output', () => {
    const doc = structuredClone(starterDocument);
    doc.groups[0].blocks = [{ id: 'first', type: 'tag', text: 'first', enabled: true }];
    doc.groups[1].blocks = [{ id: 'last', type: 'description', text: 'last', enabled: true }];
    doc.groups.splice(1, 0, { ...doc.groups[0], id: 'empty', name: 'Empty', blocks: [] });
    expect(assemblePrompt(doc)).toBe('first,\n\nlast');
    expect(assemblePrompt(doc, true)).toBe('# Subject & setting\nfirst,\n\n# Light & style\nlast');
  });

  it('adds separators only between active nonblank content and preserves internal newlines', () => {
    const doc = structuredClone(starterDocument);
    doc.groups = [doc.groups[0]];
    const blocks: TextBlock[] = [
      { id: 'first', type: 'tag', text: ' first ', enabled: true },
      { id: 'disabled', type: 'description', text: 'ignored', enabled: false },
      { id: 'blank', type: 'tag', text: '  \n ', enabled: true },
      { id: 'last', type: 'description', text: 'line one\nline two', enabled: true },
    ];
    doc.groups[0].blocks = blocks;
    expect(assemblePrompt(doc)).toBe('first,\nline one\nline two');
    blocks[3].enabled = false;
    expect(assemblePrompt(doc)).toBe('first');
    blocks[0].enabled = false;
    expect(assemblePrompt(doc, true)).toBe('');
  });

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
