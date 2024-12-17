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
    const classInheritanceMap = new Map<number, string>();
    const classImplementationMap = new Map<number, string[]>();
    const classAttributeMap = new Map<string, UMLClass["attributes"]>();
    const classAssociationMap = new Map<number, UMLAssociation[]>();

    // Map classes and their attributes
    classes.forEach((cls) => {
      classAttributeMap.set(cls.name, cls.attributes);
    });

    // Map associations to classes
    associations.forEach((assoc) => {
      if (assoc.shape === "association") {
        const sourceAssociations =
          classAssociationMap.get(assoc.sourceId) || [];
        classAssociationMap.set(assoc.sourceId, [...sourceAssociations, assoc]);
      }
    });

    // Process inheritance and implementation associations
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

    // Import statements
    const hasAbstractOrInterface = classes.some(
      (cls) => cls.shape === "abstract" || cls.shape === "interface"
    );
    const hasAssociations = associations.some(
      (assoc) => assoc.shape === "association"
    );

    if (hasAbstractOrInterface) {
      pythonCode += "from abc import ABC, abstractmethod\n";
    }
    if (hasAssociations) {
      pythonCode += "from typing import List, Optional\n";
    }
    pythonCode += "\n";

    classes.forEach((cls) => {
      // Determine base class and inheritance
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

      // Find unique attributes
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

      // Handle associations
      const classAssociations = classAssociationMap.get(cls.id) || [];
      const associationAttributes = classAssociations.map((assoc) => {
        const targetClass = classes.find((c) => c.id === assoc.targetId);
        return {
          name: targetClass
            ? targetClass.name.toLowerCase() +
              (assoc.label?.includes("*") ? "_list" : "")
            : "associated_class",
          type: targetClass ? targetClass.name : "object",
          multiplicity: assoc.label || "1:1",
        };
      });

      // Combine all attributes
      const combinedAttributes = [
        ...parentAttributes,
        ...uniqueAttributes,
        ...associationAttributes.map((assocAttr) => ({
          name: assocAttr.name,
          type: assocAttr.multiplicity.includes("*")
            ? `List[${assocAttr.type}]`
            : assocAttr.type,
          visibility: "+",
        })),
      ];

      // If no attributes, add pass
      if (combinedAttributes.length === 0 && cls.methods.length === 0) {
        pythonCode += "    pass\n\n";
        return;
      }

      // Constructor
      pythonCode += `    def __init__(self${
        combinedAttributes.length > 0
          ? ", " + combinedAttributes.map((attr) => attr.name).join(", ")
          : ""
      }):\n`;

      // Call parent constructor
      if (parentClass) {
        const parentClassObj = classes.find((c) => c.name === parentClass);
        const parentAttrNames = parentAttributes.map((attr) => attr.name);

        if (parentClassObj) {
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

      // Set attributes
      uniqueAttributes.forEach((attr) => {
        pythonCode += `        self.${attr.name} = ${attr.name}\n`;
      });

      associationAttributes.forEach((assocAttr) => {
        if (assocAttr.multiplicity.includes("*")) {
          pythonCode += `        self.${assocAttr.name} = ${assocAttr.name} or []\n`;
        } else {
          pythonCode += `        self.${assocAttr.name} = ${assocAttr.name}\n`;
        }
      });

      // If no attributes added, add pass to constructor
      if (uniqueAttributes.length === 0 && associationAttributes.length === 0) {
        pythonCode += "        pass\n";
      }

      // Methods
      cls.methods.forEach((method) => {
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
    const classAssociationMap = new Map<number, UMLAssociation[]>();

    // Map associations to classes
    associations.forEach((assoc) => {
      if (assoc.shape === "association") {
        const sourceAssociations =
          classAssociationMap.get(assoc.sourceId) || [];
        classAssociationMap.set(assoc.sourceId, [...sourceAssociations, assoc]);
      }
    });

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

    let javaCode = "import java.util.List;\nimport java.util.ArrayList;\n\n";

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

      // Handle associations
      const classAssociations = classAssociationMap.get(cls.id) || [];
      const associationAttributes = classAssociations.map((assoc) => {
        const targetClass = classes.find((c) => c.id === assoc.targetId);
        return {
          name: targetClass
            ? targetClass.name.toLowerCase() + "s" // Force plural
            : "associatedClass",
          type: targetClass ? targetClass.name : "Object",
          multiplicity: "*", // Force multiplicity to be a list
        };
      });

      // Filter out attributes that are duplicates from parent
      const uniqueAttributes = childAttributes.filter(
        (childAttr) =>
          !parentAttributes.some(
            (parentAttr) => parentAttr.name === childAttr.name
          )
      );

      // Combine all attributes
      const combinedAttributes = [
        ...parentAttributes,
        ...uniqueAttributes,
        ...associationAttributes.map((assocAttr) => ({
          name: assocAttr.name,
          type: assocAttr.multiplicity.includes("*")
            ? `List<${assocAttr.type}>`
            : assocAttr.type,
          visibility: "+",
        })),
      ];

      // Attributes
      combinedAttributes.forEach((attr) => {
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
          ...associationAttributes.map((assocAttr) =>
            assocAttr.multiplicity.includes("*")
              ? `List<${assocAttr.type}> ${assocAttr.name}`
              : `${assocAttr.type} ${assocAttr.name}`
          ),
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

          // Set association attributes
          associationAttributes.forEach((assocAttr) => {
            if (assocAttr.multiplicity.includes("*")) {
              javaCode += `        this.${assocAttr.name} = ${assocAttr.name} != null ? ${assocAttr.name} : new ArrayList<>();\n`;
            } else {
              javaCode += `        this.${assocAttr.name} = ${assocAttr.name};\n`;
            }
          });

          javaCode += `    }\n\n`;
        } else if (parentClass) {
          // Default constructor that calls parent's default constructor
          javaCode += `    public ${cls.name}() {\n        super();\n    }\n\n`;
        } else {
          javaCode += `    public ${cls.name}() {\n    }\n\n`;
        }

        // Getter and setter methods for association attributes
        associationAttributes.forEach((assocAttr) => {
          // Getter
          javaCode += `    public ${assocAttr.type} get${
            assocAttr.name.charAt(0).toUpperCase() + assocAttr.name.slice(1)
          }() {\n`;
          javaCode += `        return this.${assocAttr.name};\n    }\n\n`;

          // Setter
          javaCode += `    public void set${
            assocAttr.name.charAt(0).toUpperCase() + assocAttr.name.slice(1)
          }(${
            assocAttr.multiplicity.includes("*")
              ? `List<${assocAttr.type}> ${assocAttr.name}`
              : `${assocAttr.type} ${assocAttr.name}`
          }) {\n`;
          if (assocAttr.multiplicity.includes("*")) {
            javaCode += `        this.${assocAttr.name} = ${assocAttr.name} != null ? ${assocAttr.name} : new ArrayList<>();\n`;
          } else {
            javaCode += `        this.${assocAttr.name} = ${assocAttr.name};\n`;
          }
          javaCode += `    }\n\n`;

          // Add method for list attributes
          if (assocAttr.multiplicity.includes("*")) {
            javaCode += `    public void add${
              assocAttr.name.charAt(0).toUpperCase() +
              assocAttr.name.slice(1).slice(0, -1)
            }(${assocAttr.type} ${assocAttr.name.slice(0, -1)}) {\n`;
            javaCode += `        if (this.${assocAttr.name} == null) {\n`;
            javaCode += `            this.${assocAttr.name} = new ArrayList<>();\n`;
            javaCode += `        }\n`;
            javaCode += `        this.${
              assocAttr.name
            }.add(${assocAttr.name.slice(0, -1)});\n`;
            javaCode += `    }\n\n`;
          }
        });
      }

      // Methods (if not an interface)
      if (cls.shape !== "interface") {
        cls.methods.forEach((method) => {
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
      }

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
        <div className="sticky top-0 bg-white z-10">
          {" "}
          {/* Added wrapper div */}
          <CardHeader>
            <CardTitle>Convert UML to Code</CardTitle>
            <CardDescription>
              Transform your UML class diagram into Python or Java code
            </CardDescription>
          </CardHeader>
        </div>
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
            <div className="relative">
              {" "}
              {/* Added wrapper div */}
              <Textarea
                id="converted-code"
                placeholder="Your converted code will appear here"
                value={convertedCode}
                readOnly
                className="h-[200px] font-mono resize-y min-h-[200px] max-h-[600px]"
              />
            </div>
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
