type Props = { value: string; onChange: (value: string) => void };
export function SeparatorSettings({ value, onChange }: Props) {
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
        Used exactly between active elements and groups, with no trailing separator. Enter any text,
        spaces, line breaks, or nothing. Syntax changes never override it. Group headings still use
        their own line break.
      </p>
      <p className="hint">
        Current value: <code>{JSON.stringify(value)}</code>
      </p>
    </fieldset>
  );
}
