import { Github } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-background border-t py-4 flex justify-between px-4">
    <div className="container mx-auto text-start text-muted-foreground">
      &copy; {new Date().getFullYear()} UML2Code. All rights reserved.
    </div>
    <Link href={"/"}>
      <Github />
    </Link>
  </footer>
  )
}
