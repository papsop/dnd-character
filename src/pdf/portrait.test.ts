import { describe, expect, it } from 'vitest';
import { isPrintablePortrait } from './portrait';

/**
 * react-pdf embeds JPEG and PNG and silently skips everything else, so what counts as printable is
 * not a matter of taste - it is the list of formats that reach the paper.
 */
describe('printable portraits', () => {
  it('accepts the formats react-pdf can embed', () => {
    expect(isPrintablePortrait('data:image/jpeg;base64,AAAA')).toBe(true);
    expect(isPrintablePortrait('data:image/png;base64,AAAA')).toBe(true);
    expect(isPrintablePortrait('data:image/PNG;base64,AAAA')).toBe(true);
  });

  it('rejects the WebP portraits older saves hold', () => {
    expect(isPrintablePortrait('data:image/webp;base64,AAAA')).toBe(false);
  });

  it('rejects anything that is not a base64 image data URL', () => {
    expect(isPrintablePortrait('data:image/svg+xml;base64,AAAA')).toBe(false);
    expect(isPrintablePortrait('https://example.com/face.jpg')).toBe(false);
    expect(isPrintablePortrait('')).toBe(false);
  });
});
