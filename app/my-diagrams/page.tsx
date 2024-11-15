'use client'

import { useState } from 'react'
import { Project } from '@/types/UMLClass.Type'
import { Button } from "@/components/ui/button"
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
import DiagramCard from '@/components/DIagramCard'

// Mock data for class diagrams
const initialDiagrams: Project[]  = [
  {
    id: "1", project_name: 'User Authentication System', updated_at: '2023-06-15', project_snippet: '/placeholder.svg?height=200&width=300',
    created_at: '',
    diagram: undefined
  },
  {
    id: "2", project_name: 'E-commerce Product Catalog', updated_at: '2023-06-14', project_snippet: '/placeholder.svg?height=200&width=300',
    created_at: '',
    diagram: undefined
  },
  {
    id: "3", project_name: 'Task Management App', updated_at: '2023-06-13', project_snippet: '/placeholder.svg?height=200&width=300',
    created_at: '',
    diagram: undefined
  },
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
          {diagrams.map((project) => (
            <DiagramCard project={project} />
          ))}
        </div>
      </main>
    </div>
  )
}