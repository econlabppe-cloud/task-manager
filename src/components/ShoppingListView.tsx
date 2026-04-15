import React from 'react'
import {
  useShoppingList,
  CATEGORY_META,
  CATEGORY_ORDER,
  type Recipe,
  type ShoppingCategory,
  type RecipeIngredient,
} from '../hooks/useShoppingList'

interface Props {
  darkMode?: boolean
}

// ── Add-item form ────────────────────────────────────────────────────────────

function AddItemForm({
  darkMode,
  onAdd,
}: {
  darkMode?: boolean
  onAdd: (name: string, quantity: string, category: ShoppingCategory) => void
}) {
  const [name, setName] = React.useState('')
  const [quantity, setQuantity] = React.useState('')
  const [category, setCategory] = React.useState<ShoppingCategory>('other')

  const submit = () => {
    if (!name.trim()) return
    onAdd(name.trim(), quantity.trim(), category)
    setName('')
    setQuantity('')
  }

  const input = darkMode
    ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-600 focus:ring-cyan-500'
    : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-cyan-300'

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div className="flex-1 min-w-[140px]">
        <label className={`block text-[11px] font-medium mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          שם מוצר
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder='כגון: חמאה'
          className={`w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${input}`}
          aria-label="שם מוצר"
        />
      </div>
      <div className="w-full sm:w-28">
        <label className={`block text-[11px] font-medium mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          כמות
        </label>
        <input
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder='200 גרם'
          className={`w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${input}`}
          aria-label="כמות"
        />
      </div>
      <div className="w-full sm:w-32">
        <label className={`block text-[11px] font-medium mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          קטגוריה
        </label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value as ShoppingCategory)}
          className={`w-full rounded border px-2 py-2 text-sm focus:outline-none focus:ring-2 ${input}`}
          aria-label="קטגוריה"
        >
          {CATEGORY_ORDER.map(cat => (
            <option key={cat} value={cat}>
              {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={!name.trim()}
        className="rounded bg-cyan-600 text-white text-sm font-semibold px-4 py-2 hover:bg-cyan-700 disabled:bg-gray-300 transition-colors"
      >
        הוסף
      </button>
    </div>
  )
}

// ── New-recipe wizard (inline, collapsible) ───────────────────────────────────

function AddRecipeForm({
  darkMode,
  onAdd,
}: {
  darkMode?: boolean
  onAdd: (r: Omit<Recipe, 'id' | 'isCustom'>) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState('')
  const [emoji, setEmoji] = React.useState('🍽️')
  const [servings, setServings] = React.useState(4)
  const [ingredients, setIngredients] = React.useState<RecipeIngredient[]>([
    { name: '', quantity: '', category: 'other' },
  ])

  const input = darkMode
    ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-600'
    : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'

  const addIngredient = () =>
    setIngredients(prev => [...prev, { name: '', quantity: '', category: 'other' }])

  const updateIng = (idx: number, patch: Partial<RecipeIngredient>) =>
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, ...patch } : ing))

  const removeIng = (idx: number) =>
    setIngredients(prev => prev.filter((_, i) => i !== idx))

  const submit = () => {
    if (!name.trim()) return
    const cleaned = ingredients.filter(i => i.name.trim())
    if (!cleaned.length) return
    onAdd({ name: name.trim(), emoji, servings, ingredients: cleaned })
    setOpen(false)
    setName('')
    setEmoji('🍽️')
    setIngredients([{ name: '', quantity: '', category: 'other' }])
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-xs font-medium flex items-center gap-1 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
      >
        <span>+</span> הוסף מתכון מותאם
      </button>
    )
  }

  return (
    <div className={`border rounded-lg p-4 space-y-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
      <h3 className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>מתכון חדש</h3>

      <div className="flex gap-2">
        <input
          value={emoji}
          onChange={e => setEmoji(e.target.value)}
          className={`w-14 text-center rounded border px-2 py-1.5 text-lg ${input}`}
          maxLength={2}
          aria-label="אמוג'י"
        />
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="שם המתכון"
          className={`flex-1 rounded border px-3 py-1.5 text-sm ${input}`}
          aria-label="שם מתכון"
        />
        <input
          type="number"
          min={1}
          max={20}
          value={servings}
          onChange={e => setServings(Number(e.target.value))}
          className={`w-16 rounded border px-2 py-1.5 text-sm text-center ${input}`}
          title="מנות"
          aria-label="מנות"
        />
        <span className={`text-xs self-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>מנות</span>
      </div>

      <div className="space-y-2">
        {ingredients.map((ing, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input
              value={ing.name}
              onChange={e => updateIng(idx, { name: e.target.value })}
              placeholder="מצרך"
              className={`flex-1 rounded border px-2 py-1.5 text-xs ${input}`}
            />
            <input
              value={ing.quantity}
              onChange={e => updateIng(idx, { quantity: e.target.value })}
              placeholder="כמות"
              className={`w-24 rounded border px-2 py-1.5 text-xs ${input}`}
            />
            <select
              value={ing.category}
              onChange={e => updateIng(idx, { category: e.target.value as ShoppingCategory })}
              className={`w-28 rounded border px-2 py-1.5 text-xs ${input}`}
            >
              {CATEGORY_ORDER.map(cat => (
                <option key={cat} value={cat}>{CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}</option>
              ))}
            </select>
            {ingredients.length > 1 && (
              <button type="button" onClick={() => removeIng(idx)} className="text-red-400 hover:text-red-600 text-sm" aria-label="הסר מצרך">✕</button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={addIngredient} className={`text-xs px-3 py-1.5 rounded border transition-colors ${darkMode ? 'border-gray-600 text-gray-400 hover:text-gray-200' : 'border-gray-300 text-gray-500 hover:text-gray-700'}`}>
          + מצרך
        </button>
        <button type="button" onClick={submit} disabled={!name.trim()} className="text-xs px-4 py-1.5 rounded bg-cyan-600 text-white font-semibold hover:bg-cyan-700 disabled:bg-gray-300 transition-colors">
          שמור מתכון
        </button>
        <button type="button" onClick={() => setOpen(false)} className={`text-xs px-3 py-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'} hover:text-red-500 transition-colors`}>
          ביטול
        </button>
      </div>
    </div>
  )
}

// ── Main view ────────────────────────────────────────────────────────────────

export const ShoppingListView: React.FC<Props> = ({ darkMode }) => {
  const {
    items,
    allRecipes,
    checkedCount,
    totalCount,
    addFromRecipe,
    addItem,
    toggleItem,
    deleteItem,
    clearChecked,
    clearAll,
    addCustomRecipe,
    deleteCustomRecipe,
  } = useShoppingList()

  const [addedRecipe, setAddedRecipe] = React.useState<string | null>(null)

  const handleAddRecipe = (recipe: Recipe) => {
    addFromRecipe(recipe)
    setAddedRecipe(recipe.id)
    setTimeout(() => setAddedRecipe(null), 2000)
  }

  const bg = darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
  const cardBg = darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'
  const textMain = darkMode ? 'text-gray-100' : 'text-gray-900'
  const textMuted = darkMode ? 'text-gray-500' : 'text-gray-400'

  // Group items by category, preserving category order
  const grouped = React.useMemo(() => {
    const map = new Map<ShoppingCategory, typeof items>()
    for (const cat of CATEGORY_ORDER) map.set(cat, [])
    for (const item of items) map.get(item.category)?.push(item)
    return map
  }, [items])

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className={`rounded-xl border p-4 ${bg}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className={`text-lg font-bold ${textMain}`}>🛒 רשימת קניות</h2>
            <p className={`text-xs mt-0.5 ${textMuted}`}>
              {totalCount === 0
                ? 'הרשימה ריקה — בחר מתכון להוספה'
                : `${totalCount} פריטים${checkedCount > 0 ? ` · ${checkedCount} מסומנים` : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {checkedCount > 0 && (
              <button
                type="button"
                onClick={clearChecked}
                className={`text-xs font-medium px-3 py-1.5 rounded border transition-colors ${
                  darkMode
                    ? 'border-gray-600 text-gray-400 hover:text-red-400 hover:border-red-800'
                    : 'border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200'
                }`}
              >
                נקה מסומנים ({checkedCount})
              </button>
            )}
            {totalCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className={`text-xs px-3 py-1.5 rounded transition-colors ${darkMode ? 'text-gray-600 hover:text-red-400' : 'text-gray-300 hover:text-red-400'}`}
              >
                נקה הכל
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Recipe browser ─────────────────────────────────────────── */}
      <div className={`rounded-xl border p-4 ${bg}`}>
        <h3 className={`text-sm font-bold mb-3 ${textMain}`}>מתכונים</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {allRecipes.map(recipe => {
            const justAdded = addedRecipe === recipe.id
            return (
              <div
                key={recipe.id}
                className={`relative rounded-lg border p-3 text-center transition-all ${cardBg} ${
                  justAdded ? 'ring-2 ring-emerald-400' : ''
                }`}
              >
                {recipe.isCustom && (
                  <button
                    type="button"
                    onClick={() => deleteCustomRecipe(recipe.id)}
                    className={`absolute top-1 left-1 w-6 h-6 flex items-center justify-center rounded-full text-[11px] transition-colors ${darkMode ? 'text-gray-500 hover:bg-red-900/50 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-500'}`}
                    aria-label="מחק מתכון"
                    title="מחק מתכון"
                  >
                    ✕
                  </button>
                )}
                <div className="text-2xl mb-1">{recipe.emoji}</div>
                <div className={`text-xs font-semibold leading-tight mb-0.5 ${textMain}`}>{recipe.name}</div>
                <div className={`text-[10px] mb-2 ${textMuted}`}>{recipe.ingredients.length} מצרכים</div>
                <button
                  type="button"
                  onClick={() => handleAddRecipe(recipe)}
                  className={`w-full text-[11px] font-semibold py-1 rounded transition-colors ${
                    justAdded
                      ? 'bg-emerald-500 text-white'
                      : darkMode
                        ? 'bg-gray-700 text-cyan-300 hover:bg-gray-600'
                        : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                  }`}
                >
                  {justAdded ? '✓ נוסף' : 'הוסף לרשימה'}
                </button>
              </div>
            )
          })}
        </div>
        <AddRecipeForm darkMode={darkMode} onAdd={addCustomRecipe} />
      </div>

      {/* ── Shopping list ───────────────────────────────────────────── */}
      {totalCount > 0 && (
        <div className={`rounded-xl border p-4 ${bg} space-y-4`}>
          <h3 className={`text-sm font-bold ${textMain}`}>פריטים לקנייה</h3>
          {CATEGORY_ORDER.map(cat => {
            const catItems = grouped.get(cat) ?? []
            if (catItems.length === 0) return null
            const { emoji, label } = CATEGORY_META[cat]
            return (
              <div key={cat}>
                <div className={`text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${textMuted}`}>
                  <span>{emoji}</span>
                  <span>{label}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    {catItems.filter(i => !i.checked).length}/{catItems.length}
                  </span>
                </div>
                <ul className="space-y-1" role="list" aria-label={`${label} קניות`}>
                  {catItems.map(item => (
                    <li
                      key={item.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                        item.checked
                          ? darkMode ? 'bg-gray-900/40 border-gray-800 opacity-50' : 'bg-gray-50 border-gray-100 opacity-50'
                          : darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleItem(item.id)}
                        className="w-5 h-5 accent-cyan-600 cursor-pointer shrink-0"
                        aria-label={`סמן ${item.name}`}
                      />
                      <span className={`flex-1 font-medium ${item.checked ? 'line-through' : ''} ${textMain}`}>
                        {item.name}
                      </span>
                      {item.quantity && (
                        <span className={`text-xs shrink-0 ${textMuted}`}>{item.quantity}</span>
                      )}
                      {item.recipeName && (
                        <span className={`text-[10px] shrink-0 px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400'}`}>
                          {item.recipeName}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteItem(item.id)}
                        className={`p-1.5 rounded-lg transition-colors shrink-0 touch-manipulation ${darkMode ? 'text-gray-500 hover:bg-red-900/40 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-500'}`}
                        aria-label="הסר פריט"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add item manually ───────────────────────────────────────── */}
      <div className={`rounded-xl border p-4 ${bg}`}>
        <h3 className={`text-sm font-bold mb-3 ${textMain}`}>הוסף פריט ידנית</h3>
        <AddItemForm darkMode={darkMode} onAdd={addItem} />
      </div>
    </div>
  )
}
