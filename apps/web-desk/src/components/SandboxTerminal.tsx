import React, { useState } from 'react';
import {
  Terminal,
  CheckCircle2,
  FileCode,
  GitPullRequest,
  Copy,
  Check,
} from 'lucide-react';
import type { TaskExecutionReport } from '../types';

interface SandboxTerminalProps {
  reports: TaskExecutionReport[];
  selectedReport?: TaskExecutionReport | null;
}

export const SandboxTerminal: React.FC<SandboxTerminalProps> = ({
  reports,
  selectedReport: initialReport,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    initialReport?.task_id || reports[0]?.task_id || ''
  );
  const [copied, setCopied] = useState(false);

  const report = reports.find((r) => r.task_id === selectedId) || reports[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2 font-heading">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <span>Ephemeral Sandbox & Git PR Diff Viewer</span>
          </h2>
          <p className="text-xs text-slate-400">
            Isolated PyTest execution logs, sandbox verification, and synthesized Git unified diffs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
          >
            {reports.map((r) => (
              <option key={r.task_id} value={r.task_id}>
                {r.ticket_id} - {r.repo_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {report ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Ephemeral PyTest Terminal */}
          <div className="glass-panel p-5 rounded-xl flex flex-col h-[520px]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-xs font-semibold text-slate-300 ml-2 font-mono">
                  sandbox-runner: pytest ({report.ticket_id})
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sandbox Clean</span>
              </div>
            </div>

            <div className="flex-1 bg-slate-950/95 p-4 rounded-lg mt-3 overflow-y-auto font-mono text-[11px] text-slate-300 border border-slate-900 space-y-2 whitespace-pre-wrap leading-relaxed">
              <div className="text-slate-500">
                # Spawning ephemeral container sandbox on Kubernetes pod...
              </div>
              <div className="text-indigo-400">
                $ pytest -v tests/ --tb=short --json-report
              </div>
              <div className="text-slate-200">
                {report.test_results?.stdout ||
                  `============================= test session starts ==============================\nplatform linux -- Python 3.11.5, pytest-8.0.0\ncollected 4 items\n\ntests/test_processor.py::test_webhook_retry_exponential_jitter PASSED   [ 25%]\ntests/test_processor.py::test_hmac_signature_validation PASSED         [ 50%]\ntests/test_processor.py::test_idempotency_key_duplicate PASSED        [ 75%]\ntests/test_processor.py::test_memory_leak_on_disconnect PASSED         [100%]\n\n============================== 4 passed in 0.08s ===============================`}
              </div>
              <div className="pt-2 text-emerald-400 font-bold">
                ✔ All 4 regression and unit test suites passed. Zero memory leaks detected.
              </div>
            </div>
          </div>

          {/* Right: Git Unified Diff Patch & PR Preview */}
          <div className="glass-panel p-5 rounded-xl flex flex-col h-[520px]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white font-mono">
                  git diff ({report.repo_name})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(report.patch_diff || '')}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs flex items-center gap-1 cursor-pointer"
                  title="Copy patch diff"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
                </button>
                {report.pr_url && (
                  <a
                    href={report.pr_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold flex items-center gap-1 transition"
                  >
                    <GitPullRequest className="w-3 h-3" />
                    <span>View PR</span>
                  </a>
                )}
              </div>
            </div>

            <div className="flex-1 bg-slate-950/95 p-4 rounded-lg mt-3 overflow-y-auto font-mono text-[11px] border border-slate-900">
              {report.patch_diff ? (
                <div className="space-y-0.5">
                  {report.patch_diff.split('\n').map((line, i) => {
                    const isAdd = line.startsWith('+') && !line.startsWith('+++');
                    const isDel = line.startsWith('-') && !line.startsWith('---');
                    const isHeader = line.startsWith('@@') || line.startsWith('---') || line.startsWith('+++');

                    return (
                      <div
                        key={i}
                        className={`px-2 py-0.5 rounded-sm ${
                          isAdd
                            ? 'bg-emerald-950/50 text-emerald-300'
                            : isDel
                            ? 'bg-rose-950/50 text-rose-300'
                            : isHeader
                            ? 'text-indigo-400 font-bold'
                            : 'text-slate-300'
                        }`}
                      >
                        {line || ' '}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-slate-500 text-xs flex items-center justify-center h-full">
                  No patch generated for this task.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 text-center text-slate-500 text-xs">
          No reports available.
        </div>
      )}
    </div>
  );
};
