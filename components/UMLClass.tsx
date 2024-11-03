// src/UMLClassComponent.jsx
import React, { useEffect } from 'react';
import joint from 'jointjs';
import { UMLClass } from '@/types/UMLClass.Type';

const UMLClassComponent: React.FC<UMLClass> = ({ className, attributes, operations }) => {
    useEffect(() => {
        const graph = new joint.dia.Graph();
        const paper = new joint.dia.Paper({
            el: document.getElementById('uml-paper')!,
            model: graph,
            width: 800,
            height: 600,
            gridSize: 10,
            drawGrid: true,
        });

        // Create UML Class
        const umlClass = new joint.shapes.uml.Class();
        umlClass.position(100, 100);
        umlClass.resize(200, 200);
        umlClass.attr({
            umlNameLabel: { text: className },
            itemLabel_attributesHeader: { text: 'Attributes' },
            itemLabel_operationsHeader: { text: 'Operations' },
        });

        // Set attributes
        umlClass.attr('itemLabels', {
            text: attributes.map(attr => `${attr.access} ${attr.name}: ${attr.type}`).join('\n'),
        });

        // Set operations
        umlClass.attr('itemLabels', {
            text: [
                ...umlClass.attr('itemLabels').text.split('\n'),
                '---',
                ...operations.map(op => `${op.access} ${op.name}(${op.params.join(',')}): ${op.returnType}`)
            ].join('\n'),
        });

        graph.addCell(umlClass);

        // Cleanup to properly dispose of the paper when component unmounts
        return () => {
            paper.remove();
            graph.clear();
        };
    }, [className, attributes, operations]);

    return <div id="uml-paper" style={{ border: '1px solid black', width: '100%', height: '100%' }} />;
};

export default UMLClassComponent;
