import React, { useState } from 'react';
import {
  CheckSquare,
  Bot,
  CheckCircle2,
  RotateCw,
  GitBranch,
  MessageSquare,
  GitPullRequest,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';
import type { BacklogStory } from '../types';

export const IssueBacklogDesk: React.FC = () => {
  const {
    backlogStories,
    activeStory,
    selectStory,
    remediateStory,
    setActiveTab,
  } = useRemedaiStore();

  const [filterSource, setFilterSource] = useState<string>('all');
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  const filteredStories = backlogStories.filter((s) => {
    return filterSource === 'all' || s.source === filterSource;
  });

  const handleRemediate = async (story: BacklogStory) => {
    setIsProcessingId(story.id);
    await remediateStory(story.id);
    setIsProcessingId(null);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Issue Backlog & Autonomous Remediation</h1>
          </div>
          <p className="text-slate-600 text-sm">
            Listens for assigned issues/stories across GitHub, GitLab, Jira, and Linear. 1-click autonomous remediation with automated PR authoring and two-way comments.
          </p>
        </div>

        {/* Filter by Provider */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          {(['all', 'github', 'gitlab', 'jira', 'linear'] as const).map((src) => (
            <button
              key={src}
              onClick={() => setFilterSource(src)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase rounded-lg transition-all cursor-pointer ${
                filterSource === src
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {src}
            </button>
          ))}
        </div>
      </div>

      {/* Stories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Story List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {filteredStories.map((story) => {
            const isSelected = activeStory?.id === story.id;
            const isRunning = isProcessingId === story.id || story.status === 'IN_PROGRESS';

            return (
              <div
                key={story.id}
                onClick={() => selectStory(story)}
                className={`bg-white rounded-2xl border p-5 transition-all cursor-pointer shadow-sm ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-xs font-mono font-bold uppercase rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {story.source} • {story.key}
                    </span>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                        story.priority === 'CRITICAL'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : story.priority === 'HIGH'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {story.priority}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {story.status === 'BACKLOG' && (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full border border-slate-200">
                        Backlog
                      </span>
                    )}
                    {story.status === 'IN_PROGRESS' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200 animate-pulse">
                        <RotateCw className="w-3 h-3 animate-spin" />
                        Remediating...
                      </span>
                    )}
                    {story.status === 'REVIEW' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        PR Ready
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mb-1">{story.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 mb-3">{story.description}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-mono">
                      <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                      {story.branch}
                    </span>
                    <span>System Tier: <strong className="text-slate-700 font-mono">{story.tier_needed}</strong></span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemediate(story);
                    }}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-all cursor-pointer shadow-2xs"
                  >
                    {isRunning ? (
                      <>
                        <RotateCw className="w-3 h-3 animate-spin" />
                        Agent Working...
                      </>
                    ) : (
                      <>
                        <Bot className="w-3 h-3" />
                        Auto-Pick & Remediate
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Story Detail Panel (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          {activeStory ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-900 text-sm">{activeStory.key} Details</span>
                <span className="text-xs text-slate-400 font-mono uppercase">{activeStory.source}</span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">{activeStory.title}</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {activeStory.description}
                </p>
              </div>

              {activeStory.diff_preview && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase text-slate-600">Generated Unified Patch</div>
                  <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                    {activeStory.diff_preview}
                  </pre>
                </div>
              )}

              {activeStory.last_comment && (
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase text-slate-600 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    Automated Issue Comment Sync
                  </div>
                  <p className="text-xs text-indigo-900 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 font-sans">
                    {activeStory.last_comment}
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('pr-review')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                >
                  <GitPullRequest className="w-4 h-4" />
                  Inspect in PR Review Agent
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Select a story to inspect remediation logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
