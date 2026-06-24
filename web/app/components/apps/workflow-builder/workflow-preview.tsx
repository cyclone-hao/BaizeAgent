'use client'

import React, { useState } from 'react'
import { RiCloseLine, RiZoomInLine } from '@remixicon/react'
import type { WorkflowJson } from '@/service/workflow-builder'

type WorkflowPreviewProps = {
  workflow: WorkflowJson
  className?: string
}

const NODE_COLORS: Record<string, string> = {
  'start': '#10b981',
  'end': '#ef4444',
  'llm': '#8b5cf6',
  'knowledge-retrieval': '#f59e0b',
  'code': '#06b6d4',
  'if-else': '#ec4899',
  'tool': '#14b8a6',
  'http-request': '#6366f1',
  'answer': '#84cc16',
}

const WorkflowPreview: React.FC<WorkflowPreviewProps> = ({ workflow, className }) => {
  const { nodes, edges } = workflow.graph
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Calculate SVG viewBox
  const padding = 40
  const nodeWidth = 180
  const nodeHeight = 60

  const minX = Math.min(...nodes.map(n => n.position.x)) - padding
  const minY = Math.min(...nodes.map(n => n.position.y)) - padding
  const maxX = Math.max(...nodes.map(n => n.position.x + nodeWidth)) + padding
  const maxY = Math.max(...nodes.map(n => n.position.y + nodeHeight)) + padding

  const viewBoxWidth = maxX - minX
  const viewBoxHeight = maxY - minY

  const renderSVG = (height: string = '400') => (
    <svg
      width="100%"
      height={height}
      viewBox={`${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}`}
      className="select-none"
    >
      {/* Defs for arrow marker */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#9ca3af" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map((edge) => {
        const sourceNode = nodes.find(n => n.id === edge.source)
        const targetNode = nodes.find(n => n.id === edge.target)

        if (!sourceNode || !targetNode) return null

        const sourceX = sourceNode.position.x + nodeWidth
        const sourceY = sourceNode.position.y + nodeHeight / 2
        const targetX = targetNode.position.x
        const targetY = targetNode.position.y + nodeHeight / 2

        return (
          <g key={edge.id}>
            <path
              d={`M ${sourceX} ${sourceY} C ${sourceX + 50} ${sourceY}, ${targetX - 50} ${targetY}, ${targetX} ${targetY}`}
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          </g>
        )
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const color = NODE_COLORS[node.data.type] || '#6b7280'

        return (
          <g key={node.id} transform={`translate(${node.position.x}, ${node.position.y})`}>
            {/* Node background */}
            <rect
              width={nodeWidth}
              height={nodeHeight}
              rx="8"
              fill="white"
              stroke={color}
              strokeWidth="2"
            />

            {/* Node type badge */}
            <rect
              x="8"
              y="8"
              width="40"
              height="20"
              rx="4"
              fill={color}
            />
            <text
              x="28"
              y="22"
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="white"
            >
              {node.data.type}
            </text>

            {/* Node title */}
            <text
              x={nodeWidth / 2}
              y={nodeHeight / 2 + 15}
              textAnchor="middle"
              fontSize="12"
              fontWeight="500"
              fill="#374151"
            >
              {node.data.title || node.data.type}
            </text>
          </g>
        )
      })}
    </svg>
  )

  return (
    <>
      <div className={className}>
        <div className="mb-2 text-sm font-medium text-text-primary">
          {workflow.app_name}
        </div>
        {workflow.description && (
          <div className="mb-3 text-xs text-text-secondary">
            {workflow.description}
          </div>
        )}

        <div
          className="group relative cursor-pointer overflow-auto rounded-lg border border-components-panel-border bg-components-panel-bg transition-all hover:border-primary-300 hover:shadow-lg"
          onClick={() => setIsModalOpen(true)}
        >
          {renderSVG('400')}
          <div className="absolute right-2 top-2 rounded-lg bg-white/90 p-2 opacity-0 shadow-md transition-opacity group-hover:opacity-100">
            <RiZoomInLine className="h-5 w-5 text-text-secondary" />
          </div>
        </div>

        {/* Node summary */}
        <div className="mt-2 flex gap-2 text-xs">
          <span className="text-text-tertiary">
            节点: {nodes.length}
          </span>
          <span className="text-text-tertiary">
            连接: {edges.length}
          </span>
        </div>
      </div>

      {/* Full-screen modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-8"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-6xl overflow-auto rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-4 top-4 rounded-lg p-2 text-text-tertiary transition-colors hover:bg-state-base-hover hover:text-text-primary"
              onClick={() => setIsModalOpen(false)}
            >
              <RiCloseLine className="h-6 w-6" />
            </button>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                {workflow.app_name}
              </h3>
              {workflow.description && (
                <p className="mt-1 text-sm text-text-secondary">
                  {workflow.description}
                </p>
              )}
            </div>
            <div className="rounded-lg border border-components-panel-border bg-components-panel-bg p-4">
              {renderSVG('600')}
            </div>
            <div className="mt-4 flex gap-4 text-sm">
              <span className="text-text-secondary">
                节点数: <span className="font-medium text-text-primary">{nodes.length}</span>
              </span>
              <span className="text-text-secondary">
                连接数: <span className="font-medium text-text-primary">{edges.length}</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default WorkflowPreview
