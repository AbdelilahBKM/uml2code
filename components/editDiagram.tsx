"use client"
import UMLClassCreator from "@/components/AddClassCard";
import Canvas from "@/components/Canvas";
import { logout } from "@/store/authReducer";
import { RootState } from "@/store/redux";
import { UMLAssociation, UMLClass, Diagram } from "@/types/UMLClass.Type";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function EditDiagram({ diagramId }: { diagramId: string }) {
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const [diagram, setDiagram] = useState<Diagram | undefined>(undefined);
  const [classes, setClasses] = useState<UMLClass[]>([]);
  const [associations, setAssociations] = useState<UMLAssociation[]>([]);
  useEffect(() => {
    const getDiagram = async () => {
      try {
        const response = await fetch(`/api/project/diagram?projectId=${diagramId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const results = await response.json();
        if(!response.ok){
          if(response.status == 401){
            dispatch(logout());
          }
          throw new Error(results.message);
        }
        setDiagram(results);
        setClasses(results.uml_classes);
        setAssociations(results.uml_association);

      } catch (error) {
        console.error(error);
      }
    }
    if(diagram === undefined) {
      getDiagram();
    }
    console.log(classes, associations);
  }, [diagramId]);

  useEffect(() => {
    if(diagram !== undefined){
      const diagramObj: Diagram = {
        id: diagram.id,
        uml_classes: classes,
        uml_association: associations,
      }

      setDiagram(diagramObj);
    }

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
        {diagram && <Canvas diagram={diagram} setDiagram={setDiagram}  />}
      </section>
    </div>
  );
}
