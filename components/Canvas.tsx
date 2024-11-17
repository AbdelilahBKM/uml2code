"use client";
// components/Canvas.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Graph, Cell, ObjectExt } from '@antv/x6';
import { useGraphSetup } from '@/hooks/useGraphSetup';
import { Diagram } from '@/types/UMLClass.Type';

interface ICanvas {
  diagram: Diagram;
}

export default function Canvas({ diagram }: ICanvas) {
  const containerRef = useRef<HTMLDivElement>(null);

  // State to store the container's width and height
  const [dimensions, setDimensions] = useState<{ width: number, height: number }>({ width: 0, height: 0 });

  // Update dimensions when the component is mounted or resized
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    // Initial dimension setting
    updateDimensions();

    // Add resize event listener to update dimensions on resize
    window.addEventListener('resize', updateDimensions);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Pass dimensions to useGraphSetup when available
  useGraphSetup(containerRef, diagram, dimensions);

  return <div ref={containerRef} className="w-full h-full" />;
}
