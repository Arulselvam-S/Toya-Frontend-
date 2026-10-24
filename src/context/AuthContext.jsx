
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export const ROLE_HOME = {
  admin: "/admin/dashboard",
  manager: "/manager/dashboard",
  employee: "/employee/dashboard",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setLoading(true);
        setProfileError("");

        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          const profileRef = doc(
            db,
            "employees",
            firebaseUser.uid
          );

          const profileSnap = await getDoc(profileRef);

          if (!profileSnap.exists()) {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email,
              role: null,
              department: null,
              active: false,
            });

            setProfileError(
              "Employee profile not found. Contact your administrator."
            );
            return;
          }

          const profile = profileSnap.data();

          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: profile.name || firebaseUser.displayName || firebaseUser.email,
            role: profile.role || null,
            department: profile.department || null,
            active: profile.active === true,
          });
        } catch (error) {
          console.error("Employee profile load failed:", error);
          setUser(null);
          setProfileError(
            "Unable to load your employee profile. Please try again."
          );
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  const loginFirebase = async (email, password) => {
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      return {
        success: true,
        firebaseUser: credential.user,
      };
    } catch (error) {
      let message = "Login failed. Please try again.";

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/invalid-login-credentials"
      ) {
        message = "Invalid email or password.";
      } else if (error.code === "auth/too-many-requests") {
        message = "Too many attempts. Please try again later.";
      } else if (error.code === "auth/network-request-failed") {
        message = "Network error. Check your internet connection.";
      }

      return {
        success: false,
        message,
      };
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      profileError,
      isAuthenticated: Boolean(user),
      role: user?.role || null,
      loginFirebase,
      logout,
    }),
    [user, loading, profileError]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
