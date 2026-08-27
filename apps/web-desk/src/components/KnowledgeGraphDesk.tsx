import React, { useState } from 'react';
import {
  Network,
  Search,
  Filter,
  Layers,
  Sparkles,
  Bot,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';
import type { KnowledgeGraphNode } from '../types';

export const KnowledgeGraphDesk: React.FC = () => {
  const {
    knowledgeGraph,
    selectedKGNode,
    selectKGNode,
    activeRepo,
    evaluateSystemRouting,
    setActiveTab,
  } = useRemedaiStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredNodes = knowledgeGraph.nodes.filter((node) => {
    const matchesSearch =
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.filePath.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || node.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleRemediateNode = (node: KnowledgeGraphNode) => {
    evaluateSystemRouting(
      `Refactor and optimize ${node.label} in ${node.filePath} (Complexity: ${node.complexity})`,
      activeRepo?.name,
      [node.filePath]
    );
    setActiveTab('studio');
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <Network className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Repository Knowledge Graph</h1>
          </div>
          <p className="text-slate-600 text-sm">
            Interactive AST Knowledge Graph for <strong className="text-slate-800">{activeRepo?.name || 'tharior-remedai'}</strong>. Visualizes architectural modules, class hierarchies, and call relationships across indexed branches.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-500">Indexed Branches:</span>
            {(activeRepo?.selected_branches || ['main']).map((b) => (
              <span
                key={b}
                className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs font-mono font-medium"
              >
                {b}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-600">Nodes: <strong className="text-slate-900">{knowledgeGraph.nodes.length}</strong></span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">Edges: <strong className="text-slate-900">{knowledgeGraph.edges.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter symbols, modules, classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Type:
          </span>
          {['all', 'module', 'class', 'function'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                filterType === t
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main Knowledge Graph Canvas & Inspection Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Graph Canvas (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col relative min-h-[520px] overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-slate-900 text-sm">Interactive Graph View</span>
            </div>
            <span className="text-xs text-slate-400">Click any symbol node to inspect AST metadata</span>
          </div>

          {/* SVG Canvas for Relationship Edges & Nodes */}
          <div className="flex-1 relative bg-slate-50/50 rounded-xl border border-slate-100 p-4 min-h-[420px] overflow-auto flex items-center justify-center">
            {/* SVG Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                </marker>
              </defs>

              {knowledgeGraph.edges.map((edge) => {
                const sourceNode = knowledgeGraph.nodes.find((n) => n.id === edge.source);
                const targetNode = knowledgeGraph.nodes.find((n) => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const sx = sourceNode.x || 200;
                const sy = sourceNode.y || 150;
                const tx = targetNode.x || 400;
                const ty = targetNode.y || 300;

                return (
                  <g key={edge.id}>
                    <line
                      x1={sx}
                      y1={sy}
                      x2={tx}
                      y2={ty}
                      stroke="#cbd5e1"
                      strokeWidth={edge.weight || 2}
                      strokeDasharray={edge.type === 'imports' ? '4,4' : 'none'}
                      markerEnd="url(#arrow)"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Nodes Rendered over Canvas */}
            <div className="w-full h-full relative min-h-[420px]">
              {filteredNodes.map((node) => {
                const isSelected = selectedKGNode?.id === node.id;
                const x = node.x || 200;
                const y = node.y || 150;

                return (
                  <div
                    key={node.id}
                    onClick={() => selectKGNode(node)}
                    style={{ left: `${x - 90}px`, top: `${y - 35}px` }}
                    className={`absolute z-10 w-44 p-3 rounded-xl border transition-all cursor-pointer shadow-xs ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 ring-4 ring-indigo-500/20 scale-105 shadow-md'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {node.type}
                      </span>
                      <span
                        className={`text-[10px] font-mono ${
                          node.complexity > 7
                            ? isSelected
                              ? 'text-amber-200'
                              : 'text-amber-600 font-bold'
                            : isSelected
                            ? 'text-white/80'
                            : 'text-slate-500'
                        }`}
                      >
                        C:{node.complexity}
                      </span>
                    </div>

                    <div className="font-bold text-xs truncate">{node.label}</div>
                    <div
                      className={`text-[10px] font-mono truncate ${
                        isSelected ? 'text-indigo-100' : 'text-slate-400'
                      }`}
                    >
                      {node.filePath.split('/').slice(-2).join('/')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Node Inspection Panel (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 flex flex-col justify-between">
          {selectedKGNode ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-mono font-bold rounded uppercase border border-indigo-100">
                      {selectedKGNode.type}
                    </span>
                    <span className="text-xs text-slate-500">
                      Lines {selectedKGNode.lineRange[0]}-{selectedKGNode.lineRange[1]}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedKGNode.label}</h3>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-medium">Complexity</div>
                  <div
                    className={`text-sm font-bold ${
                      selectedKGNode.complexity > 7 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {selectedKGNode.complexity} / 10
                  </div>
                </div>
              </div>

              {/* File location */}
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-500 uppercase">File Path</div>
                <div className="text-xs font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700 break-all">
                  {selectedKGNode.filePath}
                </div>
              </div>

              {/* Docstring */}
              {selectedKGNode.docstring && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Description & AST Scope</div>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                    {selectedKGNode.docstring}
                  </p>
                </div>
              )}

              {/* Upstream Callers & Downstream Callees */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase mb-1">Callers</div>
                  <div className="space-y-1">
                    {selectedKGNode.callers.map((c) => (
                      <div key={c} className="text-xs font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 truncate">
                        {c}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase mb-1">Callees</div>
                  <div className="space-y-1">
                    {selectedKGNode.callees.map((c) => (
                      <div key={c} className="text-xs font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 truncate">
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dependencies */}
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-500 uppercase">Dependencies</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedKGNode.dependencies.map((dep) => (
                    <span key={dep} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-mono border border-slate-200">
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 space-y-2">
              <Network className="w-8 h-8 text-slate-300" />
              <p className="text-xs">Select any node on the graph to inspect AST metrics.</p>
            </div>
          )}

          {/* Autonomous Actions */}
          {selectedKGNode && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                onClick={() => handleRemediateNode(selectedKGNode)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                Remediate Symbol with Agent Studio
              </button>

              <button
                onClick={() => {
                  evaluateSystemRouting(
                    `Generate full unit test suite with mocks for ${selectedKGNode.label}`,
                    activeRepo?.name,
                    [selectedKGNode.filePath]
                  );
                  setActiveTab('studio');
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium rounded-xl transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Generate Unit Tests & Mocks
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
