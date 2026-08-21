import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Bug,
  Zap,
  RotateCw,
  Clock,
  Code2,
} from 'lucide-react';

interface VulnerabilityFinding {
  finding_id: string;
  repo_name: string;
  file_path: string;
  line_number: number;
  severity: string;
  cwe_id: string;
  title: string;
  description: string;
  suggested_fix: string;
  auto_remediable: boolean;
}

interface SASTScanReport {
  scan_id: string;
  repo_name: string;
  tenant_id: string;
  files_scanned: number;
  findings_count: number;
  findings: VulnerabilityFinding[];
  scan_duration_ms: number;
  timestamp: number;
}

export function SecuritySASTDesk() {
  const [scans, setScans] = useState<SASTScanReport[]>([]);
  const [selectedScan, setSelectedScan] = useState<SASTScanReport | null>(null);
  const [scanning, setScanning] = useState(false);
  const [remediatingId, setRemediatingId] = useState<string | null>(null);

  const fetchScans = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/sast/scans');
      if (res.ok) {
        const data = await res.json();
        setScans(data);
        if (data.length > 0 && !selectedScan) {
          setSelectedScan(data[0]);
        }
      }
    } catch (e) {
      console.warn('SAST fetch error:', e);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const triggerScanNow = async () => {
    setScanning(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/sast/scan-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_name: 'org/payments-service' }),
      });
      if (res.ok) {
        const newReport = await res.json();
        setScans((prev) => [newReport, ...prev]);
        setSelectedScan(newReport);
      }
    } catch (e) {
      console.error('Scan error:', e);
    } finally {
      setScanning(false);
    }
  };

  const handleRemediate = async (finding: VulnerabilityFinding) => {
    setRemediatingId(finding.finding_id);
    try {
      await fetch('http://localhost:8000/api/v1/tickets/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': 'default',
        },
        body: JSON.stringify({
          ticket_id: `SEC-${finding.finding_id}`,
          source: 'sast_watcher',
          repo_name: finding.repo_name,
          title: `Security Patch: ${finding.title}`,
          description: `${finding.description}\n\nSuggested Remediation: ${finding.suggested_fix}`,
          user_email: 'security-bot@company.com',
          tenant_group: 'security-tier',
        }),
      });
    } catch (e) {
      console.error('Remediation error:', e);
    } finally {
      setRemediatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Background Repository Lint & SAST Watcher
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
                CWE / OWASP / RESOURCE LEAK SCANNER
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Proactive AST vulnerability detection, unclosed descriptors, and 1-click autonomous remediation PRs.
            </p>
          </div>
        </div>

        <button
          onClick={triggerScanNow}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning AST Knowledge Graph...' : 'Trigger Immediate SAST Scan'}
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scan Reports History */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Repository Scans ({scans.length})
          </h3>
          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {scans.map((scan) => (
              <div
                key={scan.scan_id}
                onClick={() => setSelectedScan(scan)}
                className={`p-3 rounded-xl cursor-pointer transition-all border text-xs font-mono ${
                  selectedScan?.scan_id === scan.scan_id
                    ? 'bg-rose-950/40 border-rose-500/50 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">{scan.repo_name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                    {scan.findings_count} Vulns
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {new Date(scan.timestamp * 1000).toLocaleTimeString()}
                  </span>
                  <span>{scan.files_scanned} files scanned ({scan.scan_duration_ms}ms)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Findings List & Remediation Bench */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Bug className="w-4 h-4 text-rose-400" />
              Detected Vulnerabilities & Resource Leaks ({selectedScan?.findings.length || 0})
            </h3>
            {selectedScan && (
              <span className="text-xs text-slate-400 font-mono">
                Scan ID: <span className="text-indigo-400">{selectedScan.scan_id}</span>
              </span>
            )}
          </div>

          <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
            {selectedScan?.findings.map((finding) => (
              <div
                key={finding.finding_id}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        finding.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : finding.severity === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {finding.severity}
                    </span>
                    <span className="text-xs font-bold text-white">{finding.title}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{finding.cwe_id}</span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed font-sans">{finding.description}</p>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Code2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>File: <strong className="text-slate-200">{finding.file_path}:{finding.line_number}</strong></span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-emerald-300">
                  <strong>Suggested AST Fix:</strong> {finding.suggested_fix}
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleRemediate(finding)}
                    disabled={remediatingId === finding.finding_id}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {remediatingId === finding.finding_id
                      ? 'Dispatching Autonomous Agent...'
                      : 'Trigger Remediation Ticket'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
