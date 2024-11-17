import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { PenTool, FolderSync, Download } from 'lucide-react'

export default function WelcomePage() {
  return (
    <div className="flex flex-col text-slate-700 pt-16">
      <main className="flex-grow">
        <section className='flex items-center h-[545px]'>
          <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center">
            <h1 className="text-4xl font-bold mb-6">
              Transform Your UML Class Diagrams into Code
            </h1>
            <p className="text-xl mb-8 max-w-2xl">
              Design your software architecture visually with UML class diagrams,
              then instantly convert them into clean, production-ready code.
              Streamline your development process and bring your ideas to life faster.
            </p>
            <Button asChild size="lg" className='bg-slate-900 hover:bg-slate-700'>
              <Link href="/my-diagrams">Get Started for Free</Link>
            </Button>
          </div>
          <div className='w-full h-full items-center justify-center hidden md:flex'>
            <Image src={"/diagram-class.png"} alt='uml-class-diagram' width={658} height={374}
              className='w-fit h-fit' />
          </div>
        </section>

        <section className="bg-muted py-16 text-slate-800 z-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className='flex flex-col items-center gap-5'>
                <PenTool className='w-14 h-14 text-slate-700' />
                <div>
                  <h3 className="text-xl font-semibold mb-4">1. Design</h3>
                  <p>Create your UML class diagrams using our intuitive drag-and-drop interface.</p>
                </div>
              </div>
              <div className='flex flex-col items-center gap-5'>
                  <FolderSync className='w-14 h-14 text-slate-700'/>
                <div>
                <h3 className="text-xl font-semibold mb-4">2. Convert</h3>
                <p>With a single click, transform your diagrams into code in your preferred language.</p>
                </div>
              </div>
              <div className='flex flex-col items-center gap-5'>
                <Download className='w-14 h-14 text-slate-700'/>
                <div>
                <h3 className="text-xl font-semibold mb-4">3. Implement</h3>
                <p>Download the generated code and integrate it seamlessly into your project.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}