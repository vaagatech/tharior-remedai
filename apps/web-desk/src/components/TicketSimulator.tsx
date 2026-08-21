import React, { useState } from 'react';
import {
  Send,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Paperclip,
} from 'lucide-react';

interface TicketSimulatorProps {
  onTicketSubmitted: () => void;
  onNavigateTab: (tab: any) => void;
}

export const TicketSimulator: React.FC<TicketSimulatorProps> = ({
  onTicketSubmitted,
  onNavigateTab,
}) => {
  const presets = [
    {
      name: '🚨 Ambiguous Webhook Retry (Triggers Clarification Desk)',
      source: 'jira',
      ticket_id: 'JIRA-9012',
      repo_name: 'org/payments-service',
      title: 'Payment webhook retry logic is broken on HTTP 504 [AMBIGUOUS]',
      description: 'Webhook delivery failures on 504 Gateway Timeout are failing silently. Retry policy unspecified. Need clarification required on backoff strategy and maximum retry attempts.',
      priority: 'high',
      tenant_group: 'payments-core',
      has_attachment: true,
    },
    {
      name: '⚡ Stripe Deserializer Bug (Mid-Tier Haiku Remediation)',
      source: 'github',
      ticket_id: 'GH-5510',
      repo_name: 'org/payments-service',
      title: 'Fix null pointer exception in Stripe webhook payload deserializer',
      description: 'Deserializer crashes when payload["id"] is missing or None. Add fallback key lookup and default event type initialization.',
      priority: 'medium',
      tenant_group: 'default',
      has_attachment: false,
    },
    {
      name: '🏛️ Distributed Lock Deadlock (Frontier Sonnet Architecture)',
      source: 'servicenow',
      ticket_id: 'SNOW-44120',
      repo_name: 'org/inventory-api',
      title: 'Refactor distributed lock manager and resolve deadlock under high concurrency',
      description: 'Multi-service concurrency race condition across Redis Redlock and PostgreSQL row-level locks causing deadlock spikes during peak load. Multi-file refactor required.',
      priority: 'critical',
      tenant_group: 'enterprise-infra',
      has_attachment: true,
    },
    {
      name: '📝 README Typo Fix (Nano Tier Zero-Cost Remediation)',
      source: 'gitlab',
      ticket_id: 'GL-1049',
      repo_name: 'org/auth-gateway',
      title: 'Fix typo in README documentation and comment formatting',
      description: 'Fix typo in the deployment guide section of README.md where "envirnoment" is misspelled.',
      priority: 'low',
      tenant_group: 'open-source',
      has_attachment: false,
    },
  ];

  const [formData, setFormData] = useState({
    source: 'jira',
    ticket_id: 'JIRA-9012',
    repo_name: 'org/payments-service',
    title: 'Payment webhook retry logic is broken on HTTP 504 [AMBIGUOUS]',
    description: 'Webhook delivery failures on 504 Gateway Timeout are failing silently. Retry policy unspecified. Need clarification required on backoff strategy and maximum retry attempts.',
    priority: 'high',
    tenant_group: 'payments-core',
  });

  const [includeAttachment, setIncludeAttachment] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const applyPreset = (preset: typeof presets[0]) => {
    setFormData({
      source: preset.source,
      ticket_id: preset.ticket_id,
      repo_name: preset.repo_name,
      title: preset.title,
      description: preset.description,
      priority: preset.priority,
      tenant_group: preset.tenant_group,
    });
    setIncludeAttachment(preset.has_attachment);
    setStatusMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);

    const attachments = includeAttachment
      ? [
          {
            filename: 'traceback_504.log',
            content_type: 'text/plain',
            bytes: btoa('Traceback (most recent call last):\n  File "processor.py", line 45, in retry_webhook\nHTTP 504 Gateway Timeout: Upstream node unreachable'),
          },
        ]
      : [];

    const payload = {
      ...formData,
      attachments,
      user_email: 'incident.engineer@enterprise.internal',
    };

    try {
      const res = await fetch('/api/v1/tickets/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': formData.tenant_group,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 202) {
        const data = await res.json();
        setStatusMessage({
          type: 'success',
          text: `Webhook Ingested (202 ACCEPTED)! Ticket ${data.ticket_id} queued for reactive processing.`,
        });
        onTicketSubmitted();
      } else {
        setStatusMessage({ type: 'error', text: 'Ingestion failed with status ' + res.status });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Error dispatching webhook: ' + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2 font-heading">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Inbound Ticket & Webhook Ingestion Simulator</span>
          </h2>
          <p className="text-xs text-slate-400">
            Simulate incoming webhooks from GitHub, GitLab, Jira, or ServiceNow to test Tiered Routing & the Clarity Gate
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Presets Sidebar */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Pre-built Test Scenarios
          </h3>

          <div className="space-y-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="w-full p-4 rounded-xl text-left glass-panel hover:bg-slate-800/50 border border-slate-800 transition group space-y-2 cursor-pointer"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200 group-hover:text-indigo-400 transition">
                    {p.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-semibold">
                    {p.source}
                  </span>
                  <span className="font-mono">{p.ticket_id}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Form Studio */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl border border-slate-800 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1.5">
                  Source Platform
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="jira">Jira Software</option>
                  <option value="github">GitHub Issues</option>
                  <option value="gitlab">GitLab Issues</option>
                  <option value="servicenow">ServiceNow Incident</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1.5">
                  Ticket / Issue ID
                </label>
                <input
                  type="text"
                  value={formData.ticket_id}
                  onChange={(e) => setFormData({ ...formData, ticket_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1.5">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={formData.repo_name}
                  onChange={(e) => setFormData({ ...formData, repo_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1.5">
                Issue Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1.5">
                Issue Description / Reproduction Steps
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1.5">
                  Tenant Boundary Group
                </label>
                <input
                  type="text"
                  value={formData.tenant_group}
                  onChange={(e) => setFormData({ ...formData, tenant_group: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase block mb-1.5">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Multimodal Attachment Toggle */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="text-xs font-semibold text-slate-200">Multimodal Attachment</span>
                  <p className="text-[10px] text-slate-400">Attach binary error log / stack trace for scratchpad extraction</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAttachment}
                  onChange={(e) => setIncludeAttachment(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Feedback message */}
            {statusMessage && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/50 border border-rose-500/40 text-rose-300'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => onNavigateTab('clarifications')}
                className="text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                Go to Clarification Desk →
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-6 py-2.5 rounded-lg flex items-center gap-2 font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Dispatching...' : 'Dispatch Inbound Webhook'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
