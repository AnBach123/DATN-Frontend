import { ref, computed, watch } from 'vue'

interface CartProduct {
  id: number
  productName: string
  unitPrice: number
}

interface CartEntry {
  product: CartProduct
  qty: number
}

const STORAGE_KEY = 'byhat_cart'

// Load từ sessionStorage
const loadCart = (): Record<number, CartEntry> => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

const cart = ref<Record<number, CartEntry>>(loadCart())

// Auto save khi thay đổi
watch(cart, (val) => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(val))
}, { deep: true })

const cartItems = computed(() =>
  Object.values(cart.value).map((c) => ({
    id: c.product.id,
    productName: c.product.productName,
    unitPrice: c.product.unitPrice,
    qty: c.qty,
  }))
)

const totalQty = computed(() => cartItems.value.reduce((s, i) => s + i.qty, 0))
const totalPrice = computed(() => cartItems.value.reduce((s, i) => s + i.qty * i.unitPrice, 0))

const addItem = (product: CartProduct) => {
  const exist = cart.value[product.id]
  if (exist) {
    exist.qty += 1
  } else {
    cart.value[product.id] = { product, qty: 1 }
  }
}

const increase = (id: number) => {
  const item = cart.value[id]
  if (item) item.qty += 1
}

const decrease = (id: number) => {
  const item = cart.value[id]
  if (!item) return
  item.qty -= 1
  if (item.qty <= 0) delete cart.value[id]
}

const removeItem = (id: number) => {
  delete cart.value[id]
}

const clearCart = () => {
  cart.value = {}
}

const buildFoodNote = () => {
  if (cartItems.value.length === 0) return ''
  const lines = cartItems.value.map((i) => `${i.productName} x ${i.qty}`)
  return `Món đặt tham khảo: ${lines.join(', ')}`
}

export function useCartStore() {
  return {
    cart,
    cartItems,
    totalQty,
    totalPrice,
    addItem,
    increase,
    decrease,
    removeItem,
    clearCart,
    buildFoodNote,
  }
}
