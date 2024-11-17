// rootReducer.ts
export interface RootState {
    auth: {
      isAuthenticated: boolean;
      token: string;
    };
  }
  import { combineReducers } from '@reduxjs/toolkit';
  import authReducer from './authReducer';
  
  export const rootReducer = combineReducers({
    auth: authReducer,
  });
  
  export default rootReducer;
  