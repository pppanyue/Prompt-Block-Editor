import { type WeightSettings } from '../core/weights';

type Props = { settings: WeightSettings; onChange: (settings: WeightSettings) => void };
export function WeightSettingsPanel({ settings, onChange }: Props) {
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
      <p className="hint">
        Weights range from 0 to 100; 1 is neutral. Disabling hides controls and weight syntax but
        keeps saved values. Custom bracket formats require a compatible parser; they are not
        standard emphasis syntax. Section mode treats each element as a separate section.
      </p>
    </fieldset>
  );
}
