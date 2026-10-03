// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PromptPreview } from './PromptPreview';
import { defaultWeights } from '../core/weights';
import { defaultSeparatorRules } from '../core/separators';
import { type PromptDocument } from '../core/document';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it('applies separator rule changes to both the visible preview and copied output', async () => {
  const document: PromptDocument = {
    version: 2,
    title: '',
    blocks: [
      { id: 'first', type: 'description', text: 'First.', enabled: true },
      {
        id: 'group',
        type: 'group',
        name: 'Group',
        enabled: true,
        collapsed: false,
        includeHeading: true,
        blocks: [{ id: 'second', type: 'tag', text: 'Second', enabled: true }],
      },
    ],
  };
  const props = {
    document,
    separator: ', ',
    weights: defaultWeights,
    commentPrefix: '#',
    repeatPrefix: true,
    onStatus: vi.fn(),
  };
  const { rerender } = render(<PromptPreview {...props} separatorRules={defaultSeparatorRules} />);
  const output = () => (screen.getByLabelText('Assembled prompt') as HTMLTextAreaElement).value;
  expect(output()).toBe('First., Second');
  rerender(
    <PromptPreview
      {...props}
      separatorRules={{ ...defaultSeparatorRules, punctuationOverrides: true }}
    />,
  );
  expect(output()).toBe('First. Second');
  rerender(
    <PromptPreview
      {...props}
      separatorRules={{
        ...defaultSeparatorRules,
        newLineBeforeOuterGroup: true,
        newLineBeforeInnerGroup: true,
      }}
    />,
  );
  expect(output()).toBe('First.,\nSecond');
  rerender(
    <PromptPreview
      {...props}
      separatorRules={{
        ...defaultSeparatorRules,
        newLineBeforeOuterGroup: true,
        newLineBeforeInnerGroup: true,
        punctuationOverrides: true,
      }}
    />,
  );
  expect(output()).toBe('First.\nSecond');
  const writeText = vi.fn().mockResolvedValue(undefined);
  const previousClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  try {
    fireEvent.click(screen.getByRole('button', { name: 'Copy prompt' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('First.\nSecond'));
    fireEvent.click(screen.getByRole('button', { name: 'Annotated' }));
    expect(output()).toBe('First.\n# Group\nSecond');
  } finally {
    if (previousClipboard) Object.defineProperty(navigator, 'clipboard', previousClipboard);
    else Reflect.deleteProperty(navigator, 'clipboard');
  }
});
