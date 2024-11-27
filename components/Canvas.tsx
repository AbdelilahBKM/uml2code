"use client";
// components/Canvas.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useGraphSetup } from '@/hooks/useGraphSetup';
import { Diagram } from '@/types/UMLClass.Type';

interface ICanvas {
  diagram: Diagram;
  setDiagram: (newDiagram: Diagram) => void;
}

export default function Canvas({ diagram, setDiagram }: ICanvas) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();

    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Handle random position generation here, outside of the useGraphSetup
  const updateNodePositions = () => {
    const updatedClasses = diagram.uml_classes.map((cls) => {
      if (cls.position.x === 0 && cls.position.y === 0) {
        const randomX = Math.random() * (dimensions.width - 160); // Example width of the node
        const randomY = Math.random() * (dimensions.height - 80); // Example height of the node
        cls.position = { x: randomX, y: randomY };
      }
      return cls;
    });

    setDiagram({ ...diagram, uml_classes: updatedClasses });
  };

  useEffect(() => {
    updateNodePositions();
  }, [dimensions]); // Update positions when diagram or dimensions change

  useGraphSetup(containerRef, diagram, dimensions);

  return <div ref={containerRef} className="w-full h-full" />;
}
