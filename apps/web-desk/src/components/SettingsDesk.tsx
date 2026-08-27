import React, { useState } from 'react';
import {
  Settings,
  Key,
  Server,
  CheckCircle2,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';

export const SettingsDesk: React.FC = () => {
  const { addLiveEvent } = useRemedaiStore();

  const [apiGatewayUrl, setApiGatewayUrl] = useState('https://dev-api-gw.gateway.dev');
  const [openRouterKey, setOpenRouterKey] = useState('sk-or-v1-xxxxxxxxxxxxxxxxxxxx');
  const [s3StateBucket, setS3StateBucket] = useState('remedai-terraform-state-257984970292');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    addLiveEvent({
      type: 'MODEL_SYNC',
      title: 'Environment & Cloud Settings Updated',
      description: 'API Gateway endpoint and KMS secrets synchronized across cloud backends.',
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
            <h1 className="text-2xl font-bold text-slate-900">Settings & Cloud Infrastructure Config</h1>
          </div>
          <p className="text-slate-600 text-sm">
            Configure GKE backend API Gateway URLs, AWS S3 central state manifests, and OpenRouter weekly token credentials.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
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
              Settings saved and active.
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
