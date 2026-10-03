import { SeparatorSettings } from './SeparatorSettings';
import { WeightSettingsPanel } from './WeightSettingsPanel';
import { type Block } from '../core/document';
import { type EditorSettings } from '../hooks/useEditorSettings';

type SettingsPanelProps = {
  settings: EditorSettings;
  onChange: (settings: EditorSettings) => void;
  onSetCurrentMovement: (type: Block['type'], visible: boolean) => void;
};
export function SettingsPanel({ settings, onChange, onSetCurrentMovement }: SettingsPanelProps) {
  return (
    <details className="settings-panel">
      <summary>Settings</summary>
      <div className="settings-content">
        <SeparatorSettings
          value={settings.separator}
          onChange={(separator) => onChange({ ...settings, separator })}
        />
        <WeightSettingsPanel
          settings={settings.weights}
          onChange={(weights) => onChange({ ...settings, weights })}
        />
        <fieldset>
          <legend>Group names in annotated output</legend>
          <label>
            Comment prefix{' '}
            <input
              aria-label="Comment prefix"
              value={settings.commentPrefix}
              onChange={(event) => onChange({ ...settings, commentPrefix: event.target.value })}
              placeholder="# or //"
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.repeatPrefix}
              onChange={(event) => onChange({ ...settings, repeatPrefix: event.target.checked })}
            />
            Repeat prefix for each nesting level
          </label>
          <p className="hint">
            Used in preview and copied text. An empty prefix outputs just the name.
          </p>
        </fieldset>
        <fieldset>
          <legend>Movement controls</legend>
          <table>
            <thead>
              <tr>
                <th>Element</th>
                <th>Existing elements</th>
                <th>Show when created</th>
              </tr>
            </thead>
            <tbody>
              {(['tag', 'description', 'group'] as const).map((type) => (
                <tr key={type}>
                  <th>
                    {type === 'tag' ? 'Tags' : type === 'description' ? 'Descriptions' : 'Groups'}
                  </th>
                  <td>
                    <button
                      onClick={() => onSetCurrentMovement(type, true)}
                      aria-label={`Show movement controls for all ${type}s`}
                    >
                      Show all
                    </button>{' '}
                    <button
                      onClick={() => onSetCurrentMovement(type, false)}
                      aria-label={`Hide movement controls for all ${type}s`}
                    >
                      Hide all
                    </button>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Show movement controls for new ${type}s`}
                      checked={settings.defaultMovement[type]}
                      onChange={(event) =>
                        onChange({
                          ...settings,
                          defaultMovement: {
                            ...settings.defaultMovement,
                            [type]: event.target.checked,
                          },
                        })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="hint">
            Show/Hide all applies now, including collapsed groups. Defaults apply to new or newly
            loaded elements.
          </p>
        </fieldset>
        <fieldset>
          <legend>Layout</legend>
          <label>
            Group topbar add control
            <select
              aria-label="Group topbar add control"
              value={settings.groupAddControl}
              onChange={(event) =>
                onChange({
                  ...settings,
                  groupAddControl: event.target.value as 'toggle' | 'dropdown',
                })
              }
            >
              <option value="toggle">Show/hide add buttons</option>
              <option value="dropdown">Add element dropdown</option>
            </select>
          </label>
          <p className="hint">
            Dropdown mode replaces each group's add-button row. The document's add buttons stay
            available.
          </p>
          <label>
            <input
              type="checkbox"
              checked={settings.twoColumns}
              onChange={(event) => onChange({ ...settings, twoColumns: event.target.checked })}
            />
            Two columns inside groups
          </label>
          <label>
            Reading order
            <select
              aria-label="Layout reading order"
              disabled={!settings.twoColumns}
              value={settings.layoutOrder}
              onChange={(event) =>
                onChange({ ...settings, layoutOrder: event.target.value as 'rows' | 'columns' })
              }
            >
              <option value="rows">Rows</option>
              <option value="columns">Columns</option>
            </select>
          </label>
          <p className="hint">
            {settings.layoutOrder === 'rows'
              ? 'Read left to right across each row, then continue to the next row.'
              : 'Read down the left column, then down the right. Blocks stack without shared row heights.'}{' '}
            Nested groups use the full width and start a new section. Narrow groups use one column.
            Prompt order stays unchanged.
          </p>
        </fieldset>
      </div>
    </details>
  );
}
