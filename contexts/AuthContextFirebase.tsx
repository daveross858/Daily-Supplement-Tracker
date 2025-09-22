// Enhanced AuthContext with Firebase integration
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  User, 
  CreateAccountData, 
  LoginData,
} from '../utils/storage-enhanced'
import { 
  signUpWithEmail, 
  signInWithEmail, 
  signOut as firebaseSignOut,
  onAuthStateChange 
} from '../lib/firebase-service'
import { 
  createAccount, 
  loginUser, 
  createSession, 
  getCurrentSession, 
  logout as localLogout 
} from '../utils/storage-enhanced'

interface AuthContextType {
  user: User | null
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

const USE_FIREBASE = process.env.NEXT_PUBLIC_USE_FIREBASE === 'true'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (USE_FIREBASE) {
      // Use Firebase auth state listener
      const unsubscribe = onAuthStateChange((firebaseUser) => {
        setUser(firebaseUser)
        setIsLoading(false)
      })
      
      return unsubscribe
    } else {
      // Use localStorage session checking
      const checkSession = () => {
        const session = getCurrentSession()
        if (session) {
          // Convert session to user object
          const sessionUser: User = {
            id: session.userId,
            email: session.email,
            name: session.name,
            createdAt: new Date(), // We don't store these in session
            lastLoginAt: new Date()
          }
          setUser(sessionUser)
        }
        setIsLoading(false)
      }

      checkSession()
    }
  }, [])

  const login = async (loginData: LoginData) => {
    setIsLoading(true)
    
    try {
      if (USE_FIREBASE) {
        const result = await signInWithEmail(loginData.email, loginData.password)
        if (result.success && result.user) {
          setUser(result.user)
          return { success: true }
        } else {
          return { success: false, error: result.error || 'Login failed' }
        }
      } else {
        // Use localStorage authentication
        const result = loginUser(loginData)
        if (result.success && result.user) {
          const session = createSession(result.user)
          setUser(result.user)
          return { success: true }
        } else {
          return { success: false, error: result.error || 'Login failed' }
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (accountData: CreateAccountData) => {
    setIsLoading(true)
    
    try {
      if (USE_FIREBASE) {
        const result = await signUpWithEmail(accountData.email, accountData.password, accountData.name)
        if (result.success && result.user) {
          setUser(result.user)
          return { success: true }
        } else {
          return { success: false, error: result.error || 'Registration failed' }
        }
      } else {
        // Use localStorage authentication
        const result = createAccount(accountData)
        if (result.success && result.user) {
          const session = createSession(result.user)
          setUser(result.user)
          return { success: true }
        } else {
          return { success: false, error: result.error || 'Registration failed' }
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    
    try {
      if (USE_FIREBASE) {
        await firebaseSignOut()
      } else {
        localLogout()
      }
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
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