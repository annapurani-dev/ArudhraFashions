import { createContext, useContext, useState } from 'react'

const NewsletterContext = createContext()

export function NewsletterProvider({ children }) {
  const [showNewsletter, setShowNewsletter] = useState(false)

  const openNewsletter = () => {
    setShowNewsletter(true)
  }

  const closeNewsletter = () => {
    setShowNewsletter(false)
  }

  return (
    <NewsletterContext.Provider value={{ showNewsletter, openNewsletter, closeNewsletter }}>
      {children}
    </NewsletterContext.Provider>
  )
}

export function useNewsletter() {
  const context = useContext(NewsletterContext)
  if (!context) {
    throw new Error('useNewsletter must be used within NewsletterProvider')
  }
  return context
}
