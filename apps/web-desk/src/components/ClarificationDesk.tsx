import React, { useState } from 'react';
import {
  HelpCircle,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';

export const ClarificationDesk: React.FC = () => {
  const { addLiveEvent } = useRemedaiStore();
  const [activeSession] = useState({
    id: 'clarify-882',
    question: 'Should Redis cache keys be partitioned with tenant ID prefix or globally shared across namespaces?',
    options: [
      'Tenant Isolated (e.g. {tenant_id}:cache:{key})',
      'Namespace Shared with HMAC signature',
      'Cluster Default Redis db 0',
    ],
    agent: 'Lead Architecture Agent',
    status: 'WAITING_INPUT',
  });

  const [selectedOption, setSelectedOption] = useState<string>('Tenant Isolated (e.g. {tenant_id}:cache:{key})');
  const [customComment, setCustomComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitResponse = () => {
    setSubmitted(true);
    addLiveEvent({
      type: 'AGENT_DISPATCH',
      title: 'Clarification Provided to Architecture Agent',
      description: `Tenant decision recorded: ${selectedOption}. Agent resumed execution loop.`,
      severity: 'info',
    });
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Clarifications & Architectural Interview Desk</h1>
          </div>
          <p className="text-slate-600 text-sm">
            Interactive ambiguity resolver. Agents pause when reaching critical design forks and request user confirmation before applying irreversible modifications.
          </p>
        </div>
      </div>

      {/* Active Question Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 max-w-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span className="font-bold text-xs uppercase text-slate-700 font-mono">Design Decision Fork</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Agent: {activeSession.agent}</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-bold text-slate-900 leading-snug">
            {activeSession.question}
          </h3>
          <p className="text-xs text-slate-500">
            Select an architectural preference below or provide a custom write-in response to resume the agent workflow.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {activeSession.options.map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedOption === opt
                  ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <input
                type="radio"
                name="clarification_opt"
                value={opt}
                checked={selectedOption === opt}
                onChange={() => setSelectedOption(opt)}
                className="text-indigo-600 focus:ring-indigo-500 border-slate-300 w-4 h-4"
              />
              <span className="text-xs font-semibold text-slate-800">{opt}</span>
            </label>
          ))}
        </div>

        {/* Custom Text Area */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase text-slate-600">Custom Architectural Constraints (Optional)</label>
          <textarea
            rows={3}
            placeholder="Add any specific security boundaries, compliance requirements, or performance thresholds..."
            value={customComment}
            onChange={(e) => setCustomComment(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        {/* Submit */}
        <div>
          {submitted ? (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3 text-xs text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Response submitted. Autonomous Agent resumed and updated AST specifications.</span>
            </div>
          ) : (
            <button
              onClick={handleSubmitResponse}
              className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Submit Decision & Resume Agent
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
