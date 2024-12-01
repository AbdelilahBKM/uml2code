"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Code, Download } from "lucide-react";
import { UMLClass, UMLAssociation } from "@/types/UMLClass.Type";
import { RootState } from "@/store/rootReducer";
import { useSelector } from "react-redux";
import { get } from "http";

export default function ConvertToCode({ diagramId }: { diagramId: string }) {
  const token = useSelector((state: RootState) => state.auth.token);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [convertedCode, setConvertedCode] = useState<string>("");
  const [originalClasses, setOriginalClasses] = useState<UMLClass[]>([]);
  const [originalAssociations, setOriginalAssociations] = useState<
    UMLAssociation[]
  >([]);

  useEffect(() => {
    const getDiagram = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/project/diagram?projectId=${diagramId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message);
        }

        setOriginalClasses(result.uml_classes || []);
        setOriginalAssociations(result.uml_association || []); // Ensure it's always an array
      } catch (error: any) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    getDiagram();
  }, [diagramId, token]);

  const handleConvert = () => {
    if (!language || originalClasses.length === 0) return;

    let code = "";
    switch (language) {
      case "python":
        code = convertToPython(originalClasses, originalAssociations);
        break;
      case "java":
        code = convertToJava(originalClasses, originalAssociations);
        break;
      case "php":
        code = convertToPHP(originalClasses, originalAssociations);
        break;

      default:
        code = "// Unsupported language";
    }

    setConvertedCode(code);
  };

  const convertToPython = (
    classes: UMLClass[],
    associations: UMLAssociation[]
  ) => {
    // Create a map of class inheritance relationships
    const classInheritanceMap = new Map<number, string>();
    const classImplementationMap = new Map<number, string[]>();
    const classAttributeMap = new Map<string, UMLClass["attributes"]>();

    // First, map out all class attributes including inherited ones
    classes.forEach((cls) => {
      classAttributeMap.set(cls.name, cls.attributes);
    });

    // Process associations to build inheritance hierarchy
    associations.forEach((assoc) => {
      switch (assoc.shape) {
        case "extends":
          const parentClass = classes.find((c) => c.id === assoc.targetId);
          const childClass = classes.find((c) => c.id === assoc.sourceId);

          if (parentClass && childClass) {
            classInheritanceMap.set(assoc.sourceId, parentClass.name);

            // Merge attributes from parent class
            const parentAttributes =
              classAttributeMap.get(parentClass.name) || [];
            const childAttributes =
              classAttributeMap.get(childClass.name) || [];
            classAttributeMap.set(childClass.name, [
              ...parentAttributes,
              ...childAttributes.filter(
                (childAttr) =>
                  !parentAttributes.some(
                    (parentAttr) => parentAttr.name === childAttr.name
                  )
              ),
            ]);
          }
          break;
        case "implement":
          const implementedInterface = classes.find(
            (c) => c.id === assoc.targetId
          )?.name;
          if (implementedInterface) {
            const currentImplements =
              classImplementationMap.get(assoc.sourceId) || [];
            classImplementationMap.set(assoc.sourceId, [
              ...currentImplements,
              implementedInterface,
            ]);
          }
          break;
      }
    });

    let pythonCode = "";

    // Import ABC for abstract classes and interfaces
    const hasAbstractOrInterface = classes.some(
      (cls) => cls.shape === "abstract" || cls.shape === "interface"
    );
    if (hasAbstractOrInterface) {
      pythonCode += "from abc import ABC, abstractmethod\n\n";
    }

    classes.forEach((cls) => {
      // Determine base class
      const parentClass = classInheritanceMap.get(cls.id);
      const implementedInterfaces = classImplementationMap.get(cls.id);

      const baseClass =
        cls.shape === "interface"
          ? "ABC"
          : cls.shape === "abstract"
          ? "ABC"
          : parentClass || "object";

      // Multiple inheritance support
      const inheritanceList = [
        ...(parentClass ? [parentClass] : []),
        ...(implementedInterfaces || []),
      ];

      // Class definition
      pythonCode += `class ${cls.name}(${
        inheritanceList.join(", ") || baseClass
      }):\n`;

      // Find unique attributes (not in parent class)
      const parentCls = parentClass
        ? classes.find((c) => c.name === parentClass)
        : null;
      const parentAttributes = parentCls ? parentCls.attributes : [];
      const childAttributes = cls.attributes;

      const uniqueAttributes = childAttributes.filter(
        (childAttr) =>
          !parentAttributes.some(
            (parentAttr) => parentAttr.name === childAttr.name
          )
      );

      const allAttributes = [...parentAttributes, ...uniqueAttributes];

      // If no attributes or methods, add pass
      if (allAttributes.length === 0 && cls.methods.length === 0) {
        pythonCode += "    pass\n\n";
        return;
      }

      // Constructor
      pythonCode += `    def __init__(self${
        allAttributes.length > 0
          ? ", " + allAttributes.map((attr) => attr.name).join(", ")
          : ""
      }):\n`;

      // Call parent constructor if exists
      if (parentClass) {
        const parentClassObj = classes.find((c) => c.name === parentClass);
        const parentAttrNames = parentAttributes.map((attr) => attr.name);

        if (parentClassObj) {
          // Pass parent attributes to super().__init__()
          if (parentAttrNames.length > 0) {
            pythonCode += `        super().__init__(${parentAttrNames.join(
              ", "
            )})\n`;
          } else {
            pythonCode += "        super().__init__()\n";
          }
        } else {
          pythonCode += "        super().__init__()\n";
        }
      }

      // Set unique attributes
      uniqueAttributes.forEach((attr) => {
        pythonCode += `        self.${attr.name} = ${attr.name}\n`;
      });

      // If no attributes added, add pass to constructor
      if (uniqueAttributes.length === 0) {
        pythonCode += "        pass\n";
      }

      // Methods
      cls.methods.forEach((method) => {
        // Use abstractmethod for abstract methods
        const isAbstractMethod =
          cls.shape === "interface" || cls.shape === "abstract";
        const abstractDecorator = isAbstractMethod
          ? "    @abstractmethod\n"
          : "";

        pythonCode += abstractDecorator;
        pythonCode += `    def ${method.name}(self${
          (method.parameters || []).length > 0
            ? ", " + (method.parameters || []).map((p) => p.name).join(", ")
            : ""
        }):\n`;

        // Method body
        if (isAbstractMethod) {
          pythonCode += "        raise NotImplementedError()\n\n";
        } else {
          pythonCode += `        # TODO: Implement ${method.name} method\n`;
          pythonCode += "        pass\n\n";
        }
      });

      pythonCode += "\n";
    });

    return pythonCode;
  };
  const convertToJava = (
    classes: UMLClass[],
    associations: UMLAssociation[]
  ) => {
    // Create maps to track class relationships and attributes
    const classInheritanceMap = new Map<number, string>();
    const classImplementationMap = new Map<number, string[]>();

    // Process associations to build inheritance hierarchy
    associations.forEach((assoc) => {
      switch (assoc.shape) {
        case "extends":
          const parentClass = classes.find((c) => c.id === assoc.targetId);
          const childClass = classes.find((c) => c.id === assoc.sourceId);

          if (parentClass && childClass) {
            classInheritanceMap.set(assoc.sourceId, parentClass.name);
          }
          break;
        case "implement":
          const implementedInterface = classes.find(
            (c) => c.id === assoc.targetId
          )?.name;
          if (implementedInterface) {
            const currentImplements =
              classImplementationMap.get(assoc.sourceId) || [];
            classImplementationMap.set(assoc.sourceId, [
              ...currentImplements,
              implementedInterface,
            ]);
          }
          break;
      }
    });

    let javaCode = "";

    classes.forEach((cls) => {
      // Determine class type and modifiers
      const classModifier =
        cls.shape === "interface"
          ? "interface"
          : cls.shape === "abstract"
          ? "abstract class"
          : "class";

      // Determine inheritance and implementation
      const parentClass = classInheritanceMap.get(cls.id);
      const implementedInterfaces = classImplementationMap.get(cls.id);

      let classDeclaration = `public ${classModifier} ${cls.name}`;

      if (parentClass && cls.shape !== "interface") {
        classDeclaration += ` extends ${parentClass}`;
      }

      if (implementedInterfaces && implementedInterfaces.length > 0) {
        classDeclaration +=
          cls.shape === "interface"
            ? ` extends ${implementedInterfaces.join(", ")}`
            : ` implements ${implementedInterfaces.join(", ")}`;
      }

      classDeclaration += " {\n";
      javaCode += classDeclaration;

      // Find parent class attributes if exists
      const parentCls = parentClass
        ? classes.find((c) => c.name === parentClass)
        : null;
      const parentAttributes = parentCls ? parentCls.attributes : [];

      // Prepare child class attributes
      const childAttributes = cls.attributes;

      // Filter out attributes that are duplicates from parent
      const uniqueAttributes = childAttributes.filter(
        (childAttr) =>
          !parentAttributes.some(
            (parentAttr) => parentAttr.name === childAttr.name
          )
      );

      // Attributes
      uniqueAttributes.forEach((attr) => {
        const visibility =
          attr.visibility === "+"
            ? "public"
            : attr.visibility === "-"
            ? "private"
            : "protected";
        javaCode += `    ${visibility} ${attr.type} ${attr.name};\n`;
      });

      // Constructor
      if (cls.shape !== "interface") {
        // Primary constructor with all attributes
        const constructorParams = [
          ...parentAttributes.map((attr) => `${attr.type} ${attr.name}`),
          ...uniqueAttributes.map((attr) => `${attr.type} ${attr.name}`),
        ];

        if (constructorParams.length > 0) {
          javaCode += `    public ${cls.name}(${constructorParams.join(
            ", "
          )}) {\n`;

          // Call parent constructor with parent attributes
          if (parentClass) {
            const parentAttrNames = parentAttributes.map((attr) => attr.name);
            if (parentAttrNames.length > 0) {
              javaCode += `        super(${parentAttrNames.join(", ")});\n`;
            } else {
              javaCode += "        super();\n";
            }
          }

          // Set child attributes
          uniqueAttributes.forEach((attr) => {
            javaCode += `        this.${attr.name} = ${attr.name};\n`;
          });
          javaCode += `    }\n\n`;
        } else if (parentClass) {
          // Default constructor that calls parent's default constructor
          javaCode += `    public ${cls.name}() {\n        super();\n    }\n\n`;
        } else {
          javaCode += `    public ${cls.name}() {\n    }\n\n`;
        }
      }

      // Methods
      cls.methods.forEach((method) => {
        // Skip method generation for interfaces
        if (cls.shape === "interface") return;

        const visibility =
          method.visibility === "+"
            ? "public"
            : method.visibility === "-"
            ? "private"
            : "protected";

        const params =
          (method.parameters || []).length > 0
            ? (method.parameters || [])
                .map((p) => `${p.type} ${p.name}`)
                .join(", ")
            : "";

        javaCode += `    ${visibility} ${method.returnType} ${method.name}(${params}) {\n`;
        javaCode += `        // TODO: Implement ${method.name} method\n`;

        // Provide a default return based on return type
        const defaultReturn =
          method.returnType === "int"
            ? "return 0;"
            : method.returnType === "boolean"
            ? "return false;"
            : method.returnType === "double"
            ? "return 0.0;"
            : method.returnType === "void"
            ? ""
            : "return null;";

        javaCode += `        ${defaultReturn}\n`;
        javaCode += `    }\n\n`;
      });

      javaCode += "}\n\n";
    });

    return javaCode;
  };

  const convertToPHP = (
    classes: UMLClass[],
    associations: UMLAssociation[]
  ) => {
    // Create maps to track class relationships and attributes
    const classInheritanceMap = new Map<number, string>();
    const classImplementationMap = new Map<number, string[]>();

    // Process associations to build inheritance hierarchy
    associations.forEach((assoc) => {
      switch (assoc.shape) {
        case "extends":
          const parentClass = classes.find((c) => c.id === assoc.targetId);
          const childClass = classes.find((c) => c.id === assoc.sourceId);

          if (parentClass && childClass) {
            classInheritanceMap.set(assoc.sourceId, parentClass.name);
          }
          break;
        case "implement":
          const implementedInterface = classes.find(
            (c) => c.id === assoc.targetId
          )?.name;
          if (implementedInterface) {
            const currentImplements =
              classImplementationMap.get(assoc.sourceId) || [];
            classImplementationMap.set(assoc.sourceId, [
              ...currentImplements,
              implementedInterface,
            ]);
          }
          break;
      }
    });

    let phpCode = "<?php\n\n";

    classes.forEach((cls) => {
      // Determine class type and modifiers
      const classModifier =
        cls.shape === "interface"
          ? "interface"
          : cls.shape === "abstract"
          ? "abstract "
          : "";

      // Determine inheritance and implementation
      const parentClass = classInheritanceMap.get(cls.id);
      const implementedInterfaces = classImplementationMap.get(cls.id);

      let classDeclaration = `${classModifier}class ${cls.name}`;

      if (parentClass && cls.shape !== "interface") {
        classDeclaration += ` extends ${parentClass}`;
      }

      if (implementedInterfaces && implementedInterfaces.length > 0) {
        classDeclaration +=
          cls.shape === "interface"
            ? ` extends ${implementedInterfaces.join(", ")}`
            : ` implements ${implementedInterfaces.join(", ")}`;
      }

      classDeclaration += " {\n";
      phpCode += classDeclaration;

      // Find parent class attributes if exists
      const parentCls = parentClass
        ? classes.find((c) => c.name === parentClass)
        : null;
      const parentAttributes = parentCls ? parentCls.attributes : [];

      // Prepare child class attributes
      const childAttributes = cls.attributes;

      // Filter out attributes that are duplicates from parent
      const uniqueAttributes = childAttributes.filter(
        (childAttr) =>
          !parentAttributes.some(
            (parentAttr) => parentAttr.name === childAttr.name
          )
      );

      // Attributes
      const allAttributes = [...parentAttributes, ...uniqueAttributes];

      // Only add unique attributes
      uniqueAttributes.forEach((attr) => {
        const visibility =
          attr.visibility === "+"
            ? "public"
            : attr.visibility === "-"
            ? "private"
            : "protected";
        phpCode += `    ${visibility} $${attr.name};\n`;
      });

      // Constructor
      if (cls.shape !== "interface") {
        // Primary constructor with all attributes
        const constructorParams = [
          ...parentAttributes.map((attr) => `$${attr.name}`),
          ...uniqueAttributes.map((attr) => `$${attr.name}`),
        ];

        phpCode += `    public function __construct(${constructorParams.join(
          ", "
        )}) {\n`;

        // Call parent constructor with parent attributes
        if (parentClass) {
          const parentAttrNames = parentAttributes.map(
            (attr) => `$${attr.name}`
          );
          if (parentAttrNames.length > 0) {
            phpCode += `        parent::__construct(${parentAttrNames.join(
              ", "
            )});\n`;
          } else {
            phpCode += "        parent::__construct();\n";
          }
        }

        // Set child attributes
        uniqueAttributes.forEach((attr) => {
          phpCode += `        $this->${attr.name} = $${attr.name};\n`;
        });
        phpCode += `    }\n\n`;
      }

      // Methods
      cls.methods.forEach((method) => {
        // Skip method generation for interfaces
        if (cls.shape === "interface") return;

        const visibility =
          method.visibility === "+"
            ? "public"
            : method.visibility === "-"
            ? "private"
            : "protected";

        const params =
          (method.parameters || []).length > 0
            ? (method.parameters || [])
                .map((p) => `${p.type} ${p.name}`)
                .join(", ")
            : "";

        phpCode += `    ${visibility} function ${method.name}(${params}) {\n`;
        phpCode += `        // TODO: Implement ${method.name} method\n`;

        // Provide a default return based on return type
        const defaultReturn =
          method.returnType === "int"
            ? "return 0;"
            : method.returnType === "bool"
            ? "return false;"
            : method.returnType === "float"
            ? "return 0.0;"
            : method.returnType === "void"
            ? ""
            : "return null;";

        phpCode += `        ${defaultReturn}\n`;
        phpCode += `    }\n\n`;
      });

      phpCode += "}\n\n";
    });

    phpCode += "?>";
    return phpCode;
  };

  const downloadCode = () => {
    const fileExtensions: { [key: string]: string } = {
      python: "py",
      java: "java",
      php: "php",
    };
    const fileExtension = fileExtensions[language] || language;
    const blob = new Blob([convertedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `converted_code.${fileExtension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Convert UML to Code</CardTitle>
          <CardDescription>
            Transform your UML class diagram into Python or Java code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="language-select" className="text-sm font-medium">
              Select Language
            </label>
            <Select onValueChange={setLanguage}>
              <SelectTrigger id="language-select">
                <SelectValue placeholder="Choose a language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="php">PHP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleConvert}
            disabled={!language || originalClasses.length === 0}
            className="w-full"
          >
            <Code className="mr-2 h-4 w-4" />
            Convert to{" "}
            {language
              ? language.charAt(0).toUpperCase() + language.slice(1)
              : "Code"}
          </Button>
          <div className="space-y-2">
            <label htmlFor="converted-code" className="text-sm font-medium">
              Converted Code
            </label>
            <Textarea
              id="converted-code"
              placeholder="Your converted code will appear here"
              value={convertedCode}
              readOnly
              className="h-[200px] font-mono"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={downloadCode}
            disabled={!convertedCode}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Code
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
