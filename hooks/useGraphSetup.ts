// useGraphSetup.ts
import { useEffect } from 'react';
import { Graph, Cell, ObjectExt } from '@antv/x6';

export const useGraphSetup = (containerRef: React.RefObject<HTMLDivElement>) => {
  useEffect(() => {
    if (!containerRef.current) return;

    // Register node and edge shapes for UML as before
    Graph.registerNode(
      'class',
      {
        inherit: 'rect',
        markup: [
          { tagName: 'rect', selector: 'body' },
          { tagName: 'rect', selector: 'name-rect' },
          { tagName: 'rect', selector: 'attrs-rect' },
          { tagName: 'rect', selector: 'methods-rect' },
          { tagName: 'text', selector: 'name-text' },
          { tagName: 'text', selector: 'attrs-text' },
          { tagName: 'text', selector: 'methods-text' },
        ],
        attrs: {
          rect: {
            width: 160,
          },
          body: {
            stroke: '#fff',
          },
          'name-rect': {
            fill: '#2e4053', // Changed to gray
            stroke: '#fff',
            strokeWidth: 0.5,
          },
          'attrs-rect': {
            fill: '#eff4ff',
            stroke: '#fff',
            strokeWidth: 0.5,
          },
          'methods-rect': {
            fill: '#eff4ff',
            stroke: '#fff',
            strokeWidth: 0.5,
          },
          'name-text': {
            ref: 'name-rect',
            refY: 0.5,
            refX: 0.5,
            textAnchor: 'middle',
            fontWeight: 'bold',
            fill: '#fff',
            fontSize: 16,
            fontFamily: 'Arial, sans-serif', // Set custom font family here
          },
          'attrs-text': {
            ref: 'attrs-rect',
            refY: 0.5,
            refX: 5,
            textAnchor: 'left',
            fill: 'black',
            fontSize: 14,
          },
          'methods-text': {
            ref: 'methods-rect',
            refY: 0.5,
            refX: 5,
            textAnchor: 'left',
            fill: 'black',
            fontSize: 14,
          },
        },
        propHooks(meta) {
          const { name, attributes, methods, ...others } = meta;

          if (!(name && attributes && methods)) {
            return meta;
          }

          const rects = [
            { type: 'name', text: name },
            { type: 'attrs', text: attributes },
            { type: 'methods', text: methods },
          ];

          let offsetY = 0;
          rects.forEach((rect) => {
            const height = rect.text.length * 12 + 16;
            ObjectExt.setByPath(others, `attrs/${rect.type}-text/text`, rect.text.join('\n'));
            ObjectExt.setByPath(others, `attrs/${rect.type}-rect/height`, height);
            ObjectExt.setByPath(others, `attrs/${rect.type}-rect/transform`, 'translate(0,' + offsetY + ')');
            offsetY += height;
          });

          others.size = { width: 160, height: offsetY };

          return others;
        },
      },
      true,
    );

    // Register edges (extends, implements, composition, aggregation, and association)
    const edgeShapes = ['extends', 'composition', 'implement', 'aggregation', 'association'];

    edgeShapes.forEach((shape) => {
      Graph.registerEdge(
        shape,
        {
          inherit: 'edge',
          attrs: {
            line: {
              strokeWidth: 1,
              targetMarker: {
                name: 'path',
                d: 'M 20 0 L 0 10 L 20 20 z',
                fill: 'white',
                offsetX: -10,
              },
            },
          },
        },
        true,
      );
    });

    // Initialize the graph
    const graph = new Graph({
      container: containerRef.current,
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
    });

    // Handle container resizing
    const resizeObserver = new ResizeObserver(() => {
      graph.resize(containerRef.current!.offsetWidth, containerRef.current!.offsetHeight);
    });
    resizeObserver.observe(containerRef.current);

    // Load initial nodes and edges
    fetch('http://localhost:5000/classes')
      .then((response) => response.json())
      .then((data) => {
        const cells: Cell[] = [];
        data.forEach((item: any) => {
          if (edgeShapes.includes(item.shape)) {
            cells.push(graph.createEdge(item));
          } else {
            cells.push(graph.createNode(item));
          }
        });

        graph.resetCells(cells);
        graph.zoomToFit({ padding: 10, maxScale: 1 });
      });

    return () => {
      resizeObserver.disconnect();
      graph.dispose();
    };
  }, [containerRef]);
};
