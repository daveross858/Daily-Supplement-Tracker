// Enhanced storage utilities with Firebase integration
// Maintains backward compatibility with localStorage as fallback

import { 
  getUserTodaysDataFromFirebase, 
  updateUserTodaysDataInFirebase,
  getUserDailyDataFromFirebase,
  getUserSupplementLibraryFromFirebase,
  saveUserSupplementLibraryToFirebase,
  createSupplementFromLibrary,
  migrateLocalStorageToFirebase
} from '../lib/firebase-service'

// Export types (same as before)
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

// Configuration flag to enable/disable Firebase
const USE_FIREBASE = process.env.NEXT_PUBLIC_USE_FIREBASE === 'true'

// Original localStorage functions for backward compatibility
const STORAGE_KEY = 'supplement-tracker-daily-data-v1'
const LIBRARY_KEY = 'supplement-tracker-library-v1'
const USERS_KEY = 'supplement-tracker-users-v1'
const SESSION_KEY = 'supplement-tracker-session-v1'

function parseSupplements(supps: any[]): Supplement[] {
  return supps.map((s) => ({
    ...s,
    takenAt: s.takenAt ? new Date(s.takenAt) : new Date(),
    completed: !!s.completed,
  }))
}

// Enhanced functions that use Firebase when available, localStorage as fallback
export async function getUserTodaysData(userId: string): Promise<DayData> {
  if (USE_FIREBASE && typeof window !== 'undefined') {
    try {
      return await getUserTodaysDataFromFirebase(userId)
    } catch (error) {
      console.warn('Firebase error, falling back to localStorage:', error)
    }
  }
  
  // Fallback to localStorage
  return getUserTodaysDataLocal(userId)
}

export async function updateUserTodaysData(userId: string, supplements: Supplement[]): Promise<void> {
  if (USE_FIREBASE && typeof window !== 'undefined') {
    try {
      await updateUserTodaysDataInFirebase(userId, supplements)
      return
    } catch (error) {
      console.warn('Firebase error, falling back to localStorage:', error)
    }
  }
  
  // Fallback to localStorage
  updateUserTodaysDataLocal(userId, supplements)
}

export async function getUserDailyData(userId: string): Promise<DayData[]> {
  if (USE_FIREBASE && typeof window !== 'undefined') {
    try {
      return await getUserDailyDataFromFirebase(userId)
    } catch (error) {
      console.warn('Firebase error, falling back to localStorage:', error)
    }
  }
  
  // Fallback to localStorage
  return getUserDailyDataLocal(userId)
}

export async function getUserSupplementLibrary(userId: string): Promise<SupplementLibraryItem[]> {
  if (USE_FIREBASE && typeof window !== 'undefined') {
    try {
      return await getUserSupplementLibraryFromFirebase(userId)
    } catch (error) {
      console.warn('Firebase error, falling back to localStorage:', error)
    }
  }
  
  // Fallback to localStorage
  return getUserSupplementLibraryLocal(userId)
}

export async function saveUserSupplementLibrary(userId: string, library: SupplementLibraryItem[]): Promise<void> {
  if (USE_FIREBASE && typeof window !== 'undefined') {
    try {
      await saveUserSupplementLibraryToFirebase(userId, library)
      return
    } catch (error) {
      console.warn('Firebase error, falling back to localStorage:', error)
    }
  }
  
  // Fallback to localStorage
  saveUserSupplementLibraryLocal(userId, library)
}

// Helper function for adding supplements from library
export function addSupplementFromLibrary(libraryItem: SupplementLibraryItem, timeCategory: TimeCategory): Supplement {
  return createSupplementFromLibrary(libraryItem, timeCategory)
}

// Migration function
export async function migrateDataToFirebase(userId: string) {
  if (USE_FIREBASE && typeof window !== 'undefined') {
    return await migrateLocalStorageToFirebase(userId)
  }
  return { success: false, error: 'Firebase not enabled' }
}

// Original localStorage functions (preserved for backward compatibility)
function getUserKey(userId: string, key: string): string {
  return `user_${userId}_${key}`
}

function getUserTodaysDataLocal(userId: string): DayData {
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

function updateUserTodaysDataLocal(userId: string, supplements: Supplement[]) {
  const today = new Date().toISOString().split('T')[0]
  const userKey = getUserKey(userId, today)
  const data: DayData = { date: today, supplements }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(userKey, JSON.stringify(data))
  }
}

function getUserDailyDataLocal(userId: string): DayData[] {
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

function getUserSupplementLibraryLocal(userId: string): SupplementLibraryItem[] {
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

function saveUserSupplementLibraryLocal(userId: string, library: SupplementLibraryItem[]) {
  const userLibraryKey = getUserKey(userId, 'library')
  if (typeof window !== 'undefined') {
    localStorage.setItem(userLibraryKey, JSON.stringify(library))
  }
}

// Default supplement library
function getDefaultLibrary(): SupplementLibraryItem[] {
  return [
    { id: '1', name: 'Vitamin D3', defaultDosage: '2000 IU', category: 'Vitamins' },
    { id: '2', name: 'Vitamin B12', defaultDosage: '1000 mcg', category: 'Vitamins' },
    { id: '3', name: 'Omega-3 Fish Oil', defaultDosage: '1000 mg', category: 'Fatty Acids' },
    { id: '4', name: 'Magnesium', defaultDosage: '400 mg', category: 'Minerals' },
    { id: '5', name: 'Vitamin C', defaultDosage: '1000 mg', category: 'Vitamins' },
    { id: '6', name: 'Zinc', defaultDosage: '15 mg', category: 'Minerals' },
    { id: '7', name: 'Probiotics', defaultDosage: '10 billion CFU', category: 'Digestive' },
    { id: '8', name: 'Multivitamin', defaultDosage: '1 tablet', category: 'Vitamins' },
    { id: '9', name: 'Calcium', defaultDosage: '500 mg', category: 'Minerals' },
    { id: '10', name: 'Iron', defaultDosage: '18 mg', category: 'Minerals' },
    { id: '11', name: 'Vitamin E', defaultDosage: '400 IU', category: 'Vitamins' },
    { id: '12', name: 'Biotin', defaultDosage: '5000 mcg', category: 'Vitamins' },
    { id: '13', name: 'Ashwagandha', defaultDosage: '300 mg', category: 'Herbs' },
    { id: '14', name: 'Turmeric', defaultDosage: '500 mg', category: 'Herbs' },
    { id: '15', name: 'CoQ10', defaultDosage: '100 mg', category: 'Antioxidants' }
  ]
}

// Legacy functions for backward compatibility (non-Firebase)
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
  const index = all.findIndex((d) => d.date === today)
  
  if (index >= 0) {
    all[index] = { date: today, supplements }
  } else {
    all.push({ date: today, supplements })
  }
  
  saveDailyData(all)
}

export function getSupplementLibrary(): SupplementLibraryItem[] {
  if (typeof window === 'undefined') return getDefaultLibrary()
  
  const raw = localStorage.getItem(LIBRARY_KEY)
  if (!raw) {
    const library = getDefaultLibrary()
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(library))
    return library
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

// User management functions (localStorage only for legacy compatibility)
function getAllUsers(): User[] {
  if (typeof window === 'undefined') return []
  const users = localStorage.getItem(USERS_KEY)
  return users ? JSON.parse(users) : []
}

function saveUsers(users: User[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }
}

// Simple hash function for passwords (for demo purposes only)
function simpleHash(password: string): string {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString()
}

export function createAccount(data: CreateAccountData) {
  const users = getAllUsers()
  
  // Check if user already exists
  if (users.find(u => u.email === data.email)) {
    return { success: false, error: 'User already exists' }
  }
  
  const user: User = {
    id: Date.now().toString(),
    email: data.email,
    name: data.name,
    createdAt: new Date(),
    lastLoginAt: new Date()
  }
  
  // Store hashed password separately (in real app, this would be server-side)
  const hashedPassword = simpleHash(data.password)
  localStorage.setItem(`password_${user.id}`, hashedPassword)
  
  users.push(user)
  saveUsers(users)
  
  return { success: true, user }
}

export function loginUser(data: LoginData) {
  const users = getAllUsers()
  const user = users.find(u => u.email === data.email)
  
  if (!user) {
    return { success: false, error: 'User not found' }
  }
  
  const storedPasswordHash = localStorage.getItem(`password_${user.id}`)
  const inputPasswordHash = simpleHash(data.password)
  
  if (storedPasswordHash !== inputPasswordHash) {
    return { success: false, error: 'Invalid password' }
  }
  
  // Update last login
  user.lastLoginAt = new Date()
  const userIndex = users.findIndex(u => u.id === user.id)
  users[userIndex] = user
  saveUsers(users)
  
  return { success: true, user }
}

export function createSession(user: User): AuthSession {
  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    token: Date.now().toString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }
  
  return session
}

export function getCurrentSession(): AuthSession | null {
  if (typeof window === 'undefined') return null
  
  const sessionData = localStorage.getItem(SESSION_KEY)
  if (!sessionData) return null
  
  try {
    const session = JSON.parse(sessionData)
    if (new Date() > new Date(session.expiresAt)) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY)
  }
}