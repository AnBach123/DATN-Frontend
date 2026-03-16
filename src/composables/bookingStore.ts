import { ref } from 'vue'

const isOpen = ref(false)
const presetNote = ref('')

export const useBookingStore = () => {
  const open = (note: string = '') => {
    presetNote.value = typeof note === 'string' ? note : ''
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
  }

  return {
    isOpen,
    presetNote,
    open,
    close,
  }
}
