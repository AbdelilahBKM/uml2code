"use client"
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  token: string;
}

const loadTokenFromLocalStorage = (): AuthState => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    return token ? { isAuthenticated: true, token } : { isAuthenticated: false, token: '' };
  }
  return { isAuthenticated: false, token: '' };
};

const initialState: AuthState = loadTokenFromLocalStorage();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<{ access: string }>) {
      state.isAuthenticated = true;
      state.token = action.payload.access;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', state.token);
      }
    },
    logout(state) {
      state.isAuthenticated = false;
      state.token = '';
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    },
    loadAuthState(state) {
        const token = window.localStorage.getItem('token');
        if(token){
          state.isAuthenticated = true;
          state.token = token;
          
        }
    },
  },
});

export const { login, logout, loadAuthState } = authSlice.actions;
export default authSlice.reducer;