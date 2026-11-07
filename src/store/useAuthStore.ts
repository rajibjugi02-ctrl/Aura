import { create } from "zustand";
import { UserAccount } from "@/types";
import { supabase } from "@/lib/supabase";

interface AuthState {
  currentUser: UserAccount | null;
  accounts: UserAccount[];
  isAuthenticated: boolean;
  login: (identifier: string, password?: string) => boolean;
  loginWithGoogle: () => Promise<void>;
  syncSupabaseUser: (user: unknown) => void;
  register: (data: {
    fullName: string;
    username: string;
    email: string;
    password?: string;
    phone?: string;
  }) => UserAccount;
  logout: () => void;
  switchAccount: (id: string) => void;
  addAccount: (account: Omit<UserAccount, "id" | "isCurrent">) => boolean;
  removeAccount: (id: string) => void;
  updateBio: (bio: string, links?: { title: string; url: string }[]) => void;
  updateProfile: (profile: Partial<UserAccount>) => void;
  restoreSession: () => boolean;
}

const STORAGE_KEY = "auraglass_auth_session";

// Load persisted state safely in browser environment
function loadInitialState(): { currentUser: UserAccount | null; accounts: UserAccount[]; isAuthenticated: boolean } {
  if (typeof window === "undefined") {
    return { currentUser: null, accounts: [], isAuthenticated: false };
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.isAuthenticated && parsed.currentUser) {
        return {
          currentUser: parsed.currentUser,
          accounts: parsed.accounts || [parsed.currentUser],
          isAuthenticated: true,
        };
      }
    }
  } catch (err) {
    console.error("Failed to restore auth session:", err);
  }
  return { currentUser: null, accounts: [], isAuthenticated: false };
}

function persistState(state: { currentUser: UserAccount | null; accounts: UserAccount[]; isAuthenticated: boolean }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to persist auth session:", err);
  }
}

const initialState = loadInitialState();

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: initialState.currentUser,
  accounts: initialState.accounts,
  isAuthenticated: initialState.isAuthenticated,

  restoreSession: () => {
    if (typeof window === "undefined") return false;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isAuthenticated && parsed.currentUser) {
          const restoredState = {
            currentUser: parsed.currentUser,
            accounts: parsed.accounts || [parsed.currentUser],
            isAuthenticated: true,
          };
          set(restoredState);
          return true;
        }
      }
    } catch (err) {
      console.error("Failed to restore auth session:", err);
    }
    return false;
  },

  login: (identifier: string) => {
    const { accounts } = get();
    const cleanId = identifier.trim().toLowerCase().replace("@", "");

    let account = accounts.find(
      (acc) =>
        acc.username.toLowerCase() === cleanId ||
        acc.email.toLowerCase() === cleanId
    );

    if (!account) {
      account = {
        id: `acc_${Date.now()}`,
        name: identifier.split("@")[0] || identifier,
        username: cleanId || `user_${Math.floor(Math.random() * 8999 + 1000)}`,
        email: identifier.includes("@") ? identifier : `${cleanId}@preview.com`,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
        bio: "",
        links: [],
        isCurrent: true,
      };
    }

    const updatedAccounts = accounts.some((a) => a.id === account!.id)
      ? accounts.map((a) => ({ ...a, isCurrent: a.id === account!.id }))
      : [...accounts.map((a) => ({ ...a, isCurrent: false })), { ...account, isCurrent: true }];

    const newState = {
      currentUser: { ...account, isCurrent: true },
      accounts: updatedAccounts,
      isAuthenticated: true,
    };

    set(newState);
    persistState(newState);
    return true;
  },

  loginWithGoogle: async () => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/`,
        },
      });

      if (error) {
        console.error("Supabase Google OAuth error:", error.message);
        throw error;
      }

      if (data?.url) {
        window.location.assign(data.url);
        return;
      }
    } catch (e) {
      console.error("Google OAuth error:", e);
      throw e;
    }
  },

  syncSupabaseUser: (rawUser: unknown) => {
    const user = rawUser as {
      id?: string;
      email?: string;
      user_metadata?: {
        full_name?: string;
        name?: string;
        given_name?: string;
        family_name?: string;
        preferred_username?: string;
        user_name?: string;
        avatar_url?: string;
        picture?: string;
        avatar?: string;
        bio?: string;
      };
    };
    if (!user) return;

    const email = user.email || "";

    // 1. Extract authentic Google Full Name
    const googleFullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      (user.user_metadata?.given_name
        ? `${user.user_metadata.given_name} ${user.user_metadata?.family_name || ""}`.trim()
        : "") ||
      (email ? email.split("@")[0] : "Google User");

    // 2. Extract authentic Google Username (e.g. from email 'rajibjugi02@gmail.com' -> 'rajibjugi02')
    const googleUsername = (
      user.user_metadata?.preferred_username ||
      user.user_metadata?.user_name ||
      (email ? email.split("@")[0] : googleFullName.toLowerCase().replace(/\s+/g, "_"))
    )
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "");

    // 3. Extract authentic Google Profile Avatar
    const googleAvatar =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      user.user_metadata?.avatar ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop";

    // Build the authentic Google account object
    const updatedAccount: UserAccount = {
      id: user.id || `acc_google_${Date.now()}`,
      name: googleFullName,
      username: googleUsername,
      email: email,
      avatar: googleAvatar,
      bio: user.user_metadata?.bio || "Joined via Google",
      links: [],
      isCurrent: true,
    };

    const { accounts } = get();

    // Remove any previous generic dummy "user" account and avoid duplicates
    const filteredAccounts = accounts.filter(
      (a) =>
        a.id !== updatedAccount.id &&
        a.username !== "user" &&
        a.username !== updatedAccount.username &&
        (!email || a.email.toLowerCase() !== email.toLowerCase())
    );

    const newAccounts = [
      updatedAccount,
      ...filteredAccounts.map((a) => ({ ...a, isCurrent: false })),
    ];

    const newState = {
      currentUser: updatedAccount,
      accounts: newAccounts,
      isAuthenticated: true,
    };

    set(newState);
    persistState(newState);
  },

  register: (data) => {
    const { accounts } = get();
    const cleanUsername = data.username.trim().toLowerCase().replace(/\s+/g, "");

    const newAccount: UserAccount = {
      id: `acc_${Date.now()}`,
      name: data.fullName.trim() || cleanUsername,
      username: cleanUsername,
      email: data.email.trim(),
      phone: data.phone,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
      bio: "",
      links: [],
      isCurrent: false,
    };

    const updatedAccounts = [
      ...accounts.filter((a) => a.username !== cleanUsername),
      newAccount,
    ];

    const newState = {
      currentUser: null,
      accounts: updatedAccounts,
      isAuthenticated: false,
    };

    set(newState);
    persistState(newState);
    return newAccount;
  },

  logout: () => {
    try {
      supabase.auth.signOut().catch(() => {});
    } catch {}
    const newState = {
      currentUser: null,
      accounts: [],
      isAuthenticated: false,
    };
    set(newState);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  },

  switchAccount: (id: string) => {
    const { accounts } = get();
    const target = accounts.find((acc) => acc.id === id);
    if (!target) return;

    const updatedAccounts = accounts.map((acc) => ({
      ...acc,
      isCurrent: acc.id === id,
    }));

    const newState = {
      currentUser: { ...target, isCurrent: true },
      accounts: updatedAccounts,
      isAuthenticated: true,
    };

    set(newState);
    persistState(newState);
  },

  addAccount: (accountData) => {
    const { accounts } = get();
    if (accounts.length >= 5) return false;

    const newAcc: UserAccount = {
      ...accountData,
      id: `acc_${Date.now()}`,
      isCurrent: false,
    };

    const newState = {
      currentUser: get().currentUser,
      accounts: [...accounts, newAcc],
      isAuthenticated: true,
    };

    set(newState);
    persistState(newState);
    return true;
  },

  removeAccount: (id: string) => {
    const { accounts, currentUser } = get();
    const remaining = accounts.filter((a) => a.id !== id);

    let nextUser = currentUser;
    if (currentUser?.id === id) {
      nextUser = remaining[0] || null;
      if (nextUser) nextUser.isCurrent = true;
    }

    const newState = {
      currentUser: nextUser,
      accounts: remaining,
      isAuthenticated: !!nextUser,
    };

    set(newState);
    persistState(newState);
  },

  updateBio: (bio: string, links?: { title: string; url: string }[]) => {
    const { currentUser, accounts } = get();
    if (!currentUser) return;

    const updatedUser = {
      ...currentUser,
      bio,
      links: links !== undefined ? links : currentUser.links,
    };

    const updatedAccounts = accounts.map((acc) =>
      acc.id === currentUser.id ? updatedUser : acc
    );

    const newState = {
      currentUser: updatedUser,
      accounts: updatedAccounts,
      isAuthenticated: true,
    };

    set(newState);
    persistState(newState);
  },

  updateProfile: (profile) => {
    const { currentUser, accounts } = get();
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...profile };
    const updatedAccounts = accounts.map((acc) =>
      acc.id === updatedUser.id ? updatedUser : acc
    );

    const newState = {
      currentUser: updatedUser,
      accounts: updatedAccounts,
      isAuthenticated: true,
    };

    set(newState);
    persistState(newState);
  },
}));
