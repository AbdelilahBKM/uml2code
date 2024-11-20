"use client"
import UMLClassCreator from "@/components/AddClassCard";
import Canvas from "@/components/Canvas";
import { logout } from "@/store/authReducer";
import { RootState } from "@/store/redux";
import { UMLAssociation, UMLClass, Diagram } from "@/types/UMLClass.Type";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import NotFound from "./notFound";
import { AlertCircle, Terminal, X } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export default function EditDiagram({ diagramId }: { diagramId: string }) {
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const [diagram, setDiagram] = useState<Diagram | null>(() => {
    const savedDiagram = localStorage.getItem(`diagram-${diagramId}`);
    return savedDiagram ? JSON.parse(savedDiagram) : null;
  });
  const [classes, setClasses] = useState<UMLClass[]>([]);
  const [associations, setAssociations] = useState<UMLAssociation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const SaveDiagramToDatabase = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      const response = await fetch(`/api/project/diagram?projectId=${diagramId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(diagram)
      });
      const results: Diagram | any = await response.json();
      if (!response.ok) {
        throw new Error("unable to update database", results.message);
      }
      setSuccessMessage("Updated Successfully!");
      setDiagram(results);

    } catch (error) {
      console.log(error);
      setErrorMessage("Unable to update diagram! please try again later");
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const getDiagram = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/project/diagram?projectId=${diagramId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const results = await response.json();
        if (!response.ok) {
          if (response.status == 401) {
            dispatch(logout());
          }
          throw new Error(results.message);
        }
        setDiagram(results);
        setClasses(results.uml_classes);
        setAssociations(results.uml_association);

      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    }
    if (!diagram) {
      getDiagram();
    }
  }, [diagramId]);

  useEffect(() => {
    if (diagram) {
      const diagramObj: Diagram = {
        id: diagram.id,
        uml_classes: classes,
        uml_association: associations,
      }
      setDiagram(diagramObj);
    }
  }, [classes, associations]);

  useEffect(() => {
    if (diagram) {
      localStorage.setItem(`diagram-${diagramId}`, JSON.stringify(diagram));
    }
  }, [diagram, diagramId]);



  return !diagram ? (isLoading ? null : <NotFound />) : (
    <div className="w-full h-screen flex">
      {/* Sidebar */}
      {errorMessage && (
        <Alert variant="destructive" className="absolute w-fit top-2 right-5 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert 
        onClick={() => setSuccessMessage('')}
        variant={"default"} className="absolute w-fit top-2 right-5 bg-white text-green-900 cursor-pointer z-20">
          <AlertTitle className="flex"><Terminal className="h-4 w-4" />Sucess!</AlertTitle>
          <AlertDescription>
            {successMessage + " " + new Date().toLocaleString()}
          </AlertDescription>
        </Alert>
      )}
      <section className="w-fit h-full py-5 px-2">
        <UMLClassCreator
          diagram={diagram}
          setDiagram={setDiagram}
          saveDiagramToDatabase={SaveDiagramToDatabase}
        />
      </section>

      {/* Main Content */}
      <section className="w-4/5 h-full">
        <Canvas diagram={diagram} setDiagram={setDiagram} />
      </section>
    </div>
  );
}
