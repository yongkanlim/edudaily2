// src/components/useSupabaseUser.js
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export function useSupabaseUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get the current session
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);
        localStorage.setItem("user", JSON.stringify(session.user));
      } else {
        const stored = localStorage.getItem("user");
        if (stored) setUser(JSON.parse(stored));
      }
    };

    getUser();

    // Listen for changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return user;
}
