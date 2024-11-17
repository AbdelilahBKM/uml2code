"use client"
import { Button } from "@/components/ui/button";
import { JSX, SVGProps } from "react";



export default function NoProjects() {
  return (
    <section className="flex flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center text-center gap-3 w-full">
        <PackageIcon className="h-12 w-12 text-muted" />
        <h2 className="text-2xl font-bold">Nothing to see here</h2>
        <p className="text-muted-foreground text-center">
            You have no available projects. Start by adding new projects
        </p>
      </div>
      <Button variant="outline" className="mt-4"  onClick={() => window.location.reload()}>
        Refresh
      </Button>
    </section>
  )
}

function PackageIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}