import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FlowNode, FlowTransfer } from '../types/flow';
import { Wallet, FileCode, ArrowRight, ExternalLink, ZoomIn, ZoomOut, RotateCcw, Filter } from 'lucide-react';

interface Props {
  nodes: FlowNode[];
  transfers: FlowTransfer[];
  targetAddress: string;
  onNodeClick: (node: FlowNode) => void;
  selectedNodeId?: string;
}

interface PositionedNode extends FlowNode {
  x: number;
  y: number;
}

export const FlowGraph: React.FC<Props> = ({
  nodes,
  transfers,
  targetAddress,
  onNodeClick,
  selectedNodeId,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'wallet' | 'contract'>('all');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredTransfer, setHoveredTransfer] = useState<FlowTransfer | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  const WIDTH = 900;
  const HEIGHT = 580;
  const CENTER_X = WIDTH / 2;
  const CENTER_Y = HEIGHT / 2;

  // Filter nodes according to selected filter
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (n.isTarget) return true;
      if (filterType === 'all') return true;
      return n.type === filterType;
    });
  }, [nodes, filterType]);

  // Position nodes in an organized radial layout around target node
  const positionedNodes: PositionedNode[] = useMemo(() => {
    const target = nodes.find((n) => n.isTarget) || {
      id: targetAddress.toLowerCase(),
      address: targetAddress.toLowerCase(),
      type: 'wallet' as const,
      isTarget: true,
      incomingTotal: 0n,
      outgoingTotal: 0n,
      transferCount: 0,
    };

    const others = filteredNodes.filter((n) => !n.isTarget);
    const count = others.length;
    const radius = count > 8 ? 220 : 170;

    const list: PositionedNode[] = [
      {
        ...target,
        x: CENTER_X,
        y: CENTER_Y,
      },
    ];

    others.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / (count || 1) - Math.PI / 2;
      list.push({
        ...node,
        x: CENTER_X + radius * Math.cos(angle),
        y: CENTER_Y + radius * Math.sin(angle),
      });
    });

    return list;
  }, [filteredNodes, nodes, targetAddress, CENTER_X, CENTER_Y]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, PositionedNode>();
    positionedNodes.forEach((n) => map.set(n.id.toLowerCase(), n));
    return map;
  }, [positionedNodes]);

  // Visible transfers connected to current positioned nodes
  const visibleTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const hasFrom = nodeMap.has(t.from.toLowerCase());
      const hasTo = nodeMap.has(t.to.toLowerCase());
      return hasFrom && hasTo;
    });
  }, [transfers, nodeMap]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="bg-slate-800 border border-slate-700 flex flex-col h-[700px] select-none">
      {/* Visual Explorer Top Control Bar */}
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold uppercase tracking-wider text-slate-200">Visual Flow Explorer</span>
            <span className="text-slate-400">({positionedNodes.length} nodes, {visibleTransfers.length} lines)</span>
          </div>

          {/* Node Legend (Strictly flat colors) */}
          <div className="hidden sm:flex items-center space-x-3 text-[11px] border-l border-slate-700 pl-4">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600 border border-emerald-400"></span>
              <span className="text-slate-300">Target</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600 border border-blue-400"></span>
              <span className="text-slate-300">Wallet</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-amber-600 border border-amber-400"></span>
              <span className="text-slate-300">Contract</span>
            </div>
          </div>
        </div>

        {/* Filters and Zoom Controls */}
        <div className="flex items-center space-x-2">
          {/* Node Filter */}
          <div className="flex items-center bg-slate-800 border border-slate-700">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 text-[11px] font-medium ${
                filterType === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('wallet')}
              className={`px-2.5 py-1 text-[11px] font-medium border-l border-slate-700 ${
                filterType === 'wallet' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Wallets
            </button>
            <button
              onClick={() => setFilterType('contract')}
              className={`px-2.5 py-1 text-[11px] font-medium border-l border-slate-700 ${
                filterType === 'contract' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Contracts
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center bg-slate-800 border border-slate-700">
            <button
              onClick={() => setScale((s) => Math.min(s + 0.15, 2.5))}
              className="p-1 hover:bg-slate-700 text-slate-300"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setScale((s) => Math.max(s - 0.15, 0.4))}
              className="p-1 hover:bg-slate-700 text-slate-300 border-l border-slate-700"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetView}
              className="p-1 hover:bg-slate-700 text-slate-300 border-l border-slate-700"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        className="flex-1 bg-slate-950 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-full"
        >
          {/* Flat Grid Pattern */}
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.8" />
            </pattern>
            {/* Crisp Flat Arrow Markers */}
            <marker
              id="arrow-incoming"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
            </marker>
            <marker
              id="arrow-outgoing"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc2626" />
            </marker>
          </defs>

          {/* Grid background */}
          <rect width={WIDTH} height={HEIGHT} fill="url(#grid)" />

          {/* Scaled / Panned Graph Group */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
            {/* Transfer Connecting Lines */}
            {visibleTransfers.map((tx, idx) => {
              const source = nodeMap.get(tx.from.toLowerCase());
              const target = nodeMap.get(tx.to.toLowerCase());
              if (!source || !target) return null;

              const isIncomingToTarget = tx.to.toLowerCase() === targetAddress.toLowerCase();
              const strokeColor = isIncomingToTarget ? '#059669' : '#dc2626';
              const marker = isIncomingToTarget ? 'url(#arrow-incoming)' : 'url(#arrow-outgoing)';
              const isHovered = hoveredTransfer?.hash === tx.hash;

              // Compute mid-point for badge display
              const midX = (source.x + target.x) / 2;
              const midY = (source.y + target.y) / 2;

              return (
                <g
                  key={`${tx.hash}-${idx}`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredTransfer(tx)}
                  onMouseLeave={() => setHoveredTransfer(null)}
                >
                  {/* Connecting Line */}
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={strokeColor}
                    strokeWidth={isHovered ? 3 : 1.8}
                    strokeDasharray={isHovered ? '4 2' : undefined}
                    markerEnd={marker}
                    opacity={isHovered ? 1 : 0.85}
                  />

                  {/* Transfer Amount and Tx Badge */}
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-42"
                      y="-12"
                      width="84"
                      height="22"
                      fill="#0f172a"
                      stroke={strokeColor}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="2"
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {parseFloat(tx.formattedAmount) < 0.001
                        ? '<0.001'
                        : parseFloat(tx.formattedAmount).toFixed(3)}{' '}
                      {tx.tokenSymbol}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Nodes */}
            {positionedNodes.map((node) => {
              const isSelected = selectedNodeId?.toLowerCase() === node.id.toLowerCase();
              const isHovered = hoveredNodeId === node.id;
              const isContract = node.type === 'contract';

              // Flat solid styling based on node type
              let fillColor = '#1e293b';
              let strokeColor = '#3b82f6'; // blue for standard wallet
              let shape = 'circle';

              if (node.isTarget) {
                strokeColor = '#059669'; // solid emerald for target
                fillColor = '#064e3b';
              } else if (isContract) {
                strokeColor = '#d97706'; // solid amber for contract
                fillColor = '#451a03';
                shape = 'rect';
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onClick={() => onNodeClick(node)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  {/* Node Shape */}
                  {shape === 'rect' ? (
                    <rect
                      x="-24"
                      y="-24"
                      width="48"
                      height="48"
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3 : (isHovered ? 2.5 : 1.5)}
                    />
                  ) : (
                    <circle
                      r={node.isTarget ? 30 : 22}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3 : (isHovered ? 2.5 : 1.5)}
                    />
                  )}

                  {/* Node Icon */}
                  {isContract ? (
                    <FileCode
                      x="-10"
                      y="-10"
                      width="20"
                      height="20"
                      color="#f59e0b"
                      strokeWidth={2}
                    />
                  ) : (
                    <Wallet
                      x="-9"
                      y="-9"
                      width="18"
                      height="18"
                      color={node.isTarget ? '#34d399' : '#60a5fa'}
                      strokeWidth={2}
                    />
                  )}

                  {/* Node Label (Address & Type) */}
                  <g transform={`translate(0, ${node.isTarget ? 42 : 34})`}>
                    <rect
                      x="-48"
                      y="-8"
                      width="96"
                      height="18"
                      fill="#0f172a"
                      stroke={isSelected ? '#38bdf8' : '#334155'}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill={node.isTarget ? '#34d399' : '#f8fafc'}
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {node.isTarget ? 'TARGET' : `${node.address.slice(0, 4)}...${node.address.slice(-3)}`}
                    </text>
                  </g>

                  {/* Node Type Badge */}
                  <text
                    x="0"
                    y={node.isTarget ? 60 : 50}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="8"
                    fontFamily="sans-serif"
                    fontWeight="bold"
                  >
                    {node.type.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Hovered Transfer Tooltip */}
        {hoveredTransfer && (
          <div className="absolute bottom-3 left-3 bg-slate-900 border border-slate-700 p-3 text-xs font-mono shadow-none max-w-md z-10">
            <div className="text-slate-400 font-sans font-bold uppercase text-[10px] mb-1 flex items-center justify-between">
              <span>Transfer Detail</span>
              <a
                href={`https://scan.bohr.life/tx/${hoveredTransfer.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center space-x-1 underline"
              >
                <span>View on BohrScan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-white font-bold text-sm mb-1">
              {hoveredTransfer.formattedAmount} {hoveredTransfer.tokenSymbol}
            </div>
            <div className="text-slate-300 text-[11px] space-y-0.5">
              <div>From: <span className="text-slate-400">{hoveredTransfer.from}</span></div>
              <div>To: <span className="text-slate-400">{hoveredTransfer.to}</span></div>
              <div className="truncate">Tx: <span className="text-slate-400">{hoveredTransfer.hash}</span></div>
            </div>
          </div>
        )}

        {/* Click instructions banner */}
        <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-700 px-2.5 py-1 text-[11px] text-slate-400">
          Click any node to inspect its activity | Drag canvas to pan
        </div>
      </div>
    </div>
  );
};

