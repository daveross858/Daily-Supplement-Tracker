// Firebase database service functions
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth'
import { db, auth } from './firebase'
import { User, DayData, Supplement, SupplementLibraryItem, TimeCategory } from '../utils/storage'

// Collection names
const USERS_COLLECTION = 'users'
const DAILY_DATA_COLLECTION = 'dailyData'
const SUPPLEMENT_LIBRARY_COLLECTION = 'supplementLibraries'

// Firebase User type conversion
export function convertFirebaseUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
    lastLoginAt: new Date(firebaseUser.metadata.lastSignInTime || Date.now())
  }
}

// Authentication functions
export async function signUpWithEmail(email: string, password: string, name: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user
    
    // Create user document in Firestore
    const userData: User = {
      id: firebaseUser.uid,
      email: email,
      name: name,
      createdAt: new Date(),
      lastLoginAt: new Date()
    }
    
    await setDoc(doc(db, USERS_COLLECTION, firebaseUser.uid), userData)
    
    return { success: true, user: userData }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user
    
    // Update last login time
    await updateDoc(doc(db, USERS_COLLECTION, firebaseUser.uid), {
      lastLoginAt: new Date()
    })
    
    const user = convertFirebaseUser(firebaseUser)
    return { success: true, user }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Auth state listener
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Get full user data from Firestore
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, firebaseUser.uid))
      if (userDoc.exists()) {
        callback(userDoc.data() as User)
      } else {
        callback(convertFirebaseUser(firebaseUser))
      }
    } else {
      callback(null)
    }
  })
}

// Daily data functions
export async function getUserTodaysDataFromFirebase(userId: string): Promise<DayData> {
  const today = new Date().toISOString().split('T')[0]
  const docRef = doc(db, DAILY_DATA_COLLECTION, `${userId}_${today}`)
  
  try {
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        date: data.date,
        supplements: data.supplements.map((s: any) => ({
          ...s,
          takenAt: s.takenAt.toDate()
        }))
      }
    }
  } catch (error) {
    console.error('Error fetching today\'s data:', error)
  }
  
  return { date: today, supplements: [] }
}

export async function updateUserTodaysDataInFirebase(userId: string, supplements: Supplement[]) {
  const today = new Date().toISOString().split('T')[0]
  const docRef = doc(db, DAILY_DATA_COLLECTION, `${userId}_${today}`)
  
  try {
    const data: DayData = { 
      date: today, 
      supplements: supplements.map(s => ({
        ...s,
        takenAt: Timestamp.fromDate(s.takenAt)
      })) as any
    }
    
    await setDoc(docRef, data)
    return { success: true }
  } catch (error: any) {
    console.error('Error updating today\'s data:', error)
    return { success: false, error: error.message }
  }
}

export async function getUserDailyDataFromFirebase(userId: string): Promise<DayData[]> {
  try {
    const q = query(
      collection(db, DAILY_DATA_COLLECTION),
      where('__name__', '>=', `${userId}_`),
      where('__name__', '<', `${userId}_\uf8ff`),
      orderBy('__name__')
    )
    
    const querySnapshot = await getDocs(q)
    const data: DayData[] = []
    
    querySnapshot.forEach((doc) => {
      const docData = doc.data()
      data.push({
        date: docData.date,
        supplements: docData.supplements.map((s: any) => ({
          ...s,
          takenAt: s.takenAt.toDate()
        }))
      })
    })
    
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  } catch (error) {
    console.error('Error fetching user daily data:', error)
    return []
  }
}

// Supplement library functions
export async function getUserSupplementLibraryFromFirebase(userId: string): Promise<SupplementLibraryItem[]> {
  const docRef = doc(db, SUPPLEMENT_LIBRARY_COLLECTION, userId)
  
  try {
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return docSnap.data().library || []
    }
  } catch (error) {
    console.error('Error fetching supplement library:', error)
  }
  
  // Return default library if none exists
  const defaultLibrary = getDefaultSupplementLibrary()
  await saveUserSupplementLibraryToFirebase(userId, defaultLibrary)
  return defaultLibrary
}

export async function saveUserSupplementLibraryToFirebase(userId: string, library: SupplementLibraryItem[]) {
  const docRef = doc(db, SUPPLEMENT_LIBRARY_COLLECTION, userId)
  
  try {
    await setDoc(docRef, { library })
    return { success: true }
  } catch (error: any) {
    console.error('Error saving supplement library:', error)
    return { success: false, error: error.message }
  }
}

// Default supplement library
function getDefaultSupplementLibrary(): SupplementLibraryItem[] {
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

// Utility function to create a supplement from library item
export function createSupplementFromLibrary(libraryItem: SupplementLibraryItem, timeCategory: TimeCategory): Supplement {
  return {
    id: Date.now().toString(),
    name: libraryItem.name,
    dosage: libraryItem.defaultDosage,
    timeCategory: timeCategory,
    takenAt: new Date(),
    completed: false
  }
}

// Migration function to move localStorage data to Firebase
export async function migrateLocalStorageToFirebase(userId: string) {
  try {
    // Check if we already have Firebase data for this user
    const existingData = await getUserDailyDataFromFirebase(userId)
    if (existingData.length > 0) {
      return { success: true, message: 'Data already exists in Firebase' }
    }

    // Get data from localStorage
    const localStorageKeys = Object.keys(localStorage)
    const batch = writeBatch(db)
    let migrated = 0

    for (const key of localStorageKeys) {
      if (key.startsWith(`user_${userId}_`) && !key.includes('library') && !key.includes('session')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          if (data.date && data.supplements) {
            const docRef = doc(db, DAILY_DATA_COLLECTION, `${userId}_${data.date}`)
            batch.set(docRef, {
              date: data.date,
              supplements: data.supplements.map((s: any) => ({
                ...s,
                takenAt: Timestamp.fromDate(new Date(s.takenAt))
              }))
            })
            migrated++
          }
        } catch (error) {
          console.error('Error migrating data for key:', key, error)
        }
      }
    }

    if (migrated > 0) {
      await batch.commit()
    }

    return { success: true, message: `Migrated ${migrated} days of data` }
  } catch (error: any) {
    console.error('Migration error:', error)
    return { success: false, error: error.message }
  }
}