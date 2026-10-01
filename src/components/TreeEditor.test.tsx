// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { TreeEditor, type TreeEditorProps } from './TreeEditor';
import { starterDocument } from '../core/document';

afterEach(cleanup);
it('toggles group add rows independently and creates elements from the dropdown', () => {
  const onAdd = vi.fn();
  const props: TreeEditorProps = {
    blocks: structuredClone(starterDocument).blocks,
    twoColumns: false,
    layoutOrder: 'rows',
    groupAddControl: 'toggle',
    movementVisibility: {},
    onToggleMovement: vi.fn(),
    onAdd,
    onUpdate: vi.fn(),
    onRemove: vi.fn(),
    onMove: vi.fn(),
    onUngroup: vi.fn(),
  };
  const { rerender } = render(<TreeEditor {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'Hide add buttons for Subject & setting' }));
  expect(screen.queryByRole('group', { name: 'Add to Subject & setting' })).toBeNull();
  expect(screen.getByRole('group', { name: 'Add to Light & style' })).toBeTruthy();
  expect(screen.getByRole('group', { name: 'Add to document' })).toBeTruthy();
  rerender(<TreeEditor {...props} groupAddControl="dropdown" />);
  expect(screen.queryByRole('group', { name: 'Add to Light & style' })).toBeNull();
  const select = screen.getByRole('combobox', { name: 'Add element to Subject & setting' });
  for (const type of ['tag', 'description', 'group']) {
    fireEvent.change(select, { target: { value: type } });
    expect(onAdd).toHaveBeenLastCalledWith('subject', type);
    expect((select as HTMLSelectElement).value).toBe('');
  }
  rerender(<TreeEditor {...props} />);
  expect(screen.queryByRole('group', { name: 'Add to Subject & setting' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Show add buttons for Subject & setting' }));
  expect(screen.getByRole('group', { name: 'Add to Subject & setting' })).toBeTruthy();
});
