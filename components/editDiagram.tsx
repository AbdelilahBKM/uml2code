"use client"
import UMLClassCreator from "@/components/AddClassCard";
import Canvas from "@/components/Canvas";
import { RootState } from "@/store/redux";
import { Diagram } from "@/types/UMLClass.Type";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import NotFound from "./notFound";
import { AlertCircle, Terminal } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useRouter } from "next/navigation";

export default function EditDiagram({ diagramId }: { diagramId: string }) {
  const token = useSelector((state: RootState) => state.auth.token);
  const [diagram, setDiagram] = useState<Diagram | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const getDiagram = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/project/diagram?projectId=${diagramId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message);
        }

        setDiagram(result);
      } catch (error: any) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };
  
    if (!diagram) {
      getDiagram();
    }
  }, [diagramId, token]);


  const SaveDiagramToDatabase = async () => {
    if (diagram?.uml_classes.length === 0) {
      setErrorMessage("unable to update an empty diagram");
      return;
    }
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
      const results = await response.json();
      if (!response.ok) {
        throw new Error("unable to update database", results.message);
      }
      setSuccessMessage(results.message);
      setDiagram(results.update);
      console.log(results);

    } catch (error) {
      console.log(error);
      setErrorMessage("Unable to update diagram! please try again later");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigation = () => {
    router.push(`/my-diagrams/code/${diagramId}`);
  };

  return isLoading ? (
    <div className="w-full h-screen flex items-center justify-center">
      <div>Loading...</div>
    </div>
  ) : !diagram || (!diagram.uml_classes && !diagram.uml_association) ? (
    <NotFound />
  ) : (
    <div className="w-full h-screen flex">
      {/* Sidebar */}
      {errorMessage && (
        <Alert onClick={() => setErrorMessage("")} variant="destructive" className="absolute w-fit top-2 right-5 bg-red-50 cursor-pointer">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert
          onClick={() => setSuccessMessage('')}
          variant={"default"} className="absolute w-fit top-2 right-5 bg-white text-green-900 cursor-pointer z-20">
          <AlertTitle className="flex"><Terminal className="h-4 w-4" /> Success!</AlertTitle>
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
              handleNavigation={handleNavigation}        
              />
      </section>

      {/* Main Content */}
      <section className="w-4/5 h-full">
        <Canvas diagram={diagram} setDiagram={setDiagram} />
      </section>
    </div>
  );
}
