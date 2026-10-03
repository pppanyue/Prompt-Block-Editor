import { type SeparatorRules } from '../core/separators';
type Props = {
  value: string;
  onChange: (value: string) => void;
  rules: SeparatorRules;
  onRulesChange: (rules: SeparatorRules) => void;
};
export function SeparatorSettings({ value, onChange, rules, onRulesChange }: Props) {
  return (
    <fieldset>
      <legend>Element separator</legend>
      <div className="separator-presets" role="group" aria-label="Separator presets">
        {[
          ['Comma + space', ', '],
          ['Space', ' '],
          ['Newline', '\n'],
          ['None', ''],
        ].map(([label, separator]) => (
          <button
            key={label}
            aria-pressed={value === separator}
            onClick={() => onChange(separator)}
          >
            {label}
          </button>
        ))}
      </div>
      <label>
        Exact separator{' '}
        <textarea
          aria-label="Exact separator"
          rows={2}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <p className="hint">
        Current value: <code>{JSON.stringify(value)}</code>
      </p>
      <label>
        <input
          type="checkbox"
          checked={rules.newLineBeforeOuterGroup}
          onChange={(event) =>
            onRulesChange({ ...rules, newLineBeforeOuterGroup: event.target.checked })
          }
        />
        Put top-level groups on dedicated lines
      </label>
      <label>
        <input
          type="checkbox"
          checked={rules.newLineBeforeInnerGroup}
          onChange={(event) =>
            onRulesChange({ ...rules, newLineBeforeInnerGroup: event.target.checked })
          }
        />
        Put nested groups on dedicated lines
      </label>
      <p className="hint">Adds a line break before and after each selected group.</p>
      <p className="hint">Annotated output always puts groups on dedicated lines.</p>
      <label>
        <input
          type="checkbox"
          checked={rules.punctuationOverrides}
          onChange={(event) =>
            onRulesChange({ ...rules, punctuationOverrides: event.target.checked })
          }
        />
        Ending punctuation overrides the separator
      </label>
      <label>
        Ending signs{' '}
        <input
          aria-label="Separator override ending signs"
          disabled={!rules.punctuationOverrides}
          value={rules.endingSigns}
          onChange={(event) => onRulesChange({ ...rules, endingSigns: event.target.value })}
        />
      </label>
      <p className="hint">
        Used between active elements and groups, with no trailing separator. Each character is a
        matching ending sign. Enter any text, spaces, line breaks, or nothing.
      </p>
      <p className="hint">
        A match removes separator punctuation/text but keeps its whitespace. Syntax changes never
        override it. Group headings still use their own line break.
      </p>
    </fieldset>
  );
}
