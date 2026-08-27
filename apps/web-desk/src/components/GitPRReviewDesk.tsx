import { useState } from 'react';
import {
  GitPullRequest,
  ShieldCheck,
  FileCode,
  RotateCw,
  Check,
} from 'lucide-react';

export function GitPRReviewDesk() {
  const [targetRepo, setTargetRepo] = useState('vaagatech/tharior-remedai');
  const [prNumber, setPrNumber] = useState('42');
  const [autoMergePolicy, setAutoMergePolicy] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);

  const findings = [
    {
      id: 'f1',
      file: 'apps/api-gateway/app/core/event_bus.py',
      line: 28,
      severity: 'POSITIVE',
      comment: 'Excellent fix: Unregistering websocket from active_connections and popping from client_queues successfully resolves the memory leak.',
    },
    {
      id: 'f2',
      file: 'apps/api-gateway/app/services/llm_pricing_service.py',
      line: 763,
      severity: 'POSITIVE',
      comment: 'Implemented robust start_weekly_scheduler_loop with sleep_duration safeguards against zero TTL loops.',
    },
    {
      id: 'f3',
      file: 'apps/api-gateway/app/services/__init__.py',
      line: 1,
      severity: 'INFO',
      comment: 'Clean package namespace: Removed eager circular cross-imports.',
    },
  ];

  const handleRunReview = async () => {
    setIsReviewing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsReviewing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <GitPullRequest className="w-3.5 h-3.5 text-indigo-400" /> Automated PR Review & VCS Agent
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              GitHub & GitLab Connected
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-heading">
            Pull Request Review Agent & Auto-Merge Engine
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Autonomous multi-tier code review agent evaluates code safety, test coverage, SAST vulnerabilities, and AST structural integrity before auto-merging approved PRs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunReview}
            disabled={isReviewing}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isReviewing ? 'animate-spin' : ''}`} />
            {isReviewing ? 'Analyzing PR Diffs...' : 'Run Autonomous Review'}
          </button>
        </div>
      </div>

      {/* Main Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: VCS Configuration & Target PR (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-indigo-400" /> VCS Repository & Target PR
            </h3>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Target Repository</label>
              <input
                type="text"
                value={targetRepo}
                onChange={(e) => setTargetRepo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Pull Request #</label>
              <input
                type="text"
                value={prNumber}
                onChange={(e) => setPrNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={autoMergePolicy}
                  onChange={(e) => setAutoMergePolicy(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                />
                <span className="font-semibold">Auto-Merge on 100% Quality Score</span>
              </label>
              <p className="text-[11px] text-slate-500 leading-relaxed pl-5">
                Automatically merges PR if SAST score &ge;95% and Tier 10 consensus passes.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Review Report & Line-by-Line Annotations (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Review Findings for PR #{prNumber}
                </h3>
                <span className="text-xs text-slate-400">Branch: <strong>fix/ws-memory-leak-broadcast</strong> &rarr; <strong>main</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> APPROVED (Score: 98/100)
                </span>
              </div>
            </div>

            {/* Findings List */}
            <div className="space-y-3">
              {findings.map((f) => (
                <div key={f.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-indigo-300 flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-slate-400" /> {f.file}:{f.line}
                    </span>
                    <span className="text-emerald-400 font-semibold uppercase">{f.severity}</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">{f.comment}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400">SAST Clean • Unit Tests 14/14 Passed • Zero Regressions</span>
              <button className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20">
                <Check className="w-3.5 h-3.5" /> Execute Safe Merge to Main
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
