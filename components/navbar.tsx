"use client"
import Link from 'next/link'
import React, { useState } from 'react'
import { ArrowDownUp, Menu, X } from 'lucide-react' // Assuming you're using Lucide icons

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  return (
    <header className="bg-background border-b absolute w-full z-10">
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
          className={`${
            menuOpen ? 'block' : 'hidden'
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
              <Link href="/signin" className="hover:border-b border-slate-900 py-1">
                Sign In / Join
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
