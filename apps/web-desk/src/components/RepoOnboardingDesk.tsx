import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Network,
  GitBranch,
  ArrowRight,
  CheckSquare,
  Square,
  Tag,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';

export const RepoOnboardingDesk: React.FC = () => {
  const {
    onboardedRepos,
    activeRepo,
    onboardRepo,
    selectRepo,
    startIndexingRepo,
    toggleRepoChecked,
    selectAllRepos,
    addRepoBranch,
    removeRepoBranch,
    batchIndexRepos,
    setActiveTab,
  } = useRemedaiStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [repoName, setRepoName] = useState('');
  const [repoOwner, setRepoOwner] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [branchTags, setBranchTags] = useState<string[]>(['main', 'develop']);
  const [newBranchInput, setNewBranchInput] = useState('');
  const [provider, setProvider] = useState<'github' | 'gitlab' | 'bitbucket' | 'custom_git'>('github');
  const [authType] = useState<'pat' | 'ssh' | 'oauth'>('pat');
  const [accessToken, setAccessToken] = useState('');

  // Quick inline branch adder state per card
  const [inlineBranchCardId, setInlineBranchCardId] = useState<string | null>(null);
  const [inlineBranchInput, setInlineBranchInput] = useState('');

  const handleAddTag = (tagToAdd?: string) => {
    const tag = (tagToAdd || newBranchInput).trim();
    if (!tag) return;
    if (!branchTags.includes(tag)) {
      setBranchTags([...branchTags, tag]);
    }
    setNewBranchInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (branchTags.length <= 1) return; // Keep at least one branch
    setBranchTags(branchTags.filter((t) => t !== tagToRemove));
  };

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl || !repoName) return;

    // Ensure default branch and 'main' are included
    const def = defaultBranch || 'main';
    const finalBranches = Array.from(new Set([def, ...branchTags]));

    onboardRepo({
      name: repoName,
      owner: repoOwner || 'vaagatech',
      provider: provider,
      url: repoUrl,
      default_branch: def,
      selected_branches: finalBranches,
      available_branches: Array.from(new Set([...finalBranches, 'staging', 'release/v2.0'])),
      auth_type: authType,
    });

    setShowAddModal(false);
    setRepoUrl('');
    setRepoName('');
    setRepoOwner('');
    setDefaultBranch('main');
    setBranchTags(['main', 'develop']);
    setAccessToken('');
  };

  const checkedRepos = onboardedRepos.filter((r) => r.is_checked);
  const allChecked = onboardedRepos.length > 0 && checkedRepos.length === onboardedRepos.length;
  const isAnyIndexing = onboardedRepos.some((r) => r.status === 'INDEXING');

  const totalSelectedBranches = checkedRepos.reduce(
    (acc, r) => acc + (r.selected_branches?.length || 1),
    0
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Repository Onboarding & Multi-Branch Indexing</h1>
          </div>
          <p className="text-slate-600 text-sm">
            Step 1: Connect multiple Git repositories with multi-select branch cloud tags (default: repo default & main). Step 2: Batch index AST symbol topologies for autonomous LLM routing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-all text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Onboard New Repository
          </button>
        </div>
      </div>

      {/* Workflow Step Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-indigo-500/30 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center gap-3 mb-2">
            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">1</span>
            <h3 className="font-semibold text-slate-900 text-sm">Multi-Repo & Branch Tags</h3>
          </div>
          <p className="text-xs text-slate-600">Connect repositories and assign cloud branch tags (e.g. main, dev, staging).</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">2</span>
            <h3 className="font-semibold text-slate-900 text-sm">Parallel AST Symbol Indexing</h3>
          </div>
          <p className="text-xs text-slate-600">Batch parse classes, methods, imports, and generate Knowledge Graph topologies.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">3</span>
            <h3 className="font-semibold text-slate-900 text-sm">Intelligent Code Remediation</h3>
          </div>
          <p className="text-xs text-slate-600">System autonomously routes prompts & issues to optimal LLMs based on multi-repo KG context.</p>
        </div>
      </div>

      {/* Batch Operations Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => selectAllRepos(!allChecked)}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            {allChecked ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Select All ({onboardedRepos.length} Repositories)</span>
          </button>

          {checkedRepos.length > 0 && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>
                {checkedRepos.length} Repos Selected • {totalSelectedBranches} Branch Cloud Tags
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => batchIndexRepos()}
            disabled={checkedRepos.length === 0 || isAnyIndexing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnyIndexing ? 'animate-spin' : ''}`} />
            <span>Batch Re-Index Selected ({checkedRepos.length})</span>
          </button>
        </div>
      </div>

      {/* Repositories Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Onboarded Repositories</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200">
              {onboardedRepos.length}
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {onboardedRepos.map((repo) => {
            const isSelected = activeRepo?.id === repo.id;
            const isChecked = !!repo.is_checked;
            const branches = repo.selected_branches?.length ? repo.selected_branches : [repo.default_branch || 'main'];

            return (
              <div
                key={repo.id}
                onClick={() => selectRepo(repo.id)}
                className={`bg-white rounded-2xl border transition-all p-6 cursor-pointer relative shadow-sm ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/15'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Top Bar: Checkbox + Name + Status */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRepoChecked(repo.id);
                      }}
                      className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{repo.name}</h3>
                        <span className="px-2 py-0.5 text-[11px] font-mono uppercase bg-slate-100 text-slate-600 rounded border border-slate-200">
                          {repo.provider}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-500 truncate max-w-xs">{repo.url}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {repo.status === 'INDEXED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        AST Indexed
                      </span>
                    )}
                    {repo.status === 'INDEXING' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Indexing AST...
                      </span>
                    )}
                    {repo.status === 'NOT_INDEXED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Not Indexed
                      </span>
                    )}
                  </div>
                </div>

                {/* Multi-Branch Cloud Tags Section */}
                <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                      <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Indexed Branch Cloud Tags ({branches.length})</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Default: {repo.default_branch}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {branches.map((branch) => {
                      const isDefault = branch === repo.default_branch;
                      return (
                        <span
                          key={branch}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border shadow-2xs ${
                            isDefault
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>{branch}</span>
                          {isDefault && (
                            <span className="px-1 py-0.2 bg-indigo-200/50 text-indigo-800 text-[9px] rounded font-sans font-bold">
                              Default
                            </span>
                          )}
                          {branches.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeRepoBranch(repo.id, branch);
                              }}
                              className="ml-1 text-slate-400 hover:text-red-500 cursor-pointer"
                              title="Remove branch tag"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      );
                    })}

                    {/* Inline Quick Branch Adder */}
                    {inlineBranchCardId === repo.id ? (
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="text"
                          autoFocus
                          placeholder="branch-name"
                          value={inlineBranchInput}
                          onChange={(e) => setInlineBranchInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (inlineBranchInput.trim()) {
                                addRepoBranch(repo.id, inlineBranchInput);
                                setInlineBranchInput('');
                                setInlineBranchCardId(null);
                              }
                            } else if (e.key === 'Escape') {
                              setInlineBranchCardId(null);
                            }
                          }}
                          className="px-2 py-0.5 bg-white border border-indigo-400 rounded text-xs font-mono text-slate-800 focus:outline-none w-28"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (inlineBranchInput.trim()) {
                              addRepoBranch(repo.id, inlineBranchInput);
                              setInlineBranchInput('');
                            }
                            setInlineBranchCardId(null);
                          }}
                          className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[11px] font-bold cursor-pointer"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInlineBranchCardId(null);
                          }}
                          className="text-slate-400 hover:text-slate-600 text-xs px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInlineBranchCardId(repo.id);
                          setInlineBranchInput('');
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-100 text-indigo-600 border border-dashed border-indigo-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Branch Tag</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Repo Stats Grid */}
                <div className="grid grid-cols-4 gap-3 py-3 px-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase font-medium">Files</div>
                    <div className="text-sm font-bold text-slate-800">{repo.stats.files_count || '--'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase font-medium">Lines of Code</div>
                    <div className="text-sm font-bold text-slate-800">
                      {repo.stats.lines_of_code?.toLocaleString() || '--'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase font-medium">AST Symbols</div>
                    <div className="text-sm font-bold text-slate-800">{repo.stats.symbols_count || '--'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase font-medium">KG Nodes</div>
                    <div className="text-sm font-bold text-indigo-600">{repo.stats.kg_nodes_count || '--'}</div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="text-[11px] text-slate-400">
                    Last indexed:{' '}
                    {repo.last_indexed_at ? new Date(repo.last_indexed_at).toLocaleTimeString() : 'Never'}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startIndexingRepo(repo.id);
                      }}
                      disabled={repo.status === 'INDEXING'}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-medium transition-all cursor-pointer shadow-2xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${repo.status === 'INDEXING' ? 'animate-spin' : ''}`} />
                      Re-Index AST
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectRepo(repo.id);
                        setActiveTab('knowledge-graph');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-medium transition-all cursor-pointer"
                    >
                      <Network className="w-3.5 h-3.5" />
                      Knowledge Graph
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Repository Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Onboard Source Repository</h3>
                  <p className="text-xs text-slate-500">Configure multi-branch cloud tags for parallel indexing</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Git Provider</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['github', 'gitlab', 'bitbucket', 'custom_git'] as const).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setProvider(p)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border text-center uppercase cursor-pointer ${
                        provider === p
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {p === 'custom_git' ? 'Custom' : p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Repository URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://github.com/vaagatech/my-service"
                  value={repoUrl}
                  onChange={(e) => {
                    setRepoUrl(e.target.value);
                    const parts = e.target.value.split('/');
                    if (parts.length >= 2) {
                      setRepoName(parts[parts.length - 1]?.replace('.git', '') || '');
                      setRepoOwner(parts[parts.length - 2] || '');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Repository Name</label>
                  <input
                    type="text"
                    required
                    placeholder="my-service"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Default Branch</label>
                  <input
                    type="text"
                    placeholder="main"
                    value={defaultBranch}
                    onChange={(e) => {
                      setDefaultBranch(e.target.value);
                      if (e.target.value && !branchTags.includes(e.target.value)) {
                        setBranchTags([e.target.value, ...branchTags.filter((t) => t !== 'main')]);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Multi-Branch Cloud Tags Component */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Branch Cloud Tags (Multi-Select)</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Default: repo default & main</span>
                </div>

                {/* Cloud Tag Pills Container */}
                <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-white border border-slate-200 rounded-xl min-h-[44px]">
                  {branchTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-mono font-semibold"
                    >
                      <GitBranch className="w-3 h-3" />
                      <span>{tag}</span>
                      {branchTags.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-indigo-400 hover:text-red-500 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}

                  <div className="flex items-center gap-1 flex-1 min-w-[130px]">
                    <input
                      type="text"
                      placeholder="Add branch tag & enter..."
                      value={newBranchInput}
                      onChange={(e) => setNewBranchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="w-full bg-transparent text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none px-1"
                    />
                    {newBranchInput.trim() && (
                      <button
                        type="button"
                        onClick={() => handleAddTag()}
                        className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold cursor-pointer"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                  <span>Quick Presets:</span>
                  {['main', 'develop', 'staging', 'release/v2.0', 'feature/ast-graph'].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => handleAddTag(preset)}
                      className={`px-2 py-0.5 rounded border text-[10px] font-mono cursor-pointer transition-colors ${
                        branchTags.includes(preset)
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                      }`}
                      disabled={branchTags.includes(preset)}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Auth Credentials (PAT / SSH Key)
                </label>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (Optional for public repos)"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono text-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  Credentials are encrypted and stored in secure tenant KMS secret vault.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm shadow-sm cursor-pointer"
                >
                  Confirm & Start Parallel Indexing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
