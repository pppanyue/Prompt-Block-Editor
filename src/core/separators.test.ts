import { expect, it } from 'vitest';
import { assemblePrompt, type Block, type PromptDocument } from './document';
import { defaultSeparatorRules, parseSeparatorRules } from './separators';
import { defaultWeights } from './weights';
const tag = (id: string, text: string): Block => ({
  id,
  text,
  type: 'tag',
  enabled: true,
  weight: 1.2,
});
const group = (id: string, blocks: Block[], includeHeading = true): Block => ({
  id,
  name: id,
  type: 'group',
  enabled: true,
  collapsed: true,
  includeHeading,
  blocks,
});
const doc = (blocks: Block[]): PromptDocument => ({ version: 2, title: '', blocks });
it('optionally adds a newline before groups without duplicating existing newlines', () => {
  const document = doc([tag('a', 'first'), group('G', [tag('b', 'second')])]);
  expect(assemblePrompt(document, false, '#', true, undefined, ', ')).toBe('first, second');
  expect(
    assemblePrompt(document, false, '#', true, undefined, ', ', {
      ...defaultSeparatorRules,
      newLineBeforeOuterGroup: true,
      newLineBeforeInnerGroup: true,
    }),
  ).toBe('first,\nsecond');
  expect(
    assemblePrompt(document, false, '#', true, undefined, '\n', {
      ...defaultSeparatorRules,
      newLineBeforeOuterGroup: true,
      newLineBeforeInnerGroup: true,
    }),
  ).toBe('first\nsecond');
});
it('puts nested annotated headings on their own line even through unnamed containers', () => {
  const document = doc([
    tag('a', 'first'),
    group('outer', [group('inner', [tag('b', 'second')])], false),
  ]);
  expect(assemblePrompt(document, true, '//', false, undefined, ' ')).toBe(
    'first\n// inner\nsecond',
  );
});
it('uses original ending punctuation across group boundaries and weight syntaxes', () => {
  const document = doc([group('G', [tag('a', 'Done."')]), tag('b', 'Next')]);
  const rules = { ...defaultSeparatorRules, punctuationOverrides: true, endingSigns: '.' };
  for (const syntax of ['parentheses', 'section'] as const) {
    const weights = { ...defaultWeights, enabled: true, syntax };
    const expected = syntax === 'section' ? 'Done."::1.2 Next::1.2' : '(Done.":1.2) (Next:1.2)';
    expect(assemblePrompt(document, false, '#', true, weights, ', ', rules)).toBe(expected);
  }
  expect(assemblePrompt(document, false, '#', true, undefined, ' /\n', rules)).toBe(
    'Done." \nNext',
  );
  expect(
    assemblePrompt(document, false, '#', true, undefined, ', ', { ...rules, endingSigns: '!' }),
  ).toBe('Done.", Next');
});
it('ignores empty and disabled groups and validates stored separator rules', () => {
  const document = doc([
    tag('a', 'One.'),
    group('empty', []),
    { ...group('off', [tag('b', 'No')]), enabled: false },
    tag('c', 'Two'),
  ]);
  expect(
    assemblePrompt(document, true, '#', true, undefined, ', ', {
      ...defaultSeparatorRules,
      punctuationOverrides: true,
      newLineBeforeOuterGroup: true,
      newLineBeforeInnerGroup: true,
    }),
  ).toBe('One. Two');
  expect(
    parseSeparatorRules({
      newLineBeforeOuterGroup: true,
      newLineBeforeInnerGroup: true,
      punctuationOverrides: 'bad',
      endingSigns: '',
    }),
  ).toEqual({
    newLineBeforeOuterGroup: true,
    newLineBeforeInnerGroup: true,
    punctuationOverrides: false,
    endingSigns: '',
  });
});

it('controls top-level and nested group boundaries independently', () => {
  const document = doc([
    tag('a', 'A'),
    group('outer', [tag('b', 'B'), group('inner', [tag('c', 'C')])]),
  ]);
  expect(
    assemblePrompt(document, false, '#', true, undefined, ' ', {
      ...defaultSeparatorRules,
      newLineBeforeOuterGroup: true,
    }),
  ).toBe('A\nB C');
  expect(
    assemblePrompt(document, false, '#', true, undefined, ' ', {
      ...defaultSeparatorRules,
      newLineBeforeInnerGroup: true,
    }),
  ).toBe('A B\nC');
  expect(
    assemblePrompt(document, false, '#', true, undefined, ' ', {
      ...defaultSeparatorRules,
      newLineBeforeOuterGroup: true,
      newLineBeforeInnerGroup: true,
    }),
  ).toBe('A\nB\nC');
});
it('migrates the old shared setting and respects explicit new settings', () => {
  expect(parseSeparatorRules({ newLineBeforeGroup: true })).toMatchObject({
    newLineBeforeOuterGroup: true,
    newLineBeforeInnerGroup: true,
  });
  expect(
    parseSeparatorRules({ newLineBeforeGroup: true, newLineBeforeInnerGroup: false }),
  ).toMatchObject({ newLineBeforeOuterGroup: true, newLineBeforeInnerGroup: false });
});

it('separates both sides of top-level and nested groups without trailing line breaks', () => {
  const document = doc([
    tag('a', 'A'),
    group('outer', [tag('b', 'B'), group('inner', [tag('c', 'C')]), tag('d', 'D')]),
    tag('e', 'E'),
  ]);
  expect(
    assemblePrompt(document, false, '#', true, undefined, ' ', {
      ...defaultSeparatorRules,
      newLineBeforeOuterGroup: true,
    }),
  ).toBe('A\nB C D\nE');
  expect(
    assemblePrompt(document, false, '#', true, undefined, ' ', {
      ...defaultSeparatorRules,
      newLineBeforeInnerGroup: true,
    }),
  ).toBe('A B\nC\nD E');
  expect(
    assemblePrompt(document, false, '#', true, undefined, '\n', {
      ...defaultSeparatorRules,
      newLineBeforeOuterGroup: true,
      newLineBeforeInnerGroup: true,
    }),
  ).toBe('A\nB\nC\nD\nE');
});
it('propagates nested end boundaries through parent groups and always isolates annotated groups', () => {
  const document = doc([
    group('outer', [group('inner', [tag('c', 'C')], false)], false),
    tag('d', 'D'),
  ]);
  expect(
    assemblePrompt(document, false, '#', true, undefined, ' ', {
      ...defaultSeparatorRules,
      newLineBeforeInnerGroup: true,
    }),
  ).toBe('C\nD');
  expect(assemblePrompt(document, true, '#', true, undefined, ' ')).toBe('C\nD');
});
