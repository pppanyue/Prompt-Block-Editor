import { type Block, type Group, type PromptDocument } from './document';
import { type WeightSyntax, validWeight } from './weights';

export type TextImportOptions = {
  prefix: string;
  separator: string;
  syntax: WeightSyntax | 'plain';
};
const brackets = { parentheses: ['(', ')'], square: ['[', ']'], curly: ['{', '}'] } as const;

export function parsePromptText(source: string, options: TextImportOptions) {
  const warnings: string[] = [];
  let weighted = false;
  const blocks: Block[] = [];
  let destination = blocks;
  let buffer: string[] = [];
  const pair =
    options.syntax in brackets ? brackets[options.syntax as keyof typeof brackets] : null;
  function split(text: string) {
    if (!options.separator) return [text];
    const pieces: string[] = [];
    let start = 0,
      depth = 0;
    for (let index = 0; index < text.length; index++) {
      if (pair && text[index] === '\\') {
        index++;
        continue;
      }
      if (pair && text[index] === pair[0]) depth++;
      else if (pair && text[index] === pair[1]) {
        if (depth) depth--;
        else warnings.push('Unmatched closing bracket; its text was retained.');
      }
      if (!depth && text.startsWith(options.separator, index)) {
        pieces.push(text.slice(start, index));
        index += options.separator.length - 1;
        start = index + 1;
      }
    }
    if (depth) warnings.push('Unmatched opening bracket; the remaining text was kept together.');
    pieces.push(text.slice(start));
    return pieces;
  }
  function flush() {
    for (const raw of split(buffer.join('\n'))) {
      let text = raw.trim();
      if (!text) continue;
      let weight = 1;
      let match: RegExpMatchArray | null = null;
      if (options.syntax === 'section') match = text.match(/^([\s\S]+?)::([^:]+)$/);
      else if (pair && text.startsWith(pair[0]) && text.endsWith(pair[1])) {
        // Only a single outer wrapper is supported; nested emphasis stays literal.
        const body = text.slice(1, -1);
        let nested = false;
        for (let i = 0; i < body.length; i++) {
          if (body[i] === '\\') {
            i++;
            continue;
          }
          if (body[i] === pair[0] || body[i] === pair[1]) {
            nested = true;
          }
        }
        if (!nested) match = body.match(/^([\s\S]+):([^:]+)$/);
      }
      if (
        match &&
        !(options.syntax === 'section' && match[1].includes('::')) &&
        /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(match[2].trim()) &&
        validWeight(Number(match[2]))
      ) {
        text = match[1].trim();
        weight = Number(match[2]);
        if (pair)
          text = text.replace(/\\(.)/gs, (whole, char: string) =>
            char === '\\' || char === pair[0] || char === pair[1] ? char : whole,
          );
        weighted = true;
      } else if (
        options.syntax !== 'plain' &&
        (match ||
          (pair && (text.includes(pair[0]) || text.includes(pair[1]))) ||
          (options.syntax === 'section' && text.includes('::')))
      ) {
        warnings.push('Unrecognized or unsupported weight kept as text: ' + text);
      }
      destination.push({ id: crypto.randomUUID(), type: 'tag', text, weight, enabled: true });
    }
    buffer = [];
  }
  const prefix = options.prefix.trim();
  for (const line of source.replace(/\r\n?/g, '\n').split('\n')) {
    const trimmed = line.trimStart();
    if (prefix && trimmed.startsWith(prefix)) {
      flush();
      let name = trimmed;
      while (name.startsWith(prefix)) name = name.slice(prefix.length);
      const group: Group = {
        id: crypto.randomUUID(),
        type: 'group',
        name: name.trim() || 'Untitled group',
        enabled: true,
        collapsed: false,
        includeHeading: true,
        blocks: [],
      };
      blocks.push(group);
      destination = group.blocks;
    } else buffer.push(line);
  }
  flush();
  const document: PromptDocument = { version: 2, title: 'Imported prompt', blocks };
  return { document, weighted, warnings: [...new Set(warnings)] };
}
