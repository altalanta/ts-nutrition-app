var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/normalize.ts
function normalizeFromImporter(food, schema) {
  const nutrients = {};
  for (const [nutrientKey, value] of Object.entries(food.nutrients)) {
    const nutrientInfo = schema.nutrients[nutrientKey];
    if (nutrientInfo) {
      const unitValue = value;
      nutrients[`${nutrientKey}_${nutrientInfo.unit}`] = unitValue;
    }
  }
  return {
    food_name: food.food_name,
    brand: food.brand || "",
    category: "Imported",
    // Default category for imported foods
    fdc_id: parseInt(food.source_id) || 0,
    // Try to parse as number, fallback to 0
    serving_name: food.serving_name || "1 serving",
    serving_size_g: food.serving_size_g || 100,
    ...nutrients
  };
}
function foodItemToNormalized(foodItem, schema) {
  const nutrients = {};
  for (const [nutrientKey, nutrientInfo] of Object.entries(schema.nutrients)) {
    const fieldName = `${nutrientKey}_${nutrientInfo.unit}`;
    const value = foodItem[fieldName] || 0;
    nutrients[nutrientKey] = value;
  }
  return {
    source: "FDC",
    // Default, could be enhanced to track original source
    source_id: foodItem.fdc_id.toString(),
    food_name: foodItem.food_name,
    brand: foodItem.brand,
    serving_name: foodItem.serving_name,
    serving_size_g: foodItem.serving_size_g,
    barcode: void 0,
    // Not stored in FoodItem
    nutrients
  };
}

export {
  __require,
  normalizeFromImporter,
  foodItemToNormalized
};
