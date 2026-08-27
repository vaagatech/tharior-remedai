import React, { useState } from 'react';
import {
  CheckSquare,
  Bot,
  CheckCircle2,
  RotateCw,
  GitBranch,
  MessageSquare,
  GitPullRequest,
  Plus,
  Network,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';
import type { BacklogStory } from '../types';

export const IssueBacklogDesk: React.FC = () => {
  const {
    backlogStories,
    activeStory,
    selectStory,
    remediateStory,
    addBacklogStory,
    deleteBacklogStory,
    openInStudio,
    openInKnowledgeGraph,
    setActiveTab,
    onboardedRepos,
  } = useRemedaiStore();

  const [filterSource, setFilterSource] = useState<string>('all');
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Story Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSource, setNewSource] = useState<'github' | 'gitlab' | 'jira' | 'linear'>('github');
  const [newPriority, setNewPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [newRepo, setNewRepo] = useState(onboardedRepos[0]?.name || 'vaagatech/tharior-remedai');
  const [newBranch, setNewBranch] = useState('main');

  const filteredStories = backlogStories.filter((s) => {
    return filterSource === 'all' || s.source === filterSource;
  });

  const handleRemediate = async (story: BacklogStory) => {
    setIsProcessingId(story.id);
    await remediateStory(story.id);
    setIsProcessingId(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addBacklogStory({
      source: newSource,
      key: `${newSource.toUpperCase().slice(0, 3)}-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      description: newDescription.trim() || newTitle.trim(),
      repo: newRepo,
      branch: newBranch || 'main',
      priority: newPriority,
      status: 'BACKLOG',
      tier_needed: newPriority === 'CRITICAL' ? 'tier_7_deep_reasoner' : 'tier_5_fast_reasoner',
      estimated_cost_usd: newPriority === 'CRITICAL' ? 0.0055 : 0.0028,
    });

    setShowCreateModal(false);
    setNewTitle('');
    setNewDescription('');
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

        <div className="flex flex-wrap items-center gap-3">
          {/* Create Story Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ingest New Issue</span>
          </button>

          {/* Filter by Provider */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
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

                  {/* Status Badge & Delete */}
                  <div className="flex items-center gap-2">
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

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBacklogStory(story.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete Story"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
                    <span>Target Repo: <strong className="text-slate-700 font-mono">{story.repo}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openInStudio(
                          `Remediate Backlog Story ${story.key}: ${story.title}\n\nContext & Description:\n${story.description}`,
                          story.repo,
                          [story.branch]
                        );
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      <span>Open in Studio</span>
                    </button>

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
                          Working...
                        </>
                      ) : (
                        <>
                          <Bot className="w-3 h-3" />
                          Auto-Remediate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredStories.length === 0 && (
            <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">No backlog stories found for provider "{filterSource}". Click "Ingest New Issue" to create one.</p>
            </div>
          )}
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

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    openInStudio(
                      `Remediate Issue ${activeStory.key}: ${activeStory.title}\n\n${activeStory.description}`,
                      activeStory.repo,
                      [activeStory.branch]
                    );
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                >
                  <Bot className="w-4 h-4" />
                  Remediate in Agent Studio
                </button>

                <button
                  onClick={() => {
                    const matchedRepo = onboardedRepos.find(r => r.name === activeStory.repo || activeStory.repo.includes(r.name));
                    if (matchedRepo) {
                      openInKnowledgeGraph(matchedRepo.id);
                    } else {
                      setActiveTab('knowledge-graph');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium rounded-xl text-xs transition-all cursor-pointer"
                >
                  <Network className="w-3.5 h-3.5 text-indigo-600" />
                  Inspect Affected AST in Knowledge Graph
                </button>

                <button
                  onClick={() => setActiveTab('pr-review')}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium rounded-xl text-xs transition-all cursor-pointer"
                >
                  <GitPullRequest className="w-3.5 h-3.5 text-emerald-600" />
                  Inspect in PR Review Desk
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

      {/* Ingest / Create Backlog Story Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Ingest New Issue / Story</h3>
                  <p className="text-xs text-slate-500">Add bug report or feature request for autonomous remediation</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Memory Leak in Redis Connection Pool"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Description & Failure Context</label>
                <textarea
                  rows={3}
                  placeholder="Describe error traces, reproducer steps, or requirements..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Provider Source</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="github">GitHub Issues</option>
                    <option value="gitlab">GitLab Issues</option>
                    <option value="jira">Jira Software</option>
                    <option value="linear">Linear App</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="CRITICAL">Critical (High Severity)</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Target Repository</label>
                  <select
                    value={newRepo}
                    onChange={(e) => setNewRepo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                  >
                    {onboardedRepos.map((r) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Target Branch</label>
                  <input
                    type="text"
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                >
                  Ingest & Queue for Remediation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
