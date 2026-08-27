import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Network,
  GitBranch,
  CheckSquare,
  Square,
  Tag,
  X,
  Layers,
  Shield,
  Key,
  Lock,
  ExternalLink,
  ShieldCheck,
  RotateCw,
  Edit3,
  Trash2,
  Bot,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';
import type { GitAuthMethod, RepoAuthConfig, OnboardedRepo } from '../types';

export const RepoOnboardingDesk: React.FC = () => {
  const {
    onboardedRepos,
    activeRepo,
    onboardRepo,
    updateRepo,
    deleteRepo,
    selectRepo,
    startIndexingRepo,
    toggleRepoChecked,
    selectAllRepos,
    addRepoBranch,
    removeRepoBranch,
    batchIndexRepos,
    securityVault,
    rotateSecurityKeys,
    openInStudio,
    openInKnowledgeGraph,
  } = useRemedaiStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [repoName, setRepoName] = useState('');
  const [repoOwner, setRepoOwner] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [branchTags, setBranchTags] = useState<string[]>(['main', 'develop']);
  const [newBranchInput, setNewBranchInput] = useState('');
  const [provider, setProvider] = useState<'github' | 'gitlab' | 'bitbucket' | 'azure_devops' | 'custom_git'>('github');
  
  // Multi-Auth Methods
  const [authMethod, setAuthMethod] = useState<GitAuthMethod>('github_app');
  const [appId, setAppId] = useState('app_1092834');
  const [installationId, setInstallationId] = useState('inst_5893021');
  const [privateKeyPem, setPrivateKeyPem] = useState('');
  const [oauthIdentity, setOauthIdentity] = useState('github:org:vaagatech');
  const [accessToken, setAccessToken] = useState('');
  const [sshKey, setSshKey] = useState('');

  // Edit Repo State
  const [editingRepo, setEditingRepo] = useState<OnboardedRepo | null>(null);
  const [editModalTab, setEditModalTab] = useState<'general' | 'auth' | 'branches' | 'governance'>('general');
  const [editName, setEditName] = useState('');
  const [editOwner, setEditOwner] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editProvider, setEditProvider] = useState<'github' | 'gitlab' | 'bitbucket' | 'azure_devops' | 'custom_git'>('github');
  const [editDefaultBranch, setEditDefaultBranch] = useState('main');
  const [editBranchTags, setEditBranchTags] = useState<string[]>([]);
  const [editNewBranchInput, setEditNewBranchInput] = useState('');
  const [editAuthMethod, setEditAuthMethod] = useState<GitAuthMethod>('github_app');
  const [editAppId, setEditAppId] = useState('');
  const [editInstallationId, setEditInstallationId] = useState('');
  const [editPrivateKeyPem, setEditPrivateKeyPem] = useState('');
  const [editOauthIdentity, setEditOauthIdentity] = useState('');
  const [editAccessToken, setEditAccessToken] = useState('');
  const [editSshKey, setEditSshKey] = useState('');
  const [editWebhookUrl, setEditWebhookUrl] = useState('https://api.remedai.vaagatech.com/api/v1/webhooks/github');
  const [editWebhookSecret, setEditWebhookSecret] = useState('whsec_••••••••••••••••');

  // Delete Repo State
  const [deletingRepo, setDeletingRepo] = useState<OnboardedRepo | null>(null);

  // Quick inline branch adder state per card
  const [inlineBranchCardId, setInlineBranchCardId] = useState<string | null>(null);
  const [inlineBranchInput, setInlineBranchInput] = useState('');

  const handleStartEdit = (repo: OnboardedRepo) => {
    setEditingRepo(repo);
    setEditModalTab('general');
    setEditName(repo.name);
    setEditOwner(repo.owner || 'vaagatech');
    setEditUrl(repo.url);
    setEditProvider((repo.provider as any) || 'github');
    setEditDefaultBranch(repo.default_branch || 'main');
    setEditBranchTags(repo.selected_branches?.length ? [...repo.selected_branches] : [repo.default_branch || 'main']);
    setEditAuthMethod(repo.auth_type || 'github_app');
    setEditAppId(repo.auth_config?.app_id || 'app_1092834');
    setEditInstallationId(repo.auth_config?.installation_id || 'inst_5893021');
    setEditPrivateKeyPem(repo.auth_config?.private_key_preview || '');
    setEditOauthIdentity(repo.auth_config?.oauth_identity || 'github:org:vaagatech');
    setEditAccessToken(repo.auth_config?.encrypted_secret_preview ? 'ghp_••••••••••••••••' : '');
    setEditSshKey(repo.auth_config?.method === 'ssh_deploy_key' ? 'ssh-rsa ••••••••••••' : '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRepo) return;

    const finalBranches = Array.from(new Set([editDefaultBranch || 'main', ...editBranchTags]));

    const updatedAuthConfig: RepoAuthConfig = {
      ...editingRepo.auth_config,
      method: editAuthMethod,
      app_id: editAuthMethod === 'github_app' ? editAppId : undefined,
      installation_id: editAuthMethod === 'github_app' ? editInstallationId : undefined,
      private_key_preview: editAuthMethod === 'github_app' ? (editPrivateKeyPem || 'Default GitHub App Key') : undefined,
      oauth_identity: editAuthMethod === 'federated_oauth' ? editOauthIdentity : undefined,
      oauth_provider: editAuthMethod === 'federated_oauth' ? `${editProvider.toUpperCase()} Enterprise SSO` : undefined,
      encrypted_secret_preview: editAuthMethod === 'encrypted_pat' ? (editAccessToken || 'ghp_•••••••••••••••• [Double-Encrypted]') : (editSshKey ? 'ssh-rsa •••••••••••• [Double-Encrypted]' : undefined),
      encryption_layers: ['AES-256-GCM (Application DEK)', 'AWS KMS KEK (Envelope Encryption)'],
      kms_key_id: securityVault.kek_key_arn,
      kms_key_version: securityVault.active_kek_version,
      last_rotated_at: securityVault.last_rotation_timestamp,
      next_rotation_due: securityVault.next_scheduled_rotation,
      rotation_period_days: securityVault.auto_rotation_interval_days,
    };

    await updateRepo(editingRepo.id, {
      name: editName,
      owner: editOwner,
      url: editUrl,
      provider: editProvider,
      default_branch: editDefaultBranch || 'main',
      selected_branches: finalBranches,
      auth_type: editAuthMethod,
      auth_config: updatedAuthConfig,
    });

    setEditingRepo(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRepo) return;
    await deleteRepo(deletingRepo.id);
    setDeletingRepo(null);
  };

  const handleAddTag = (tagToAdd?: string) => {
    const tag = (tagToAdd || newBranchInput).trim();
    if (!tag) return;
    if (!branchTags.includes(tag)) {
      setBranchTags([...branchTags, tag]);
    }
    setNewBranchInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (branchTags.length <= 1) return;
    setBranchTags(branchTags.filter((t) => t !== tagToRemove));
  };

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl || !repoName) return;

    const def = defaultBranch || 'main';
    const finalBranches = Array.from(new Set([def, ...branchTags]));

    const authConfig: RepoAuthConfig = {
      method: authMethod,
      app_id: authMethod === 'github_app' ? appId : undefined,
      installation_id: authMethod === 'github_app' ? installationId : undefined,
      private_key_preview: authMethod === 'github_app' ? (privateKeyPem ? '-----BEGIN RSA PRIVATE KEY-----\n[Encrypted 2x with AWS KMS]\n-----END RSA PRIVATE KEY-----' : 'Default GitHub App Key') : undefined,
      oauth_identity: authMethod === 'federated_oauth' ? oauthIdentity : undefined,
      oauth_provider: authMethod === 'federated_oauth' ? `${provider.toUpperCase()} Enterprise SSO` : undefined,
      encrypted_secret_preview: authMethod === 'encrypted_pat' ? (accessToken ? 'ghp_•••••••••••••••• [Double-Encrypted]' : undefined) : (sshKey ? 'ssh-rsa •••••••••••• [Double-Encrypted]' : undefined),
      encryption_layers: ['AES-256-GCM (Application DEK)', 'AWS KMS KEK (Envelope Encryption)'],
      kms_key_id: securityVault.kek_key_arn,
      kms_key_version: securityVault.active_kek_version,
      last_rotated_at: securityVault.last_rotation_timestamp,
      next_rotation_due: securityVault.next_scheduled_rotation,
      rotation_period_days: securityVault.auto_rotation_interval_days,
    };

    onboardRepo({
      name: repoName,
      owner: repoOwner || 'vaagatech',
      provider: provider,
      url: repoUrl,
      default_branch: def,
      selected_branches: finalBranches,
      available_branches: Array.from(new Set([...finalBranches, 'staging', 'release/v2.0'])),
      auth_type: authMethod,
      auth_config: authConfig,
    });

    setShowAddModal(false);
    setRepoUrl('');
    setRepoName('');
    setRepoOwner('');
    setDefaultBranch('main');
    setBranchTags(['main', 'develop']);
    setAccessToken('');
    setPrivateKeyPem('');
    setSshKey('');
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
            <h1 className="text-2xl font-bold text-slate-900">Repository Onboarding & Enterprise Authentication</h1>
          </div>
          <p className="text-slate-600 text-sm">
            Install as <strong>GitHub App</strong>, connect via <strong>Federated OAuth</strong>, or use <strong>KMS Double-Encrypted API Keys</strong> with automated key rotation.
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

      {/* Security & Double-Encryption Status Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl mt-0.5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Paramount Security: 2x Double Envelope Encryption Active</h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-300">
                  AES-256-GCM + AWS KMS
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                All API keys, GitHub App private keys (.pem), and tokens are encrypted twice before persistence. Zero plaintext storage.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-mono mt-2">
                <span>KMS Key ARN: <strong className="text-slate-700">{securityVault.kek_key_arn}</strong></span>
                <span>Active Version: <strong className="text-indigo-600">v{securityVault.active_kek_version}</strong></span>
                <span>Next Auto-Rotation: <strong className="text-slate-700">{new Date(securityVault.next_scheduled_rotation).toLocaleDateString()}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => rotateSecurityKeys()}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Rotate KMS Keys Now</span>
            </button>
          </div>
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
            const authCfg = repo.auth_config;

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
                <div className="flex items-start justify-between gap-3 mb-3">
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

                {/* Authentication & Encryption Badge */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-bold text-slate-700">Auth:</span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-semibold text-slate-800 text-[11px]">
                      {repo.auth_type === 'github_app'
                        ? 'GitHub App (Full Webhook Control)'
                        : repo.auth_type === 'federated_oauth'
                        ? 'Federated OAuth / SSO'
                        : repo.auth_type === 'encrypted_pat'
                        ? 'Double-Encrypted PAT'
                        : 'SSH Deploy Key'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <Lock className="w-3 h-3" />
                    <span>2x Encrypted (v{authCfg?.kms_key_version || securityVault.active_kek_version})</span>
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
                    Rotation Due:{' '}
                    {authCfg?.next_rotation_due
                      ? new Date(authCfg.next_rotation_due).toLocaleDateString()
                      : 'Active'}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      title="Open in Agent Studio"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInStudio(`Refactor, optimize and review AST code symbols in ${repo.name}`, repo.name);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 rounded-lg font-medium transition-all cursor-pointer shadow-2xs"
                    >
                      <Bot className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Studio</span>
                    </button>

                    <button
                      type="button"
                      title="Inspect AST Knowledge Graph"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInKnowledgeGraph(repo.id);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 rounded-lg font-medium transition-all cursor-pointer shadow-2xs"
                    >
                      <Network className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Graph</span>
                    </button>

                    <button
                      type="button"
                      title="Re-Index AST Graph"
                      onClick={(e) => {
                        e.stopPropagation();
                        startIndexingRepo(repo.id);
                      }}
                      disabled={repo.status === 'INDEXING'}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-medium transition-all cursor-pointer shadow-2xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${repo.status === 'INDEXING' ? 'animate-spin' : ''}`} />
                      <span>Index</span>
                    </button>

                    <button
                      type="button"
                      title="Edit Repository Settings"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(repo);
                      }}
                      className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      title="Delete Repository"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingRepo(repo);
                      }}
                      className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Repository & Authentication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Onboard Source Repository</h3>
                  <p className="text-xs text-slate-500">Choose authentication method & branch cloud tags</p>
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
              {/* Git Provider Selection */}
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

              {/* Authentication Approach Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-slate-700 flex items-center justify-between">
                  <span>Authentication & Access Method</span>
                  <span className="text-[10px] text-emerald-600 font-mono font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> 2x Envelope Encryption
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'github_app', label: 'GitHub App', desc: 'Full Webhook Control', icon: ShieldCheck },
                    { id: 'federated_oauth', label: 'Federated SSO', desc: 'OAuth2 & OIDC', icon: Key },
                    { id: 'encrypted_pat', label: 'Encrypted PAT', desc: 'Scoped API Token', icon: Lock },
                    { id: 'ssh_key', label: 'SSH Deploy Key', desc: 'RSA / Ed25519', icon: ExternalLink },
                  ].map((auth) => {
                    const Icon = auth.icon;
                    const isSelected = authMethod === auth.id;
                    return (
                      <button
                        type="button"
                        key={auth.id}
                        onClick={() => setAuthMethod(auth.id as GitAuthMethod)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer shadow-2xs ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <div className="font-bold text-xs">{auth.label}</div>
                        <div className="text-[10px] text-slate-500 truncate">{auth.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditional Auth Inputs */}
              {authMethod === 'github_app' && (
                <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-indigo-950">GitHub App Configuration</span>
                    <span className="text-[10px] font-mono text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200">
                      Permissions: Read & Write Code, PRs, Webhooks
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">GitHub App ID</label>
                      <input
                        type="text"
                        value={appId}
                        onChange={(e) => setAppId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Installation ID</label>
                      <input
                        type="text"
                        value={installationId}
                        onChange={(e) => setInstallationId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Private Key (.pem) — Encrypted 2x with AWS KMS
                    </label>
                    <textarea
                      rows={2}
                      placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                      value={privateKeyPem}
                      onChange={(e) => setPrivateKeyPem(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {authMethod === 'federated_oauth' && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Federated SSO Identity</span>
                    <span className="text-[10px] text-emerald-600 font-mono font-bold">OIDC Active</span>
                  </div>
                  <input
                    type="text"
                    value={oauthIdentity}
                    onChange={(e) => setOauthIdentity(e.target.value)}
                    placeholder="github:org:your-organization"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500">
                    Seamless organization-level federation. Tokens are minted just-in-time via AWS KMS OIDC exchange.
                  </p>
                </div>
              )}

              {authMethod === 'encrypted_pat' && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-semibold uppercase text-slate-600">Personal Access Token (PAT)</label>
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500">
                    Encrypted with local AES-256-GCM then wrapped with Cloud KMS KEK with 90-day automatic key rotation.
                  </p>
                </div>
              )}

              {authMethod === 'ssh_key' && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-semibold uppercase text-slate-600">SSH Private Key</label>
                  <textarea
                    rows={2}
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                    value={sshKey}
                    onChange={(e) => setSshKey(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none"
                  />
                </div>
              )}

              {/* Repo Details */}
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

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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

      {/* Edit Repository Configuration Modal (Comprehensive Multi-Tab) */}
      {editingRepo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Edit Repository Configuration</h3>
                  <p className="text-xs text-slate-500">Manage repository settings, multi-auth credentials, branch tags, and encryption vault</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRepo(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              {[
                { id: 'general', label: '1. General & Git' },
                { id: 'auth', label: '2. Multi-Auth & 2x KMS' },
                { id: 'branches', label: '3. Branch Cloud Tags' },
                { id: 'governance', label: '4. Webhooks & Automations' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEditModalTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    editModalTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Tab 1: General Info */}
              {editModalTab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Git Provider</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['github', 'gitlab', 'bitbucket', 'custom_git'] as const).map((p) => (
                        <button
                          type="button"
                          key={p}
                          onClick={() => setEditProvider(p)}
                          className={`px-3 py-2 text-xs font-medium rounded-lg border text-center uppercase cursor-pointer ${
                            editProvider === p
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {p === 'custom_git' ? 'Custom' : p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Repository Name</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Owner / Organization</label>
                      <input
                        type="text"
                        required
                        value={editOwner}
                        onChange={(e) => setEditOwner(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Git Clone URL</label>
                    <input
                      type="url"
                      required
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Default Branch</label>
                    <input
                      type="text"
                      required
                      value={editDefaultBranch}
                      onChange={(e) => setEditDefaultBranch(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Multi-Auth & 2x KMS Vault */}
              {editModalTab === 'auth' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Authentication Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'github_app', title: 'GitHub App (Full Org Control)', desc: 'Webhooks, App ID & RSA Key' },
                        { id: 'federated_oauth', title: 'Federated OAuth / SSO', desc: 'Enterprise Identity Federation' },
                        { id: 'encrypted_pat', title: 'Double-Encrypted PAT', desc: 'Scoped Access Token' },
                        { id: 'ssh_deploy_key', title: 'SSH Deploy Key', desc: 'Read/Write SSH Deploy Key' },
                      ].map((method) => (
                        <button
                          type="button"
                          key={method.id}
                          onClick={() => setEditAuthMethod(method.id as GitAuthMethod)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            editAuthMethod === method.id
                              ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-bold text-xs text-slate-900">{method.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{method.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {editAuthMethod === 'github_app' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">GitHub App ID</label>
                          <input
                            type="text"
                            value={editAppId}
                            onChange={(e) => setEditAppId(e.target.value)}
                            placeholder="app_1092834"
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">Installation ID</label>
                          <input
                            type="text"
                            value={editInstallationId}
                            onChange={(e) => setEditInstallationId(e.target.value)}
                            placeholder="inst_5893021"
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">Private Key (.pem) Preview</label>
                        <textarea
                          rows={3}
                          value={editPrivateKeyPem}
                          onChange={(e) => setEditPrivateKeyPem(e.target.value)}
                          placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 leading-tight"
                        />
                      </div>
                    </div>
                  )}

                  {editAuthMethod === 'federated_oauth' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <label className="block text-[11px] font-semibold uppercase text-slate-600">OAuth Enterprise Identity</label>
                      <input
                        type="text"
                        value={editOauthIdentity}
                        onChange={(e) => setEditOauthIdentity(e.target.value)}
                        placeholder="github:org:vaagatech"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                      />
                    </div>
                  )}

                  {editAuthMethod === 'encrypted_pat' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <label className="block text-[11px] font-semibold uppercase text-slate-600">Personal Access Token (PAT)</label>
                      <input
                        type="password"
                        value={editAccessToken}
                        onChange={(e) => setEditAccessToken(e.target.value)}
                        placeholder="ghp_••••••••••••••••"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                      />
                    </div>
                  )}

                  {editAuthMethod === 'ssh_deploy_key' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <label className="block text-[11px] font-semibold uppercase text-slate-600">SSH Private Deploy Key</label>
                      <textarea
                        rows={3}
                        value={editSshKey}
                        onChange={(e) => setEditSshKey(e.target.value)}
                        placeholder="ssh-rsa AAAAB3NzaC1yc2E..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 leading-tight"
                      />
                    </div>
                  )}

                  {/* KMS Envelope Encryption Vault Info */}
                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-emerald-800">
                      <Lock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Paramount Security: 2x Double Envelope Encryption Active</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-relaxed">
                      Application DEK (AES-256-GCM) + Cloud KMS KEK (<span className="font-mono">{securityVault.kek_key_arn.split('/').pop()}</span>). Active Key Version: <strong className="font-mono">v{securityVault.active_kek_version}</strong>. Next scheduled rotation in 90 days.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: Branch Cloud Tags & Presets */}
              {editModalTab === 'branches' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                      Indexed Branch Cloud Tags ({editBranchTags.length})
                    </label>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-1.5 items-center min-h-[48px]">
                      {editBranchTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-mono font-medium"
                        >
                          <GitBranch className="w-3 h-3" />
                          <span>{tag}</span>
                          {editBranchTags.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setEditBranchTags(editBranchTags.filter((t) => t !== tag))}
                              className="ml-1 text-indigo-400 hover:text-red-500 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}

                      <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                        <input
                          type="text"
                          placeholder="Add branch tag & enter..."
                          value={editNewBranchInput}
                          onChange={(e) => setEditNewBranchInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = editNewBranchInput.trim();
                              if (val && !editBranchTags.includes(val)) {
                                setEditBranchTags([...editBranchTags, val]);
                                setEditNewBranchInput('');
                              }
                            }
                          }}
                          className="w-full bg-transparent text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none px-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Quick Presets:</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {['main', 'develop', 'staging', 'release/v2.0', 'feature/ast-graph', 'infra-modules'].map((preset) => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => {
                            if (!editBranchTags.includes(preset)) {
                              setEditBranchTags([...editBranchTags, preset]);
                            }
                          }}
                          disabled={editBranchTags.includes(preset)}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                            editBranchTags.includes(preset)
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                          }`}
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Webhooks & Governance */}
              {editModalTab === 'governance' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Webhook Listener Endpoint</label>
                    <input
                      type="text"
                      value={editWebhookUrl}
                      onChange={(e) => setEditWebhookUrl(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Webhook Signing Secret</label>
                    <input
                      type="password"
                      value={editWebhookSecret}
                      onChange={(e) => setEditWebhookSecret(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                    />
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-slate-800">AST Indexing Policy</div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Automatic incremental AST parsing runs on each Git push webhook event. CPU and memory headroom are strictly governed under 75%.
                    </p>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  Target: <strong className="text-slate-800 font-mono">{editName}</strong>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingRepo(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                  >
                    Save All Repository Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Repository Confirmation Modal */}
      {deletingRepo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Delete Repository?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900 font-mono">{deletingRepo.name}</strong> from RemedAI? All indexed AST Knowledge Graph entities, symbol call maps, and cached vectors will be purged.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRepo(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm shadow-sm cursor-pointer transition-colors"
              >
                Delete Repository
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
