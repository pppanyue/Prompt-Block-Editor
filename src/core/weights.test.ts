import { expect, it } from 'vitest';
import { assemblePrompt, parseDocument, type PromptDocument } from './document';
import { defaultWeights, formatWeightedText, parseWeightSettings } from './weights';
const document: PromptDocument = {
  version: 2,
  title: '',
  blocks: [
    { id: 'a', type: 'tag', text: 'red dress', enabled: true, weight: 1.2 },
    { id: 'b', type: 'description', text: 'Soft light.', enabled: true, weight: 0.8 },
    { id: 'c', type: 'tag', text: 'ignored', enabled: false, weight: 2 },
  ],
};
it('keeps weights through JSON round trips, ignores them when disabled and supports older documents', () => {
  const restored = parseDocument(JSON.parse(JSON.stringify(document)));
  expect(restored).toEqual(document);
  expect(assemblePrompt(restored, false, '#', true, defaultWeights)).toBe(
    'red dress,\nSoft light.',
  );
  expect(assemblePrompt(restored, false, '#', true, { ...defaultWeights, enabled: true })).toBe(
    '(red dress:1.2),\n(Soft light.:0.8)',
  );
  const legacy = {
    version: 2,
    title: '',
    blocks: [{ id: 'x', type: 'tag', text: 'plain', enabled: true }],
  };
  expect(
    assemblePrompt(parseDocument(legacy), false, '#', true, { ...defaultWeights, enabled: true }),
  ).toBe('(plain:1)');
});
it('renders section weights without comma separators, including nested groups', () => {
  const nested: PromptDocument = {
    ...document,
    blocks: [
      {
        id: 'g',
        type: 'group',
        name: 'Scene',
        enabled: true,
        collapsed: false,
        includeHeading: true,
        blocks: document.blocks,
      },
      { id: 'z', type: 'tag', text: 'blue', enabled: true, weight: 0 },
    ],
  };
  expect(
    assemblePrompt(nested, false, '#', true, {
      ...defaultWeights,
      enabled: true,
      syntax: 'section',
    }),
  ).toBe('red dress::1.2\nSoft light.::0.8\n\nblue::0');
});
it('formats bracket templates and escapes literal delimiters', () => {
  expect(formatWeightedText('a (b)', 1.2, 'parentheses')).toBe('(a \\(b\\):1.2)');
  expect(formatWeightedText('a', 0.5, 'square')).toBe('[a:0.5]');
  expect(formatWeightedText('a', 2, 'curly')).toBe('{a:2}');
});
it('rejects malformed weights and restores safe settings defaults', () => {
  for (const weight of [-1, 101, NaN, Infinity, '1.2', null]) {
    expect(() =>
      parseDocument({ ...document, blocks: [{ ...document.blocks[0], weight }] }),
    ).toThrow();
  }
  expect(parseWeightSettings({ enabled: true, syntax: 'bad', increment: -1 })).toEqual({
    ...defaultWeights,
    enabled: true,
  });
});

it('uses exact separators independently of syntax, including across groups and punctuation', () => {
  const doc: PromptDocument = {
    version: 2,
    title: '',
    blocks: [
      { id: 'a', type: 'tag', text: 'red', enabled: true, weight: 1.2 },
      { id: 'empty', type: 'description', text: '  ', enabled: true },
      {
        id: 'g',
        type: 'group',
        name: 'G',
        enabled: true,
        collapsed: true,
        includeHeading: false,
        blocks: [{ id: 'b', type: 'description', text: 'blue.', enabled: true, weight: 0.8 }],
      },
    ],
  };
  const settings = { ...defaultWeights, enabled: true, syntax: 'section' as const };
  for (const separator of [', ', ' ', '\n', '', ' / ']) {
    expect(assemblePrompt(doc, false, '#', true, settings, separator)).toBe(
      'red::1.2' + separator + 'blue.::0.8',
    );
    expect(assemblePrompt(doc, false, '#', true, { ...settings, enabled: false }, separator)).toBe(
      'red' + separator + 'blue.',
    );
  }
});
it('layers neutral-weight hiding without changing non-neutral values', () => {
  for (const syntax of ['parentheses', 'square', 'curly', 'section'] as const) {
    const full = { neutralWeightMode: 'omit-syntax' as const };
    expect(formatWeightedText('text', 1, syntax, full)).toBe('text');
    expect(formatWeightedText('text', 1.2, syntax, full)).toBe(
      formatWeightedText('text', 1.2, syntax),
    );
  }
  expect(
    formatWeightedText('text', 1, 'parentheses', {
      neutralWeightMode: 'omit-value',
    }),
  ).toBe('(text:)');
  expect(
    formatWeightedText('text', 1, 'parentheses', {
      neutralWeightMode: 'omit-value-and-colons',
    }),
  ).toBe('(text)');
  expect(
    formatWeightedText('text', 1, 'section', {
      neutralWeightMode: 'omit-value',
    }),
  ).toBe('text::');
  expect(
    formatWeightedText('text', 1, 'section', {
      neutralWeightMode: 'omit-value-and-colons',
    }),
  ).toBe('text');
  expect(
    formatWeightedText('text', 1, 'parentheses', {
      neutralWeightMode: 'full',
    }),
  ).toBe('(text:1)');
});

it('migrates every combination of legacy neutral-weight checkboxes', () => {
  for (const hideNeutralWeight of [false, true]) {
    for (const keepNeutralBrackets of [false, true]) {
      for (const hideNeutralColon of [false, true]) {
        const settings = parseWeightSettings({
          hideNeutralWeight,
          keepNeutralBrackets,
          hideNeutralColon,
        });
        expect(settings.neutralWeightMode).toBe(
          !hideNeutralWeight
            ? 'full'
            : !keepNeutralBrackets
              ? 'omit-syntax'
              : hideNeutralColon
                ? 'omit-value-and-colons'
                : 'omit-value',
        );
        expect(settings).not.toHaveProperty('hideNeutralWeight');
      }
    }
  }
  expect(
    parseWeightSettings({ neutralWeightMode: 'omit-value', hideNeutralWeight: false })
      .neutralWeightMode,
  ).toBe('omit-value');
});
