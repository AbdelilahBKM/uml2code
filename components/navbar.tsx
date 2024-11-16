'use client'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { ArrowDownUp, Menu, X } from 'lucide-react'
import { loadAuthState, logout } from '@/store/authReducer'
import { RootState } from '@/store/redux'
import { useDispatch, useSelector } from 'react-redux'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [token, setToken] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const dispatch = useDispatch();

  // Retrieve isAuthenticated and token state from Redux
  const isAuth = useSelector((state: RootState) => state.auth.isAuthenticated);
  const authToken = useSelector((state: RootState) => state.auth.token);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  }

  useEffect(() => {
    // Load authentication state on initial render
    dispatch(loadAuthState());
  }, [dispatch]);

  useEffect(() => {
    // Set token if authenticated
    if (isAuth && authToken) {
      setToken(authToken);
    }
  }, [isAuth, authToken]);

  useEffect(() => {
    const validateToken = async () => {
      try {
        console.log("Validating token:", token);  // Log token for debugging
        const response = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const results = await response.json();

        if (!response.ok) {
          dispatch(logout());
          throw new Error("Validation failed: " + results.message);
        }
      } catch (error) {
        console.log("Error during token validation:", error);
      }
    };

    // Trigger validation only if authenticated and token is set
    if (isAuth && token) {
      validateToken();
    }
  }, [token, isAuth, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    setToken('');
  };
  

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return !isMounted ? null : (
    <header className="bg-background border-b absolute mb-11 w-full z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary flex items-center">
          <ArrowDownUp />
          <p className='hidden lg:block'>UML2Code</p>
          <p className='block lg:hidden'>U2C</p>
        </Link>
        {/* Hamburger Icon for mobile */}
        <button
          className="md:hidden text-primary focus:outline-none"
          onClick={toggleMenu}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        {/* Navigation Links */}
        <nav
          className={`${menuOpen ? 'block' : 'hidden'
            } md:flex md:space-x-4 gap-5 text-slate-700`}
        >
          <ul className="flex flex-col md:flex-row space-y-4 md:space-y-0 lg:gap-4">
            <li>
              <Link href="/" className="hover:border-b border-slate-900 py-1">
                Home
              </Link>
            </li>
            <li>
              <Link href="/my-diagrams" className="hover:border-b border-slate-900 py-1">
                My Class Diagrams
              </Link>
            </li>
            <li>
              {!isAuth ?
                <Link href="/signin" className="hover:border-b border-slate-900 py-1">
                  Sign In / Join
                </Link> :

                <Link href={"/"} className='hover:border-b border-slate-900 py-1' onClick={handleLogout}>
                  Logout
                </Link>
              }
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
