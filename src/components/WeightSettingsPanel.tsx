import { formatWeightedText, type WeightSettings } from '../core/weights';

type Props = {
  settings: WeightSettings;
  onChange: (settings: WeightSettings) => void;
  showIncrement?: boolean;
};
export function WeightSettingsPanel({ settings, onChange, showIncrement = true }: Props) {
  return (
    <fieldset>
      <legend>Element weights</legend>
      <label>
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(event) => onChange({ ...settings, enabled: event.target.checked })}
        />
        Enable weights for tags and descriptions
      </label>
      <label>
        Syntax{' '}
        <select
          aria-label="Weight syntax"
          value={settings.syntax}
          onChange={(event) =>
            onChange({ ...settings, syntax: event.target.value as WeightSettings['syntax'] })
          }
        >
          <option value="parentheses">Parentheses — (text:1.2)</option>
          <option value="square">Custom square — [text:1.2]</option>
          <option value="curly">Custom curly — {'{text:1.2}'}</option>
          <option value="section">Section — text::1.2</option>
        </select>
      </label>
      {showIncrement && (
        <label>
          Button increment{' '}
          <input
            aria-label="Weight increment"
            type="number"
            min="0.001"
            max="10"
            step="0.001"
            defaultValue={settings.increment}
            onBlur={(event) => {
              const increment = event.target.valueAsNumber;
              if (Number.isFinite(increment) && increment >= 0.001 && increment <= 10)
                onChange({ ...settings, increment });
              else event.target.value = String(settings.increment);
            }}
          />
        </label>
      )}
      <label>
        When weight is 1
        <select
          aria-label="When weight is 1"
          value={settings.neutralWeightMode ?? 'full'}
          onChange={(event) =>
            onChange({
              ...settings,
              neutralWeightMode: event.target.value as WeightSettings['neutralWeightMode'],
            })
          }
        >
          {(
            [
              ['full', 'Keep full syntax'],
              ['omit-syntax', 'Omit whole syntax'],
              ['omit-value', 'Omit number only'],
              ['omit-value-and-colons', 'Omit number and colons'],
            ] as const
          ).map(([mode, label]) => (
            <option key={mode} value={mode}>
              {label} —{' '}
              {formatWeightedText('text', 1, settings.syntax, { neutralWeightMode: mode })}
            </option>
          ))}
        </select>
      </label>
      <p className="hint">
        At weight 1: <code>{formatWeightedText('text', 1, settings.syntax, settings)}</code>. These
        options change output only; the weight input remains available.
      </p>
      <p className="hint">
        Weights range from 0 to 100; Disabling hides controls and weight syntax but keeps saved
        values. Section mode treats each element as a separate section.
      </p>
    </fieldset>
  );
}
