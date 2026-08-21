import { useState, useEffect } from 'react';
import {
  Globe,
  Camera,
  CheckCircle,
  RotateCw,
  Eye,
  ShieldCheck,
  Smartphone,
  Laptop,
} from 'lucide-react';

interface AccessibilityIssue {
  rule_id: string;
  impact: string;
  selector: string;
  message: string;
  help_url?: string;
}

interface VisualAuditReport {
  url: string;
  status_code: number;
  title: string;
  dom_elements_count: number;
  accessibility_score: number;
  accessibility_violations: AccessibilityIssue[];
  console_errors: string[];
  screenshot_svg: string;
  latency_ms: number;
}

export function BrowserPreviewDesk() {
  const [url, setUrl] = useState('http://localhost:5173');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<VisualAuditReport | null>(null);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  const runBrowserAudit = async (targetUrl: string = url) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/browser/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (e) {
      console.warn('Browser audit fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runBrowserAudit();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Autonomous Visual Browser Subagent
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                HEADLESS CHROMIUM MCP
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Live DOM inspector, rendered component snapshot, and WCAG 2.1 AA accessibility verification.
            </p>
          </div>
        </div>

        {/* URL Input & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-500">URL:</span>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-transparent text-slate-200 outline-none w-48 sm:w-64"
            />
          </div>
          <button
            onClick={() => runBrowserAudit()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Inspecting...' : 'Audit Viewport'}
          </button>
        </div>
      </div>

      {/* Main Viewport & Audit Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rendered Viewport Canvas */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 font-mono">
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>Rendered Viewport Preview ({report?.title || 'Loading...'})</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`p-1.5 rounded text-xs transition ${
                  deviceMode === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Desktop View"
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`p-1.5 rounded text-xs transition ${
                  deviceMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            className={`mx-auto transition-all rounded-xl border border-slate-800 overflow-hidden bg-slate-950 ${
              deviceMode === 'mobile' ? 'max-w-xs' : 'w-full'
            }`}
          >
            {report?.screenshot_svg ? (
              <div
                dangerouslySetInnerHTML={{ __html: report.screenshot_svg }}
                className="w-full overflow-hidden flex justify-center"
              />
            ) : (
              <div className="py-24 text-center text-slate-500 text-xs font-mono">
                <Camera className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-pulse" />
                Capturing visual snapshot from headless browser...
              </div>
            )}
          </div>

          {report && (
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2">
              <span>Status: <strong className="text-emerald-400">{report.status_code} OK</strong></span>
              <span>DOM Elements: <strong className="text-slate-200">{report.dom_elements_count}</strong></span>
              <span>Render Latency: <strong className="text-indigo-400">{report.latency_ms}ms</strong></span>
            </div>
          )}
        </div>

        {/* Accessibility & DOM Quality Scorecard */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Accessibility Scorecard
            </h3>
            {report && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold font-mono ${
                  report.accessibility_score >= 90
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                }`}
              >
                {report.accessibility_score}/100 WCAG 2.1
              </span>
            )}
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {report?.accessibility_violations.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-70" />
                100% WCAG Compliant. Zero accessibility violations detected.
              </div>
            ) : (
              report?.accessibility_violations.map((v, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">{v.rule_id}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        v.impact === 'critical' || v.impact === 'serious'
                          ? 'bg-rose-500/10 text-rose-300'
                          : 'bg-amber-500/10 text-amber-300'
                      }`}
                    >
                      {v.impact}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{v.message}</p>
                  <div className="text-[10px] text-slate-500 truncate">
                    Selector: <code className="text-indigo-300">{v.selector}</code>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
