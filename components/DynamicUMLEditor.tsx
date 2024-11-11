"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Trash2 } from "lucide-react";

export interface UMLNode {
  id: string;
  shape: string;
  name: string[];
  attributes: string[];
  methods: string[];
  position: {
    x: number;
    y: number;
  };
}

interface DynamicUMLEditorProps {
  selectedNode?: UMLNode | null;
  onSubmit?: (classData: UMLNode) => void;
  onClose?: () => void;
}

interface AssociationDetails {
  targetId: string;
  sourceMultiplicity: string;
  targetMultiplicity: string;
  relationshipType: "association" | "aggregation" | "composition";
}

const DynamicUMLEditor: React.FC<DynamicUMLEditorProps> = ({
  selectedNode,
  onSubmit = () => {},
  onClose = () => {},
}) => {
  const [className, setClassName] = useState("");
  const [stereotype, setStereotype] = useState("");
  const [attributes, setAttributes] = useState([""]);
  const [methods, setMethods] = useState([""]);
  const [inheritFrom, setInheritFrom] = useState("");
  const [implementFrom, setImplementFrom] = useState("");
  const [position, setPosition] = useState({ x: 300, y: 200 });
  const [existingClasses, setExistingClasses] = useState<UMLNode[]>([]);
  const [associationDetails, setAssociationDetails] =
    useState<AssociationDetails>({
      targetId: "",
      sourceMultiplicity: "",
      targetMultiplicity: "",
      relationshipType: "association",
    });

  // Fetch existing classes
  const fetchClasses = async () => {
    try {
      const response = await fetch("http://localhost:5000/classes");
      if (!response.ok) throw new Error("Failed to fetch classes");
      const data = await response.json();
      setExistingClasses(data);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  // Delete class function
  const deleteClass = async (classId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/classes/${classId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete class");

      // Refresh the classes list after deletion
      await fetchClasses();
    } catch (error) {
      console.error("Error deleting class:", error);
    }
  };

  // Fetch classes on mount and after adding a new class
  useEffect(() => {
    fetchClasses();
  }, []);

  // Reset form
  const resetForm = () => {
    setClassName("");
    setStereotype("");
    setAttributes([""]);
    setMethods([""]);
    setInheritFrom("");
    setImplementFrom("");
    setAssociationDetails({
      targetId: "",
      sourceMultiplicity: "",
      targetMultiplicity: "",
      relationshipType: "association",
    });
    onClose();
  };

  // Handle form submission
  const handleSubmit = async () => {
    const newClass: UMLNode = {
      id: Date.now().toString(),
      shape: "class",
      name: stereotype ? [`<<${stereotype}>>`, className] : [className],
      attributes: attributes
        .filter((attr) => attr.trim() !== "")
        .map((attr) => `+${attr}`),
      methods: methods
        .filter((method) => method.trim() !== "")
        .map((method) => `+${method}()`),
      position,
    };

    try {
      const payload: any = {
        class: newClass,
      };

      if (inheritFrom) {
        payload.relationship = {
          id: `rel-${Date.now()}`,
          shape: "extends",
          source: newClass.id,
          target: inheritFrom,
        };
      } else if (implementFrom) {
        payload.relationship = {
          id: `rel-${Date.now()}`,
          shape: "implements",
          source: newClass.id,
          target: implementFrom,
        };
      } else if (associationDetails.targetId) {
        const multiplicityLabel = `${associationDetails.sourceMultiplicity}:${associationDetails.targetMultiplicity}`;
        payload.relationship = {
          id: `rel-${Date.now()}`,
          shape: associationDetails.relationshipType,
          source: newClass.id,
          target: associationDetails.targetId,
          label: multiplicityLabel,
        };
      }

      const response = await fetch("http://localhost:5000/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to add class");

      onSubmit(newClass);
      await fetchClasses(); // Refresh the classes list
      resetForm();
    } catch (error) {
      console.error("Error adding class:", error);
    }
  };

  // Get interface classes (with <<interface>> stereotype)
  const interfaceClasses = existingClasses.filter(
    (cls) => Array.isArray(cls.name) && cls.name[0]?.includes("<<interface>>")
  );

  // Get non-interface classes for inheritance
  const normalClasses = existingClasses.filter(
    (cls) => !Array.isArray(cls.name) || !cls.name[0]?.includes("<<interface>>")
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create UML Class</CardTitle>
        <CardDescription>Add a new class to the diagram</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          {/* Stereotype field */}
          <div className="space-y-2">
            <Label htmlFor="stereotype">Stereotype (optional)</Label>
            <Input
              id="stereotype"
              placeholder="interface, abstract, etc."
              value={stereotype}
              onChange={(e) => setStereotype(e.target.value)}
            />
          </div>

          {/* Class name field */}
          <div className="space-y-2">
            <Label htmlFor="name">Class Name</Label>
            <Input
              id="name"
              placeholder="ClassName"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              required
            />
          </div>

          {/* Attributes section */}
          <div className="space-y-2">
            <Label>Attributes</Label>
            {attributes.map((attr, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="attribute"
                  value={attr}
                  onChange={(e) => {
                    const newAttributes = [...attributes];
                    newAttributes[index] = e.target.value;
                    setAttributes(newAttributes);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setAttributes(attributes.filter((_, i) => i !== index));
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setAttributes([...attributes, ""])}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Attribute
            </Button>
          </div>

          {/* Methods section */}
          <div className="space-y-2">
            <Label>Methods</Label>
            {methods.map((method, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="method"
                  value={method}
                  onChange={(e) => {
                    const newMethods = [...methods];
                    newMethods[index] = e.target.value;
                    setMethods(newMethods);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setMethods(methods.filter((_, i) => i !== index));
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setMethods([...methods, ""])}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Method
            </Button>
          </div>

          {/* Inheritance section */}
          <div className="space-y-2">
            <Label htmlFor="inheritance">Inherits From</Label>
            <Select value={inheritFrom} onValueChange={setInheritFrom}>
              <SelectTrigger>
                <SelectValue placeholder="Select parent class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                {normalClasses.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {Array.isArray(cls.name)
                      ? cls.name[cls.name.length - 1]
                      : cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Implementation section */}
          <div className="space-y-2">
            <Label htmlFor="implements">Implements</Label>
            <Select value={implementFrom} onValueChange={setImplementFrom}>
              <SelectTrigger>
                <SelectValue placeholder="Select interface to implement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                {interfaceClasses.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {Array.isArray(cls.name)
                      ? cls.name[cls.name.length - 1]
                      : cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Relationship section */}
          <div className="space-y-4">
            <Label>Relationship</Label>
            <div className="space-y-2">
              <Label htmlFor="relationshipType">Relationship Type</Label>
              <Select
                value={associationDetails.relationshipType}
                onValueChange={(
                  value: "association" | "aggregation" | "composition"
                ) =>
                  setAssociationDetails((prev) => ({
                    ...prev,
                    relationshipType: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="association">Association</SelectItem>
                  <SelectItem value="aggregation">Aggregation</SelectItem>
                  <SelectItem value="composition">Composition</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetClass">Target Class</Label>
              <Select
                value={associationDetails.targetId}
                onValueChange={(value) =>
                  setAssociationDetails((prev) => ({
                    ...prev,
                    targetId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class to relate with" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  {existingClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {Array.isArray(cls.name)
                        ? cls.name[cls.name.length - 1]
                        : cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {associationDetails.targetId && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sourceMultiplicity">
                    Source Multiplicity
                  </Label>
                  <Select
                    value={associationDetails.sourceMultiplicity}
                    onValueChange={(value) =>
                      setAssociationDetails((prev) => ({
                        ...prev,
                        sourceMultiplicity: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select multiplicity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="0..1">0..1</SelectItem>
                      <SelectItem value="*">*</SelectItem>
                      <SelectItem value="1..*">1..*</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetMultiplicity">
                    Target Multiplicity
                  </Label>
                  <Select
                    value={associationDetails.targetMultiplicity}
                    onValueChange={(value) =>
                      setAssociationDetails((prev) => ({
                        ...prev,
                        targetMultiplicity: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select multiplicity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="0..1">0..1</SelectItem>
                      <SelectItem value="*">*</SelectItem>
                      <SelectItem value="1..*">1..*</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Existing Classes section */}
          <div className="space-y-4">
            <Label>Existing Classes</Label>
            <div className="space-y-2">
              {existingClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <span>
                    {Array.isArray(cls.name)
                      ? cls.name[cls.name.length - 1]
                      : cls.name}
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to delete this class?"
                        )
                      ) {
                        deleteClass(cls.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={resetForm}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!className.trim()}>
          Add Class
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DynamicUMLEditor;
