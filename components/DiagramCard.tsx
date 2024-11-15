import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Project } from '@/types/UMLClass.Type'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from './ui/button'
import { Code, Edit, Trash2 } from 'lucide-react'

interface IDiagramCard {
    project: Project
}


export default function DiagramCard({project}: IDiagramCard) {
    
  return (
    <Card key={project.id}>
              <CardHeader>
                <CardTitle>{project.project_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video relative mb-4">
                  <Image
                    src={project.project_snippet}
                    alt={`Class diagram for ${project.project_name}`}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Last modified: {project.updated_at}
                </p>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/edit/${project.id}`}>
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
                <Button variant="destructive" onClick={() => {}}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
  )
}
