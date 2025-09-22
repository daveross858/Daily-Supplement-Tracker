import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  User, 
  AuthSession, 
  CreateAccountData, 
  LoginData, 
  createAccount, 
  loginUser, 
  createSession, 
  getCurrentSession, 
  logout as logoutUser 
} from '../utils/storage'

interface AuthContextType {
  user: User | null
  session: AuthSession | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (loginData: LoginData) => Promise<{ success: boolean; error?: string }>
  register: (accountData: CreateAccountData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user && !!session

  // Check for existing session on mount
  useEffect(() => {
    const existingSession = getCurrentSession()
    if (existingSession) {
      setSession(existingSession)
      setUser({
        id: existingSession.userId,
        email: existingSession.email,
        name: existingSession.name,
        createdAt: new Date(), // We don't store these in session
        lastLoginAt: new Date()
      })
    }
    setIsLoading(false)
  }, [])

  const login = async (loginData: LoginData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    
    const result = loginUser(loginData)
    
    if (result.success && result.user) {
      const newSession = createSession(result.user)
      setUser(result.user)
      setSession(newSession)
    }
    
    setIsLoading(false)
    return result
  }

  const register = async (accountData: CreateAccountData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    
    const result = createAccount(accountData)
    
    if (result.success && result.user) {
      const newSession = createSession(result.user)
      setUser(result.user)
      setSession(newSession)
    }
    
    setIsLoading(false)
    return result
  }

  const logout = () => {
    logoutUser()
    setUser(null)
    setSession(null)
  }

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}