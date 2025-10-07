// Branded types for type safety
export type Milligram = number & { __brand: 'Milligram' };
export type Microgram = number & { __brand: 'Microgram' };

// Conversion functions
export function toMilligram(micrograms: Microgram): Milligram {
  return (micrograms / 1000) as Milligram;
}

export function toMicrogram(milligrams: Milligram): Microgram {
  return (milligrams * 1000) as Microgram;
}

// Helper to convert any nutrient value to base unit (mg or µg based on schema)
export function convertToBaseUnit(
  value: number,
  fromUnit: 'mg' | 'µg'
): number {
  if (fromUnit === 'mg') {
    return value;
  }
  return value / 1000; // Convert µg to mg
}

// Helper to convert from base unit back to schema unit
export function convertFromBaseUnit(
  value: number,
  toUnit: 'mg' | 'µg'
): number {
  if (toUnit === 'mg') {
    return value;
  }
  return value * 1000; // Convert mg to µg
}
