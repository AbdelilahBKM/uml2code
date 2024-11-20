'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Save, Code, CirclePlus } from 'lucide-react'
import { UMLClass, UMLAssociation, Method, Attribute, Diagram } from '@/types/UMLClass.Type'

interface UMLClassCreatorInterface {
  diagram: Diagram;
  setDiagram: (newDiagram: Diagram) => void;
  saveDiagramToDatabase: () => Promise<void>;
}

export default function UMLClassCreator(
  {
    diagram,
    setDiagram,
    saveDiagramToDatabase

  }: UMLClassCreatorInterface) {

  const [className, setClassName] = useState<string>('');
  const [classShape, setClassShape] = useState<string>('');
  const [sourceId, setSourceId] = useState<number>();
  const [targetId, setTargetId] = useState<number>();
  const [multiplicity, setMultiplicity] = useState<string>('');
  const [associationShape, setAssShape] = useState<string>();
  const [selectedClass, setSelectedClass] = useState<UMLClass | null>(null);
  const [attVisibility, setAttVisibility] = useState<string>('');
  const [attName, setAttName] = useState<string>('');
  const [attType, setAttType] = useState<string>('');
  const [methodVisibility, setMethodVisibility] = useState<string>('');
  const [methodName, setMethodName] = useState<string>('');
  const [returnType, setReturnType] = useState<string>('');
  const [classes, setClasses] = useState<UMLClass[]>([]);
  const [associations, setAssociations] = useState<UMLAssociation[]>([]);
  useEffect(() => {
    setClasses(diagram.uml_classes);
    setAssociations(diagram.uml_association);
  }, []);

  useEffect(() => {
    const newObj: Diagram = {
      id: diagram.id,
      uml_classes: classes,
      uml_association: associations
    }
    setDiagram(newObj);
  }, [classes, associations]);
  
  const addClass = () => {
    if (className && classShape) {
      const newClass: UMLClass = {
        id: Number(Date.now()),
        name: className,
        shape: classShape,
        attributes: [],
        methods: [],
        position: {
          x: 0,
          y: 0
        }
      }
      setClasses([...classes, newClass])
      setSelectedClass(newClass)
      setClassName('')
      setClassShape('')
    }
  }

  const addAttribute = () => {
    if (selectedClass && attName && attType && attVisibility) {
      const attribute: Attribute = {
        id: Number(Date.now()),
        name: attName,
        visibility: attVisibility,
        type: attType
      }

      const updatedClass = {
        ...selectedClass,
        attributes: [...selectedClass.attributes, attribute]
      }
      setClasses(classes.map(c => c.id === selectedClass.id ? updatedClass : c))
      setSelectedClass(updatedClass)
      setAttName('')
      setAttVisibility('')
      setAttType('')
    }
  }

  const addMethod = () => {
    if (selectedClass && methodName && returnType && methodVisibility) {
      const method: Method = {
        id: Number(Date.now()),
        name: methodName,
        returnType: returnType,
        visibility: methodVisibility,
        parameters: []
      }
      const updatedClass = {
        ...selectedClass,
        methods: [...selectedClass.methods, method]
      }
      setClasses(classes.map(c => c.id === selectedClass.id ? updatedClass : c))
      setSelectedClass(updatedClass)
      setMethodName('')
      setReturnType('')
      setMethodVisibility('')
    }
  }

  const addAssociation = () => {
    if (targetId && sourceId && associationShape) {
      const newAssociation: UMLAssociation = {
        id: Number(Date.now().toString()),
        source: sourceId,
        target: targetId,
        shape: associationShape,
        label: multiplicity

      }
      setAssociations([...associations, newAssociation])
    }
    setSourceId(0)
    setTargetId(0)
    setAssShape('')
    setMultiplicity('')
  }

  const deleteClass = (id: number) => {
    setClasses(classes.filter(c => c.id !== id))
    setAssociations(associations.filter(a => a.source !== id && a.target !== id))
    if (selectedClass?.id === id) {
      setSelectedClass(null)
    }
  }

  const deleteAssociation = (id: number) => {
    setAssociations(associations.filter(a => a.id !== id))
  }

  const handleSaveChanges = () => {
    // Implement save functionality here
    console.log('Saving changes:', { classes, associations })
    // You could save to localStorage, send to a server, etc.
  }

  const handleConvertToCode = () => {
    // Implement code conversion functionality here
    console.log('Converting to code:', { classes, associations })
    // You could generate code based on the UML diagram and display it in a modal or new page
  }

  return (
    <Card className="w-full max-w-3xl min-h-[75vh]">
      <CardHeader>
        <CardTitle>UML Class Diagram Creator</CardTitle>
        <CardDescription>Create and manage UML classes and associations</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="addClass">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="addClass">Add</TabsTrigger>
            <TabsTrigger value="manageClass">My Classes</TabsTrigger>
            <TabsTrigger value="manageAssociations">Associations</TabsTrigger>
          </TabsList>
          <TabsContent value="addClass">
            <div className="space-y-4 mt-4">
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="className">Class Name</Label>
                  <Input
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    id="className" placeholder="Enter class name" />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="classType">Class Type</Label>
                  <Select onValueChange={(value) => setClassShape(value.toString())}>
                    <SelectTrigger id="classType">
                      <SelectValue placeholder="Select class type" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="class">Class</SelectItem>
                      <SelectItem value="abstract">Abstract Class</SelectItem>
                      <SelectItem value="interface">Interface</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={addClass}>
                Add Class
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="manageClass">
            <div className="space-y-4 mt-4">
              <Select onValueChange={(value) => setSelectedClass(classes.find(c => c.id === Number(value)) || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class to manage" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClass && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="attributes">Attributes</Label>
                    <div className="flex space-x-2 mt-1">
                      <Select onValueChange={(value) => setAttVisibility(value)}>
                        <SelectTrigger className='w-1/3' >
                          <SelectValue placeholder="Visibility" />
                        </SelectTrigger>
                        <SelectContent >
                          <SelectItem key={"+"} value={"+"} >&#43;</SelectItem>
                          <SelectItem key={"-"} value={"-"} >&#45;</SelectItem>
                          <SelectItem key={"#"} value={"#"} >&#35;</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        className='w-1/3'
                        id="att-type"
                        value={attType}
                        onChange={(e) => setAttType(e.target.value)}
                        placeholder="Type"
                      />
                      <Input
                        id="attributes"
                        value={attName}
                        onChange={(e) => setAttName(e.target.value)}
                        placeholder="New attribute"
                      />
                      <Button onClick={addAttribute}>Add</Button>
                    </div>
                    <ScrollArea className="h-20 mt-2">
                      <ul className="list-disc pl-4">
                        {selectedClass.attributes.map((attr, index) => (
                          <li key={index}>{`${attr.visibility} ${attr.name}: ${attr.type}`}</li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                  <div>
                    <Label htmlFor="methods">Methods</Label>
                    <div className="flex space-x-2 mt-1">
                      <Select onValueChange={(value) => setMethodVisibility(value)}>
                        <SelectTrigger className='w-1/3' >
                          <SelectValue placeholder="Visibility" />
                        </SelectTrigger>
                        <SelectContent >
                          <SelectItem key={"+"} value={"+"} >&#43;</SelectItem>
                          <SelectItem key={"-"} value={"-"} >&#45;</SelectItem>
                          <SelectItem key={"#"} value={"#"} >&#35;</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        className='w-1/3'
                        id="returnType"
                        value={returnType}
                        onChange={(e) => setReturnType(e.target.value)}
                        placeholder="Return"
                      />
                      <Input
                        id="methods"
                        value={methodName}
                        onChange={(e) => setMethodName(e.target.value)}
                        placeholder="New method"
                      />
                      <Button onClick={addMethod}>Add</Button>
                    </div>
                    <ScrollArea className="h-20 mt-2">
                      <ul className="list-disc pl-4">
                        {selectedClass.methods.map((method, index) => (
                          <li key={index}>{`${method.visibility} ${method.name}(): ${method.returnType}`}</li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                  <Button variant="destructive" onClick={() => deleteClass(selectedClass.id)}>
                    Delete Class
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="manageAssociations">
            <div className="space-y-4 mt-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full">Add Association</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Association</DialogTitle>
                    <DialogDescription>Create a new association between two classes.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="sourceClass" className="text-right">Source</Label>
                      <Select onValueChange={(value) => setSourceId(Number(value))}>
                        <SelectTrigger className='col-span-3' id="sourceClass">
                          <SelectValue placeholder="Select source class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="targetClass" className="text-right">Target</Label>
                      <Select onValueChange={(value) => setTargetId(Number(value))}>
                        <SelectTrigger className='col-span-3' id="targetClass">
                          <SelectValue placeholder="Select target class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="associationType" className="text-right">Type</Label>
                      <Select onValueChange={(value) => setAssShape(value.toString())} >
                        <SelectTrigger className="col-span-3" id="associationType">
                          <SelectValue placeholder="Select association type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="association">Association</SelectItem>
                          <SelectItem value="aggregation">Aggregation</SelectItem>
                          <SelectItem value="composition">Composition</SelectItem>
                          <SelectItem value="implementation">Implementation</SelectItem>
                          <SelectItem value="extends">Generalization</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="associationType" className="text-right">Multiplicity</Label>
                      <Select onValueChange={(value) => setMultiplicity(value.toString())} >
                        <SelectTrigger className="col-span-3" id="associationType">
                          <SelectValue placeholder="multiplicity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1:1">One to One</SelectItem>
                          <SelectItem value="1:*">One to Many</SelectItem>
                          <SelectItem value="*:*">Many to Many</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={addAssociation}>Add Association</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <ScrollArea className="h-[200px]">
                {associations.map(association => (
                  <div key={association.id} className="flex justify-between items-center p-2 border-b">
                    <span>
                      {classes.find(c => c.id === association.source)?.name}
                      {' -> '}
                      {classes.find(c => c.id === association.target)?.name}
                      {' ('}{association.shape}{')'}
                    </span>
                    <Button variant="destructive" size="sm" onClick={() => deleteAssociation(association.id)}>
                      Delete
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between gap-5">
        <Button onClick={saveDiagramToDatabase} className="flex items-center bg-slate-800 hover:bg-slate-700">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
        <Button onClick={handleConvertToCode} className="flex items-center bg-slate-800 hover:bg-slate-700">
          <Code className="mr-2 h-4 w-4" />
          Convert to Code
        </Button>
      </CardFooter>
    </Card>
  )
}