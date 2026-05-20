import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail as firebaseSendPasswordReset,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, IS_DEMO_MODE } from '../services/firebase';
import type { AdminUser, UserRole } from '../types';
import { getMockCollection } from '../utils/mockData';

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync session in Demo Mode or fetch on mount
  useEffect(() => {
    if (IS_DEMO_MODE) {
      const savedMockUser = sessionStorage.getItem('zoa_active_user');
      if (savedMockUser) {
        setUser(JSON.parse(savedMockUser));
      }
      setLoading(false);
      return;
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    // Firebase Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Fetch admin role & status from Firestore
          const docRef = doc(db, 'admins', firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const adminData = docSnap.data();
            if (adminData.status === 'disabled') {
              setError('Your admin account has been disabled. Contact super admin.');
              await firebaseSignOut(auth);
              setUser(null);
            } else {
              setUser({
                id: firebaseUser.uid,
                fullName: adminData.fullName || firebaseUser.displayName || 'Admin User',
                email: firebaseUser.email || adminData.email || '',
                role: adminData.role as UserRole,
                status: adminData.status,
                createdAt: adminData.createdAt || new Date().toISOString(),
              });
              setError(null);
            }
          } else {
            // Logged in but not in admins collection
            setError(`Unauthorized: Email ${firebaseUser.email} is not registered as an Admin in the database. Please add this UID: ${firebaseUser.uid} in the Firebase Console.`);
            await firebaseSignOut(auth);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err: any) {
        console.error('Error fetching admin profile:', err);
        setError(err.message || 'Error loading profile');
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<AdminUser> => {
    setError(null);
    setLoading(true);

    if (IS_DEMO_MODE) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const admins = getMockCollection<AdminUser>('admins');
            const foundAdmin = admins.find(a => a.email.toLowerCase() === email.toLowerCase());

            if (!foundAdmin) {
              setLoading(false);
              const errStr = 'User not found. Try superadmin@zubair.com or admin@zubair.com';
              setError(errStr);
              reject(new Error(errStr));
              return;
            }

            if (foundAdmin.status === 'disabled') {
              setLoading(false);
              const errStr = 'Account is suspended/disabled.';
              setError(errStr);
              reject(new Error(errStr));
              return;
            }

            // Simple mock password bypass
            sessionStorage.setItem('zoa_active_user', JSON.stringify(foundAdmin));
            setUser(foundAdmin);
            setLoading(false);
            resolve(foundAdmin);
          } catch (e: any) {
            setLoading(false);
            setError(e.message);
            reject(e);
          }
        }, 1000); // simulate network delay
      });
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Fetch admin role & status from Firestore
      const docRef = doc(db, 'admins', firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const adminData = docSnap.data();
        if (adminData.status === 'disabled') {
          await firebaseSignOut(auth);
          throw new Error('Your admin account has been disabled. Contact super admin.');
        }

        const normalizedRole = adminData.role === 'superadmin' ? 'super_admin' : adminData.role;
        const adminUser: AdminUser = {
          id: firebaseUser.uid,
          fullName: adminData.fullName || adminData.name || 'Admin User',
          email: firebaseUser.email || '',
          role: normalizedRole as UserRole,
          status: adminData.status || 'active',
          createdAt: adminData.createdAt || new Date().toISOString(),
        };

        setUser(adminUser);
        setLoading(false);
        return adminUser;
      } else {
        await firebaseSignOut(auth);
        throw new Error(`Unauthorized: Email ${firebaseUser.email} is not registered in the 'admins' collection. Please add a document with ID: ${firebaseUser.uid} in the Firebase Console.`);
      }
    } catch (err: any) {
      setLoading(false);
      let errMsg = err.message || 'Login failed';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errMsg = 'Invalid email or password.';
      }
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    if (IS_DEMO_MODE) {
      sessionStorage.removeItem('zoa_active_user');
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    if (IS_DEMO_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log(`Demo Mode: Password reset email simulated to ${email}`);
          resolve();
        }, 800);
      });
    }

    try {
      await firebaseSendPasswordReset(auth, email);
    } catch (err: any) {
      let errMsg = err.message || 'Reset password failed';
      if (err.code === 'auth/user-not-found') {
        errMsg = 'No user found with this email.';
      }
      throw new Error(errMsg);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, resetPassword, isDemo: IS_DEMO_MODE }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
