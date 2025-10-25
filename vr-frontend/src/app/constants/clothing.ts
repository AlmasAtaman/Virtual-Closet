/**
 * Clothing Constants
 * Centralized configuration for clothing categories, subcategories, style tags, sizes, and brands
 */

export const MAIN_CATEGORIES = [
  'tops',
  'bottoms',
  'outerwear',
  'dresses',
  'shoes',
  'accessories',
  'bags'
] as const;

export type MainCategory = typeof MAIN_CATEGORIES[number];

export const SUBCATEGORIES: Record<MainCategory, readonly string[]> = {
  tops: ['t-shirt', 'shirt', 'blouse', 'tank top', 'crop top', 'sweater', 'polo', 'henley'] as const,
  bottoms: ['jeans', 'pants', 'shorts', 'skirt', 'leggings', 'trousers', 'chinos', 'cargo pants'] as const,
  outerwear: ['jacket', 'coat', 'blazer', 'cardigan', 'hoodie', 'vest', 'windbreaker', 'parka', 'bomber'] as const,
  dresses: ['mini dress', 'midi dress', 'maxi dress', 'cocktail dress', 'sundress', 'wrap dress', 'shirt dress'] as const,
  shoes: ['sneakers', 'boots', 'heels', 'flats', 'sandals', 'loafers', 'oxfords', 'slippers'] as const,
  accessories: ['hat', 'scarf', 'belt', 'sunglasses', 'jewelry', 'watch', 'cap', 'beanie', 'gloves'] as const,
  bags: ['handbag', 'backpack', 'tote', 'clutch', 'crossbody', 'messenger', 'duffel', 'satchel'] as const
} as const;

export const STYLE_TAGS = [
  'casual',
  'elegant',
  'sporty',
  'vintage',
  'minimalist',
  'bohemian',
  'streetwear',
  'formal',
  'edgy',
  'preppy',
  'chic',
  'retro',
  'athleisure',
  'grunge',
  'romantic'
] as const;

export type StyleTag = typeof STYLE_TAGS[number];

export const SIZES = [
  // Letter sizes
  'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL',
  // Numeric dress/suit sizes
  '0', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20',
  // Waist sizes (inches)
  '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '36', '38', '40',
  // Shoe sizes (US)
  '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13'
] as const;

export type Size = typeof SIZES[number] | string; // Allow custom sizes

export const POPULAR_BRANDS = [
  'Zara',
  'H&M',
  'Nike',
  'Adidas',
  'Uniqlo',
  'Gap',
  "Levi's",
  'Mango',
  'Forever 21',
  'Urban Outfitters',
  'Aritzia',
  'Everlane',
  'COS',
  'Massimo Dutti',
  'Banana Republic',
  'J.Crew',
  'Topshop',
  'ASOS',
  'Reformation',
  'Madewell',
  'AllSaints',
  'Free People',
  'Abercrombie & Fitch',
  '& Other Stories',
  'Hollister'
] as const;

export type PopularBrand = typeof POPULAR_BRANDS[number] | string; // Allow custom brands

export const SEASONS = [
  'Spring',
  'Summer',
  'Fall',
  'Winter',
  'All Season'
] as const;

export type Season = typeof SEASONS[number];

export const COLORS = [
  'Black',
  'White',
  'Gray',
  'Navy',
  'Blue',
  'Red',
  'Pink',
  'Purple',
  'Green',
  'Yellow',
  'Orange',
  'Brown',
  'Beige',
  'Cream',
  'Gold',
  'Silver',
  'Multi-color'
] as const;

export type Color = typeof COLORS[number] | string; // Allow custom colors

/**
 * Helper function to get subcategories for a given main category
 */
export function getSubcategoriesForCategory(category: MainCategory | string): readonly string[] {
  if (category in SUBCATEGORIES) {
    return SUBCATEGORIES[category as MainCategory];
  }
  return [];
}

/**
 * Helper function to determine main category from subcategory (type)
 */
export function getCategoryFromType(type: string): MainCategory | null {
  const normalizedType = type.toLowerCase().trim();

  for (const [category, subcategories] of Object.entries(SUBCATEGORIES)) {
    if (subcategories.some(sub => sub.toLowerCase() === normalizedType)) {
      return category as MainCategory;
    }
  }

  return null;
}

/**
 * Legacy mapping from old type values to new category structure
 * Used for data migration
 */
export const LEGACY_TYPE_TO_CATEGORY: Record<string, { category: MainCategory; type: string }> = {
  't-shirt': { category: 'tops', type: 't-shirt' },
  'tshirt': { category: 'tops', type: 't-shirt' },
  'shirt': { category: 'tops', type: 'shirt' },
  'top': { category: 'tops', type: 't-shirt' },
  'blouse': { category: 'tops', type: 'blouse' },
  'tank top': { category: 'tops', type: 'tank top' },
  'tank': { category: 'tops', type: 'tank top' },
  'sweater': { category: 'tops', type: 'sweater' },
  'hoodie': { category: 'outerwear', type: 'hoodie' },
  'sweatshirt': { category: 'tops', type: 'sweater' },
  'jacket': { category: 'outerwear', type: 'jacket' },
  'coat': { category: 'outerwear', type: 'coat' },
  'blazer': { category: 'outerwear', type: 'blazer' },
  'cardigan': { category: 'outerwear', type: 'cardigan' },
  'pants': { category: 'bottoms', type: 'pants' },
  'jeans': { category: 'bottoms', type: 'jeans' },
  'trousers': { category: 'bottoms', type: 'trousers' },
  'shorts': { category: 'bottoms', type: 'shorts' },
  'skirt': { category: 'bottoms', type: 'skirt' },
  'leggings': { category: 'bottoms', type: 'leggings' },
  'dress': { category: 'dresses', type: 'midi dress' },
  'shoes': { category: 'shoes', type: 'sneakers' },
  'sneakers': { category: 'shoes', type: 'sneakers' },
  'boots': { category: 'shoes', type: 'boots' },
  'heels': { category: 'shoes', type: 'heels' },
  'flats': { category: 'shoes', type: 'flats' },
  'sandals': { category: 'shoes', type: 'sandals' },
  'hat': { category: 'accessories', type: 'hat' },
  'cap': { category: 'accessories', type: 'cap' },
  'scarf': { category: 'accessories', type: 'scarf' },
  'belt': { category: 'accessories', type: 'belt' },
  'bag': { category: 'bags', type: 'handbag' },
  'backpack': { category: 'bags', type: 'backpack' },
  'handbag': { category: 'bags', type: 'handbag' },
  'purse': { category: 'bags', type: 'handbag' }
};

/**
 * Map old style/occasion values to new tags
 * Used for data migration
 */
export const LEGACY_STYLE_TO_TAGS: Record<string, StyleTag[]> = {
  'streetwear': ['streetwear', 'casual'],
  'minimalist': ['minimalist', 'chic'],
  'old money': ['elegant', 'preppy'],
  'y2k': ['retro', 'casual'],
  'preppy': ['preppy', 'chic'],
  'bohemian': ['bohemian', 'casual'],
  'grunge': ['grunge', 'edgy'],
  'athletic': ['sporty', 'athleisure'],
  'formal': ['formal', 'elegant'],
  'casual': ['casual'],
  'elegant': ['elegant', 'chic'],
  'sporty': ['sporty'],
  'vintage': ['vintage', 'retro'],
  'party': ['elegant', 'formal'],
  'work': ['formal', 'preppy']
};
