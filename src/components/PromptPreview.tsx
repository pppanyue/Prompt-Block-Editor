import { type WeightSettings } from '../core/weights';
import { useState } from 'react';
import { assemblePrompt, type PromptDocument } from '../core/document';

type PromptPreviewProps = {
  document: PromptDocument;
  weights: WeightSettings;
  separator: string;
  commentPrefix: string;
  repeatPrefix: boolean;
  onStatus: (message: string) => void;
};

export function PromptPreview({
  document,
  weights,
  separator,
  onStatus,
  commentPrefix,
  repeatPrefix,
}: PromptPreviewProps) {
  const [annotated, setAnnotated] = useState(false);
  const output = assemblePrompt(
    document,
    annotated,
    commentPrefix,
    repeatPrefix,
    weights,
    separator,
  );

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(output);
      onStatus('Prompt copied to clipboard');
    } catch {
      onStatus('Copy failed. Select and copy the preview text manually.');
    }
  }

  return (
    <aside className="preview">
      <div className="section-heading">
        <h2>Assembled prompt</h2>
        <span className="live">● LIVE</span>
      </div>
      <div className="mode-switch">
        <button className={!annotated ? 'selected' : ''} onClick={() => setAnnotated(false)}>
          Clean
        </button>
        <button className={annotated ? 'selected' : ''} onClick={() => setAnnotated(true)}>
          Annotated
        </button>
      </div>
      <textarea
        readOnly
        aria-label="Assembled prompt"
        value={output}
        placeholder="Your active blocks will appear here…"
      />
      <div className="preview-footer">
        <span>{output.length} characters</span>
        <button className="primary" onClick={copyPrompt}>
          Copy prompt
        </button>
      </div>
      <p className="hint">
        {annotated
          ? 'Headings are included as text. Use Clean to omit them.'
          : 'Only enabled content is included. Ready to paste into your generator.'}
      </p>
    </aside>
  );
}
