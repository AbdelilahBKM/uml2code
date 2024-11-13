import Link from 'next/link'
import { Button } from "@/components/ui/button"

import { ArrowRight, Code, Zap, RefreshCw } from 'lucide-react'
import AuthForm from '@/components/authForm'

export default function WelcomePage() {
  return (
    <div className="flex flex-col min-h-[92vh] w-full">
      <main className="flex-grow flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <div className="bg-background rounded-lg shadow-lg overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">
          <div className="md:w-1/2 p-8 bg-primary text-primary-foreground flex flex-col justify-center">
            <h1 className="text-3xl font-bold mb-6">
              Transform UML to Code
            </h1>
            <p className="text-lg mb-8">
              Design, convert, and implement your software architecture with ease.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center">
                <Code className="mr-4" />
                <span>Intuitive UML diagram creation</span>
              </li>
              <li className="flex items-center">
                <Zap className="mr-4" />
                <span>Instant code generation</span>
              </li>
              <li className="flex items-center">
                <RefreshCw className="mr-4" />
                <span>Seamless project integration</span>
              </li>
            </ul>
            <Button className="mt-8 w-full md:w-auto" variant="secondary">
              <Link href={"/"} >
                Learn More
              </Link>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="md:w-1/2 p-8 flex items-center justify-center">
            <AuthForm />
          </div>
        </div>
      </main>
    </div>
  )
}