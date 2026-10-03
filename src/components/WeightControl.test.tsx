// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { BlockEditor } from './BlockEditor';
import { type TextBlock } from '../core/document';
import { defaultWeights } from '../core/weights';
afterEach(cleanup);
it('adjusts a retained element weight with inputs and buttons and hides only the controls', () => {
  function Editor({ enabled, increment }: { enabled: boolean; increment: number }) {
    const [block, setBlock] = useState<TextBlock>({
      id: 'a',
      type: 'description',
      text: 'light',
      enabled: true,
      weight: 1,
    });
    return (
      <BlockEditor
        block={block}
        weights={{ ...defaultWeights, enabled, increment }}
        onUpdate={(patch) => setBlock((previous) => ({ ...previous, ...patch }))}
        onRemove={() => {}}
        inheritedDisabled={false}
        movementControls={null}
        movementControlsToggle={null}
      />
    );
  }
  const { rerender } = render(<Editor enabled increment={0.1} />);
  fireEvent.click(screen.getByLabelText('Increase weight'));
  expect((screen.getByLabelText('Weight') as HTMLInputElement).value).toBe('1.1');
  fireEvent.change(screen.getByLabelText('Weight'), { target: { value: '2.5' } });
  rerender(<Editor enabled={false} increment={0.25} />);
  expect(screen.queryByLabelText('Weight')).toBeNull();
  rerender(<Editor enabled increment={0.25} />);
  expect((screen.getByLabelText('Weight') as HTMLInputElement).value).toBe('2.5');
  fireEvent.click(screen.getByLabelText('Decrease weight'));
  expect((screen.getByLabelText('Weight') as HTMLInputElement).value).toBe('2.25');
});
