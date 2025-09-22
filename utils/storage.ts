// Supplement and storage utilities for Daily Supplement Tracker

export type TimeCategory =
  | 'Morning (Wake + Breakfast)'
  | 'Midday (Lunch + Afternoon)'
  | 'Pre-Workout (Workout days)'
  | 'Evening (Dinner)'
  | 'Before Bed'

export interface Supplement {
  id: string
  name: string
  dosage: string
  timeCategory: TimeCategory
  takenAt: Date
  completed: boolean
}

export interface DayData {
  date: string // YYYY-MM-DD
  supplements: Supplement[]
}

export interface SupplementLibraryItem {
  id: string
  name: string
  defaultDosage: string
  category: string
}

// Authentication Types
export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  lastLoginAt: Date
}

export interface AuthSession {
  userId: string
  email: string
  name: string
  token: string
  expiresAt: Date
}

export interface CreateAccountData {
  email: string
  password: string
  name: string
}

export interface LoginData {
  email: string
  password: string
}

const STORAGE_KEY = 'supplement-tracker-daily-data-v1'
const LIBRARY_KEY = 'supplement-tracker-library-v1'

function parseSupplements(supps: any[]): Supplement[] {
  return supps.map((s) => ({
    ...s,
    takenAt: s.takenAt ? new Date(s.takenAt) : new Date(),
    completed: !!s.completed,
  }))
}

export function getDailyData(): DayData[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    return arr.map((d: any) => ({
      ...d,
      supplements: parseSupplements(d.supplements || []),
    }))
  } catch {
    return []
  }
}

export function saveDailyData(data: DayData[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getTodaysData(): DayData {
  const today = new Date().toISOString().split('T')[0]
  const all = getDailyData()
  let day = all.find((d) => d.date === today)
  if (!day) {
    day = { date: today, supplements: [] }
    all.push(day)
    saveDailyData(all)
  }
  return {
    ...day,
    supplements: parseSupplements(day.supplements || []),
  }
}

export function updateTodaysData(supplements: Supplement[]) {
  const today = new Date().toISOString().split('T')[0]
  const all = getDailyData()
  const idx = all.findIndex((d) => d.date === today)
  if (idx !== -1) {
    all[idx].supplements = supplements
  } else {
    all.push({ date: today, supplements })
  }
  saveDailyData(all)
}

// Library management functions
export function getSupplementLibrary(): SupplementLibraryItem[] {
  if (typeof window === 'undefined') return getDefaultLibrary()
  const raw = localStorage.getItem(LIBRARY_KEY)
  if (!raw) {
    const defaultLib = getDefaultLibrary()
    saveSupplementLibrary(defaultLib)
    return defaultLib
  }
  try {
    return JSON.parse(raw)
  } catch {
    return getDefaultLibrary()
  }
}

export function saveSupplementLibrary(library: SupplementLibraryItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(library))
}

function getDefaultLibrary(): SupplementLibraryItem[] {
  return [
    { id: '1', name: 'Vitamin D3', defaultDosage: '1000 IU', category: 'Vitamins' },
    { id: '2', name: 'Omega-3', defaultDosage: '1000mg', category: 'Essential Fatty Acids' },
    { id: '3', name: 'Multivitamin', defaultDosage: '1 tablet', category: 'Vitamins' },
    { id: '4', name: 'Magnesium', defaultDosage: '400mg', category: 'Minerals' },
    { id: '5', name: 'Vitamin C', defaultDosage: '500mg', category: 'Vitamins' },
    { id: '6', name: 'Zinc', defaultDosage: '15mg', category: 'Minerals' },
    { id: '7', name: 'Probiotics', defaultDosage: '1 capsule', category: 'Digestive Health' },
  ]
}

export function addSupplementFromLibrary(
  libraryItem: SupplementLibraryItem,
  timeCategory: TimeCategory
): Supplement {
  return {
    id: Date.now().toString(),
    name: libraryItem.name,
    dosage: libraryItem.defaultDosage,
    timeCategory,
    takenAt: new Date(),
    completed: false,
  }
}

// Authentication Storage Keys
const USERS_KEY = 'supplement_tracker_users'
const SESSION_KEY = 'supplement_tracker_session'

// Simple password hashing (in production, use proper bcrypt or similar)
function hashPassword(password: string): string {
  // Simple hash for demo - in production use proper hashing
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString()
}

// Generate a simple session token
function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Get all users from localStorage
function getUsers(): User[] {
  if (typeof window === 'undefined') return []
  const users = localStorage.getItem(USERS_KEY)
  return users ? JSON.parse(users) : []
}

// Save users to localStorage
function saveUsers(users: User[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// Create a new account
export function createAccount(accountData: CreateAccountData): { success: boolean; error?: string; user?: User } {
  const users = getUsers()
  
  // Check if email already exists
  if (users.find(user => user.email === accountData.email)) {
    return { success: false, error: 'Account with this email already exists' }
  }

  // Validate input
  if (!accountData.email || !accountData.password || !accountData.name) {
    return { success: false, error: 'All fields are required' }
  }

  if (!accountData.email.includes('@')) {
    return { success: false, error: 'Please enter a valid email address' }
  }

  if (accountData.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' }
  }

  // Create new user
  const newUser: User = {
    id: Date.now().toString(),
    email: accountData.email,
    name: accountData.name,
    createdAt: new Date(),
    lastLoginAt: new Date()
  }

  // Store user with hashed password
  const userWithPassword = {
    ...newUser,
    passwordHash: hashPassword(accountData.password)
  }

  users.push(userWithPassword)
  saveUsers(users)

  return { success: true, user: newUser }
}

// Login user
export function loginUser(loginData: LoginData): { success: boolean; error?: string; user?: User } {
  const users = getUsers()
  const hashedPassword = hashPassword(loginData.password)
  
  const userWithPassword = users.find(user => 
    user.email === loginData.email && (user as any).passwordHash === hashedPassword
  )

  if (!userWithPassword) {
    return { success: false, error: 'Invalid email or password' }
  }

  // Update last login
  userWithPassword.lastLoginAt = new Date()
  saveUsers(users)

  // Return user without password hash
  const { passwordHash, ...user } = userWithPassword as any
  return { success: true, user: user as User }
}

// Create and save session
export function createSession(user: User): AuthSession {
  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    token: generateToken(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  return session
}

// Get current session
export function getCurrentSession(): AuthSession | null {
  if (typeof window === 'undefined') return null
  
  const sessionData = localStorage.getItem(SESSION_KEY)
  if (!sessionData) return null

  const session: AuthSession = JSON.parse(sessionData)
  
  // Check if session is expired
  if (new Date(session.expiresAt) < new Date()) {
    localStorage.removeItem(SESSION_KEY)
    return null
  }

  return session
}

// Logout user
export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY)
  }
}

// Get user-specific storage key
function getUserKey(userId: string, key: string): string {
  return `user_${userId}_${key}`
}

// Update storage functions to be user-specific
export function getUserDailyData(userId: string): DayData[] {
  if (typeof window === 'undefined') return []
  
  const allData: DayData[] = []
  const keys = Object.keys(localStorage)
  const userPrefix = `user_${userId}_`
  
  keys.forEach(key => {
    if (key.startsWith(userPrefix) && !key.includes('library') && !key.includes('session')) {
      const data = localStorage.getItem(key)
      if (data) {
        try {
          const parsed = JSON.parse(data)
          if (parsed.date && parsed.supplements) {
            allData.push({
              ...parsed,
              supplements: parsed.supplements.map((s: any) => ({
                ...s,
                takenAt: new Date(s.takenAt)
              }))
            })
          }
        } catch (e) {
          // Skip invalid data
        }
      }
    }
  })
  
  return allData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export function getUserTodaysData(userId: string): DayData {
  const today = new Date().toISOString().split('T')[0]
  const userKey = getUserKey(userId, today)
  
  if (typeof window === 'undefined') return { date: today, supplements: [] }
  
  const data = localStorage.getItem(userKey)
  if (data) {
    const parsed = JSON.parse(data)
    return {
      ...parsed,
      supplements: parsed.supplements.map((s: any) => ({
        ...s,
        takenAt: new Date(s.takenAt)
      }))
    }
  }
  return { date: today, supplements: [] }
}

export function updateUserTodaysData(userId: string, supplements: Supplement[]) {
  const today = new Date().toISOString().split('T')[0]
  const userKey = getUserKey(userId, today)
  const data: DayData = { date: today, supplements }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(userKey, JSON.stringify(data))
  }
}

export function getUserSupplementLibrary(userId: string): SupplementLibraryItem[] {
  const userLibraryKey = getUserKey(userId, 'library')
  
  if (typeof window === 'undefined') return getDefaultLibrary()
  
  const library = localStorage.getItem(userLibraryKey)
  if (library) {
    return JSON.parse(library)
  } else {
    const defaultLibrary = getDefaultLibrary()
    localStorage.setItem(userLibraryKey, JSON.stringify(defaultLibrary))
    return defaultLibrary
  }
}

export function saveUserSupplementLibrary(userId: string, library: SupplementLibraryItem[]) {
  const userLibraryKey = getUserKey(userId, 'library')
  if (typeof window !== 'undefined') {
    localStorage.setItem(userLibraryKey, JSON.stringify(library))
  }
}
