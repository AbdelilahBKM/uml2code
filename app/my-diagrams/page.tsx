'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlusCircle, Edit, Trash2, Code } from 'lucide-react'

// Mock data for class diagrams
const initialDiagrams = [
  { id: 1, name: 'User Authentication System', lastModified: '2023-06-15', image: '/placeholder.svg?height=200&width=300' },
  { id: 2, name: 'E-commerce Product Catalog', lastModified: '2023-06-14', image: '/placeholder.svg?height=200&width=300' },
  { id: 3, name: 'Task Management App', lastModified: '2023-06-13', image: '/placeholder.svg?height=200&width=300' },
]

export default function Dashboard() {
  const [diagrams, setDiagrams] = useState(initialDiagrams)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newDiagramName, setNewDiagramName] = useState('')

  const handleAddDiagram = () => {
    if (newDiagramName.trim()) {
      const newDiagram = {
        id: diagrams.length + 1,
        name: newDiagramName.trim(),
        lastModified: new Date().toISOString().split('T')[0],
        image: '/placeholder.svg?height=200&width=300',
      }
      setDiagrams([...diagrams, newDiagram])
      setNewDiagramName('')
      setIsAddDialogOpen(false)
    }
  }

  const handleDeleteDiagram = (id: number) => {
    setDiagrams(diagrams.filter(diagram => diagram.id !== id))
  }

  return (
    <div className="min-h-fit bg-background pt-20">
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Your Class Diagrams</h2>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Diagram
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Class Diagram</DialogTitle>
                <DialogDescription>
                  Enter a name for your new class diagram.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="diagramName">Diagram Name</Label>
                <Input
                  id="diagramName"
                  value={newDiagramName}
                  onChange={(e) => setNewDiagramName(e.target.value)}
                  placeholder="Enter diagram name"
                />
              </div>
              <DialogFooter>
                <Button onClick={handleAddDiagram}>Add Diagram</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {diagrams.map((diagram) => (
            <Card key={diagram.id}>
              <CardHeader>
                <CardTitle>{diagram.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video relative mb-4">
                  <Image
                    src={diagram.image}
                    alt={`Class diagram for ${diagram.name}`}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Last modified: {diagram.lastModified}
                </p>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/edit/${diagram.id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/view-code/${diagram.id}`}>
                    <Code className="mr-2 h-4 w-4" />
                    View Code
                  </Link>
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteDiagram(diagram.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}