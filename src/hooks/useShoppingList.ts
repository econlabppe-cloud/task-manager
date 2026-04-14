/**
 * useShoppingList
 *
 * State management for the shopping list + recipe book.
 * Persists to localStorage under 'mandy-shopping-v1'.
 */
import React from 'react'

const STORAGE_KEY = 'mandy-shopping-v1'

// ── Types ────────────────────────────────────────────────────────────────────

export type ShoppingCategory = 'produce' | 'meat' | 'dairy' | 'pantry' | 'bakery' | 'frozen' | 'other'

export const CATEGORY_META: Record<ShoppingCategory, { label: string; emoji: string }> = {
  produce: { label: 'ירקות ופירות', emoji: '🥬' },
  meat:    { label: 'בשר ועוף',     emoji: '🥩' },
  dairy:   { label: 'חלב וגבינות',  emoji: '🥛' },
  pantry:  { label: 'מזווה',        emoji: '🧂' },
  bakery:  { label: 'לחם ומאפים',   emoji: '🍞' },
  frozen:  { label: 'קפואים',       emoji: '🧊' },
  other:   { label: 'שונות',        emoji: '🛒' },
}

export const CATEGORY_ORDER: ShoppingCategory[] = [
  'produce', 'meat', 'dairy', 'bakery', 'pantry', 'frozen', 'other',
]

export interface RecipeIngredient {
  name: string
  quantity: string
  category: ShoppingCategory
}

export interface Recipe {
  id: string
  name: string
  emoji: string
  servings: number
  ingredients: RecipeIngredient[]
  isCustom?: boolean
}

export interface ShoppingItem {
  id: string
  name: string
  quantity: string
  category: ShoppingCategory
  checked: boolean
  recipeId?: string
  recipeName?: string
  addedAt: string
}

// ── Built-in recipes ─────────────────────────────────────────────────────────

export const DEFAULT_RECIPES: Recipe[] = [
  {
    id: 'pasta-bolognese',
    name: 'פסטה בולונז',
    emoji: '🍝',
    servings: 4,
    ingredients: [
      { name: 'ספגטי', quantity: '500 גרם', category: 'pantry' },
      { name: 'בשר טחון', quantity: '500 גרם', category: 'meat' },
      { name: 'בצל', quantity: '2 יחידות', category: 'produce' },
      { name: 'שום', quantity: '4 שיניים', category: 'produce' },
      { name: 'עגבניות מרוסקות', quantity: 'קופסת שימורים', category: 'pantry' },
      { name: 'רסק עגבניות', quantity: '2 כפות', category: 'pantry' },
      { name: 'שמן זית', quantity: 'לפי הצורך', category: 'pantry' },
    ],
  },
  {
    id: 'chicken-schnitzel',
    name: 'שניצל עוף',
    emoji: '🍗',
    servings: 4,
    ingredients: [
      { name: 'חזות עוף', quantity: '4 יחידות', category: 'meat' },
      { name: 'ביצים', quantity: '2 יחידות', category: 'dairy' },
      { name: 'פירורי לחם', quantity: 'כוס', category: 'pantry' },
      { name: 'קמח', quantity: 'חצי כוס', category: 'pantry' },
      { name: 'שמן לטיגון', quantity: 'לפי הצורך', category: 'pantry' },
    ],
  },
  {
    id: 'chicken-soup',
    name: 'מרק עוף',
    emoji: '🍲',
    servings: 6,
    ingredients: [
      { name: 'עוף שלם', quantity: '1 יחידה', category: 'meat' },
      { name: 'גזרים', quantity: '3 יחידות', category: 'produce' },
      { name: 'סלרי', quantity: '3 גבעולים', category: 'produce' },
      { name: 'בצל', quantity: '1 יחידה', category: 'produce' },
      { name: 'פטרוזיליה', quantity: 'צרור', category: 'produce' },
    ],
  },
  {
    id: 'shakshuka',
    name: 'שקשוקה',
    emoji: '🍳',
    servings: 4,
    ingredients: [
      { name: 'ביצים', quantity: '6 יחידות', category: 'dairy' },
      { name: 'עגבניות מרוסקות', quantity: 'קופסת שימורים', category: 'pantry' },
      { name: 'פלפל אדום', quantity: '1 יחידה', category: 'produce' },
      { name: 'בצל', quantity: '1 יחידה', category: 'produce' },
      { name: 'שום', quantity: '3 שיניים', category: 'produce' },
    ],
  },
  {
    id: 'israeli-salad',
    name: 'סלט ישראלי',
    emoji: '🥗',
    servings: 4,
    ingredients: [
      { name: 'עגבניות', quantity: '4 יחידות', category: 'produce' },
      { name: 'מלפפונים', quantity: '2 יחידות', category: 'produce' },
      { name: 'בצל סגול', quantity: '1 יחידה', category: 'produce' },
      { name: 'שמן זית', quantity: '3 כפות', category: 'pantry' },
      { name: 'לימון', quantity: '1 יחידה', category: 'produce' },
    ],
  },
  {
    id: 'homemade-pizza',
    name: 'פיצה ביתית',
    emoji: '🍕',
    servings: 4,
    ingredients: [
      { name: 'קמח', quantity: '500 גרם', category: 'pantry' },
      { name: 'שמרים יבשים', quantity: 'שקית', category: 'pantry' },
      { name: 'רסק עגבניות', quantity: 'קופסית', category: 'pantry' },
      { name: 'מוצרלה מגוררת', quantity: '200 גרם', category: 'dairy' },
      { name: 'שמן זית', quantity: 'לפי הצורך', category: 'pantry' },
    ],
  },
  {
    id: 'rice-chicken',
    name: 'אורז עם עוף',
    emoji: '🍚',
    servings: 4,
    ingredients: [
      { name: 'עוף (חתיכות)', quantity: '1 ק"ג', category: 'meat' },
      { name: 'אורז', quantity: '2 כוסות', category: 'pantry' },
      { name: 'בצל', quantity: '1 יחידה', category: 'produce' },
      { name: 'שמן', quantity: 'לפי הצורך', category: 'pantry' },
    ],
  },
  {
    id: 'pancakes',
    name: 'פנקייק',
    emoji: '🥞',
    servings: 4,
    ingredients: [
      { name: 'קמח', quantity: '2 כוסות', category: 'pantry' },
      { name: 'ביצים', quantity: '2 יחידות', category: 'dairy' },
      { name: 'חלב', quantity: '1.5 כוסות', category: 'dairy' },
      { name: 'אבקת אפייה', quantity: 'כפית', category: 'pantry' },
      { name: 'סוכר', quantity: '2 כפות', category: 'pantry' },
      { name: 'חמאה', quantity: '2 כפות', category: 'dairy' },
    ],
  },
]

// ── Persistence ──────────────────────────────────────────────────────────────

interface PersistedState {
  items: ShoppingItem[]
  customRecipes: Recipe[]
}

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as PersistedState
  } catch { /* ignore */ }
  return { items: [], customRecipes: [] }
}

function persist(s: PersistedState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useShoppingList() {
  const [state, setStateRaw] = React.useState<PersistedState>(load)

  const set = React.useCallback((fn: (s: PersistedState) => PersistedState) => {
    setStateRaw(prev => {
      const next = fn(prev)
      persist(next)
      return next
    })
  }, [])

  const allRecipes = React.useMemo(
    () => [...DEFAULT_RECIPES, ...state.customRecipes],
    [state.customRecipes],
  )

  const addFromRecipe = React.useCallback((recipe: Recipe) => {
    set(s => {
      const existing = new Set(s.items.map(i => i.name.trim().toLowerCase()))
      const newItems: ShoppingItem[] = recipe.ingredients
        .filter(ing => !existing.has(ing.name.trim().toLowerCase()))
        .map(ing => ({
          id: genId(),
          name: ing.name,
          quantity: ing.quantity,
          category: ing.category,
          checked: false,
          recipeId: recipe.id,
          recipeName: recipe.name,
          addedAt: new Date().toISOString(),
        }))
      return { ...s, items: [...s.items, ...newItems] }
    })
  }, [set])

  const addItem = React.useCallback((
    name: string,
    quantity = '',
    category: ShoppingCategory = 'other',
  ) => {
    const trimmed = name.trim()
    if (!trimmed) return
    set(s => ({
      ...s,
      items: [...s.items, {
        id: genId(),
        name: trimmed,
        quantity,
        category,
        checked: false,
        addedAt: new Date().toISOString(),
      }],
    }))
  }, [set])

  const toggleItem = React.useCallback((id: string) => {
    set(s => ({ ...s, items: s.items.map(i => i.id === id ? { ...i, checked: !i.checked } : i) }))
  }, [set])

  const deleteItem = React.useCallback((id: string) => {
    set(s => ({ ...s, items: s.items.filter(i => i.id !== id) }))
  }, [set])

  const clearChecked = React.useCallback(() => {
    set(s => ({ ...s, items: s.items.filter(i => !i.checked) }))
  }, [set])

  const clearAll = React.useCallback(() => {
    set(s => ({ ...s, items: [] }))
  }, [set])

  const addCustomRecipe = React.useCallback((recipe: Omit<Recipe, 'id' | 'isCustom'>) => {
    set(s => ({
      ...s,
      customRecipes: [...s.customRecipes, { ...recipe, id: genId(), isCustom: true }],
    }))
  }, [set])

  const deleteCustomRecipe = React.useCallback((id: string) => {
    set(s => ({ ...s, customRecipes: s.customRecipes.filter(r => r.id !== id) }))
  }, [set])

  return {
    items: state.items,
    allRecipes,
    checkedCount: state.items.filter(i => i.checked).length,
    totalCount: state.items.length,
    addFromRecipe,
    addItem,
    toggleItem,
    deleteItem,
    clearChecked,
    clearAll,
    addCustomRecipe,
    deleteCustomRecipe,
  }
}
