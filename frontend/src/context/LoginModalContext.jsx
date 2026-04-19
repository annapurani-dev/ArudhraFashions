import { createContext, useContext, useState } from 'react'

const LoginModalContext = createContext()

export function LoginModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialMode, setInitialMode] = useState('login') // 'login' or 'register'

  const openModal = (mode = 'login') => {
    setInitialMode(mode)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
  }

  return (
    <LoginModalContext.Provider value={{ isOpen, openModal, closeModal, initialMode }}>
      {children}
    </LoginModalContext.Provider>
  )
}

export function useLoginModal() {
  const context = useContext(LoginModalContext)
  if (!context) {
    throw new Error('useLoginModal must be used within LoginModalProvider')
  }
  return context
}
