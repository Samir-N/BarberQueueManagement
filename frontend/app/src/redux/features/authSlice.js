import { createSlice } from '@reduxjs/toolkit';
const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        token: null,
        isAuthenticated: false
    },
    reducers: {
        setUser: (state, action) => {
         
            state.user = action.payload.user;
            if (action.payload.token) {
                state.token = action.payload.token;
            }
            state.isAuthenticated = true;
        },
        clearUser: (state) => {
    state.user = null;
    state.token = null;
    state.isAuthenticated = false;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');       
    localStorage.removeItem('barberToken');
    localStorage.removeItem('barber'); 
            
        },
        setToken: (state, action) => {
            state.token = action.payload.token;
        }
    }
});

export const { setUser, clearUser, setToken } = authSlice.actions;
export default authSlice.reducer;