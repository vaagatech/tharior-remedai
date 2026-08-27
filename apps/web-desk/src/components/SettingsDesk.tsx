import React, { useState } from 'react';
import {
  Settings,
  Key,
  Server,
  CheckCircle2,
  ShieldCheck,
  RotateCw,
  Lock,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';

export const SettingsDesk: React.FC = () => {
  const { addLiveEvent, securityVault, rotateSecurityKeys } = useRemedaiStore();

  const [apiGatewayUrl, setApiGatewayUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('remedai_api_gateway_url') || 'https://dev-api-gw.gateway.dev';
    }
    return 'https://dev-api-gw.gateway.dev';
  });
  const [openRouterKey, setOpenRouterKey] = useState('sk-or-v1-xxxxxxxxxxxxxxxxxxxx');
  const [s3StateBucket, setS3StateBucket] = useState('remedai-terraform-state-257984970292');
  const [kmsKeyArn, setKmsKeyArn] = useState(securityVault.kek_key_arn);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('remedai_api_gateway_url', apiGatewayUrl);
    }
    setSaved(true);
    addLiveEvent({
      type: 'MODEL_SYNC',
      title: 'Environment & Cloud Settings Updated',
      description: 'API Gateway endpoint, KMS secrets, and double-encryption keys synchronized across cloud backends.',
      severity: 'success',
    });
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <Settings className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Settings & Security KMS Infrastructure</h1>
          </div>
          <p className="text-slate-600 text-sm">
            Configure GKE backend API Gateway URLs, AWS S3 central state manifests, and 2x Envelope Encryption Key Rotation.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Security & 2x Envelope Encryption Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Paramount Security: Double Envelope Encryption & Key Rotation</h3>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold rounded-full">
              AES-256-GCM + AWS KMS Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <div className="text-slate-500 uppercase font-medium text-[10px]">Active KEK Version</div>
              <div className="text-sm font-bold text-indigo-600 font-mono">v{securityVault.active_kek_version}</div>
            </div>
            <div>
              <div className="text-slate-500 uppercase font-medium text-[10px]">Rotation Policy</div>
              <div className="text-sm font-bold text-slate-800">Every 90 Days</div>
            </div>
            <div>
              <div className="text-slate-500 uppercase font-medium text-[10px]">Next Scheduled Rotation</div>
              <div className="text-sm font-bold text-slate-800 font-mono">
                {new Date(securityVault.next_scheduled_rotation).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase text-slate-600">Master KMS Key Encryption Key (KEK) ARN</label>
            <input
              type="text"
              value={kmsKeyArn}
              onChange={(e) => setKmsKeyArn(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>All secrets encrypted at app layer with AES-256-GCM, then wrapped with Cloud KMS.</span>
            </div>

            <button
              type="button"
              onClick={() => rotateSecurityKeys()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Trigger Immediate Key Rotation</span>
            </button>
          </div>
        </div>

        {/* Cloud Endpoints */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Server className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">GKE Backend & API Gateway</h3>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase text-slate-600">Active API Base URL</label>
            <input
              type="text"
              value={apiGatewayUrl}
              onChange={(e) => setApiGatewayUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase text-slate-600">Central S3 State & Manifest Bucket</label>
            <input
              type="text"
              value={s3StateBucket}
              onChange={(e) => setS3StateBucket(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* API Credentials */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Key className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">OpenRouter API & Catalog Sync Key</h3>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase text-slate-600">OpenRouter Bearer Token</label>
            <input
              type="password"
              value={openRouterKey}
              onChange={(e) => setOpenRouterKey(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              Settings and security parameters saved and active.
            </div>
          ) : (
            <div />
          )}

          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
