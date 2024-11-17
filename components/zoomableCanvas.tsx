'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useGraphSetup } from '@/hooks/useGraphSetup'

export default function ZoomableCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })

  useGraphSetup(containerRef)

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const baseGridSize = 50
    let gridSize = baseGridSize * scale

    // Adjust grid size based on zoom level
    while (gridSize < 20) {
      gridSize *= 2
    }

    const offsetX = offset.x % gridSize
    const offsetY = offset.y % gridSize

    ctx.beginPath()
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)'
    ctx.lineWidth = 0.5

    for (let x = offsetX; x < canvasWidth; x += gridSize) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvasHeight)
    }

    for (let y = offsetY; y < canvasHeight; y += gridSize) {
      ctx.moveTo(0, y)
      ctx.lineTo(canvasWidth, y)
    }

    ctx.stroke()
  }, [scale, offset])

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const zoomSensitivity = 0.001
    const newScale = scale * (1 - e.deltaY * zoomSensitivity)
    const clampedScale = Math.max(0.5, Math.min(newScale, 2)) // Set zoom limits between 0.5x and 2x

    // Zoom towards cursor position
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const zoomPoint = {
        x: (x - offset.x) / scale,
        y: (y - offset.y) / scale
      }
      setOffset({
        x: x - zoomPoint.x * clampedScale,
        y: y - zoomPoint.y * clampedScale
      })
    }

    setScale(clampedScale)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    setStartPan({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    setOffset({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        ref={containerRef}
        className="relative w-full h-screen aspect-video border border-gray-300 rounded-lg overflow-hidden shadow-md cursor-move bg-gray-50"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  )
}
