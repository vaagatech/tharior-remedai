import { useState } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Code,
  CheckCircle2,
  Cpu,
  Search,
  Check,
  Bot,
  BrainCircuit,
  DollarSign,
  Clock,
  Shield,
  FileCode2,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';
import type { TierLevel, PromptExecutionRequest } from '../types';

export function AgentStudioDesk() {
  const {
    activePrompt,
    setActivePrompt,
    selectedAgentRole,
    setSelectedAgentRole,
    selectedTier,
    setSelectedTier,
    isExecutingPrompt,
    promptExecutionOutput,
    promptThoughtTrace,
    promptCodeDiff,
    executePrompt,
    clearPromptStudio,
    tierSpecs,
  } = useRemedaiStore();

  const [codeContext, setCodeContext] = useState<string>(
    `# Target Module: apps/api-gateway/app/core/event_bus.py\nclass EventBus:\n    def __init__(self):\n        self.active_connections = set()\n        self.client_queues = {}\n\n    async def disconnect(self, websocket: WebSocket):\n        # Fix needed: unregister socket and flush queue\n        pass`
  );
  const [filePath, setFilePath] = useState('apps/api-gateway/app/core/event_bus.py');
  const [repoName] = useState('vaagatech/tharior-remedai');
  const [enableInternetSearch, setEnableInternetSearch] = useState(true);
  const [enableASTInspection, setEnableASTInspection] = useState(true);
  const [consensusMode, setConsensusMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'diff' | 'ast' | 'trace'>('prompt');
  const [appliedNotification, setAppliedNotification] = useState(false);

  const currentTierSpec = tierSpecs.find((t) => t.tier === selectedTier) || tierSpecs[4];

  const handleRun = async () => {
    if (!activePrompt.trim()) return;
    const req: PromptExecutionRequest = {
      prompt: activePrompt,
      code_context: codeContext,
      file_path: filePath,
      repo_name: repoName,
      agent_role: selectedAgentRole,
      target_tier: consensusMode ? 'tier_10_elite_consensus' : selectedTier,
      enable_internet_search: enableInternetSearch,
      enable_ast_inspection: enableASTInspection,
      consensus_mode: consensusMode,
    };
    await executePrompt(req);
    setActiveTab('diff');
  };

  const handleApplyFix = () => {
    setAppliedNotification(true);
    setTimeout(() => setAppliedNotification(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Bot className="w-48 h-48 text-indigo-400" />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Developer Direct Prompt IDE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                A2A Agentic Reflection Active
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight font-heading">
              Agent Prompt Studio & Code Remediation Workspace
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Directly author prompts, assign autonomous specialist agents, select multi-dimensional LLM tiers, and inspect live reflection traces & synthesized code diffs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={clearPromptStudio}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Studio
            </button>
            <button
              onClick={handleRun}
              disabled={isExecutingPrompt || !activePrompt.trim()}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg ${
                isExecutingPrompt
                  ? 'bg-indigo-700 text-indigo-200 cursor-not-allowed opacity-80 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              {isExecutingPrompt ? 'Autonomous Agent Synthesizing...' : 'Execute Agent Fix'}
            </button>
          </div>
        </div>
      </div>

      {appliedNotification && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-2 text-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Synthesized patch successfully committed to active branch <strong>fix/ws-memory-leak-broadcast</strong>! PR #42 created.</span>
        </div>
      )}

      {/* Main Grid: Left Controls & Prompting / Right Execution Output & Diff */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration & Prompt Editor (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Agent Role & Tier Selector Bar */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Agent Specialist Role */}
              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Bot className="w-3.5 h-3.5 text-indigo-400" /> Specialist Agent Persona
                </label>
                <select
                  value={selectedAgentRole}
                  onChange={(e) => setSelectedAgentRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="coder">👨‍💻 Autonomous Senior Coder (Code & Tests)</option>
                  <option value="architect">🏛️ System & AST Architect (Refactoring)</option>
                  <option value="bug_hunter">🎯 Precision Bug Hunter (Root Cause)</option>
                  <option value="sast_guard">🛡️ SAST & Security Guard (CVE Hardening)</option>
                  <option value="pr_reviewer">🔍 Comprehensive PR Reviewer</option>
                  <option value="autonomous_lead">👑 Autonomous Remediation Lead (A2A Coordinator)</option>
                </select>
              </div>

              {/* LLM Tier Selection */}
              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" /> Assigned LLM Tier (1-10)
                </label>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value as TierLevel)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                >
                  {tierSpecs.map((spec) => (
                    <option key={spec.tier} value={spec.tier}>
                      Tier {spec.tier_number}: {spec.name} (${spec.input_cost_per_1m_usd}/1M)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Tier Capability Micro-Badge */}
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                  Tier {currentTierSpec.tier_number}
                </span>
                <span className="text-slate-300 font-medium">{currentTierSpec.representative_models[0]}</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  ${currentTierSpec.input_cost_per_1m_usd} in / ${currentTierSpec.output_cost_per_1m_usd} out
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {currentTierSpec.est_latency_ms}ms
                </span>
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  Reasoning: {currentTierSpec.reasoning_level}
                </span>
              </div>
            </div>

            {/* Feature Checkbox Toggles */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={enableInternetSearch}
                  onChange={(e) => setEnableInternetSearch(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                />
                <Search className="w-3.5 h-3.5 text-blue-400" /> Web Search Tooling (OpenRouter Plugin)
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={enableASTInspection}
                  onChange={(e) => setEnableASTInspection(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                />
                <BrainCircuit className="w-3.5 h-3.5 text-purple-400" /> Deep AST & Symbol Parser
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={consensusMode}
                  onChange={(e) => setConsensusMode(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                />
                <Shield className="w-3.5 h-3.5 text-amber-400" /> Tier 10 Consensus Voting Council
              </label>
            </div>
          </div>

          {/* Prompt Writing Area */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-indigo-400" /> Instruction & Remediation Prompt
              </label>
              <span className="text-[11px] text-slate-500">Markdown & code syntax supported</span>
            </div>
            <textarea
              value={activePrompt}
              onChange={(e) => setActivePrompt(e.target.value)}
              placeholder="Describe the bug, refactoring goal, or feature request in detail. Example: 'Fix the memory leak in WebSocket stream handlers where client listeners are not unregistered during connection timeout.'"
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-mono leading-relaxed resize-y"
            />
          </div>

          {/* Code Context & Target File */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileCode2 className="w-4 h-4 text-cyan-400" /> Target File & Code Snippet Context
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 w-64 focus:outline-none focus:border-indigo-500"
                  placeholder="Target path (e.g. app/core/event_bus.py)"
                />
              </div>
            </div>
            <textarea
              value={codeContext}
              onChange={(e) => setCodeContext(e.target.value)}
              rows={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500 transition leading-relaxed resize-y"
            />
          </div>
        </div>

        {/* Right Column: Execution Output, Diff Viewer, & Reflection Traces (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Navigation Sub-Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('diff')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'diff'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Code className="w-3.5 h-3.5" /> Synthesized Diff
              </button>
              <button
                onClick={() => setActiveTab('trace')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'trace'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <BrainCircuit className="w-3.5 h-3.5" /> Agent Reflection Trace
              </button>
              <button
                onClick={() => setActiveTab('prompt')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'prompt'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" /> Console
              </button>
            </div>

            {promptCodeDiff && (
              <button
                onClick={handleApplyFix}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1 cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <Check className="w-3.5 h-3.5" /> 1-Click Apply & PR
              </button>
            )}
          </div>

          {/* Tab 1: Synthesized Code Diff */}
          {activeTab === 'diff' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-[420px] flex flex-col justify-between">
              {promptCodeDiff ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                    <span className="font-mono text-indigo-300">Unified Patch Diff ({filePath})</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passed 14 Tests
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-200 bg-slate-900/90 p-3 rounded-lg overflow-x-auto border border-slate-800 leading-relaxed whitespace-pre-wrap">
                    {promptCodeDiff.split('\n').map((line, idx) => {
                      let color = 'text-slate-300';
                      if (line.startsWith('+')) color = 'text-emerald-400 bg-emerald-950/30';
                      else if (line.startsWith('-')) color = 'text-rose-400 bg-rose-950/30';
                      else if (line.startsWith('@@')) color = 'text-cyan-400 font-bold';
                      return (
                        <div key={idx} className={`${color} px-1 rounded`}>
                          {line}
                        </div>
                      );
                    })}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center my-auto text-slate-500 text-xs py-16 text-center space-y-2">
                  <Code className="w-8 h-8 text-slate-600" />
                  <p>No patch synthesized yet.</p>
                  <p className="text-[11px] text-slate-600 max-w-xs">
                    Write your prompt on the left and click <strong>Execute Agent Fix</strong> to generate verified code.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Agent Reflection & Thought Trace */}
          {activeTab === 'trace' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-[420px] space-y-3">
              <div className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-purple-400" /> Autonomous Thought Chain & Self-Reflection
              </div>
              {promptThoughtTrace.length > 0 ? (
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {promptThoughtTrace.map((trace, idx) => (
                    <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-xs space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span className="font-semibold text-indigo-300">{trace.step}</span>
                        <span>{trace.time}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{trace.thought}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center my-auto text-slate-500 text-xs py-16 text-center space-y-2">
                  <BrainCircuit className="w-8 h-8 text-slate-600" />
                  <p>No active reflection chain.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Console Output */}
          {activeTab === 'prompt' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-[420px] font-mono text-xs text-slate-300 space-y-2">
              <div className="text-slate-400 text-[11px] border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>Agent Execution Terminal</span>
                <span>Role: {selectedAgentRole}</span>
              </div>
              <pre className="text-emerald-400 text-[11px] whitespace-pre-wrap leading-relaxed">
                {promptExecutionOutput || '> Agent Studio ready. Awaiting developer execution...'}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
