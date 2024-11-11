"use client";
import DynamicUMLEditor from "./DynamicUMLEditor";
import { UMLNode } from "./DynamicUMLEditor";

export function AddUML() {
  const handleSubmit = (classData: UMLNode) => {
    console.log("New class added:", classData);
  };

  const handleClose = () => {
    console.log("Editor closed");
  };

  return <DynamicUMLEditor onSubmit={handleSubmit} onClose={handleClose} />;
}
