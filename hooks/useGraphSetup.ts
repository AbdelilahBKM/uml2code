// useGraphSetup.ts
import { useEffect } from 'react';
import { Graph, Cell, ObjectExt } from '@antv/x6';
import { Diagram } from '@/types/UMLClass.Type';
export interface Dimension {
  width: number;
  height: number;
}

export const useGraphSetup = (
  containerRef: React.RefObject<HTMLDivElement>,
  diagram: Diagram,
  dimension: Dimension,
) => {
  function getRandomPosition(nodeWidth: number, nodeHeight: number) {
    const x = Math.random() * (dimension.width - nodeWidth);
    const y = Math.random() * (dimension.height - nodeHeight);
    return { x, y };
  }
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

    Graph.registerEdge(
      'extends',
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
    )

    // 实现
    Graph.registerEdge(
      'implement',
      {
        inherit: 'edge',
        attrs: {
          line: {
            strokeWidth: 1,
            strokeDasharray: '3,3',
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
    )

    // 组合
    Graph.registerEdge(
      'composition',
      {
        inherit: 'edge',
        attrs: {
          line: {
            strokeWidth: 1,
            sourceMarker: {
              name: 'path',
              d: 'M 30 10 L 20 16 L 10 10 L 20 4 z',
              fill: 'black',
              offsetX: -10,
            },
            targetMarker: {
              name: 'path',
              d: 'M 6 10 L 18 4 C 14.3333 6 10.6667 8 7 10 L 18 16 z',
              fill: 'black',
              offsetX: -5,
            },
          },
        },
      },
      true,
    )

    // 聚合
    Graph.registerEdge(
      'aggregation',
      {
        inherit: 'edge',
        attrs: {
          line: {
            strokeWidth: 1,
            sourceMarker: {
              name: 'path',
              d: 'M 30 10 L 20 16 L 10 10 L 20 4 z',
              fill: 'white',
              offsetX: -10,
            },
            targetMarker: {
              name: 'path',
              d: 'M 6 10 L 18 4 C 14.3333 6 10.6667 8 7 10 L 18 16 z',
              fill: 'black',
              offsetX: -5,
            },
          },
        },
      },
      true,
    )

    // 关联
    Graph.registerEdge(
      'association',
      {
        inherit: 'edge',
        attrs: {
          line: {
            strokeWidth: 1,
            targetMarker: {
              name: 'path',
              d: 'M 6 10 L 18 4 C 14.3333 6 10.6667 8 7 10 L 18 16 z',
              fill: 'black',
              offsetX: -5,
            },
          },
        },
      },
      true,
    )
    // #endregion

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
    const cells: Cell[] = []
    const edgeShapes = [
      'extends',
      'composition',
      'implement',
      'aggregation',
      'association',
    ]

    const umlClasses = diagram.uml_classes.map((cls) => {
      return {
        id: cls.id,
        shape: "class",
        name: cls.shape !== "class" ? [
          `<<${cls.shape}>>`,
          cls.name
        ] : [cls.name],
        attributes: cls.attributes.map((att) => `${att.visibility}${att.name}: ${att.type}`),
        methods: cls.methods.map((op) => `${op.visibility}${op.name}(): ${op.returnType}`),
        position: cls.position || {
          x: Math.random() * (dimension.width - 160), y: Math.random() * (dimension.height - 80)
        }
      }
    })
    const UMLAssociations = diagram.uml_association.map((ass) => {
      return {
        id: ass.id,
        shape: ass.shape,
        source: ass.source,
        target: ass.target,
        ...(
          ass.label && { label: ass.label }
        )
      }
    })
    const data = [...umlClasses, ...UMLAssociations];
    data.forEach((item: any) => {
      if (edgeShapes.includes(item.shape)) {
        cells.push(graph.createEdge(item));
      } else {
        const node = graph.createNode(item);
        node.position(item.position.x, item.position.y); // Use the position passed from Canvas
        cells.push(node);
      }
    });
    graph.resetCells(cells)
    graph.zoomToFit({ padding: 10, maxScale: 1 })

    return () => {
      resizeObserver.disconnect();
      graph.dispose();
    };
  }, [containerRef, diagram, dimension]);
};