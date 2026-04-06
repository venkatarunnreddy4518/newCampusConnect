import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/database/client";

type AuthUser = {
  id: string;
  email: string | null;
  user_metadata?: {
    full_name?: string;
  };
  app_metadata?: {
    roles?: string[];
    primary_role?: string;
    permissions?: unknown[];
  };
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getRoles(user: AuthUser | null) {
  return user?.app_metadata?.roles || [];
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }
      setUser((data.session?.user as AuthUser) ?? null);
      setLoading(false);
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }
      setUser((session?.user as AuthUser) ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const roles = getRoles(user);

    return {
      user,
      loading,
      isAdmin: roles.includes("admin"),
      isModerator: roles.includes("moderator"),
      signOut: async () => {
        await supabase.auth.signOut();
      },
    };
  }, [loading, user]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
};

