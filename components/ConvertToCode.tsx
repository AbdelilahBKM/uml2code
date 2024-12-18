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
    classes: UMLClass[], // Liste des classes UML
    associations: UMLAssociation[] // Liste des associations UML (ex : héritage, implémentation)
  ): string => {
    const classInheritanceMap = new Map<number, string>(); // stocker les relations d'héritage (id de l'enfant, nom de la classe parent)
    const classImplementationMap = new Map<number, string[]>(); // stocker les relations d'implémentation (id source, interfaces implémentées)

    // Étape 1 : Traiter les associations pour l'héritage et l'implémentation
    associations.forEach((assoc) => {
      if (assoc.shape === "extends") {
        // Si l'association est de type héritage (extends)
        const parentClass = classes.find((c) => c.id === assoc.targetId)?.name; // Trouver la classe parente
        if (parentClass) classInheritanceMap.set(assoc.sourceId, parentClass); // Ajouter la relation
      } else if (assoc.shape === "implement") {
        // Si l'association est de type implémentation (implement)
        const implementedInterface = classes.find(
          (c) => c.id === assoc.targetId // Trouver l'interface à implémenter
        )?.name;
        if (implementedInterface) {
          const current = classImplementationMap.get(assoc.sourceId) || []; // Récupérer les interfaces déjà associées
          classImplementationMap.set(assoc.sourceId, [
            ...current,
            implementedInterface, // Ajouter l'interface actuelle
          ]);
        }
      }
    });

    let pythonCode = "";

    // Étape 2 : Ajouter les imports si des classes abstraites ou des interfaces sont présentes
    const hasAbstractOrInterface = classes.some(
      (cls) => cls.shape === "abstract" || cls.shape === "interface" // Vérifier la présence de classes abstraites ou d'interfaces
    );
    if (hasAbstractOrInterface)
      pythonCode += "from abc import ABC, abstractmethod\n\n"; // Importation des bases pour les classes abstraites

    // Étape 3 : Générer le code pour chaque classe UML
    classes.forEach((cls) => {
      const parentClass = classInheritanceMap.get(cls.id); // Récupérer la classe parente
      const implementedInterfaces = classImplementationMap.get(cls.id) || []; // Récupérer les interfaces implémentées
      const inheritanceList = [
        ...(parentClass ? [parentClass] : []), // Ajouter la classe parente si elle existe
        ...implementedInterfaces, // Ajouter les interfaces implémentées
      ];
      const baseClass =
        cls.shape === "interface" || cls.shape === "abstract" // Définir la base de la classe selon son type
          ? "ABC" // Les classes abstraites et interfaces héritent de ABC (Abstract Base Class)
          : "object"; // Sinon, elles héritent de 'object' par défaut

      // Déclaration de la classe en Python
      pythonCode += `class ${cls.name}(${
        inheritanceList.length > 0 ? inheritanceList.join(", ") : baseClass
      }):\n`;

      // Étape 4 : Générer les attributs pour le constructeur
      const parentAttributes = parentClass
        ? classes.find((c) => c.name === parentClass)?.attributes || [] // Récupérer les attributs de la classe parente
        : [];
      const uniqueAttributes = cls.attributes.filter(
        // Identifier les attributs uniques
        (attr) =>
          !parentAttributes.some((parentAttr) => parentAttr.name === attr.name)
      );

      // Générer le constructeur (__init__)
      if (cls.attributes.length || parentAttributes.length) {
        const allAttributes = [...parentAttributes, ...uniqueAttributes]; // Combiner les attributs parentaux et uniques
        pythonCode += `    def __init__(self, ${allAttributes
          .map((attr) => attr.name) // Liste des paramètres du constructeur
          .join(", ")}):\n`;
        if (parentClass) {
          // Appeler le constructeur de la classe parente si elle existe
          pythonCode += `        super().__init__(${parentAttributes
            .map((attr) => attr.name)
            .join(", ")})\n`;
        }
        uniqueAttributes.forEach((attr) => {
          // Initialiser les attributs uniques
          pythonCode += `        self.${attr.name} = ${attr.name}\n`;
        });
      } else {
        pythonCode += "    pass\n"; // Ajouter un pass si le constructeur est vide
      }

      // Étape 5 : Générer les méthodes de la classe
      cls.methods.forEach((method) => {
        const isAbstract =
          cls.shape === "abstract" || cls.shape === "interface"; // Déterminer si la méthode est abstraite
        const decorator = isAbstract ? "    @abstractmethod\n" : ""; // Ajouter le décorateur @abstractmethod si nécessaire
        pythonCode += `${decorator}    def ${method.name}(self${
          method.parameters && method.parameters.length // Ajouter les paramètres si disponibles
            ? ", " + method.parameters.map((p) => p.name).join(", ")
            : ""
        }):\n`;
        if (isAbstract) {
          pythonCode += "        raise NotImplementedError()\n"; // Lever une exception pour les méthodes abstraites
        } else {
          pythonCode += "        # TODO: Implement this method\n        pass\n"; // Ajouter un commentaire pour les méthodes normales
        }
      });

      pythonCode += "\n"; // Ajouter une ligne vide entre les classes
    });

    return pythonCode; // Retourner le code Python final
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

    let javaCode = "import java.util.List;\nimport java.util.ArrayList;\n\n"; // Imports de base pour les listes et collections

    classes.forEach((cls) => {
      // Parcourt chaque classe du diagramme UML
      // Déterminer le type et les modificateurs de la classe
      const classModifier =
        cls.shape === "interface"
          ? "interface" // Si c'est une interface
          : cls.shape === "abstract"
          ? "abstract class" // Si c'est une classe abstraite
          : "class"; // Sinon une classe standard

      // Déterminer l'héritage et les implémentations
      const parentClass = classInheritanceMap.get(cls.id); // Récupère la classe parente
      const implementedInterfaces = classImplementationMap.get(cls.id); // Récupère les interfaces implémentées

      // Construire la déclaration de la classe
      let classDeclaration = `public ${classModifier} ${cls.name}`;

      // Gestion de l'héritage (extends)
      if (parentClass && cls.shape !== "interface") {
        classDeclaration += ` extends ${parentClass}`; // Ajoute la classe parente si existante
      }

      // Gestion des implémentations
      if (implementedInterfaces && implementedInterfaces.length > 0) {
        classDeclaration +=
          cls.shape === "interface"
            ? ` extends ${implementedInterfaces.join(", ")}` // Pour les interfaces
            : ` implements ${implementedInterfaces.join(", ")}`; // Pour les classes
      }

      classDeclaration += " {\n"; // Début du corps de la classe
      javaCode += classDeclaration;

      // Trouver les attributs de la classe parente
      const parentCls = parentClass
        ? classes.find((c) => c.name === parentClass)
        : null;
      const parentAttributes = parentCls ? parentCls.attributes : []; // Attributs du parent

      // Préparer les attributs de la classe courante
      const childAttributes = cls.attributes;

      // Gérer les associations
      const classAssociations = classAssociationMap.get(cls.id) || []; // Récupère les associations
      const associationAttributes = classAssociations.map((assoc) => {
        // Convertit les associations en attributs
        const targetClass = classes.find((c) => c.id === assoc.targetId);
        return {
          name: targetClass
            ? targetClass.name.toLowerCase() + "s" // Nom en minuscules au pluriel
            : "associatedClass",
          type: targetClass ? targetClass.name : "Object", // Type de l'association
          multiplicity: "*", // Force la multiplicité à être une liste
        };
      });

      // Filtrer les attributs uniques (non présents dans la classe parent)
      const uniqueAttributes = childAttributes.filter(
        (childAttr) =>
          !parentAttributes.some(
            (parentAttr) => parentAttr.name === childAttr.name
          )
      );

      // Combiner tous les attributs
      const combinedAttributes = [
        ...parentAttributes, // Attributs du parent
        ...uniqueAttributes, // Attributs uniques de l'enfant
        ...associationAttributes.map((assocAttr) => ({
          // Attributs des associations
          name: assocAttr.name,
          type: assocAttr.multiplicity.includes("*")
            ? `List<${assocAttr.type}>` // Type List si multiplicité multiple
            : assocAttr.type,
          visibility: "+",
        })),
      ];

      // Générer les déclarations d'attributs
      combinedAttributes.forEach((attr) => {
        const visibility = // Convertir la visibilité
          attr.visibility === "+"
            ? "public"
            : attr.visibility === "-"
            ? "private"
            : "protected";
        javaCode += `    ${visibility} ${attr.type} ${attr.name};\n`;
      });

      // Constructeur (sauf pour les interfaces)
      if (cls.shape !== "interface") {
        // Paramètres du constructeur
        const constructorParams = [
          ...parentAttributes.map((attr) => `${attr.type} ${attr.name}`),
          ...uniqueAttributes.map((attr) => `${attr.type} ${attr.name}`),
          ...associationAttributes.map((assocAttr) =>
            assocAttr.multiplicity.includes("*")
              ? `List<${assocAttr.type}> ${assocAttr.name}`
              : `${assocAttr.type} ${assocAttr.name}`
          ),
        ];

        // Générer le constructeur
        if (constructorParams.length > 0) {
          javaCode += `    public ${cls.name}(${constructorParams.join(
            ", "
          )}) {\n`;

          // Appel du constructeur parent
          if (parentClass) {
            const parentAttrNames = parentAttributes.map((attr) => attr.name);
            if (parentAttrNames.length > 0) {
              javaCode += `        super(${parentAttrNames.join(", ")});\n`;
            } else {
              javaCode += "        super();\n";
            }
          }

          // Initialiser les attributs uniques
          uniqueAttributes.forEach((attr) => {
            javaCode += `        this.${attr.name} = ${attr.name};\n`;
          });

          // Initialiser les attributs d'association
          associationAttributes.forEach((assocAttr) => {
            if (assocAttr.multiplicity.includes("*")) {
              javaCode += `        this.${assocAttr.name} = ${assocAttr.name} != null ? ${assocAttr.name} : new ArrayList<>();\n`;
            } else {
              javaCode += `        this.${assocAttr.name} = ${assocAttr.name};\n`;
            }
          });

          javaCode += `    }\n\n`;
        } else if (parentClass) {
          // Constructeur par défaut qui appelle le constructeur parent
          javaCode += `    public ${cls.name}() {\n        super();\n    }\n\n`;
        } else {
          // Constructeur par défaut simple
          javaCode += `    public ${cls.name}() {\n    }\n\n`;
        }

        // Générer les getters et setters pour les attributs d'association
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

          // Méthode d'ajout pour les attributs de liste
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

      // Méthodes (sauf pour les interfaces)
      if (cls.shape !== "interface") {
        cls.methods.forEach((method) => {
          // Déterminer la visibilité
          const visibility =
            method.visibility === "+"
              ? "public"
              : method.visibility === "-"
              ? "private"
              : "protected";

          // Préparer les paramètres de la méthode
          const params =
            (method.parameters || []).length > 0
              ? (method.parameters || [])
                  .map((p) => `${p.type} ${p.name}`)
                  .join(", ")
              : "";

          // Générer la déclaration de la méthode
          javaCode += `    ${visibility} ${method.returnType} ${method.name}(${params}) {\n`;
          javaCode += `        // TODO: Implement ${method.name} method\n`;

          // Valeur de retour par défaut selon le type
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

    let phpCode = "<?php\n\n"; // Début du code PHP

    classes.forEach((cls) => {
      // Déterminer le type et les modificateurs de la classe
      const classModifier =
        cls.shape === "interface"
          ? "interface" // Si la classe est une interface
          : cls.shape === "abstract"
          ? "abstract " // Si la classe est abstraite
          : ""; // Classe standard

      // Déterminer l'héritage et les interfaces implémentées
      const parentClass = classInheritanceMap.get(cls.id); // Obtenir le nom de la classe parente si elle existe
      const implementedInterfaces = classImplementationMap.get(cls.id); // Obtenir les interfaces implémentées

      // Construire la déclaration de la classe
      let classDeclaration = `${classModifier}class ${cls.name}`;

      // Ajouter l'héritage si applicable
      if (parentClass && cls.shape !== "interface") {
        classDeclaration += ` extends ${parentClass}`; // Hériter de la classe parente
      }

      // Ajouter les interfaces implémentées si applicable
      if (implementedInterfaces && implementedInterfaces.length > 0) {
        classDeclaration +=
          cls.shape === "interface"
            ? ` extends ${implementedInterfaces.join(", ")}` // Pour les interfaces
            : ` implements ${implementedInterfaces.join(", ")}`; // Pour les classes
      }

      classDeclaration += " {\n"; // Ouvrir le corps de la classe
      phpCode += classDeclaration; // Ajouter la déclaration de classe au code PHP

      // Trouver les attributs de la classe parente si elle existe
      const parentCls = parentClass
        ? classes.find((c) => c.name === parentClass) // Trouver l'objet de la classe parente
        : null;
      const parentAttributes = parentCls ? parentCls.attributes : []; // Obtenir les attributs de la classe parente

      // Préparer les attributs de la classe enfant
      const childAttributes = cls.attributes; // Obtenir les attributs de la classe enfant

      // Filtrer les attributs pour exclure les doublons de la classe parente
      const uniqueAttributes = childAttributes.filter(
        (childAttr) =>
          !parentAttributes.some(
            (parentAttr) => parentAttr.name === childAttr.name // Exclure les doublons
          )
      );

      // Combiner tous les attributs pour la classe
      const allAttributes = [...parentAttributes, ...uniqueAttributes];

      // Ajouter les attributs uniques de l'enfant au code PHP
      uniqueAttributes.forEach((attr) => {
        const visibility =
          attr.visibility === "+"
            ? "public" // Attribut public
            : attr.visibility === "-"
            ? "private" // Attribut privé
            : "protected"; // Attribut protégé
        phpCode += `    ${visibility} $${attr.name};\n`; // Déclaration de l'attribut
      });

      // Constructeur
      if (cls.shape !== "interface") {
        // Constructeur principal avec tous les attributs
        const constructorParams = [
          ...parentAttributes.map((attr) => `$${attr.name}`), // Paramètres des attributs de parent
          ...uniqueAttributes.map((attr) => `$${attr.name}`), // Paramètres des attributs uniques
        ];

        phpCode += `    public function __construct(${constructorParams.join(
          ", "
        )}) {\n`;

        // Appeler le constructeur parent avec les attributs parent
        if (parentClass) {
          const parentAttrNames = parentAttributes.map(
            (attr) => `$${attr.name}`
          );
          if (parentAttrNames.length > 0) {
            phpCode += `        parent::__construct(${parentAttrNames.join(
              ", "
            )});\n`; // Appel du constructeur parent
          } else {
            phpCode += "        parent::__construct();\n"; // Appel du constructeur par défaut
          }
        }

        // Initialiser les attributs enfants
        uniqueAttributes.forEach((attr) => {
          phpCode += `        $this->${attr.name} = $${attr.name};\n`; // Initialisation de l'attribut
        });
        phpCode += `    }\n\n`; // Fin du constructeur
      }

      // Méthodes
      cls.methods.forEach((method) => {
        // Ignorer la génération de méthodes pour les interfaces
        if (cls.shape === "interface") return;

        const visibility =
          method.visibility === "+"
            ? "public" // Visibilité publique
            : method.visibility === "-"
            ? "private" // Visibilité privée
            : "protected"; // Visibilité protégée

        // Préparer les paramètres de la méthode
        const params =
          (method.parameters || []).length > 0
            ? (method.parameters || [])
                .map((p) => `${p.type} ${p.name}`)
                .join(", ") // Liste des paramètres
            : "";

        phpCode += `    ${visibility} function ${method.name}(${params}) {\n`;
        phpCode += `        // TODO: Implémenter la méthode ${method.name}\n`;

        // Fournir une valeur de retour par défaut selon le type de retour
        const defaultReturn =
          method.returnType === "int"
            ? "return 0;" // Valeur par défaut pour un entier
            : method.returnType === "bool"
            ? "return false;" // Valeur par défaut pour un booléen
            : method.returnType === "float"
            ? "return 0.0;" // Valeur par défaut pour un flottant
            : method.returnType === "void"
            ? "" // Aucune valeur pour void
            : "return null;"; // Valeur par défaut pour les autres types

        phpCode += `        ${defaultReturn}\n`; // Ajouter la valeur de retour
        phpCode += `    }\n\n`; // Fin de la méthode
      });

      phpCode += "}\n\n"; // Fin de la classe
    });

    phpCode += "?>"; // Fin du code PHP
    return phpCode; // Retourner le code PHP généré
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
