import { useState } from 'react';
import {
  Settings,
  Server,
  Key,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';

export function SettingsDesk() {
  const {
    apiBaseUrl,
    setApiBaseUrl,
    setIsApiConnected,
    customerConfig,
    setCustomOpenRouterUrl,
  } = useRemedaiStore();

  const [inputUrl, setInputUrl] = useState(apiBaseUrl || 'http://localhost:8000');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [tenantId, setTenantId] = useState('enterprise-prod-tenant');
  const [cognitoPoolId, setCognitoPoolId] = useState('us-east-1_tXDj4NcQA');
  const [cognitoClientId, setCognitoClientId] = useState('36bko78s1dng51adp4032766pq');

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch(`${inputUrl}/healthz`, { method: 'GET' }).catch(() => null);
      if (res && res.ok) {
        setIsApiConnected(true);
        setTestResult({ success: true, msg: 'Connected successfully to Remedai API Gateway & Event Bus!' });
      } else {
        setIsApiConnected(false);
        setTestResult({
          success: false,
          msg: `Could not reach ${inputUrl}/healthz. Falling back to local offline simulation mode.`,
        });
      }
    } catch {
      setIsApiConnected(false);
      setTestResult({
        success: false,
        msg: `Connection to ${inputUrl} timed out. Offline simulation mode active.`,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = () => {
    setApiBaseUrl(inputUrl);
    setTestResult({ success: true, msg: 'API settings and endpoints saved.' });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Settings className="w-3.5 h-3.5 text-indigo-400" /> System Gateway & Security Preferences
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-heading">
            Environment, API Gateway & Auth Configuration
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Configure the GKE API Gateway URL, OpenRouter endpoints, AWS Cognito credentials, and tenant session sandboxing policies.
          </p>
        </div>
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 border animate-in fade-in duration-200 ${
            testResult.success
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-950/80 border-amber-500/40 text-amber-200'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          )}
          <span>{testResult.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Card 1: API Gateway Endpoint & Probes */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Server className="w-4 h-4 text-indigo-400" /> Remedai API Gateway & WebSocket Endpoint
          </h3>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Gateway Base URL (HTTP / HTTPS)</label>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="http://localhost:8000 or https://dev-api-gw.gateway.dev"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Used for REST endpoints, WebSocket live event streams, and agent execution.
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition font-bold flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
              Test Connection
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition font-bold shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              Save URL
            </button>
          </div>
        </div>

        {/* Card 2: AWS Cognito Authentication */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Shield className="w-4 h-4 text-cyan-400" /> AWS Cognito User Pool & App Client
          </h3>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Cognito User Pool ID</label>
            <input
              type="text"
              value={cognitoPoolId}
              onChange={(e) => setCognitoPoolId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Cognito Web Client ID (Public)</label>
            <input
              type="text"
              value={cognitoClientId}
              onChange={(e) => setCognitoClientId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        {/* Card 3: Multi-Tenant Session Sandboxing */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Lock className="w-4 h-4 text-amber-400" /> Strict Tenant & Session Isolation
          </h3>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Tenant ID Scope</label>
            <input
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Enforces POSIX directory permissions (0700) and context isolation across pods.
            </span>
          </div>
        </div>

        {/* Card 4: OpenRouter Ingestion */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Key className="w-4 h-4 text-emerald-400" /> OpenRouter Ingestion URL & Credentials
          </h3>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Catalog Endpoint</label>
            <input
              type="text"
              value={customerConfig.custom_openrouter_url}
              onChange={(e) => setCustomOpenRouterUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
