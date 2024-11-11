"use client";
import React, { useEffect, useRef, useState } from "react";
import { Graph, Cell, ObjectExt, Node, Edge } from "@antv/x6";
import DynamicUMLEditor, { UMLNode } from "./DynamicUMLEditor";

export default function Canvas() {
  // Refs and State
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const [selectedNode, setSelectedNode] = useState<UMLNode | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [classes, setClasses] = useState<Cell[]>([]);

  // Utility function to convert X6 Node to our UMLNode format
  const convertNodeToUMLNode = (node: Node): UMLNode => {
    const props = node.getProp();
    return {
      id: node.id as string,
      shape: props.shape || "class",
      name: Array.isArray(props.name) ? props.name : [props.name],
      attributes: Array.isArray(props.attributes) ? props.attributes : [],
      methods: Array.isArray(props.methods) ? props.methods : [],
      position: {
        x: node.getPosition().x,
        y: node.getPosition().y,
      },
    };
  };

  // Utility function to convert UMLNode to X6 Node properties
  const convertUMLNodeToX6Props = (umlNode: UMLNode) => {
    return {
      id: umlNode.id,
      shape: umlNode.shape,
      name: umlNode.name,
      attributes: umlNode.attributes,
      methods: umlNode.methods,
      position: umlNode.position,
    };
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Register UML Class Node
    Graph.registerNode(
      "class",
      {
        inherit: "rect",
        markup: [
          { tagName: "rect", selector: "body" },
          { tagName: "rect", selector: "name-rect" },
          { tagName: "rect", selector: "attrs-rect" },
          { tagName: "rect", selector: "methods-rect" },
          { tagName: "text", selector: "name-text" },
          { tagName: "text", selector: "attrs-text" },
          { tagName: "text", selector: "methods-text" },
        ],
        attrs: {
          rect: {
            width: 160,
          },
          body: {
            stroke: "#2e4053",
            strokeWidth: 1,
          },
          "name-rect": {
            fill: "#2e4053",
            stroke: "#fff",
            strokeWidth: 0.5,
          },
          "attrs-rect": {
            fill: "#eff4ff",
            stroke: "#fff",
            strokeWidth: 0.5,
          },
          "methods-rect": {
            fill: "#eff4ff",
            stroke: "#fff",
            strokeWidth: 0.5,
          },
          "name-text": {
            ref: "name-rect",
            refY: 0.5,
            refX: 0.5,
            textAnchor: "middle",
            fontWeight: "bold",
            fill: "#fff",
            fontSize: 16,
            fontFamily: "Arial, sans-serif",
          },
          "attrs-text": {
            ref: "attrs-rect",
            refY: 0.5,
            refX: 5,
            textAnchor: "left",
            fill: "black",
            fontSize: 14,
          },
          "methods-text": {
            ref: "methods-rect",
            refY: 0.5,
            refX: 5,
            textAnchor: "left",
            fill: "black",
            fontSize: 14,
          },
        },
        propHooks(meta) {
          const { name, attributes, methods, ...others } = meta;

          if (!(name && attributes && methods)) {
            return meta;
          }

          const rects = [
            { type: "name", text: name },
            { type: "attrs", text: attributes },
            { type: "methods", text: methods },
          ];

          let offsetY = 0;
          rects.forEach((rect) => {
            const height = rect.text.length * 12 + 16;
            ObjectExt.setByPath(
              others,
              `attrs/${rect.type}-text/text`,
              rect.text.join("\n")
            );
            ObjectExt.setByPath(
              others,
              `attrs/${rect.type}-rect/height`,
              height
            );
            ObjectExt.setByPath(
              others,
              `attrs/${rect.type}-rect/transform`,
              "translate(0," + offsetY + ")"
            );
            offsetY += height;
          });

          others.size = { width: 160, height: offsetY };
          return others;
        },
      },
      true
    );

    // Register relationship types
    const relationshipTypes = [
      {
        name: "extends",
        stroke: "#000000",
        targetMarker: {
          name: "triangle",
          fill: "white",
        },
      },
      {
        name: "implements",
        stroke: "#000000",
        strokeDasharray: "5 5",
        targetMarker: {
          name: "triangle",
          fill: "white",
        },
      },
      {
        name: "composition",
        stroke: "#000000",
        sourceMarker: {
          name: "diamond",
          fill: "black",
        },
      },
      {
        name: "aggregation",
        stroke: "#000000",
        sourceMarker: {
          name: "diamond",
          fill: "white",
        },
      },
      {
        name: "association",
        stroke: "#000000",
      },
    ];

    relationshipTypes.forEach(({ name, ...attrs }) => {
      Graph.registerEdge(
        name,
        {
          inherit: "edge",
          attrs: {
            line: {
              strokeWidth: 1,
              ...attrs,
            },
          },
          label: {
            position: 0.5,
          },
        },
        true
      );
    });

    // Initialize graph
    const graph = new Graph({
      container: containerRef.current,
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
      grid: true,
      connecting: {
        allowBlank: false,
        allowLoop: false,
        allowNode: true,
        connector: "smooth",
        createEdge() {
          return new Edge({
            shape: "association",
          });
        },
      },
      highlighting: {
        magnetAvailable: {
          name: "stroke",
          args: {
            padding: 4,
            attrs: {
              strokeWidth: 4,
              stroke: "#52c41a",
            },
          },
        },
      },
      mousewheel: {
        enabled: true,
        modifiers: ["ctrl", "meta"],
      },
      interacting: {
        nodeMovable: true,
        edgeMovable: true,
        magnetConnectable: true,
      },
    });

    graphRef.current = graph;

    // Handle node selection with conversion
    graph.on("cell:click", ({ cell }) => {
      if (cell.isNode()) {
        setSelectedNode(convertNodeToUMLNode(cell as Node));
        setShowEditor(true);
      }
    });

    // Handle canvas click (deselect)
    graph.on("blank:click", () => {
      setSelectedNode(null);
      setShowEditor(false);
    });

    // Load initial data
    fetchClasses();

    // Handle window resize
    const resizeObserver = new ResizeObserver(() => {
      graph.resize(
        containerRef.current!.offsetWidth,
        containerRef.current!.offsetHeight
      );
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      graph.dispose();
    };
  }, []);

  // Fetch classes from the backend
  const fetchClasses = async () => {
    try {
      const response = await fetch("http://localhost:5000/classes");
      const data = await response.json();

      if (graphRef.current) {
        const cells: Cell[] = [];
        data.forEach((item: any) => {
          if (item.shape === "class") {
            const x6Props = convertUMLNodeToX6Props(item);
            cells.push(graphRef.current!.createNode(x6Props));
          } else {
            cells.push(graphRef.current!.createEdge(item));
          }
        });

        graphRef.current.resetCells(cells);
        graphRef.current.zoomToFit({ padding: 10, maxScale: 1 });
        setClasses(cells);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  // Add new class to the canvas
  const handleAddClass = async (classData: UMLNode) => {
    if (graphRef.current) {
      const x6Props = convertUMLNodeToX6Props(classData);
      const node = graphRef.current.addNode(x6Props);
      setClasses([...classes, node]);

      try {
        await fetch("http://localhost:5000/classes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(classData),
        });
      } catch (error) {
        console.error("Error saving class:", error);
      }
    }
  };

  // Update existing class
  const handleUpdateClass = async (classData: UMLNode) => {
    if (selectedNode && graphRef.current) {
      const node = graphRef.current.getCellById(selectedNode.id);
      if (node && node.isNode()) {
        const x6Props = convertUMLNodeToX6Props(classData);
        node.prop(x6Props);

        try {
          await fetch(`http://localhost:5000/classes/${selectedNode.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(classData),
          });
        } catch (error) {
          console.error("Error updating class:", error);
        }
      }
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {showEditor && (
        <div className="absolute top-4 right-4">
          <DynamicUMLEditor
            selectedNode={selectedNode}
            onSubmit={selectedNode ? handleUpdateClass : handleAddClass}
            onClose={() => setShowEditor(false)}
          />
        </div>
      )}
    </div>
  );
}
