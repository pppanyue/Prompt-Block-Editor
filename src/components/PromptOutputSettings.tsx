import { type OutputSettings } from '../core/workflow';
import { SeparatorSettings } from './SeparatorSettings';
import { WeightSettingsPanel } from './WeightSettingsPanel';

type Props = {
  value: OutputSettings;
  increment: number;
  onChange: (value: OutputSettings) => void;
};
export function PromptOutputSettings({ value, increment, onChange }: Props) {
  return (
    <details className="settings-panel prompt-output-settings">
      <summary title="Expand or collapse prompt output settings">
        <span aria-hidden="true" className="drawer-chevron">
          ‹
        </span>
        <span>Prompt output settings</span>
      </summary>
      <div className="output-settings-scroll">
        <p className="hint">
          Saved with this prompt. New tabs copy these settings. Layout and editing defaults are
          global.
        </p>
        <div className="settings-content">
          <SeparatorSettings
            value={value.separator}
            rules={value.separatorRules}
            onChange={(separator) => onChange({ ...value, separator })}
            onRulesChange={(separatorRules) => onChange({ ...value, separatorRules })}
          />
          <WeightSettingsPanel
            settings={{ ...value.weights, increment }}
            showIncrement={false}
            onChange={({ increment: _increment, ...weights }) => onChange({ ...value, weights })}
          />
          <fieldset>
            <legend>Annotated group names</legend>
            <label>
              Comment prefix{' '}
              <input
                aria-label="Comment prefix"
                value={value.commentPrefix}
                onChange={(event) => onChange({ ...value, commentPrefix: event.target.value })}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={value.repeatPrefix}
                onChange={(event) => onChange({ ...value, repeatPrefix: event.target.checked })}
              />
              Repeat prefix for each nesting level
            </label>
          </fieldset>
        </div>
      </div>
    </details>
  );
}
