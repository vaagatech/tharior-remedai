import { useState } from 'react';
import {
  ListTodo,
  Play,
  Filter,
  MessageSquare,
  ArrowUpRight,
  DollarSign,
  Layers,
  Bot,
  Search,
  GitBranch,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';
import type { BacklogStory } from '../types';

export function IssueBacklogDesk() {
  const { stories, pickAndRemediateStory, addStoryComment } = useRemedaiStore();
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newCommentText, setNewCommentText] = useState<{ [storyId: string]: string }>({});
  const [activeCommentBox, setActiveCommentBox] = useState<string | null>(null);

  const filteredStories = stories.filter((story) => {
    if (filterSource !== 'all' && story.source !== filterSource) return false;
    if (filterPriority !== 'all' && story.priority !== filterPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        story.title.toLowerCase().includes(q) ||
        story.key.toLowerCase().includes(q) ||
        story.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSourceBadge = (source: BacklogStory['source']) => {
    switch (source) {
      case 'github':
        return <span className="text-[10px] font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded">GITHUB</span>;
      case 'gitlab':
        return <span className="text-[10px] font-bold text-orange-400 bg-orange-950/40 px-1.5 py-0.5 rounded">GITLAB</span>;
      case 'jira':
        return <span className="text-[10px] font-bold text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded">JIRA</span>;
      case 'linear':
        return <span className="text-[10px] font-bold text-purple-400 bg-purple-950/40 px-1.5 py-0.5 rounded">LINEAR</span>;
    }
  };

  const getPriorityBadge = (priority: BacklogStory['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'LOW':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const handleCommentSubmit = (storyId: string) => {
    const text = newCommentText[storyId];
    if (!text || !text.trim()) return;
    addStoryComment(storyId, 'Autonomous Agent', text);
    setNewCommentText((prev) => ({ ...prev, [storyId]: '' }));
    setActiveCommentBox(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <ListTodo className="w-3.5 h-3.5 text-indigo-400" /> Automated Issue & Backlog Picker
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Webhook Listener Active
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-heading">
            Issue Tracker Integration & Autonomous Story Execution
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Live backlog stream from GitHub, GitLab, Jira, and Linear. Autonomous agents monitor assigned stories, execute 1-click self-healing fixes, update comments, and open pull requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-400">Total Backlog Items</div>
            <div className="text-xl font-bold text-indigo-300">{stories.length} Stories</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by story key, title, or keywords..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Source:</span>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Sources</option>
              <option value="github">GitHub Issues</option>
              <option value="gitlab">GitLab Issues</option>
              <option value="jira">Jira Software</option>
              <option value="linear">Linear</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Priority:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Story Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStories.map((story) => (
          <div
            key={story.id}
            className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition flex flex-col justify-between space-y-4 relative group"
          >
            <div>
              {/* Top Card Meta */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {getSourceBadge(story.source)}
                  <span className="text-xs font-mono font-bold text-indigo-400">{story.key}</span>
                  <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                    <GitBranch className="w-3 h-3 text-slate-600" /> {story.repo}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityBadge(story.priority)}`}>
                    {story.priority}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      story.status === 'IN_PROGRESS'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : story.status === 'REVIEW'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : story.status === 'MERGED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {story.status}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition">
                {story.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                {story.description}
              </p>
            </div>

            {/* Middle Technical Specs */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px]">Agent: <strong>{story.assigned_agent || 'Unassigned'}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-cyan-400" />
                  {story.tier_needed.replace('tier_', 'T').replace('_', ' ')}
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <DollarSign className="w-3 h-3" />
                  ~${story.estimated_cost_usd}
                </span>
              </div>
            </div>

            {/* Actions & Comment Drawer */}
            <div className="space-y-2 pt-1 border-t border-slate-800/60">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveCommentBox(activeCommentBox === story.id ? null : story.id)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{story.comments_count} Comments</span>
                </button>

                <button
                  onClick={() => pickAndRemediateStory(story.id)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Auto-Pick & Remediate</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Inline Comment Box */}
              {activeCommentBox === story.id && (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 space-y-2 text-xs animate-in fade-in duration-150">
                  <textarea
                    value={newCommentText[story.id] || ''}
                    onChange={(e) =>
                      setNewCommentText({ ...newCommentText, [story.id]: e.target.value })
                    }
                    placeholder="Add story comment or instructions for the agent..."
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setActiveCommentBox(null)}
                      className="px-2.5 py-1 rounded text-[11px] text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleCommentSubmit(story.id)}
                      className="px-3 py-1 rounded text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-500"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
