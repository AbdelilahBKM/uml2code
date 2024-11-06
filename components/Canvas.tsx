"use client"
// components/Canvas.tsx
import React, { useEffect, useRef } from 'react';
import { Graph, Cell, ObjectExt } from '@antv/x6';
import { useGraphSetup } from '@/hooks/useGraphSetup';

export default function Canvas() {
    const containerRef = useRef<HTMLDivElement>(null);

    useGraphSetup(containerRef);

    return <div ref={containerRef} className="w-full h-full" />;
}
