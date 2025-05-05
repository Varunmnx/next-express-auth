import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';

interface AuthState {
  token: string | null;
}

const initialState: AuthState = {
  token: null
};

interface UseAuthStore {
  auth: AuthState;
  setToken: (token: string) => void;
  clearToken: () => void;
}

type AuthPersist = (
  config: StateCreator<UseAuthStore>,
  options: PersistOptions<UseAuthStore>
) => StateCreator<UseAuthStore>;

const useAuthStore = create<UseAuthStore>(
  (persist as AuthPersist)(
    (set) => ({
      auth: initialState,
      setToken: (token: string) => set((state)=>({...state, auth: { token } })),
      clearToken: () => set({ auth: { token: null } }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAuthStore;