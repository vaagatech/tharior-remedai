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
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';

export const RepoOnboardingDesk: React.FC = () => {
  const {
    onboardedRepos,
    activeRepo,
    onboardRepo,
    selectRepo,
    startIndexingRepo,
    setActiveTab,
  } = useRemedaiStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [repoName, setRepoName] = useState('');
  const [repoOwner, setRepoOwner] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [provider, setProvider] = useState<'github' | 'gitlab' | 'bitbucket' | 'custom_git'>('github');
  const [authType] = useState<'pat' | 'ssh' | 'oauth'>('pat');
  const [accessToken, setAccessToken] = useState('');

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl || !repoName) return;

    onboardRepo({
      name: repoName,
      owner: repoOwner || 'enterprise',
      provider: provider,
      url: repoUrl,
      default_branch: defaultBranch || 'main',
      auth_type: authType,
    });

    setShowAddModal(false);
    setRepoUrl('');
    setRepoName('');
    setRepoOwner('');
    setAccessToken('');
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Repository Onboarding & AST Indexing</h1>
          </div>
          <p className="text-slate-600 text-sm">
            Step 1: Connect your source repository. Step 2: Index AST symbol trees and generate the interactive Knowledge Graph.
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
            <h3 className="font-semibold text-slate-900 text-sm">Repository Onboarding</h3>
          </div>
          <p className="text-xs text-slate-600">Connect GitHub, GitLab, Bitbucket, or custom Git with secure OAuth/PAT.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">2</span>
            <h3 className="font-semibold text-slate-900 text-sm">AST & Symbol Indexing</h3>
          </div>
          <p className="text-xs text-slate-600">Parses classes, methods, imports, and builds the Repository Knowledge Graph.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">3</span>
            <h3 className="font-semibold text-slate-900 text-sm">Intelligent Remediation</h3>
          </div>
          <p className="text-xs text-slate-600">System autonomously routes prompts & issues to optimal LLMs based on KG context.</p>
        </div>
      </div>

      {/* Active Repositories List */}
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
            return (
              <div
                key={repo.id}
                onClick={() => selectRepo(repo.id)}
                className={`bg-white rounded-2xl border transition-all p-6 cursor-pointer relative shadow-sm ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{repo.name}</h3>
                      <span className="px-2 py-0.5 text-xs font-mono uppercase bg-slate-100 text-slate-600 rounded border border-slate-200">
                        {repo.provider}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-500 truncate max-w-sm">{repo.url}</p>
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

                {/* Repo Stats Grid */}
                <div className="grid grid-cols-4 gap-3 py-3 px-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase font-medium">Files</div>
                    <div className="text-sm font-bold text-slate-800">{repo.stats.files_count || '--'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase font-medium">Lines of Code</div>
                    <div className="text-sm font-bold text-slate-800">{repo.stats.lines_of_code?.toLocaleString() || '--'}</div>
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
                  <div className="flex items-center gap-2 text-slate-500">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>Branch: <strong className="text-slate-700">{repo.default_branch}</strong></span>
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
                      View Knowledge Graph
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Onboard Source Repository</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
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
                      className={`px-3 py-2 text-xs font-medium rounded-lg border text-center uppercase ${
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
                  placeholder="https://github.com/organization/my-repo"
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
                    placeholder="my-repo"
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
                    onChange={(e) => setDefaultBranch(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Auth Credentials (Personal Access Token / SSH Key)</label>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (Optional for public repos)"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono text-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1">Tokens are encrypted and stored in secure tenant KMS secret vault.</p>
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
                  Confirm & Start Indexing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
