import { useEffect, useMemo, useRef, useState } from 'react';
import { assemblePrompt, type Block, type PromptDocument } from '../core/document';
import { parsePromptText, type TextImportOptions } from '../core/textImport';
import { type OutputSettings } from '../core/workflow';

export function TextImportDialog({
  defaults,
  onClose,
  onImport,
}: {
  defaults: OutputSettings;
  onClose: () => void;
  onImport: (document: PromptDocument, output: OutputSettings) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [source, setSource] = useState('');
  const [title, setTitle] = useState('Imported prompt');
  const [options, setOptions] = useState<TextImportOptions>({
    prefix: defaults.commentPrefix,
    separator: defaults.separator || ',',
    syntax: defaults.weights.enabled ? defaults.weights.syntax : 'plain',
  });
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  const result = useMemo(() => parsePromptText(source, options), [source, options]);
  const output: OutputSettings = {
    ...structuredClone(defaults),
    commentPrefix: options.prefix.trim(),
    separator: options.separator,
    weights: {
      ...defaults.weights,
      enabled: result.weighted,
      syntax: options.syntax === 'plain' ? defaults.weights.syntax : options.syntax,
      neutralWeightMode: 'omit-syntax',
    },
  };
  const document = { ...result.document, title: title.trim() || 'Imported prompt' };
  const assembled = assemblePrompt(
    document,
    true,
    output.commentPrefix,
    output.repeatPrefix,
    { ...output.weights, increment: 0.1 },
    output.separator,
    output.separatorRules,
  );
  return (
    <dialog
      ref={dialog}
      className="text-import-dialog"
      aria-labelledby="text-import-title"
      onCancel={onClose}
    >
      <div className="import-heading">
        <h2 id="text-import-title">Import text</h2>
        <button onClick={onClose} aria-label="Close text import">
          ×
        </button>
      </div>
      <p>
        Comment lines start top-level groups. Separated pieces become tags. Review the result before
        creating a new tab.
      </p>
      <div className="import-options">
        <label>
          Tab name
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          Comment prefix
          <input
            value={options.prefix}
            onChange={(e) => setOptions({ ...options, prefix: e.target.value })}
            placeholder="Empty disables headings"
          />
        </label>
        <label>
          Weight syntax
          <select
            value={options.syntax}
            onChange={(e) =>
              setOptions({ ...options, syntax: e.target.value as TextImportOptions['syntax'] })
            }
          >
            <option value="plain">Plain text</option>
            <option value="parentheses">(text:1.2)</option>
            <option value="square">[text:1.2]</option>
            <option value="curly">{'{text:1.2}'}</option>
            <option value="section">text::1.2</option>
          </select>
        </label>
        <label>
          Exact separator
          <textarea
            rows={1}
            value={options.separator}
            onChange={(e) => setOptions({ ...options, separator: e.target.value })}
          />
        </label>
        <div className="separator-presets">
          {[
            [',', 'Comma'],
            ['\n', 'Newline'],
            [' ', 'Space'],
            ['', 'None'],
          ].map(([value, label]) => (
            <button
              key={label}
              aria-pressed={options.separator === value}
              onClick={() => setOptions({ ...options, separator: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="import-columns">
        <label>
          Source prompt
          <textarea
            rows={12}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            autoFocus
          />
        </label>
        <section aria-label="Import preview">
          <h3>Proposed blocks</h3>
          <PreviewBlocks blocks={document.blocks} />
          <label>
            Assembled annotated output
            <textarea rows={6} readOnly value={assembled} />
          </label>
        </section>
      </div>
      {result.warnings.length > 0 && (
        <div role="status">
          <strong>Kept for review</strong>
          <ul>
            {result.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="hint">
        No nesting or sentence detection. Section weights require separators between tags. Bracketed
        phrases stay together. Unsupported weights remain literal text; output may normalize
        whitespace and weight formatting.
      </p>
      <div className="import-actions">
        <button onClick={onClose}>Cancel</button>
        <button
          className="primary"
          disabled={!source.trim() || !document.blocks.length}
          onClick={() => onImport(document, output)}
        >
          Create tab
        </button>
      </div>
    </dialog>
  );
}
function PreviewBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <ul className="import-blocks">
      {blocks.map((block) => (
        <li key={block.id}>
          {block.type === 'group' ? (
            <>
              <strong>{block.name}</strong>
              <PreviewBlocks blocks={block.blocks} />
            </>
          ) : (
            <>
              <small>TAG </small>
              {block.text}
              {block.weight !== 1 && <small> · weight {block.weight}</small>}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
