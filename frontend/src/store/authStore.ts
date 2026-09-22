import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '../types';
import { setLanguage } from '../i18n';
import type { LangCode } from '../i18n';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const VALID_LANGS: LangCode[] = ['cs', 'en', 'uk', 'de'];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        set({ token, user });
        if (user.preferredLanguage && VALID_LANGS.includes(user.preferredLanguage as LangCode)) {
          setLanguage(user.preferredLanguage as LangCode);
        }
      },
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'eshop-auth' }
  )
);
