import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Project } from '@/types/UMLClass.Type'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from './button'
import { Code, Edit, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


interface IDiagramCard {
  project: Project,
  handleDeleteProject: (projectId: string) => void;
}


export default function DiagramCard({ project, handleDeleteProject }: IDiagramCard) {

  function handleDelete(): void {
    handleDeleteProject(project.id);
  }

  return (
    <Card key={project.id}>
      <CardHeader>
        <CardTitle>{project.project_name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-video relative mb-4">
          <Image
            src={project.project_snippet || '/blank.jpg'}
            alt={`Class diagram for ${project.project_name}`}
            fill
            className="object-cover rounded-md"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          <span className='font-semibold'>Last modified:</span> {new Date(project.updated_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href={`/my-diagrams/edit/${project.id}`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/view-code/${project.id}`}>
            <Code className="mr-2 h-4 w-4" />
            View Code
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger className='flex text-sm items-center rounded-lg bg-red-600 text-white px-4 py-2 transition-colors duration-200 hover:bg-red-400 active:bg-red-800 focus:ring-red-500'>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your project
                and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className='bg-red-700 hover:bg-red-400'
              onClick={handleDelete}
              >Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}
