import { describe, it, expect } from 'vitest';
import { toMilligram, toMicrogram, convertToBaseUnit, convertFromBaseUnit } from '../packages/nutri-core/src/units';

describe('Unit Conversions', () => {
  describe('Milligram/Microgram conversions', () => {
    it('should convert micrograms to milligrams correctly', () => {
      const micrograms = 1000;
      const milligrams = toMilligram(micrograms);
      expect(milligrams).toBe(1);
    });

    it('should convert milligrams to micrograms correctly', () => {
      const milligrams = 1;
      const micrograms = toMicrogram(milligrams);
      expect(micrograms).toBe(1000);
    });

    it('should be idempotent for round-trip conversions', () => {
      const originalMicrograms = 2500;
      const milligrams = toMilligram(originalMicrograms);
      const backToMicrograms = toMicrogram(milligrams);
      expect(backToMicrograms).toBe(originalMicrograms);
    });
  });

  describe('Base unit conversions', () => {
    it('should convert mg values to base unit (mg)', () => {
      const result = convertToBaseUnit(100, 'mg');
      expect(result).toBe(100);
    });

    it('should convert µg values to base unit (mg)', () => {
      const result = convertToBaseUnit(1000, 'µg');
      expect(result).toBe(1);
    });

    it('should convert from base unit back to mg', () => {
      const result = convertFromBaseUnit(100, 'mg');
      expect(result).toBe(100);
    });

    it('should convert from base unit back to µg', () => {
      const result = convertFromBaseUnit(1, 'µg');
      expect(result).toBe(1000);
    });

    it('should be idempotent for mg round-trip', () => {
      const original = 150;
      const toBase = convertToBaseUnit(original, 'mg');
      const fromBase = convertFromBaseUnit(toBase, 'mg');
      expect(fromBase).toBe(original);
    });

    it('should be idempotent for µg round-trip', () => {
      const original = 1500;
      const toBase = convertToBaseUnit(original, 'µg');
      const fromBase = convertFromBaseUnit(toBase, 'µg');
      expect(fromBase).toBe(original);
    });
  });
});
