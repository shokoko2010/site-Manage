// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Team {
  id: string;
  name: string;
  owner: string;
  members: string[];
  roles: { [key: string]: 'Admin' | 'Editor' | 'Viewer' };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  team: Team | null;
  userRole: 'Admin' | 'Editor' | 'Viewer' | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  team: null,
  userRole: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [userRole, setUserRole] = useState<'Admin' | 'Editor' | 'Viewer' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const teamsQuery = query(collection(db, "teams"), where("members", "array-contains", currentUser.uid));
        const teamsSnapshot = await getDocs(teamsQuery);
        if (!teamsSnapshot.empty) {
          const teamDoc = teamsSnapshot.docs[0];
          const teamData = { id: teamDoc.id, ...teamDoc.data() } as Team;
          setTeam(teamData);
          setUserRole(teamData.roles[currentUser.uid] || null);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, team, userRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
