import { expect, it } from 'vitest';
import { parsePromptText } from './textImport';
const options = { prefix: '#', separator: ',', syntax: 'parentheses' as const };
it('keeps leading tags, recognizes flat comment groups and preserves order', () => {
  const { document } = parsePromptText(
    'root, tag\r\n  # Subject\r\na cabin, rain\r\n## Style\r\nfilm,',
    options,
  );
  expect(document.blocks.map((b) => (b.type === 'group' ? b.name : b.text))).toEqual([
    'root',
    'tag',
    'Subject',
    'Style',
  ]);
  const group = document.blocks[2];
  expect(group.type === 'group' && group.blocks.map((b) => b.type !== 'group' && b.text)).toEqual([
    'a cabin',
    'rain',
  ]);
});
it.each([
  ['parentheses', '(warm light, soft shadows:1.2)'],
  ['square', '[warm light, soft shadows:1.2]'],
  ['curly', '{warm light, soft shadows:1.2}'],
  ['section', 'warm light and shadows::1.2'],
] as const)('extracts %s weights', (syntax, source) => {
  const result = parsePromptText(source + ',film', { ...options, syntax });
  expect(result.document.blocks).toHaveLength(2);
  expect(result.document.blocks[0]).toMatchObject({ type: 'tag', weight: 1.2 });
  expect(result.weighted).toBe(true);
  expect(result.warnings).toEqual([]);
});
it('preserves malformed, nested, and out-of-range weights', () => {
  for (const source of ['(text:101)', '(text:invalid)', '(outer (inner):1.2)', '(unclosed, text']) {
    const result = parsePromptText(source, options);
    expect(result.document.blocks[0]).toMatchObject({ text: source, weight: 1 });
    expect(result.warnings.length).toBeGreaterThan(0);
  }
});
it('supports exact multi-character separators, no headings, and literal plain text', () => {
  const result = parsePromptText('# literal / (film:1.2) /  / rain\nclouds', {
    prefix: '',
    separator: ' / ',
    syntax: 'plain',
  });
  expect(result.document.blocks.map((b) => b.type !== 'group' && b.text)).toEqual([
    '# literal',
    '(film:1.2)',
    'rain\nclouds',
  ]);
  expect(result.weighted).toBe(false);
});
it('supports newlines, empty separators, zero weights, and escaped delimiters', () => {
  expect(
    parsePromptText('one\r\ntwo', { ...options, separator: '\n' }).document.blocks,
  ).toHaveLength(2);
  expect(parsePromptText('one,two', { ...options, separator: '' }).document.blocks).toHaveLength(1);
  expect(parsePromptText('(a \\(b\\):0)', options).document.blocks[0]).toMatchObject({
    text: 'a (b)',
    weight: 0,
  });
});
