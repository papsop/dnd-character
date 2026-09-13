import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { ItemForge } from './ItemForge';

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('recovers from malformed saved items and persists edits', () => {
  localStorage.setItem('dnd-toolkit/items-prototype/v1', '[{}]');
  render(<ItemForge />);
  fireEvent.change(screen.getByLabelText('Item name'), { target: { value: 'Křížová blade' } });
  expect(screen.getByRole('heading', { name: 'Křížová blade' })).toBeInTheDocument();
  cleanup();
  render(<ItemForge />);
  expect(screen.getByLabelText('Item name')).toHaveValue('Křížová blade');
});

it('paginates copy counts and disables printing an empty collection', () => {
  const { container } = render(<ItemForge />);
  fireEvent.click(screen.getByRole('button', { name: /Prepare to print/ }));
  fireEvent.change(screen.getByLabelText('Copies of Emberwake'), { target: { value: '2' } });
  expect(container.querySelectorAll('.a4-sheet')).toHaveLength(2);
  expect(container.querySelectorAll('.cut-card')).toHaveLength(5);
  for (const input of screen.getAllByRole('spinbutton')) fireEvent.change(input, { target: { value: '0' } });
  expect(screen.getByRole('button', { name: 'Print / save as PDF' })).toBeDisabled();
});

it('adds starting equipment as an editable card and uses isolated artwork', () => {
  const { container } = render(<ItemForge />);
  fireEvent.click(screen.getByRole('button', { name: 'Browse starting gear' }));
  fireEvent.change(screen.getByLabelText('Starting gear for'), { target: { value: 'cleric' } });
  expect(screen.getByRole('button', { name: 'Add Shield' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Add Greataxe' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Add Shield' }));
  expect(screen.getByLabelText('Item name')).toHaveValue('Shield');
  expect(screen.getByLabelText('Type')).toHaveValue('Shield');
  expect((screen.getByLabelText('Story & effects') as HTMLTextAreaElement).value).toContain('Armor Class: +2.');
  const image = container.querySelector('.live-preview img');
  expect(image?.getAttribute('src')).toContain('/art/equipment/shield.png');
  expect(image?.getAttribute('style')).toBeNull();
  fireEvent.change(screen.getByLabelText('Rarity'), { target: { value: 'Legendary' } });
  expect(container.querySelector('.live-preview .item-card')).toHaveClass('palette-gold');
  fireEvent.change(screen.getByLabelText('Artwork background'), { target: { value: 'Arcane blue' } });
  expect(container.querySelector('.live-preview .item-card')).toHaveClass('palette-blue');
});

