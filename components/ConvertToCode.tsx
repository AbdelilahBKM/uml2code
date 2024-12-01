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
import { convertToJava, convertToPHP, convertToPython } from "@/utils/CodeConversion";

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