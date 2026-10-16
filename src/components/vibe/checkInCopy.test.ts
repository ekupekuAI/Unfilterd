import { describe, expect, it } from 'vitest';
import { getCheckInCopy, HELPLINES } from './checkInCopy';

describe('check-in copy', () => {
  it('replies in English, Hinglish and Telugu', () => {
    expect(getCheckInCopy('en').options.joking).toMatch(/joking/i);
    expect(getCheckInCopy('hinglish').options.joking).toMatch(/mazaak/i);
    expect(getCheckInCopy('telugu').options.joking).toMatch(/[ఀ-౿]/);
  });

  it('maps the other styles sensibly', () => {
    expect(getCheckInCopy('tenglish')).toEqual(getCheckInCopy('telugu'));
    expect(getCheckInCopy('devanagari')).toEqual(getCheckInCopy('hinglish'));
  });

  it('every language has every string', () => {
    const keys = Object.keys(getCheckInCopy('en')).sort();
    for (const lang of ['hinglish', 'telugu'] as const) {
      const copy = getCheckInCopy(lang);
      expect(Object.keys(copy).sort()).toEqual(keys);
      for (const value of Object.values(copy)) {
        if (typeof value === 'string') expect(value.trim()).not.toBe('');
      }
    }
  });

  it('helplines are callable and match the app resources', () => {
    expect(HELPLINES.map(h => h.tel)).toEqual(['14416', '+919999666555', '988']);
  });
});
