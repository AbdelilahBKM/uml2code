"use client"
import UMLClassCreator from "@/components/AddClassCard";
import Canvas from "@/components/Canvas";
import { UMLAssociation, UMLClass, Diagram } from "@/types/UMLClass.Type";
import { useEffect, useState } from "react";

export default function EditDiagram() {
  const [diagram, setDiagram] = useState<Diagram | undefined>(undefined);
  const [classes, setClasses] = useState<UMLClass[]>([]);
  const [associations, setAssociations] = useState<UMLAssociation[]>([]);
  useEffect(() => {
    const objectDiagram: Diagram = {
      id: Date.now().toString(),
      uml_classes: classes,
      uml_association: associations
    } 
    setDiagram(objectDiagram);
  }, [classes, associations]);

  return (
    <div className="w-full h-screen flex">
      {/* Sidebar */}
      <section className="w-fit h-full py-5 px-2">
        <UMLClassCreator 
        classes={classes} 
        setClasses={setClasses} 
        associations={associations} 
        setAssociations={setAssociations} />
      </section>

      {/* Main Content */}
      <section className="w-4/5 h-full">
        {diagram && <Canvas diagram={diagram}  />}
      </section>
    </div>
  );
}
