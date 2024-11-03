// components/Diagram.tsx
"use client";
import { useEffect, useRef } from 'react';
import { dia, shapes } from '@joint/core';

const Diagram: React.FC = () => {
  const diagramRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Initialize the JointJS graph and paper
    const graph = new dia.Graph();

    const paper = new dia.Paper({
      el: diagramRef.current as HTMLDivElement,
      model: graph,
      width: '100%',
      height: '100%',
      gridSize: 10,
      drawGrid: true,
    });

    // Add a simple UML class shape as an example
    const umlClass = new shapes.standard.Rectangle();
    umlClass.position(100, 30);
    umlClass.resize(150, 60);
    umlClass.attr({
      body: { fill: 'lightblue', stroke: 'black' },
      label: { text: 'ClassName', fill: 'black', fontSize: 14 },
    });
    umlClass.addTo(graph);

    // Cleanup to properly dispose of the paper when component unmounts
    return () => {
      paper.remove();
    };
  }, []);

  return <div ref={diagramRef} className='w-full h-full border border-gray-300' />;
};

export default Diagram;
