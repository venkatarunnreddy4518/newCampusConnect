import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../pages/supabase";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async (userId: string) => {
      console.log("1. Checking admin status for ID:", userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      // Tell TypeScript to relax and let us read the properties
      const profile = data as any; 
      
      console.log("2. Supabase returned Data:", profile, "Error:", error);
      
      if (profile && (profile.role === 'admin' || profile.is_admin === true)) {
        console.log("3. SUCCESS! User is confirmed as Admin.");
        setIsAdmin(true);
      } else {
        console.log("3. FAILED. User is not an admin according to data.");
        setIsAdmin(false);
      }
      setLoading(false);
    };

    // 1. Check if the user is logged in when the app loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for any login or logout events in real-time
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          checkAdminStatus(session.user.id);
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin,
      isModerator: false,
      signIn: async () => {}, 
      signUp: async () => {}, 
      signOut: async () => await supabase.auth.signOut()
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
