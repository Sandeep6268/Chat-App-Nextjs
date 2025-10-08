// --- path: /src/components/auth/AuthProvider.tsx ---
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, updateUserPresence } from '@/lib/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    //console.log('AuthProvider mounted - setting up auth listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      //console.log('🔥 Auth state changed:', user ? `User: ${user.uid}` : 'No user');
      
      if (user) {
        // Create or update user profile in Firestore
        try {
          //console.log('🔄 Creating user profile for:', user.uid);
          await createUserProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            phoneNumber: user.phoneNumber,
          });
          //console.log('✅ User profile created successfully');
          
          // Set user as online
          await updateUserPresence(user.uid, true);
        } catch (error) {
          console.error('❌ Error creating user profile:', error);
        }
      }
      
      setUser(user);
      setLoading(false);
    });

    return () => {
      //console.log('AuthProvider unmounted - cleaning up');
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}