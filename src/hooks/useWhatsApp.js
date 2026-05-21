import { useCallback } from 'react'
import { getWhatsAppLink, WHATSAPP } from '../data/siteConfig'

export function useWhatsApp() {
  const openDefault = useCallback(() => {
    window.open(getWhatsAppLink(), '_blank', 'noopener,noreferrer')
  }, [])

  const openWithItem = useCallback((itemName) => {
    const message = `${WHATSAPP.orderMessage}${itemName} 🍽️`
    window.open(getWhatsAppLink(message), '_blank', 'noopener,noreferrer')
  }, [])

  const openMenu = useCallback(() => {
    window.open(getWhatsAppLink(WHATSAPP.menuMessage), '_blank', 'noopener,noreferrer')
  }, [])

  return { openDefault, openWithItem, openMenu, getLink: getWhatsAppLink }
}
