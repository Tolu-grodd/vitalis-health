import type { LibraryFood } from './types'

/**
 * Reference food library, weighted heavily towards what is actually eaten and
 * sold in Nigeria: local dishes, street food, packaged goods and the imported
 * things you find in any supermarket.
 *
 * All macros are per 100 g of the food AS EATEN, which is what a kitchen scale
 * reads. Cooked unless the name says otherwise. Drinks are per 100 ml, treating
 * 1 ml as 1 g, which is close enough for anything water based.
 *
 * `serving` is a typical single portion in grams, used to prefill the weight
 * field and to give the portion unit something to multiply. `servingLabel`
 * describes what one portion actually is.
 *
 * These are reference values, not label values. Recipes vary enormously,
 * especially with oil, so every number stays editable.
 */
const BASE_LIBRARY: LibraryFood[] = [
  /* ================= Swallows and staples ================= */
  { name: 'Eba (garri)', kcal: 155, protein: 1.2, carbs: 37, fat: 0.3, category: 'Swallows and staples', serving: 200, servingLabel: '1 medium wrap' },
  { name: 'Pounded yam', kcal: 145, protein: 1.5, carbs: 34, fat: 0.2, category: 'Swallows and staples', serving: 250, servingLabel: '1 medium wrap' },
  { name: 'Fufu (cassava)', kcal: 160, protein: 1, carbs: 38, fat: 0.2, category: 'Swallows and staples', serving: 220 },
  { name: 'Akpu', kcal: 160, protein: 1, carbs: 38, fat: 0.2, category: 'Swallows and staples', serving: 220 },
  { name: 'Amala (yam flour)', kcal: 130, protein: 1.5, carbs: 31, fat: 0.2, category: 'Swallows and staples', serving: 200 },
  { name: 'Amala lafun (cassava flour)', kcal: 140, protein: 1.2, carbs: 33, fat: 0.2, category: 'Swallows and staples', serving: 200 },
  { name: 'Semovita', kcal: 150, protein: 4, carbs: 32, fat: 0.5, category: 'Swallows and staples', serving: 220 },
  { name: 'Semolina swallow', kcal: 150, protein: 4, carbs: 32, fat: 0.5, category: 'Swallows and staples', serving: 220 },
  { name: 'Wheat swallow', kcal: 145, protein: 5, carbs: 30, fat: 1, category: 'Swallows and staples', serving: 220 },
  { name: 'Tuwo shinkafa', kcal: 140, protein: 2.5, carbs: 32, fat: 0.3, category: 'Swallows and staples', serving: 220 },
  { name: 'Tuwo masara (corn)', kcal: 145, protein: 3, carbs: 32, fat: 0.6, category: 'Swallows and staples', serving: 220 },
  { name: 'Starch (Delta starch)', kcal: 170, protein: 0.5, carbs: 42, fat: 0.2, category: 'Swallows and staples', serving: 220 },
  { name: 'Plantain flour swallow', kcal: 135, protein: 1.5, carbs: 32, fat: 0.3, category: 'Swallows and staples', serving: 200 },
  { name: 'Garri (dry, uncooked)', kcal: 360, protein: 1.5, carbs: 84, fat: 0.5, category: 'Swallows and staples', serving: 60 },
  { name: 'Soaked garri (with water)', kcal: 130, protein: 1, carbs: 30, fat: 0.4, category: 'Swallows and staples', serving: 250 },
  { name: 'Tapioca', kcal: 130, protein: 0.2, carbs: 32, fat: 0.1, category: 'Swallows and staples', serving: 200 },
  { name: 'Boiled cassava', kcal: 160, protein: 1.4, carbs: 38, fat: 0.3, category: 'Swallows and staples', serving: 200 },
  { name: 'Abacha (African salad)', kcal: 210, protein: 5, carbs: 30, fat: 8, category: 'Swallows and staples', serving: 200 },
  { name: 'Okpa', kcal: 150, protein: 8, carbs: 18, fat: 5, category: 'Swallows and staples', serving: 200, servingLabel: '1 wrap' },
  { name: 'Acha (fonio), cooked', kcal: 140, protein: 3, carbs: 30, fat: 0.6, category: 'Swallows and staples', serving: 200 },

  /* ================= Rice and grain dishes ================= */
  { name: 'Jollof rice', kcal: 160, protein: 3.2, carbs: 27, fat: 4.5, category: 'Rice and grains', serving: 250, servingLabel: '1 plate' },
  { name: 'White rice (cooked)', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, category: 'Rice and grains', serving: 200 },
  { name: 'Fried rice', kcal: 175, protein: 4, carbs: 26, fat: 6, category: 'Rice and grains', serving: 250 },
  { name: 'Coconut rice', kcal: 185, protein: 3, carbs: 26, fat: 7.5, category: 'Rice and grains', serving: 250 },
  { name: 'Ofada rice', kcal: 135, protein: 2.8, carbs: 29, fat: 0.4, category: 'Rice and grains', serving: 200 },
  { name: 'Native rice (palm oil rice)', kcal: 175, protein: 4, carbs: 27, fat: 6, category: 'Rice and grains', serving: 250 },
  { name: 'Rice and beans (mixed)', kcal: 145, protein: 5, carbs: 27, fat: 2, category: 'Rice and grains', serving: 250 },
  { name: 'Brown rice (cooked)', kcal: 123, protein: 2.7, carbs: 26, fat: 1, category: 'Rice and grains', serving: 200 },
  { name: 'Basmati rice (cooked)', kcal: 130, protein: 2.7, carbs: 28, fat: 0.4, category: 'Rice and grains', serving: 200 },
  { name: 'Chinese fried rice', kcal: 180, protein: 5, carbs: 26, fat: 6, category: 'Rice and grains', serving: 250 },
  { name: 'Boiled corn', kcal: 96, protein: 3.4, carbs: 21, fat: 1.5, category: 'Rice and grains', serving: 150, servingLabel: '1 cob' },
  { name: 'Roasted corn', kcal: 110, protein: 3.6, carbs: 24, fat: 1.6, category: 'Rice and grains', serving: 150, servingLabel: '1 cob' },
  { name: 'Millet porridge', kcal: 90, protein: 2.5, carbs: 19, fat: 0.8, category: 'Rice and grains', serving: 300 },
  { name: 'Guinea corn porridge', kcal: 95, protein: 2.6, carbs: 20, fat: 0.9, category: 'Rice and grains', serving: 300 },
  { name: 'Couscous (cooked)', kcal: 112, protein: 3.8, carbs: 23, fat: 0.2, category: 'Rice and grains', serving: 200 },
  { name: 'Quinoa (cooked)', kcal: 120, protein: 4.4, carbs: 21, fat: 1.9, category: 'Rice and grains', serving: 200 },

  /* ================= Soups ================= */
  { name: 'Egusi soup', kcal: 190, protein: 9, carbs: 6, fat: 15, category: 'Soups', serving: 150, servingLabel: '1 ladle' },
  { name: 'Ogbono soup', kcal: 175, protein: 8, carbs: 7, fat: 13, category: 'Soups', serving: 150 },
  { name: 'Okra soup', kcal: 95, protein: 5, carbs: 6, fat: 6, category: 'Soups', serving: 150 },
  { name: 'Okra and egusi (combo)', kcal: 150, protein: 7, carbs: 6, fat: 11, category: 'Soups', serving: 150 },
  { name: 'Efo riro', kcal: 120, protein: 6, carbs: 5, fat: 9, category: 'Soups', serving: 150 },
  { name: 'Edikang ikong', kcal: 155, protein: 9, carbs: 6, fat: 11, category: 'Soups', serving: 150 },
  { name: 'Afang soup', kcal: 165, protein: 9, carbs: 6, fat: 12, category: 'Soups', serving: 150 },
  { name: 'Oha soup', kcal: 160, protein: 8, carbs: 6, fat: 12, category: 'Soups', serving: 150 },
  { name: 'Bitterleaf soup (onugbu)', kcal: 150, protein: 8, carbs: 6, fat: 11, category: 'Soups', serving: 150 },
  { name: 'Nsala (white soup)', kcal: 145, protein: 11, carbs: 5, fat: 9, category: 'Soups', serving: 150 },
  { name: 'Banga soup', kcal: 210, protein: 8, carbs: 6, fat: 18, category: 'Soups', serving: 150 },
  { name: 'Ewedu soup', kcal: 55, protein: 3, carbs: 5, fat: 2.5, category: 'Soups', serving: 120 },
  { name: 'Gbegiri soup', kcal: 130, protein: 7, carbs: 14, fat: 5, category: 'Soups', serving: 120 },
  { name: 'Ewedu and gbegiri (abula)', kcal: 100, protein: 5, carbs: 10, fat: 4, category: 'Soups', serving: 150 },
  { name: 'Miyan kuka', kcal: 120, protein: 6, carbs: 9, fat: 7, category: 'Soups', serving: 150 },
  { name: 'Miyan taushe', kcal: 140, protein: 6, carbs: 12, fat: 8, category: 'Soups', serving: 150 },
  { name: 'Groundnut soup', kcal: 195, protein: 9, carbs: 8, fat: 14, category: 'Soups', serving: 150 },
  { name: 'Vegetable soup (mixed)', kcal: 130, protein: 7, carbs: 6, fat: 9, category: 'Soups', serving: 150 },
  { name: 'Ora soup', kcal: 160, protein: 8, carbs: 6, fat: 12, category: 'Soups', serving: 150 },
  { name: 'Owo soup', kcal: 180, protein: 6, carbs: 5, fat: 16, category: 'Soups', serving: 150 },
  { name: 'Fisherman soup', kcal: 120, protein: 14, carbs: 4, fat: 5, category: 'Soups', serving: 250 },
  { name: 'Pepper soup (goat)', kcal: 105, protein: 13, carbs: 2, fat: 5, category: 'Soups', serving: 250, servingLabel: '1 bowl' },
  { name: 'Pepper soup (catfish)', kcal: 90, protein: 14, carbs: 2, fat: 3, category: 'Soups', serving: 250 },
  { name: 'Pepper soup (chicken)', kcal: 95, protein: 15, carbs: 2, fat: 3, category: 'Soups', serving: 250 },
  { name: 'Pepper soup (cow leg)', kcal: 130, protein: 15, carbs: 2, fat: 7, category: 'Soups', serving: 250 },
  { name: 'Nkwobi', kcal: 250, protein: 18, carbs: 3, fat: 19, category: 'Soups', serving: 200 },
  { name: 'Isi ewu', kcal: 260, protein: 17, carbs: 3, fat: 20, category: 'Soups', serving: 200 },

  /* ================= Stews and sauces ================= */
  { name: 'Tomato stew (obe ata)', kcal: 130, protein: 3, carbs: 7, fat: 10, category: 'Stews and sauces', serving: 100, servingLabel: '1 serving spoon' },
  { name: 'Ayamase (ofada stew)', kcal: 200, protein: 7, carbs: 5, fat: 17, category: 'Stews and sauces', serving: 100 },
  { name: 'Buka stew', kcal: 175, protein: 5, carbs: 6, fat: 15, category: 'Stews and sauces', serving: 100 },
  { name: 'Egg sauce', kcal: 180, protein: 11, carbs: 4, fat: 13, category: 'Stews and sauces', serving: 120 },
  // Home version: 3 to 4 eggs, blended tomato and pepper, about a tablespoon of
  // oil for the whole pan. Works out a third lighter than the standard sauce.
  { name: 'Egg sauce (little oil)', kcal: 132, protein: 7.8, carbs: 2.5, fat: 9.9, category: 'Stews and sauces', serving: 250, aliases: ['egg sauce light', 'egg and tomato sauce'] },
  { name: 'Fish stew', kcal: 150, protein: 12, carbs: 5, fat: 9, category: 'Stews and sauces', serving: 120 },
  { name: 'Chicken stew', kcal: 165, protein: 13, carbs: 5, fat: 10, category: 'Stews and sauces', serving: 120 },
  { name: 'Beef stew', kcal: 180, protein: 12, carbs: 5, fat: 12, category: 'Stews and sauces', serving: 120 },
  { name: 'Corned beef sauce', kcal: 200, protein: 13, carbs: 4, fat: 15, category: 'Stews and sauces', serving: 100 },
  { name: 'Sardine sauce', kcal: 190, protein: 14, carbs: 4, fat: 13, category: 'Stews and sauces', serving: 100 },
  { name: 'Pepper sauce (ata dindin)', kcal: 160, protein: 2, carbs: 7, fat: 14, category: 'Stews and sauces', serving: 60 },
  { name: 'Curry sauce', kcal: 120, protein: 4, carbs: 8, fat: 8, category: 'Stews and sauces', serving: 120 },

  /* ================= Beans, eggs and bean dishes ================= */
  { name: 'Beans (ewa, cooked)', kcal: 120, protein: 8, carbs: 20, fat: 0.5, category: 'Beans and eggs', serving: 200 },
  { name: 'Beans porridge', kcal: 135, protein: 7, carbs: 20, fat: 3, category: 'Beans and eggs', serving: 250 },
  { name: 'Ewa agoyin', kcal: 145, protein: 7, carbs: 19, fat: 5, category: 'Beans and eggs', serving: 250 },
  { name: 'Ewa agoyin sauce', kcal: 260, protein: 2, carbs: 6, fat: 25, category: 'Beans and eggs', serving: 60 },
  { name: 'Beans and corn (adalu)', kcal: 130, protein: 6, carbs: 22, fat: 2.5, category: 'Beans and eggs', serving: 250 },
  { name: 'Moi moi', kcal: 165, protein: 9, carbs: 14, fat: 8, category: 'Beans and eggs', serving: 150, servingLabel: '1 wrap' },
  { name: 'Akara', kcal: 250, protein: 9, carbs: 18, fat: 16, category: 'Beans and eggs', serving: 60, servingLabel: '2 balls' },
  { name: 'Gbegiri (bean paste)', kcal: 130, protein: 7, carbs: 14, fat: 5, category: 'Beans and eggs', serving: 120 },
  { name: 'Egg (boiled)', kcal: 155, protein: 13, carbs: 1.1, fat: 11, category: 'Beans and eggs', serving: 50, servingLabel: '1 egg' },
  { name: 'Egg (fried)', kcal: 200, protein: 14, carbs: 1, fat: 15, category: 'Beans and eggs', serving: 60, servingLabel: '1 egg' },
  { name: 'Omelette', kcal: 175, protein: 12, carbs: 2, fat: 13, category: 'Beans and eggs', serving: 120 },
  { name: 'Scrambled egg', kcal: 165, protein: 11, carbs: 1.6, fat: 12, category: 'Beans and eggs', serving: 120 },
  { name: 'Egg white (boiled)', kcal: 52, protein: 11, carbs: 0.7, fat: 0.2, category: 'Beans and eggs', serving: 33 },
  { name: 'Quail egg', kcal: 158, protein: 13, carbs: 0.4, fat: 11, category: 'Beans and eggs', serving: 10, servingLabel: '1 egg' },

  /* ================= Meat ================= */
  { name: 'Beef (cooked)', kcal: 250, protein: 26, carbs: 0, fat: 15, category: 'Meat', serving: 100 },
  { name: 'Beef (boiled, lean)', kcal: 190, protein: 30, carbs: 0, fat: 7, category: 'Meat', serving: 100 },
  { name: 'Fried beef', kcal: 290, protein: 26, carbs: 1, fat: 20, category: 'Meat', serving: 80 },
  { name: 'Suya (beef)', kcal: 235, protein: 27, carbs: 4, fat: 12, category: 'Meat', serving: 100, servingLabel: '1 stick' },
  { name: 'Kilishi', kcal: 410, protein: 50, carbs: 10, fat: 18, category: 'Meat', serving: 40 },
  { name: 'Asun (peppered goat)', kcal: 240, protein: 25, carbs: 3, fat: 14, category: 'Meat', serving: 100 },
  { name: 'Goat meat', kcal: 143, protein: 27, carbs: 0, fat: 3, category: 'Meat', serving: 100 },
  { name: 'Ram meat', kcal: 195, protein: 25, carbs: 0, fat: 10, category: 'Meat', serving: 100 },
  { name: 'Pork', kcal: 242, protein: 27, carbs: 0, fat: 14, category: 'Meat', serving: 100 },
  { name: 'Bacon', kcal: 540, protein: 37, carbs: 1.4, fat: 42, category: 'Meat', serving: 30 },
  { name: 'Sausage (hot dog)', kcal: 300, protein: 12, carbs: 3, fat: 27, category: 'Meat', serving: 50 },
  { name: 'Gala sausage roll', kcal: 350, protein: 8, carbs: 40, fat: 18, category: 'Meat', serving: 60, servingLabel: '1 roll' },
  { name: 'Corned beef (tinned)', kcal: 250, protein: 26, carbs: 0, fat: 16, category: 'Meat', serving: 60 },
  { name: 'Ponmo (cow skin)', kcal: 190, protein: 30, carbs: 0, fat: 8, category: 'Meat', serving: 60 },
  { name: 'Shaki (tripe)', kcal: 95, protein: 15, carbs: 0, fat: 4, category: 'Meat', serving: 80 },
  { name: 'Roundabout (intestine)', kcal: 180, protein: 14, carbs: 0, fat: 13, category: 'Meat', serving: 80 },
  { name: 'Beef liver', kcal: 175, protein: 27, carbs: 5, fat: 5, category: 'Meat', serving: 100 },
  { name: 'Cow leg', kcal: 200, protein: 20, carbs: 0, fat: 13, category: 'Meat', serving: 120 },
  { name: 'Cow tail', kcal: 260, protein: 20, carbs: 0, fat: 20, category: 'Meat', serving: 120 },
  { name: 'Bush meat (grasscutter)', kcal: 150, protein: 27, carbs: 0, fat: 4, category: 'Meat', serving: 100 },

  /* ================= Poultry ================= */
  { name: 'Chicken (grilled)', kcal: 190, protein: 29, carbs: 0, fat: 8, category: 'Poultry', serving: 120 },
  { name: 'Chicken (boiled)', kcal: 165, protein: 31, carbs: 0, fat: 3.6, category: 'Poultry', serving: 120 },
  { name: 'Chicken (fried)', kcal: 260, protein: 26, carbs: 6, fat: 15, category: 'Poultry', serving: 120, servingLabel: '1 piece' },
  { name: 'Chicken breast (skinless)', kcal: 165, protein: 31, carbs: 0, fat: 3.6, category: 'Poultry', serving: 150 },
  { name: 'Chicken thigh', kcal: 220, protein: 25, carbs: 0, fat: 13, category: 'Poultry', serving: 100 },
  { name: 'Chicken wings', kcal: 265, protein: 24, carbs: 2, fat: 18, category: 'Poultry', serving: 100 },
  { name: 'Peppered chicken', kcal: 240, protein: 25, carbs: 4, fat: 14, category: 'Poultry', serving: 120 },
  { name: 'Chicken gizzard', kcal: 154, protein: 30, carbs: 0, fat: 2.7, category: 'Poultry', serving: 100 },
  { name: 'Peppered gizzard', kcal: 200, protein: 26, carbs: 4, fat: 9, category: 'Poultry', serving: 100 },
  { name: 'Turkey (grilled)', kcal: 189, protein: 29, carbs: 0, fat: 7, category: 'Poultry', serving: 120 },
  { name: 'Fried turkey', kcal: 270, protein: 26, carbs: 3, fat: 17, category: 'Poultry', serving: 120 },
  { name: 'Guinea fowl', kcal: 160, protein: 25, carbs: 0, fat: 6, category: 'Poultry', serving: 120 },

  /* ================= Fish and seafood ================= */
  { name: 'Titus (mackerel)', kcal: 205, protein: 19, carbs: 0, fat: 14, category: 'Fish and seafood', serving: 120 },
  { name: 'Fried titus', kcal: 240, protein: 21, carbs: 4, fat: 15, category: 'Fish and seafood', serving: 120 },
  { name: 'Croaker fish', kcal: 105, protein: 18, carbs: 0, fat: 3, category: 'Fish and seafood', serving: 150 },
  { name: 'Catfish', kcal: 105, protein: 18, carbs: 0, fat: 3, category: 'Fish and seafood', serving: 150 },
  { name: 'Tilapia', kcal: 96, protein: 20, carbs: 0, fat: 1.7, category: 'Fish and seafood', serving: 150 },
  { name: 'Grilled fish', kcal: 140, protein: 22, carbs: 1, fat: 5, category: 'Fish and seafood', serving: 200 },
  { name: 'Fried fish (general)', kcal: 232, protein: 20, carbs: 8, fat: 13, category: 'Fish and seafood', serving: 120 },
  { name: 'Dried fish', kcal: 290, protein: 62, carbs: 0, fat: 5, category: 'Fish and seafood', serving: 40 },
  { name: 'Stockfish', kcal: 290, protein: 63, carbs: 0, fat: 2, category: 'Fish and seafood', serving: 40 },
  { name: 'Smoked fish', kcal: 200, protein: 35, carbs: 0, fat: 6, category: 'Fish and seafood', serving: 60 },
  { name: 'Crayfish (dried, ground)', kcal: 300, protein: 55, carbs: 3, fat: 7, category: 'Fish and seafood', serving: 15 },
  { name: 'Sardine (tinned in oil)', kcal: 208, protein: 24, carbs: 0, fat: 11, category: 'Fish and seafood', serving: 60 },
  { name: 'Tuna (tinned in water)', kcal: 116, protein: 26, carbs: 0, fat: 0.8, category: 'Fish and seafood', serving: 100 },
  { name: 'Salmon', kcal: 208, protein: 20, carbs: 0, fat: 13, category: 'Fish and seafood', serving: 120 },
  { name: 'Prawns', kcal: 99, protein: 24, carbs: 0.2, fat: 0.3, category: 'Fish and seafood', serving: 100 },
  { name: 'Periwinkle', kcal: 90, protein: 15, carbs: 4, fat: 1.5, category: 'Fish and seafood', serving: 60 },
  { name: 'Snail', kcal: 90, protein: 16, carbs: 2, fat: 1.4, category: 'Fish and seafood', serving: 80 },
  { name: 'Crab', kcal: 97, protein: 19, carbs: 0, fat: 1.5, category: 'Fish and seafood', serving: 100 },
  { name: 'Kpomo fish (panla)', kcal: 110, protein: 22, carbs: 0, fat: 2, category: 'Fish and seafood', serving: 100 },

  /* ================= Plantain, yam and potatoes ================= */
  { name: 'Boiled plantain', kcal: 116, protein: 1, carbs: 31, fat: 0.2, category: 'Plantain and tubers', serving: 150 },
  { name: 'Fried plantain (dodo)', kcal: 190, protein: 1.3, carbs: 30, fat: 8, category: 'Plantain and tubers', serving: 120, servingLabel: '6 to 8 pieces' },
  { name: 'Boli (roasted plantain)', kcal: 122, protein: 1.2, carbs: 32, fat: 0.2, category: 'Plantain and tubers', serving: 150 },
  { name: 'Unripe plantain (boiled)', kcal: 105, protein: 1.2, carbs: 28, fat: 0.2, category: 'Plantain and tubers', serving: 150 },
  { name: 'Plantain porridge', kcal: 140, protein: 2, carbs: 27, fat: 3.5, category: 'Plantain and tubers', serving: 300 },
  { name: 'Boiled yam', kcal: 118, protein: 1.5, carbs: 28, fat: 0.2, category: 'Plantain and tubers', serving: 200 },
  { name: 'Fried yam (dundun)', kcal: 220, protein: 1.8, carbs: 33, fat: 9, category: 'Plantain and tubers', serving: 150 },
  { name: 'Roasted yam', kcal: 125, protein: 1.6, carbs: 30, fat: 0.2, category: 'Plantain and tubers', serving: 200 },
  { name: 'Yam porridge (asaro)', kcal: 130, protein: 2, carbs: 25, fat: 3, category: 'Plantain and tubers', serving: 300 },
  { name: 'Yam and egg', kcal: 150, protein: 5, carbs: 22, fat: 5, category: 'Plantain and tubers', serving: 300 },
  { name: 'Sweet potato (boiled)', kcal: 76, protein: 1.4, carbs: 17.7, fat: 0.1, category: 'Plantain and tubers', serving: 200 },
  { name: 'Fried sweet potato', kcal: 200, protein: 1.8, carbs: 30, fat: 8, category: 'Plantain and tubers', serving: 150 },
  { name: 'Irish potato (boiled)', kcal: 87, protein: 2, carbs: 20, fat: 0.1, category: 'Plantain and tubers', serving: 200 },
  { name: 'Potato chips (fries)', kcal: 312, protein: 3.4, carbs: 41, fat: 15, category: 'Plantain and tubers', serving: 120 },
  { name: 'Cocoyam (boiled)', kcal: 145, protein: 2, carbs: 34, fat: 0.2, category: 'Plantain and tubers', serving: 180 },

  /* ================= Bread and breakfast ================= */
  { name: 'Agege bread', kcal: 275, protein: 8, carbs: 52, fat: 3, category: 'Bread and breakfast', serving: 60, servingLabel: '2 slices' },
  { name: 'Sliced white bread', kcal: 265, protein: 9, carbs: 49, fat: 3.2, category: 'Bread and breakfast', serving: 60, servingLabel: '2 slices' },
  { name: 'Wholemeal bread', kcal: 247, protein: 13, carbs: 41, fat: 3.4, category: 'Bread and breakfast', serving: 60 },
  { name: 'Coconut bread', kcal: 300, protein: 7, carbs: 48, fat: 9, category: 'Bread and breakfast', serving: 60 },
  { name: 'Butter bread', kcal: 300, protein: 8, carbs: 50, fat: 8, category: 'Bread and breakfast', serving: 60 },
  { name: 'Bread and butter', kcal: 330, protein: 7, carbs: 45, fat: 14, category: 'Bread and breakfast', serving: 70 },
  { name: 'Pancake', kcal: 230, protein: 6, carbs: 32, fat: 8, category: 'Bread and breakfast', serving: 100 },
  { name: 'Nigerian pancake (masa)', kcal: 210, protein: 4, carbs: 34, fat: 6, category: 'Bread and breakfast', serving: 100 },
  { name: 'Waffle', kcal: 290, protein: 7, carbs: 33, fat: 14, category: 'Bread and breakfast', serving: 90 },
  { name: 'Pap (akamu, ogi)', kcal: 60, protein: 1, carbs: 13, fat: 0.3, category: 'Bread and breakfast', serving: 300, servingLabel: '1 bowl' },
  { name: 'Custard', kcal: 75, protein: 1.5, carbs: 15, fat: 1, category: 'Bread and breakfast', serving: 300 },
  { name: 'Oatmeal (cooked)', kcal: 71, protein: 2.5, carbs: 12, fat: 1.5, category: 'Bread and breakfast', serving: 250 },
  { name: 'Golden Morn', kcal: 390, protein: 9, carbs: 75, fat: 5, category: 'Bread and breakfast', serving: 50 },
  { name: 'Cornflakes', kcal: 357, protein: 7, carbs: 84, fat: 0.4, category: 'Bread and breakfast', serving: 40 },
  { name: 'Weetabix', kcal: 358, protein: 12, carbs: 69, fat: 2, category: 'Bread and breakfast', serving: 40 },
  { name: 'Granola', kcal: 470, protein: 10, carbs: 64, fat: 20, category: 'Bread and breakfast', serving: 50 },
  { name: 'Chapati', kcal: 297, protein: 8, carbs: 48, fat: 7, category: 'Bread and breakfast', serving: 70 },

  /* ================= Pasta and noodles ================= */
  { name: 'Spaghetti (cooked)', kcal: 158, protein: 6, carbs: 31, fat: 0.9, category: 'Pasta and noodles', serving: 250 },
  { name: 'Jollof spaghetti', kcal: 165, protein: 5, carbs: 27, fat: 4, category: 'Pasta and noodles', serving: 250 },
  { name: 'Macaroni (cooked)', kcal: 158, protein: 6, carbs: 31, fat: 0.9, category: 'Pasta and noodles', serving: 250 },
  { name: 'Indomie noodles (cooked)', kcal: 185, protein: 4, carbs: 25, fat: 7, category: 'Pasta and noodles', serving: 150, servingLabel: '1 pack' },
  { name: 'Indomie with egg', kcal: 195, protein: 7, carbs: 22, fat: 9, category: 'Pasta and noodles', serving: 200 },
  { name: 'Noodles (dry pack)', kcal: 450, protein: 9, carbs: 60, fat: 19, category: 'Pasta and noodles', serving: 70, servingLabel: '1 pack' },
  { name: 'Pasta in tomato sauce', kcal: 150, protein: 5, carbs: 26, fat: 3.5, category: 'Pasta and noodles', serving: 300 },

  /* ================= Street food and small chops ================= */
  { name: 'Puff puff', kcal: 320, protein: 5, carbs: 45, fat: 13, category: 'Street food', serving: 80, servingLabel: '4 balls' },
  { name: 'Buns', kcal: 350, protein: 6, carbs: 46, fat: 16, category: 'Street food', serving: 80 },
  { name: 'Chin chin', kcal: 480, protein: 8, carbs: 60, fat: 23, category: 'Street food', serving: 60 },
  { name: 'Meat pie', kcal: 300, protein: 8, carbs: 33, fat: 15, category: 'Street food', serving: 120, servingLabel: '1 pie' },
  { name: 'Fish pie', kcal: 290, protein: 9, carbs: 32, fat: 14, category: 'Street food', serving: 120 },
  { name: 'Fish roll', kcal: 330, protein: 9, carbs: 35, fat: 17, category: 'Street food', serving: 80 },
  { name: 'Egg roll', kcal: 340, protein: 9, carbs: 34, fat: 18, category: 'Street food', serving: 100, servingLabel: '1 roll' },
  { name: 'Sausage roll', kcal: 350, protein: 8, carbs: 32, fat: 21, category: 'Street food', serving: 80 },
  { name: 'Scotch egg', kcal: 300, protein: 12, carbs: 20, fat: 19, category: 'Street food', serving: 110 },
  { name: 'Samosa', kcal: 310, protein: 7, carbs: 30, fat: 18, category: 'Street food', serving: 50, servingLabel: '1 piece' },
  { name: 'Spring roll', kcal: 290, protein: 6, carbs: 32, fat: 15, category: 'Street food', serving: 50 },
  { name: 'Kuli kuli', kcal: 500, protein: 25, carbs: 25, fat: 33, category: 'Street food', serving: 40 },
  { name: 'Donkwa', kcal: 420, protein: 12, carbs: 50, fat: 19, category: 'Street food', serving: 50 },
  { name: 'Kokoro', kcal: 450, protein: 5, carbs: 62, fat: 20, category: 'Street food', serving: 50 },
  { name: 'Aadun', kcal: 400, protein: 6, carbs: 60, fat: 15, category: 'Street food', serving: 60 },
  { name: 'Robo (melon cake)', kcal: 470, protein: 20, carbs: 20, fat: 35, category: 'Street food', serving: 40 },
  { name: 'Coconut candy', kcal: 450, protein: 4, carbs: 45, fat: 28, category: 'Street food', serving: 40 },
  { name: 'Plantain chips', kcal: 519, protein: 2, carbs: 58, fat: 30, category: 'Street food', serving: 40, servingLabel: '1 small pack' },
  { name: 'Cassava chips', kcal: 480, protein: 2, carbs: 62, fat: 24, category: 'Street food', serving: 40 },
  { name: 'Potato crisps', kcal: 536, protein: 7, carbs: 53, fat: 35, category: 'Street food', serving: 40 },
  { name: 'Groundnut (roasted)', kcal: 585, protein: 26, carbs: 16, fat: 49, category: 'Street food', serving: 40 },
  { name: 'Boiled groundnut', kcal: 320, protein: 15, carbs: 20, fat: 22, category: 'Street food', serving: 60 },
  { name: 'Shawarma', kcal: 215, protein: 13, carbs: 20, fat: 9, category: 'Street food', serving: 250, servingLabel: '1 wrap' },
  { name: 'Small chops (mixed)', kcal: 350, protein: 9, carbs: 32, fat: 21, category: 'Street food', serving: 150 },
  { name: 'Asun (peppered)', kcal: 240, protein: 25, carbs: 3, fat: 14, category: 'Street food', serving: 100 },
  { name: 'Tanfiri', kcal: 460, protein: 10, carbs: 55, fat: 22, category: 'Street food', serving: 40 },

  /* ================= Snacks, biscuits and sweets ================= */
  { name: 'Digestive biscuits', kcal: 480, protein: 7, carbs: 65, fat: 21, category: 'Snacks and sweets', serving: 30 },
  { name: 'Cabin biscuit', kcal: 430, protein: 9, carbs: 72, fat: 12, category: 'Snacks and sweets', serving: 30 },
  { name: 'Cream crackers', kcal: 440, protein: 9, carbs: 68, fat: 14, category: 'Snacks and sweets', serving: 30 },
  { name: 'Speedy biscuit', kcal: 470, protein: 7, carbs: 68, fat: 19, category: 'Snacks and sweets', serving: 30 },
  { name: 'Wafer biscuit', kcal: 510, protein: 5, carbs: 62, fat: 27, category: 'Snacks and sweets', serving: 40 },
  { name: 'Chocolate bar', kcal: 546, protein: 4.9, carbs: 61, fat: 31, category: 'Snacks and sweets', serving: 40 },
  { name: 'Doughnut', kcal: 452, protein: 4.9, carbs: 51, fat: 25, category: 'Snacks and sweets', serving: 70, servingLabel: '1 doughnut' },
  { name: 'Cake (sponge)', kcal: 350, protein: 5, carbs: 50, fat: 15, category: 'Snacks and sweets', serving: 90, servingLabel: '1 slice' },
  { name: 'Meat floss bread', kcal: 330, protein: 10, carbs: 42, fat: 13, category: 'Snacks and sweets', serving: 90 },
  { name: 'Ice cream', kcal: 207, protein: 3.5, carbs: 24, fat: 11, category: 'Snacks and sweets', serving: 100 },
  { name: 'Popcorn', kcal: 375, protein: 11, carbs: 74, fat: 4.5, category: 'Snacks and sweets', serving: 30 },
  { name: 'Sweets (boiled)', kcal: 390, protein: 0, carbs: 98, fat: 0, category: 'Snacks and sweets', serving: 20 },
  { name: 'Chewing gum', kcal: 300, protein: 0, carbs: 75, fat: 0, category: 'Snacks and sweets', serving: 3 },
  { name: 'Sugar', kcal: 387, protein: 0, carbs: 100, fat: 0, category: 'Snacks and sweets', serving: 8, servingLabel: '2 tsp' },
  { name: 'Honey', kcal: 304, protein: 0.3, carbs: 82, fat: 0, category: 'Snacks and sweets', serving: 20 },
  { name: 'Jam', kcal: 250, protein: 0.4, carbs: 62, fat: 0.1, category: 'Snacks and sweets', serving: 20 },
  { name: 'Chocolate spread', kcal: 540, protein: 6, carbs: 57, fat: 31, category: 'Snacks and sweets', serving: 20 },
  { name: 'Peanut butter', kcal: 588, protein: 25, carbs: 20, fat: 50, category: 'Snacks and sweets', serving: 20 },

  /* ================= Fast food and international ================= */
  { name: 'Pizza', kcal: 266, protein: 11, carbs: 33, fat: 10, category: 'Fast food', serving: 130, servingLabel: '1 slice' },
  { name: 'Beef burger', kcal: 295, protein: 17, carbs: 24, fat: 14, category: 'Fast food', serving: 180 },
  { name: 'Chicken burger', kcal: 270, protein: 16, carbs: 27, fat: 11, category: 'Fast food', serving: 180 },
  { name: 'Club sandwich', kcal: 250, protein: 12, carbs: 25, fat: 11, category: 'Fast food', serving: 200 },
  { name: 'Hot dog', kcal: 290, protein: 11, carbs: 27, fat: 16, category: 'Fast food', serving: 140 },
  { name: 'Fried chicken (fast food)', kcal: 290, protein: 24, carbs: 12, fat: 17, category: 'Fast food', serving: 120 },
  { name: 'Chicken and chips', kcal: 280, protein: 15, carbs: 26, fat: 13, category: 'Fast food', serving: 300 },
  { name: 'Beef roll', kcal: 330, protein: 10, carbs: 34, fat: 17, category: 'Fast food', serving: 90 },
  { name: 'Burrito', kcal: 220, protein: 10, carbs: 28, fat: 8, category: 'Fast food', serving: 250 },
  { name: 'Sushi roll', kcal: 145, protein: 6, carbs: 25, fat: 2, category: 'Fast food', serving: 150 },
  { name: 'Chicken salad', kcal: 130, protein: 12, carbs: 5, fat: 7, category: 'Fast food', serving: 200 },

  /* ================= Vegetables ================= */
  { name: 'Ugu (pumpkin leaf)', kcal: 34, protein: 4, carbs: 4, fat: 0.4, category: 'Vegetables', serving: 80 },
  { name: 'Waterleaf', kcal: 28, protein: 2.4, carbs: 4, fat: 0.4, category: 'Vegetables', serving: 80 },
  { name: 'Bitterleaf', kcal: 52, protein: 5, carbs: 6, fat: 0.8, category: 'Vegetables', serving: 80 },
  { name: 'Scent leaf (efirin)', kcal: 40, protein: 3, carbs: 5, fat: 0.6, category: 'Vegetables', serving: 20 },
  { name: 'Utazi', kcal: 45, protein: 4, carbs: 5, fat: 0.7, category: 'Vegetables', serving: 20 },
  { name: 'Uziza leaf', kcal: 45, protein: 4, carbs: 5, fat: 0.8, category: 'Vegetables', serving: 20 },
  { name: 'Soko (celosia)', kcal: 30, protein: 3, carbs: 4, fat: 0.4, category: 'Vegetables', serving: 80 },
  { name: 'Tete (amaranth)', kcal: 32, protein: 3.2, carbs: 4.5, fat: 0.4, category: 'Vegetables', serving: 80 },
  { name: 'Ewedu leaf (jute)', kcal: 34, protein: 4.6, carbs: 5.8, fat: 0.3, category: 'Vegetables', serving: 80 },
  { name: 'Okra (fresh)', kcal: 33, protein: 1.9, carbs: 7, fat: 0.2, category: 'Vegetables', serving: 100 },
  { name: 'Spinach', kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, category: 'Vegetables', serving: 80 },
  { name: 'Cabbage', kcal: 25, protein: 1.3, carbs: 6, fat: 0.1, category: 'Vegetables', serving: 80 },
  { name: 'Lettuce', kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2, category: 'Vegetables', serving: 50 },
  { name: 'Tomato', kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, category: 'Vegetables', serving: 100 },
  { name: 'Cucumber', kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, category: 'Vegetables', serving: 100 },
  { name: 'Carrot', kcal: 41, protein: 0.9, carbs: 10, fat: 0.2, category: 'Vegetables', serving: 80 },
  { name: 'Onion', kcal: 40, protein: 1.1, carbs: 9, fat: 0.1, category: 'Vegetables', serving: 50 },
  { name: 'Bell pepper (tatashe)', kcal: 31, protein: 1, carbs: 6, fat: 0.3, category: 'Vegetables', serving: 80 },
  { name: 'Scotch bonnet (rodo)', kcal: 40, protein: 1.9, carbs: 9, fat: 0.4, category: 'Vegetables', serving: 15 },
  { name: 'Garden egg', kcal: 25, protein: 1, carbs: 6, fat: 0.2, category: 'Vegetables', serving: 80 },
  { name: 'Green beans', kcal: 31, protein: 1.8, carbs: 7, fat: 0.1, category: 'Vegetables', serving: 80 },
  { name: 'Green peas', kcal: 81, protein: 5.4, carbs: 14, fat: 0.4, category: 'Vegetables', serving: 80 },
  { name: 'Sweet corn (tinned)', kcal: 81, protein: 2.7, carbs: 17, fat: 1.2, category: 'Vegetables', serving: 80 },
  { name: 'Broccoli', kcal: 34, protein: 2.8, carbs: 7, fat: 0.4, category: 'Vegetables', serving: 80 },
  { name: 'Mushroom', kcal: 22, protein: 3.1, carbs: 3.3, fat: 0.3, category: 'Vegetables', serving: 80 },
  { name: 'Coleslaw', kcal: 150, protein: 1, carbs: 12, fat: 11, category: 'Vegetables', serving: 100 },
  { name: 'Vegetable salad (with cream)', kcal: 130, protein: 2, carbs: 8, fat: 10, category: 'Vegetables', serving: 150 },
  { name: 'Avocado (ube oyibo)', kcal: 160, protein: 2, carbs: 9, fat: 15, category: 'Vegetables', serving: 100 },

  /* ================= Fruit ================= */
  { name: 'Banana', kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, category: 'Fruit', serving: 120, servingLabel: '1 medium' },
  { name: 'Orange', kcal: 47, protein: 0.9, carbs: 12, fat: 0.1, category: 'Fruit', serving: 150, servingLabel: '1 medium' },
  { name: 'Tangerine', kcal: 53, protein: 0.8, carbs: 13, fat: 0.3, category: 'Fruit', serving: 100 },
  { name: 'Pineapple', kcal: 50, protein: 0.5, carbs: 13, fat: 0.1, category: 'Fruit', serving: 150 },
  { name: 'Watermelon', kcal: 30, protein: 0.6, carbs: 8, fat: 0.2, category: 'Fruit', serving: 250 },
  { name: 'Mango', kcal: 60, protein: 0.8, carbs: 15, fat: 0.4, category: 'Fruit', serving: 200, servingLabel: '1 medium' },
  { name: 'Pawpaw', kcal: 43, protein: 0.5, carbs: 11, fat: 0.3, category: 'Fruit', serving: 200 },
  { name: 'Guava', kcal: 68, protein: 2.6, carbs: 14, fat: 1, category: 'Fruit', serving: 100 },
  { name: 'Soursop', kcal: 66, protein: 1, carbs: 17, fat: 0.3, category: 'Fruit', serving: 150 },
  { name: 'African star apple (agbalumo)', kcal: 67, protein: 1, carbs: 16, fat: 0.3, category: 'Fruit', serving: 60 },
  { name: 'African pear (ube)', kcal: 250, protein: 5, carbs: 10, fat: 22, category: 'Fruit', serving: 60 },
  { name: 'Cashew fruit', kcal: 46, protein: 0.8, carbs: 11, fat: 0.3, category: 'Fruit', serving: 120 },
  { name: 'Velvet tamarind (icheku)', kcal: 240, protein: 3, carbs: 60, fat: 0.5, category: 'Fruit', serving: 40 },
  { name: 'Apple', kcal: 52, protein: 0.3, carbs: 14, fat: 0.2, category: 'Fruit', serving: 180, servingLabel: '1 medium' },
  { name: 'Grapes', kcal: 69, protein: 0.7, carbs: 18, fat: 0.2, category: 'Fruit', serving: 100 },
  { name: 'Strawberry', kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3, category: 'Fruit', serving: 100 },
  { name: 'Dates', kcal: 282, protein: 2.5, carbs: 75, fat: 0.4, category: 'Fruit', serving: 40 },
  { name: 'Coconut (fresh)', kcal: 354, protein: 3.3, carbs: 15, fat: 33, category: 'Fruit', serving: 50 },
  { name: 'Lime', kcal: 30, protein: 0.7, carbs: 11, fat: 0.2, category: 'Fruit', serving: 40 },
  { name: 'Lemon', kcal: 29, protein: 1.1, carbs: 9, fat: 0.3, category: 'Fruit', serving: 60 },
  { name: 'Fruit salad', kcal: 60, protein: 0.7, carbs: 15, fat: 0.2, category: 'Fruit', serving: 200 },
  // Chewed cane: the fibre is spat out, so the numbers below are per 100 ml of
  // the juice actually swallowed, not per 100 g of cane. One 8 inch stick gives
  // roughly 70 ml, so a piece is counted at 70 g.
  // Label stays "1 stick" with no parenthetical: describeSize pluralises by
  // appending an s, so "1 stick (juice)" would read "3 stick (juice)s".
  { name: 'Sugar cane (chewed, juice only)', kcal: 73, protein: 0.2, carbs: 18, fat: 0.1, category: 'Fruit', serving: 70, servingLabel: '1 stick', pieceGrams: 70, pieceLabel: '1 stick', aliases: ['sugarcane', 'cane', 'reke', 'oke oyibo'] },
  { name: 'Sugar cane juice', kcal: 73, protein: 0.2, carbs: 18, fat: 0.1, category: 'Fruit', serving: 250, isLiquid: true, aliases: ['sugarcane juice', 'cane juice'] },

  /* ================= Nuts and seeds ================= */
  { name: 'Cashew nuts', kcal: 553, protein: 18, carbs: 30, fat: 44, category: 'Nuts and seeds', serving: 40 },
  { name: 'Tiger nuts', kcal: 400, protein: 5, carbs: 60, fat: 24, category: 'Nuts and seeds', serving: 40 },
  { name: 'African walnut', kcal: 400, protein: 18, carbs: 25, fat: 26, category: 'Nuts and seeds', serving: 40 },
  { name: 'Almonds', kcal: 579, protein: 21, carbs: 22, fat: 50, category: 'Nuts and seeds', serving: 30 },
  { name: 'Egusi (melon seed)', kcal: 590, protein: 28, carbs: 15, fat: 47, category: 'Nuts and seeds', serving: 40 },
  { name: 'Ogbono seed', kcal: 570, protein: 8, carbs: 15, fat: 55, category: 'Nuts and seeds', serving: 30 },
  { name: 'Benniseed (sesame)', kcal: 573, protein: 18, carbs: 23, fat: 50, category: 'Nuts and seeds', serving: 20 },
  { name: 'Lentils (cooked)', kcal: 116, protein: 9, carbs: 20, fat: 0.4, category: 'Nuts and seeds', serving: 200 },
  { name: 'Chickpeas (cooked)', kcal: 164, protein: 9, carbs: 27, fat: 2.6, category: 'Nuts and seeds', serving: 150 },
  { name: 'Soya beans (cooked)', kcal: 173, protein: 17, carbs: 10, fat: 9, category: 'Nuts and seeds', serving: 150 },
  { name: 'Tofu', kcal: 76, protein: 8, carbs: 1.9, fat: 4.8, category: 'Nuts and seeds', serving: 120 },
  { name: 'Wara (local cheese)', kcal: 200, protein: 15, carbs: 3, fat: 14, category: 'Nuts and seeds', serving: 80 },

  /* ================= Dairy ================= */
  { name: 'Whole milk', kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3, category: 'Dairy', serving: 250 },
  { name: 'Semi-skimmed milk', kcal: 50, protein: 3.4, carbs: 5, fat: 1.8, category: 'Dairy', serving: 250 },
  { name: 'Powdered milk (Peak, Dano)', kcal: 496, protein: 26, carbs: 38, fat: 27, category: 'Dairy', serving: 25, servingLabel: '2 tbsp' },
  { name: 'Evaporated milk', kcal: 135, protein: 7, carbs: 10, fat: 7.6, category: 'Dairy', serving: 50 },
  { name: 'Condensed milk (sweetened)', kcal: 321, protein: 8, carbs: 54, fat: 9, category: 'Dairy', serving: 30 },
  { name: 'Yoghurt (plain)', kcal: 61, protein: 3.5, carbs: 4.7, fat: 3.3, category: 'Dairy', serving: 200 },
  { name: 'Yoghurt (sweetened)', kcal: 95, protein: 3.4, carbs: 15, fat: 2.5, category: 'Dairy', serving: 200 },
  { name: 'Greek yoghurt', kcal: 97, protein: 9, carbs: 3.6, fat: 5, category: 'Dairy', serving: 170 },
  { name: 'Cheddar cheese', kcal: 402, protein: 25, carbs: 1.3, fat: 33, category: 'Dairy', serving: 30 },
  { name: 'Butter', kcal: 717, protein: 0.9, carbs: 0.1, fat: 81, category: 'Dairy', serving: 10, servingLabel: '2 tsp' },
  { name: 'Margarine', kcal: 717, protein: 0.2, carbs: 0.7, fat: 80, category: 'Dairy', serving: 10 },

  /* ================= Fats, oils and condiments ================= */
  { name: 'Palm oil', kcal: 884, protein: 0, carbs: 0, fat: 100, category: 'Oils and condiments', serving: 14, servingLabel: '1 tbsp' },
  { name: 'Vegetable oil', kcal: 884, protein: 0, carbs: 0, fat: 100, category: 'Oils and condiments', serving: 14, servingLabel: '1 tbsp' },
  { name: 'Groundnut oil', kcal: 884, protein: 0, carbs: 0, fat: 100, category: 'Oils and condiments', serving: 14 },
  { name: 'Olive oil', kcal: 884, protein: 0, carbs: 0, fat: 100, category: 'Oils and condiments', serving: 14 },
  { name: 'Coconut oil', kcal: 892, protein: 0, carbs: 0, fat: 100, category: 'Oils and condiments', serving: 14 },
  { name: 'Mayonnaise', kcal: 680, protein: 1, carbs: 0.6, fat: 75, category: 'Oils and condiments', serving: 15 },
  { name: 'Salad cream', kcal: 350, protein: 1, carbs: 17, fat: 31, category: 'Oils and condiments', serving: 20 },
  { name: 'Ketchup', kcal: 100, protein: 1, carbs: 24, fat: 0.1, category: 'Oils and condiments', serving: 20 },
  { name: 'Tomato paste', kcal: 82, protein: 4, carbs: 19, fat: 0.5, category: 'Oils and condiments', serving: 30 },
  { name: 'Maggi or Knorr cube', kcal: 240, protein: 10, carbs: 25, fat: 11, category: 'Oils and condiments', serving: 4, servingLabel: '1 cube' },
  { name: 'Iru (locust bean)', kcal: 300, protein: 30, carbs: 20, fat: 12, category: 'Oils and condiments', serving: 15 },
  { name: 'Ogiri', kcal: 300, protein: 25, carbs: 18, fat: 15, category: 'Oils and condiments', serving: 10 },
  { name: 'Yaji (suya spice)', kcal: 400, protein: 18, carbs: 30, fat: 22, category: 'Oils and condiments', serving: 10 },
  { name: 'Salt', kcal: 0, protein: 0, carbs: 0, fat: 0, category: 'Oils and condiments', serving: 2 },

  /* ================= Soft drinks ================= */
  { name: 'Coca-Cola', kcal: 42, protein: 0, carbs: 10.6, fat: 0, category: 'Soft drinks', serving: 330, servingLabel: '1 can' },
  { name: 'Pepsi', kcal: 43, protein: 0, carbs: 11, fat: 0, category: 'Soft drinks', serving: 330 },
  { name: 'Fanta', kcal: 44, protein: 0, carbs: 11, fat: 0, category: 'Soft drinks', serving: 330 },
  { name: 'Sprite', kcal: 39, protein: 0, carbs: 9.8, fat: 0, category: 'Soft drinks', serving: 330 },
  { name: '7Up', kcal: 40, protein: 0, carbs: 10, fat: 0, category: 'Soft drinks', serving: 330 },
  { name: 'Mirinda', kcal: 45, protein: 0, carbs: 11.4, fat: 0, category: 'Soft drinks', serving: 330 },
  { name: 'Bigi cola', kcal: 42, protein: 0, carbs: 10.5, fat: 0, category: 'Soft drinks', serving: 350 },
  { name: 'LaCasera', kcal: 48, protein: 0, carbs: 12, fat: 0, category: 'Soft drinks', serving: 330 },
  { name: 'Schweppes', kcal: 40, protein: 0, carbs: 10, fat: 0, category: 'Soft drinks', serving: 330 },
  { name: 'Coca-Cola Zero', kcal: 0.3, protein: 0, carbs: 0, fat: 0, category: 'Soft drinks', serving: 330 },
  { name: 'Soda water', kcal: 0, protein: 0, carbs: 0, fat: 0, category: 'Soft drinks', serving: 330 },
  { name: 'Water', kcal: 0, protein: 0, carbs: 0, fat: 0, category: 'Soft drinks', serving: 500, servingLabel: '1 bottle' },

  /* ================= Juices and dairy drinks ================= */
  { name: 'Orange juice', kcal: 45, protein: 0.7, carbs: 10, fat: 0.2, category: 'Juices and dairy drinks', serving: 250 },
  { name: 'Chivita juice', kcal: 50, protein: 0.3, carbs: 12, fat: 0, category: 'Juices and dairy drinks', serving: 250 },
  { name: 'Chi Exotic juice', kcal: 52, protein: 0.3, carbs: 12.5, fat: 0, category: 'Juices and dairy drinks', serving: 250 },
  { name: 'Hollandia yoghurt', kcal: 85, protein: 2.6, carbs: 14, fat: 2, category: 'Juices and dairy drinks', serving: 250 },
  { name: 'Viju milk drink', kcal: 80, protein: 2, carbs: 13, fat: 2, category: 'Juices and dairy drinks', serving: 250 },
  { name: 'Nutri Milk', kcal: 75, protein: 2.4, carbs: 11, fat: 2.2, category: 'Juices and dairy drinks', serving: 250 },
  { name: 'Soya milk', kcal: 54, protein: 3.3, carbs: 6, fat: 1.8, category: 'Juices and dairy drinks', serving: 250 },
  { name: 'Smoothie (fruit)', kcal: 60, protein: 1, carbs: 14, fat: 0.3, category: 'Juices and dairy drinks', serving: 300 },
  { name: 'Chapman', kcal: 60, protein: 0, carbs: 15, fat: 0, category: 'Juices and dairy drinks', serving: 300 },

  /* ================= Local drinks ================= */
  { name: 'Zobo (unsweetened)', kcal: 15, protein: 0, carbs: 3, fat: 0, category: 'Local drinks', serving: 300 },
  { name: 'Zobo (sweetened)', kcal: 45, protein: 0, carbs: 11, fat: 0, category: 'Local drinks', serving: 300 },
  { name: 'Kunu (millet)', kcal: 45, protein: 1, carbs: 9, fat: 0.5, category: 'Local drinks', serving: 300 },
  { name: 'Kunun aya (tiger nut)', kcal: 70, protein: 1.5, carbs: 12, fat: 2, category: 'Local drinks', serving: 300 },
  { name: 'Palm wine', kcal: 45, protein: 0.2, carbs: 5, fat: 0, category: 'Local drinks', serving: 300 },
  { name: 'Fura da nono', kcal: 90, protein: 3, carbs: 14, fat: 2.5, category: 'Local drinks', serving: 300 },
  { name: 'Nono (fermented milk)', kcal: 60, protein: 3.2, carbs: 5, fat: 3, category: 'Local drinks', serving: 250 },
  { name: 'Agbo (herbal mix)', kcal: 10, protein: 0, carbs: 2, fat: 0, category: 'Local drinks', serving: 150 },

  /* ================= Hot drinks and powders ================= */
  { name: 'Black coffee', kcal: 2, protein: 0.1, carbs: 0, fat: 0, category: 'Hot drinks', serving: 250 },
  { name: 'Coffee with milk and sugar', kcal: 45, protein: 1.6, carbs: 7, fat: 1.2, category: 'Hot drinks', serving: 250 },
  { name: 'Tea (unsweetened)', kcal: 1, protein: 0, carbs: 0.2, fat: 0, category: 'Hot drinks', serving: 250 },
  { name: 'Tea with milk and sugar', kcal: 45, protein: 1.5, carbs: 7.5, fat: 1.2, category: 'Hot drinks', serving: 250 },
  { name: 'Milo (powder)', kcal: 400, protein: 8, carbs: 75, fat: 8, category: 'Hot drinks', serving: 20, servingLabel: '2 tbsp' },
  { name: 'Bournvita (powder)', kcal: 390, protein: 7, carbs: 80, fat: 5, category: 'Hot drinks', serving: 20 },
  { name: 'Ovaltine (powder)', kcal: 380, protein: 8, carbs: 78, fat: 4, category: 'Hot drinks', serving: 20 },
  { name: 'Hot chocolate (made up)', kcal: 80, protein: 3, carbs: 13, fat: 2, category: 'Hot drinks', serving: 250 },

  /* ================= Alcohol ================= */
  { name: 'Beer (Star, Gulder)', kcal: 43, protein: 0.5, carbs: 3.6, fat: 0, category: 'Alcohol', serving: 600, servingLabel: '1 big bottle' },
  { name: 'Beer (small bottle)', kcal: 43, protein: 0.5, carbs: 3.6, fat: 0, category: 'Alcohol', serving: 330 },
  { name: 'Guinness stout', kcal: 48, protein: 0.6, carbs: 4.5, fat: 0, category: 'Alcohol', serving: 600 },
  { name: 'Legend stout', kcal: 55, protein: 0.6, carbs: 6, fat: 0, category: 'Alcohol', serving: 600 },
  { name: 'Heineken', kcal: 42, protein: 0.4, carbs: 3.2, fat: 0, category: 'Alcohol', serving: 330 },
  { name: 'Smirnoff Ice', kcal: 62, protein: 0, carbs: 8, fat: 0, category: 'Alcohol', serving: 275 },
  { name: 'Orijin', kcal: 65, protein: 0, carbs: 9, fat: 0, category: 'Alcohol', serving: 330 },
  { name: 'Red wine', kcal: 85, protein: 0.1, carbs: 2.6, fat: 0, category: 'Alcohol', serving: 150, servingLabel: '1 glass' },
  { name: 'White wine', kcal: 82, protein: 0.1, carbs: 2.6, fat: 0, category: 'Alcohol', serving: 150 },
  { name: 'Spirits (whisky, gin, vodka)', kcal: 250, protein: 0, carbs: 0, fat: 0, category: 'Alcohol', serving: 40, servingLabel: '1 shot' },
  { name: 'Ogogoro', kcal: 250, protein: 0, carbs: 0, fat: 0, category: 'Alcohol', serving: 40 },

  /* ================= Energy and sports drinks ================= */
  { name: 'Red Bull', kcal: 45, protein: 0, carbs: 11, fat: 0, category: 'Energy drinks', serving: 250, servingLabel: '1 can' },
  { name: 'Power Horse', kcal: 48, protein: 0, carbs: 11.5, fat: 0, category: 'Energy drinks', serving: 250 },
  { name: 'Fearless', kcal: 46, protein: 0, carbs: 11, fat: 0, category: 'Energy drinks', serving: 250 },
  { name: 'Predator', kcal: 45, protein: 0, carbs: 11, fat: 0, category: 'Energy drinks', serving: 250 },
  { name: 'Bullet energy drink', kcal: 47, protein: 0, carbs: 11.5, fat: 0, category: 'Energy drinks', serving: 250 },
  { name: 'Lucozade Boost', kcal: 70, protein: 0, carbs: 17, fat: 0, category: 'Energy drinks', serving: 380 },
  { name: 'Sports drink', kcal: 24, protein: 0, carbs: 6, fat: 0, category: 'Energy drinks', serving: 500 },
  { name: 'Whey protein (powder)', kcal: 380, protein: 78, carbs: 8, fat: 5, category: 'Energy drinks', serving: 30, servingLabel: '1 scoop' },

  /* ================= Malt drinks ================= */
  { name: 'Maltina', kcal: 68, protein: 0.5, carbs: 15, fat: 0, category: 'Malt drinks', serving: 330, servingLabel: '1 bottle' },
  { name: 'Malta Guinness', kcal: 72, protein: 0.6, carbs: 16, fat: 0, category: 'Malt drinks', serving: 330 },
  { name: 'Amstel Malta', kcal: 64, protein: 0.5, carbs: 14, fat: 0, category: 'Malt drinks', serving: 330 },
  { name: 'Grand Malt', kcal: 70, protein: 0.5, carbs: 15.5, fat: 0, category: 'Malt drinks', serving: 330 },
  { name: 'Hi-Malt', kcal: 69, protein: 0.5, carbs: 15, fat: 0, category: 'Malt drinks', serving: 330 },
]

/**
 * Preparation variants and gaps found on a second pass. The same ingredient
 * cooked three ways is three different calorie counts, and picking "chicken"
 * when you ate it fried is the most common way a food log goes wrong.
 */
const PREPARATIONS: LibraryFood[] = [
  /* ---- eggs ---- */
  { name: 'Egg (poached)', kcal: 143, protein: 12.5, carbs: 0.7, fat: 9.5, category: 'Beans and eggs', serving: 50, pieceGrams: 50, pieceLabel: '1 egg' },
  { name: 'Egg white omelette', kcal: 60, protein: 12, carbs: 1, fat: 0.5, category: 'Beans and eggs', serving: 120 },
  { name: 'Egg (raw)', kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5, category: 'Beans and eggs', serving: 50, pieceGrams: 50, pieceLabel: '1 egg' },

  /* ---- fish ---- */
  { name: 'Boiled fish', kcal: 105, protein: 21, carbs: 0, fat: 2.5, category: 'Fish and seafood', serving: 150 },
  { name: 'Steamed fish', kcal: 110, protein: 22, carbs: 0, fat: 2.5, category: 'Fish and seafood', serving: 150 },
  { name: 'Peppered fish', kcal: 175, protein: 20, carbs: 4, fat: 9, category: 'Fish and seafood', serving: 150 },
  { name: 'Roasted fish', kcal: 155, protein: 23, carbs: 2, fat: 6, category: 'Fish and seafood', serving: 200 },
  { name: 'Fried prawns', kcal: 240, protein: 20, carbs: 10, fat: 14, category: 'Fish and seafood', serving: 100 },
  { name: 'Peppered prawns', kcal: 160, protein: 22, carbs: 4, fat: 6, category: 'Fish and seafood', serving: 100 },
  { name: 'Peppered snail', kcal: 140, protein: 16, carbs: 4, fat: 7, category: 'Fish and seafood', serving: 80 },
  { name: 'Fried snail', kcal: 200, protein: 16, carbs: 6, fat: 13, category: 'Fish and seafood', serving: 80 },

  /* ---- poultry ---- */
  { name: 'Roasted chicken', kcal: 200, protein: 28, carbs: 0, fat: 10, category: 'Poultry', serving: 120 },
  { name: 'Barbecue chicken', kcal: 215, protein: 27, carbs: 5, fat: 10, category: 'Poultry', serving: 120 },
  { name: 'Smoked chicken', kcal: 190, protein: 29, carbs: 0, fat: 8, category: 'Poultry', serving: 120 },
  { name: 'Chicken suya', kcal: 220, protein: 28, carbs: 4, fat: 10, category: 'Poultry', serving: 100, pieceGrams: 100, pieceLabel: '1 stick' },
  { name: 'Fried gizzard', kcal: 240, protein: 26, carbs: 5, fat: 13, category: 'Poultry', serving: 100 },
  { name: 'Gizdodo', kcal: 210, protein: 12, carbs: 20, fat: 10, category: 'Poultry', serving: 200 },
  { name: 'Chicken nuggets', kcal: 290, protein: 15, carbs: 18, fat: 18, category: 'Poultry', serving: 100 },
  { name: 'Smoked turkey', kcal: 200, protein: 28, carbs: 0, fat: 9, category: 'Poultry', serving: 120 },
  { name: 'Boiled turkey', kcal: 175, protein: 29, carbs: 0, fat: 6, category: 'Poultry', serving: 120 },
  { name: 'Turkey wings (fried)', kcal: 285, protein: 25, carbs: 3, fat: 19, category: 'Poultry', serving: 120 },

  /* ---- meat ---- */
  { name: 'Roasted beef', kcal: 220, protein: 28, carbs: 0, fat: 12, category: 'Meat', serving: 100 },
  { name: 'Peppered beef', kcal: 230, protein: 25, carbs: 4, fat: 13, category: 'Meat', serving: 100 },
  { name: 'Fried goat meat', kcal: 245, protein: 26, carbs: 2, fat: 15, category: 'Meat', serving: 100 },
  { name: 'Boiled goat meat', kcal: 143, protein: 27, carbs: 0, fat: 3, category: 'Meat', serving: 100 },
  { name: 'Goat suya', kcal: 230, protein: 26, carbs: 4, fat: 12, category: 'Meat', serving: 100 },
  { name: 'Peppered ponmo', kcal: 210, protein: 28, carbs: 4, fat: 9, category: 'Meat', serving: 80 },
  { name: 'Fried ponmo', kcal: 260, protein: 27, carbs: 3, fat: 16, category: 'Meat', serving: 60 },
  { name: 'Balangu', kcal: 250, protein: 28, carbs: 1, fat: 15, category: 'Meat', serving: 100 },
  { name: 'Tsire', kcal: 235, protein: 27, carbs: 4, fat: 12, category: 'Meat', serving: 100 },
  { name: 'Dambu nama', kcal: 420, protein: 45, carbs: 12, fat: 22, category: 'Meat', serving: 50 },
  { name: 'Beef steak', kcal: 270, protein: 27, carbs: 0, fat: 18, category: 'Meat', serving: 200 },

  /* ---- tubers and plantain ---- */
  { name: 'Grilled yam', kcal: 125, protein: 1.6, carbs: 30, fat: 0.2, category: 'Plantain and tubers', serving: 200 },
  { name: 'Yam chips', kcal: 230, protein: 2, carbs: 34, fat: 10, category: 'Plantain and tubers', serving: 150 },
  { name: 'Ikokore (water yam porridge)', kcal: 150, protein: 4, carbs: 24, fat: 5, category: 'Plantain and tubers', serving: 300 },
  { name: 'Grilled plantain', kcal: 120, protein: 1.2, carbs: 32, fat: 0.2, category: 'Plantain and tubers', serving: 150 },
  { name: 'Plantain and egg', kcal: 165, protein: 5, carbs: 24, fat: 6, category: 'Plantain and tubers', serving: 250 },
  { name: 'Mashed potato', kcal: 110, protein: 2, carbs: 17, fat: 4, category: 'Plantain and tubers', serving: 200 },
  { name: 'Roasted potato', kcal: 120, protein: 2.5, carbs: 21, fat: 3, category: 'Plantain and tubers', serving: 200 },
  { name: 'Roasted sweet potato', kcal: 90, protein: 2, carbs: 21, fat: 0.2, category: 'Plantain and tubers', serving: 200 },
  { name: 'Boiled cocoyam', kcal: 145, protein: 2, carbs: 34, fat: 0.2, category: 'Plantain and tubers', serving: 180 },

  /* ---- beans, corn and grains ---- */
  { name: 'Beans and plantain', kcal: 135, protein: 5.5, carbs: 24, fat: 2.5, category: 'Beans and eggs', serving: 300 },
  { name: 'Beans and yam', kcal: 130, protein: 5, carbs: 25, fat: 2, category: 'Beans and eggs', serving: 300 },
  { name: 'Ekuru', kcal: 130, protein: 9, carbs: 15, fat: 3, category: 'Beans and eggs', serving: 150 },
  { name: 'Danwake', kcal: 165, protein: 6, carbs: 28, fat: 4, category: 'Beans and eggs', serving: 200 },
  { name: 'Ukwa (breadfruit)', kcal: 170, protein: 8, carbs: 26, fat: 4, category: 'Beans and eggs', serving: 200 },
  { name: 'Corn and pear (agbado ati ube)', kcal: 150, protein: 2.5, carbs: 25, fat: 5, category: 'Rice and grains', serving: 200 },
  { name: 'Corn and coconut', kcal: 160, protein: 3, carbs: 24, fat: 6, category: 'Rice and grains', serving: 200 },
  { name: 'Dambun shinkafa', kcal: 180, protein: 4, carbs: 30, fat: 5, category: 'Rice and grains', serving: 200 },
  { name: 'Sinasir', kcal: 200, protein: 4, carbs: 34, fat: 5, category: 'Bread and breakfast', serving: 100 },
  { name: 'Gurasa', kcal: 280, protein: 8, carbs: 50, fat: 5, category: 'Bread and breakfast', serving: 100 },
  { name: 'Fankaso', kcal: 330, protein: 5, carbs: 46, fat: 14, category: 'Street food', serving: 80 },
  { name: 'Alkaki', kcal: 440, protein: 6, carbs: 58, fat: 21, category: 'Street food', serving: 60 },
  { name: 'Koko (Hausa pap)', kcal: 60, protein: 1.2, carbs: 12, fat: 0.5, category: 'Bread and breakfast', serving: 300 },

  /* ---- soups and sides ---- */
  { name: 'Atama soup', kcal: 175, protein: 8, carbs: 6, fat: 13, category: 'Soups', serving: 150 },
  { name: 'Editan soup', kcal: 165, protein: 9, carbs: 6, fat: 12, category: 'Soups', serving: 150 },
  { name: 'Ofe owerri', kcal: 185, protein: 10, carbs: 6, fat: 14, category: 'Soups', serving: 150 },
  { name: 'Ekpang nkukwo', kcal: 170, protein: 5, carbs: 24, fat: 6, category: 'Soups', serving: 250 },
  { name: 'Ugba (oil bean)', kcal: 280, protein: 12, carbs: 14, fat: 20, category: 'Soups', serving: 80 },
  { name: 'Stir fried vegetables', kcal: 80, protein: 2.5, carbs: 8, fat: 4.5, category: 'Vegetables', serving: 150 },
  { name: 'Steamed vegetables', kcal: 40, protein: 2.5, carbs: 6, fat: 0.5, category: 'Vegetables', serving: 150 },
  { name: 'Fried okra', kcal: 130, protein: 2.5, carbs: 8, fat: 10, category: 'Vegetables', serving: 120 },
  { name: 'Boiled ugu', kcal: 30, protein: 3.5, carbs: 4, fat: 0.4, category: 'Vegetables', serving: 100 },

  /* ---- nuts ---- */
  { name: 'Fried groundnut', kcal: 610, protein: 25, carbs: 15, fat: 53, category: 'Nuts and seeds', serving: 40 },
  { name: 'Raw groundnut', kcal: 567, protein: 26, carbs: 16, fat: 49, category: 'Nuts and seeds', serving: 40 },
  { name: 'Roasted cashew', kcal: 574, protein: 15, carbs: 30, fat: 46, category: 'Nuts and seeds', serving: 40 },

  /* ---- international, widely sold here ---- */
  { name: 'Croissant', kcal: 406, protein: 8, carbs: 46, fat: 21, category: 'Bread and breakfast', serving: 60, pieceGrams: 60, pieceLabel: '1 croissant' },
  { name: 'Muffin', kcal: 380, protein: 6, carbs: 50, fat: 17, category: 'Snacks and sweets', serving: 90, pieceGrams: 90, pieceLabel: '1 muffin' },
  { name: 'Cupcake', kcal: 370, protein: 4, carbs: 53, fat: 16, category: 'Snacks and sweets', serving: 60 },
  { name: 'Chocolate cake', kcal: 390, protein: 5, carbs: 50, fat: 19, category: 'Snacks and sweets', serving: 90, sliceGrams: 90 },
  { name: 'Cheesecake', kcal: 320, protein: 6, carbs: 26, fat: 21, category: 'Snacks and sweets', serving: 100, sliceGrams: 100 },
  { name: 'Bagel', kcal: 250, protein: 10, carbs: 49, fat: 1.5, category: 'Bread and breakfast', serving: 90 },
  { name: 'Pita bread', kcal: 275, protein: 9, carbs: 55, fat: 1.2, category: 'Bread and breakfast', serving: 60 },
  { name: 'Hummus', kcal: 170, protein: 8, carbs: 14, fat: 10, category: 'Oils and condiments', serving: 60 },
  { name: 'Falafel', kcal: 330, protein: 13, carbs: 32, fat: 18, category: 'Fast food', serving: 100 },
  { name: 'Kebab', kcal: 215, protein: 20, carbs: 6, fat: 12, category: 'Fast food', serving: 150, pieceGrams: 75, pieceLabel: '1 skewer' },
  { name: 'Chicken wrap', kcal: 210, protein: 13, carbs: 22, fat: 8, category: 'Fast food', serving: 250 },
  { name: 'Caesar salad', kcal: 160, protein: 8, carbs: 6, fat: 12, category: 'Fast food', serving: 200 },
  { name: 'Pepperoni pizza', kcal: 295, protein: 12, carbs: 31, fat: 13, category: 'Fast food', serving: 130, sliceGrams: 130 },
  { name: 'Fish fingers', kcal: 230, protein: 13, carbs: 20, fat: 11, category: 'Fish and seafood', serving: 100 },
  { name: 'Baked beans', kcal: 94, protein: 5, carbs: 15, fat: 0.6, category: 'Beans and eggs', serving: 200 },
  { name: 'Noodle stir fry', kcal: 175, protein: 6, carbs: 25, fat: 6, category: 'Pasta and noodles', serving: 300 },
  { name: 'Milkshake', kcal: 110, protein: 3.5, carbs: 17, fat: 3, category: 'Juices and dairy drinks', serving: 300 },
  { name: 'Frozen yoghurt', kcal: 160, protein: 4, carbs: 25, fat: 5, category: 'Snacks and sweets', serving: 120 },
  { name: 'Protein bar', kcal: 380, protein: 30, carbs: 35, fat: 12, category: 'Snacks and sweets', serving: 60, pieceGrams: 60, pieceLabel: '1 bar' },
  { name: 'Rice cake', kcal: 387, protein: 8, carbs: 82, fat: 2.8, category: 'Snacks and sweets', serving: 18, pieceGrams: 9, pieceLabel: '1 cake' },

  /* ---- drinks ---- */
  { name: 'Coconut water', kcal: 19, protein: 0.7, carbs: 3.7, fat: 0.2, category: 'Local drinks', serving: 300 },
  { name: 'Alomo bitters', kcal: 180, protein: 0, carbs: 8, fat: 0, category: 'Alcohol', serving: 50 },
  { name: 'Baileys', kcal: 327, protein: 3, carbs: 25, fat: 13, category: 'Alcohol', serving: 50 },
  { name: 'Champagne', kcal: 76, protein: 0.1, carbs: 1.6, fat: 0, category: 'Alcohol', serving: 150 },
  { name: 'Iced tea', kcal: 30, protein: 0, carbs: 7.5, fat: 0, category: 'Soft drinks', serving: 330 },
  { name: 'Instant coffee (powder)', kcal: 350, protein: 12, carbs: 41, fat: 0.5, category: 'Hot drinks', serving: 2, spoonGrams: 2 },
]

/**
 * Household measures and local names, attached by name so the entries above
 * stay readable. Anything not listed falls back to the category defaults in
 * lib/measures, which are good enough for most foods.
 */
const REFINEMENTS: Record<string, Partial<LibraryFood>> = {
  // Things measured with a spoon far more often than a scale.
  Sugar: { cupGrams: 200, spoonGrams: 12.5, pieceGrams: 4, pieceLabel: '1 cube' },
  Honey: { cupGrams: 340, spoonGrams: 21 },
  'Palm oil': { cupGrams: 218, spoonGrams: 13.6 },
  'Vegetable oil': { cupGrams: 218, spoonGrams: 13.6 },
  'Groundnut oil': { cupGrams: 218, spoonGrams: 13.6 },
  'Olive oil': { cupGrams: 218, spoonGrams: 13.6 },
  'Coconut oil': { cupGrams: 218, spoonGrams: 13.6 },
  Salt: { spoonGrams: 18 },
  'Powdered milk (Peak, Dano)': { cupGrams: 128, spoonGrams: 12, aliases: ['peak milk', 'dano', 'cowbell', 'three crowns'] },
  'Milo (powder)': { cupGrams: 128, spoonGrams: 12, aliases: ['milo'] },
  'Bournvita (powder)': { cupGrams: 128, spoonGrams: 12 },
  'Ovaltine (powder)': { cupGrams: 128, spoonGrams: 12 },
  'Peanut butter': { cupGrams: 258, spoonGrams: 16 },
  Mayonnaise: { cupGrams: 220, spoonGrams: 14 },
  Ketchup: { spoonGrams: 17 },
  'Tomato paste': { spoonGrams: 16 },
  Jam: { spoonGrams: 20 },
  'Chocolate spread': { spoonGrams: 20 },
  'Maggi or Knorr cube': { pieceGrams: 4, pieceLabel: '1 cube', aliases: ['maggi', 'knorr', 'seasoning cube'] },
  'Whey protein (powder)': { spoonGrams: 30 },

  // Dry goods where a cup is the normal kitchen measure.
  'Garri (dry, uncooked)': { cupGrams: 150, aliases: ['garri', 'gari'] },
  Cornflakes: { cupGrams: 30 },
  'Golden Morn': { cupGrams: 45 },
  Granola: { cupGrams: 60 },
  'Oatmeal (cooked)': { cupGrams: 234, aliases: ['oats', 'oatmeal'] },
  'White rice (cooked)': { cupGrams: 180, aliases: ['rice'] },
  'Jollof rice': { cupGrams: 180, aliases: ['jollof'] },
  'Fried rice': { cupGrams: 180 },
  'Beans (ewa, cooked)': { cupGrams: 180, aliases: ['ewa', 'beans'] },

  // Countable things.
  'Egg (boiled)': { pieceGrams: 50, pieceLabel: '1 egg', aliases: ['boiled egg', 'egg'] },
  'Egg (fried)': { pieceGrams: 60, pieceLabel: '1 egg', aliases: ['fried egg'] },
  Akara: { pieceGrams: 30, pieceLabel: '1 ball', aliases: ['kosai', 'bean cake', 'akara'] },
  'Puff puff': { pieceGrams: 20, pieceLabel: '1 ball', aliases: ['puff puff', 'bofrot'] },
  'Moi moi': { pieceGrams: 150, pieceLabel: '1 wrap', aliases: ['moin moin', 'moimoi'] },
  'Meat pie': { pieceGrams: 120, pieceLabel: '1 pie' },
  'Chicken (fried)': { pieceGrams: 120, pieceLabel: '1 piece', aliases: ['fried chicken'] },
  'Boiled corn': { pieceGrams: 150, pieceLabel: '1 cob', aliases: ['corn', 'agbado'] },
  'Roasted corn': { pieceGrams: 150, pieceLabel: '1 cob' },
  Banana: { pieceGrams: 120, pieceLabel: '1 medium' },
  Orange: { pieceGrams: 150, pieceLabel: '1 medium' },
  Apple: { pieceGrams: 180, pieceLabel: '1 medium' },
  Mango: { pieceGrams: 200, pieceLabel: '1 medium' },
  'Suya (beef)': { pieceGrams: 100, pieceLabel: '1 stick', aliases: ['suya'] },
  Samosa: { pieceGrams: 50, pieceLabel: '1 piece' },
  'Spring roll': { pieceGrams: 50, pieceLabel: '1 piece' },
  Doughnut: { pieceGrams: 70, pieceLabel: '1 doughnut' },

  // Sliced things.
  'Agege bread': { sliceGrams: 30, aliases: ['bread', 'agege'] },
  'Sliced white bread': { sliceGrams: 30, aliases: ['bread'] },
  'Wholemeal bread': { sliceGrams: 30 },
  'Coconut bread': { sliceGrams: 30 },
  'Butter bread': { sliceGrams: 30 },
  'Cake (sponge)': { sliceGrams: 90 },
  Pizza: { sliceGrams: 130, pieceGrams: 130, pieceLabel: '1 slice' },

  // Local names people actually type.
  'Eba (garri)': { aliases: ['eba', 'garri', 'gari'] },
  'Pounded yam': { aliases: ['iyan', 'pounded'] },
  'Amala (yam flour)': { aliases: ['amala'] },
  'Fufu (cassava)': { aliases: ['fufu', 'akpu'] },
  'Banga soup': { aliases: ['ofe akwu', 'banga'] },
  'Afang soup': { aliases: ['okazi', 'afang'] },
  'Egusi soup': { aliases: ['egusi'] },
  'Ogbono soup': { aliases: ['ogbono', 'draw soup'] },
  'Edikang ikong': { aliases: ['edikaikong', 'edikang'] },
  'Ewa agoyin': { aliases: ['ewa aganyin', 'agoyin'] },
  'Pap (akamu, ogi)': { aliases: ['ogi', 'akamu', 'pap'] },
  'Titus (mackerel)': { aliases: ['mackerel', 'titus'] },
  'Indomie noodles (cooked)': { aliases: ['indomie', 'noodles'] },
  'African star apple (agbalumo)': { aliases: ['udara', 'agbalumo'] },
  'African pear (ube)': { aliases: ['ube'] },
  'Fried plantain (dodo)': { aliases: ['dodo', 'plantain'] },
  'Boli (roasted plantain)': { aliases: ['boli'] },
  'Yam porridge (asaro)': { aliases: ['asaro', 'porridge yam'] },
  'Kunun aya (tiger nut)': { aliases: ['tiger nut milk', 'kunun aya'] },
  'Soaked garri (with water)': { aliases: ['garri drink', 'drinking garri'] },
  Maltina: { aliases: ['malt'] },
  'Malta Guinness': { aliases: ['malt'] },
}

function refine(list: LibraryFood[]): LibraryFood[] {
  return list.map((f) => (REFINEMENTS[f.name] ? { ...f, ...REFINEMENTS[f.name] } : f))
}

export const FOOD_LIBRARY: LibraryFood[] = refine([...BASE_LIBRARY, ...PREPARATIONS]).sort((a, b) =>
  a.name.localeCompare(b.name),
)

export const FOOD_CATEGORIES = Array.from(new Set(FOOD_LIBRARY.map((f) => f.category))).sort()

/**
 * How well a food matches a query. Lower is better, null means no match.
 *
 * Ordering matters more than cleverness here: an exact name beats a prefix,
 * a prefix beats a word start, and a local name someone typed ("dodo", "iyan")
 * has to rank as highly as the formal one or the library feels broken.
 */
export function matchScore(f: LibraryFood, query: string): number | null {
  const q = query.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!q) return 0

  // Name and local names only. Category is deliberately NOT searched: typing
  // "rice" used to match the whole "Rice and grains" category and drag in
  // corn, millet and couscous. Categories are browsed with the chips instead.
  const name = f.name.toLowerCase()
  const aliases = (f.aliases ?? []).map((a) => a.toLowerCase())
  const fields = [name, ...aliases]

  let best: number | null = null
  const keep = (n: number) => {
    if (best == null || n < best) best = n
  }

  fields.forEach((field, i) => {
    // An alias is a real name for the food, just slightly less canonical.
    const penalty = i === 0 ? 0 : 1
    if (field === q) keep(0 + penalty)
    else if (field.startsWith(q)) keep(1 + penalty)
    else if (field.includes(' ' + q)) keep(3 + penalty)
    else if (field.includes(q)) keep(5 + penalty)
  })
  if (best != null) return best

  // Multi word queries: every word has to appear somewhere, so "fried rice"
  // and "rice fried" both work without matching everything containing "rice".
  const words = q.split(' ').filter(Boolean)
  if (words.length > 1) {
    const all = fields.join(' ')
    if (words.every((w) => all.includes(w))) return 8
  }

  return null
}

/** Ranked search across the library plus any extra foods supplied. */
export function searchFoods(
  query: string,
  extra: LibraryFood[] = [],
  limit = 40,
  category?: string,
): LibraryFood[] {
  let pool = [...extra, ...FOOD_LIBRARY]
  if (category && category !== 'All') pool = pool.filter((f) => f.category === category)

  const q = query.trim()
  if (!q) return pool.slice(0, limit)

  const scored: Array<{ f: LibraryFood; score: number }> = []
  for (const f of pool) {
    const score = matchScore(f, q)
    if (score != null) scored.push({ f, score })
  }
  scored.sort((a, b) => a.score - b.score || a.f.name.length - b.f.name.length)
  return scored.slice(0, limit).map((s) => s.f)
}
