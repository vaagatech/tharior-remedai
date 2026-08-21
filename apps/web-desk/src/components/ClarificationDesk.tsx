import React, { useState } from 'react';
import {
  AlertCircle,
  Bot,
  Send,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import type { ClarificationSession } from '../types';

interface ClarificationDeskProps {
  sessions: ClarificationSession[];
  onRefresh: () => void;
  onSessionResolved?: () => void;
}

export const ClarificationDesk: React.FC<ClarificationDeskProps> = ({
  sessions,
  onRefresh,
  onSessionResolved,
}) => {
  const pendingSessions = sessions.filter((s) => s.status === 'WAITING_CLARIFICATION');
  const resolvedSessions = sessions.filter((s) => s.status !== 'WAITING_CLARIFICATION');

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    pendingSessions[0]?.session_id || sessions[0]?.session_id || ''
  );

  const activeSession = sessions.find((s) => s.session_id === selectedSessionId) || pendingSessions[0] || sessions[0];

  // User input answers map: { [questionId]: string }
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleOptionSelect = (qId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const handleTextChange = (qId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: text }));
  };

  const handleSubmit = async () => {
    if (!activeSession) return;
    setSubmitting(true);
    setSuccessMsg('');

    const formattedAnswers = activeSession.questions.map((q) => ({
      question_id: q.id,
      answer: answers[q.id] || q.suggested_options?.[0] || 'Default configuration accepted.',
    }));

    try {
      const res = await fetch(`/api/v1/clarification/${activeSession.session_id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: formattedAnswers,
          user_email: 'lead.engineer@enterprise.internal',
        }),
      });

      if (res.ok) {
        setSuccessMsg(`Autonomous Agent successfully resumed for ${activeSession.ticket_id}! Check execution traces.`);
        onRefresh();
        if (onSessionResolved) onSessionResolved();
      } else {
        alert('Failed to submit clarification');
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting clarification');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white font-heading">
                Clarity Verification Desk
              </h2>
              <p className="text-xs text-slate-400">
                Mandatory human-in-the-loop clarification gate for ambiguous requirements
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-slate-300 font-semibold">{pendingSessions.length} Pending Approval</span>
          </div>
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Refresh queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Sessions Queue Selector */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Verification Queue
          </h3>

          <div className="space-y-2">
            {pendingSessions.map((session) => (
              <div
                key={session.session_id}
                onClick={() => {
                  setSelectedSessionId(session.session_id);
                  setSuccessMsg('');
                }}
                className={`p-4 rounded-xl cursor-pointer transition border text-left ${
                  selectedSessionId === session.session_id
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                    : 'glass-panel hover:bg-slate-800/40 border-slate-800'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {session.ticket_id}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                    PAUSED
                  </span>
                </div>
                <h4 className="text-xs font-medium text-slate-200 line-clamp-1">{session.title}</h4>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">{session.repo_name}</p>
              </div>
            ))}

            {resolvedSessions.map((session) => (
              <div
                key={session.session_id}
                onClick={() => {
                  setSelectedSessionId(session.session_id);
                  setSuccessMsg('');
                }}
                className={`p-4 rounded-xl cursor-pointer transition border text-left opacity-75 hover:opacity-100 ${
                  selectedSessionId === session.session_id
                    ? 'bg-slate-900 border-emerald-500/50'
                    : 'glass-panel border-slate-800/60'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {session.ticket_id}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
                    RESOLVED
                  </span>
                </div>
                <h4 className="text-xs font-medium text-slate-300 line-clamp-1">{session.title}</h4>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">{session.repo_name}</p>
              </div>
            ))}

            {sessions.length === 0 && (
              <div className="glass-panel p-6 rounded-xl text-center text-slate-500 text-xs">
                No active clarification sessions in queue.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Interactive Clarification Session Studio */}
        <div className="lg:col-span-2 space-y-4">
          {activeSession ? (
            <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-6">
              {/* Ticket Details */}
              <div className="pb-4 border-b border-slate-800 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {activeSession.ticket_id}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{activeSession.repo_name}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1 font-heading">
                    {activeSession.title}
                  </h3>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <div className="flex items-center gap-1 justify-end text-indigo-400">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Slack & Teams Dispatched</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Tenant: {activeSession.tenant_group}</span>
                </div>
              </div>

              {/* Status Notice if resolved */}
              {activeSession.status !== 'WAITING_CLARIFICATION' && (
                <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-semibold">Clarification already provided and agent resumed.</p>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">
                      Instructions: {activeSession.resolved_context || 'Custom requirements injected.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Interactive Questions */}
              <div className="space-y-5">
                {activeSession.questions.map((q, idx) => (
                  <div key={q.id} className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                      <Bot className="w-4 h-4" />
                      <span>Question {idx + 1}:</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {q.question}
                    </p>

                    {/* Suggested Options Chips */}
                    {q.suggested_options && q.suggested_options.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {q.suggested_options.map((opt) => {
                          const isSelected =
                            answers[q.id] === opt || (!answers[q.id] && q.selected_option === opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              disabled={activeSession.status !== 'WAITING_CLARIFICATION'}
                              onClick={() => handleOptionSelect(q.id, opt)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border text-left cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30'
                                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                              } ${activeSession.status !== 'WAITING_CLARIFICATION' ? 'cursor-default' : ''}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Custom Textarea for additional instructions */}
                    <div className="pt-2">
                      <textarea
                        disabled={activeSession.status !== 'WAITING_CLARIFICATION'}
                        rows={2}
                        value={answers[q.id] || q.answer || ''}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        placeholder="Or provide custom engineering specifications / edge case rules..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Success Notification */}
              {successMsg && (
                <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Submit & Resume Button */}
              {activeSession.status === 'WAITING_CLARIFICATION' && (
                <div className="pt-2 flex justify-end">
                  <button
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Resuming Autonomous Agent...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit & Resume Autonomous Agent</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-xl text-center text-slate-400 space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold">Select a clarification session from the queue</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
