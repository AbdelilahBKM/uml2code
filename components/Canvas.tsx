"use client";
// components/Canvas.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Graph, Cell, ObjectExt } from '@antv/x6';
import { useGraphSetup } from '@/hooks/useGraphSetup';
import { Diagram } from '@/types/UMLClass.Type';

interface ICanvas {
  diagram: Diagram;
  setDiagram: (newDiagram: Diagram) => void
}

export default function Canvas({ diagram, setDiagram }: ICanvas) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [dimensions, setDimensions] = useState<{ width: number, height: number }>({ width: 0, height: 0 });

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

  useGraphSetup(containerRef, diagram, setDiagram, dimensions);

  return <div ref={containerRef} className="w-full h-full" />;
}
