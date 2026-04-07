import { ref } from 'vue'

const isOpen = ref(false)
const isCustomOpen = ref(false)
const presetNote = ref('')

export const useBookingStore = () => {
  const open = (note: string = '') => {
    presetNote.value = typeof note === 'string' ? note : ''
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
  }

  const openCustom = (note: string = '') => {
    presetNote.value = typeof note === 'string' ? note : ''
    isCustomOpen.value = true
  }

  const closeCustom = () => {
    isCustomOpen.value = false
  }

  return {
    isOpen,
    isCustomOpen,
    presetNote,
    open,
    close,
    openCustom,
    closeCustom,
  }
}
