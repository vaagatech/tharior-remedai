import { useState } from 'react';
import {
  Volume2,
  Video,
  Image as ImageIcon,
  FileText,
  Play,
  Download,
  Sparkles,
  Eye,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';

export function MultimodalStudioDesk() {
  const { multimodalSpecs } = useRemedaiStore();
  const [selectedModality, setSelectedModality] = useState<'audio' | 'video' | 'image' | 'presentation'>('image');
  const [prompt, setPrompt] = useState('Generate an interactive architecture diagram of the Tharior Remedai 10-tier dynamic routing engine with KEDA autoscaler.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArtifact, setGeneratedArtifact] = useState<{
    type: string;
    title: string;
    description: string;
    previewUrl?: string;
    meta: Record<string, string>;
  } | null>(null);

  const activeGroup = multimodalSpecs.find((s) => s.modality === selectedModality) || multimodalSpecs[0];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1400));
    setIsGenerating(false);

    if (selectedModality === 'image') {
      setGeneratedArtifact({
        type: 'image',
        title: 'Tharior Remedai 10-Tier Architecture Overview',
        description: 'Rendered full architectural component flow with Redis Semantic Cache, GKE Spot Node Pool, and KEDA ScaledObjects.',
        meta: { resolution: '2048x1152 px', model: 'Flux.1 Dev / Claude Vision', latency: '1.8s', cost: '$0.03' },
      });
    } else if (selectedModality === 'video') {
      setGeneratedArtifact({
        type: 'video',
        title: 'Remediation Workflow Walkthrough Demo (1080p)',
        description: 'Automated 15-second browser test execution video showing unit test passing and PR auto-creation.',
        meta: { duration: '15.0s', resolution: '1080p @ 60fps', model: 'Luma Ray 2', latency: '4.2s', cost: '$0.60' },
      });
    } else if (selectedModality === 'audio') {
      setGeneratedArtifact({
        type: 'audio',
        title: 'Voice Debugging Session Audio Summary',
        description: 'Synthesized voice summary of the WebSocket memory leak root cause and patch verification.',
        meta: { duration: '0:45s', format: 'MP3 320kbps', model: 'Whisper Turbo / ElevenLabs', latency: '650ms', cost: '$0.004' },
      });
    } else {
      setGeneratedArtifact({
        type: 'presentation',
        title: 'Autonomous Coding & Cost Efficiency Whitepaper.pptx',
        description: '8-slide executive presentation detailing 78% LLM cost reductions via 10-tier routing.',
        meta: { slides: '8 Slides', format: 'PPTX & Markdown', model: 'Claude 3.7 Technical Docs', latency: '1.2s', cost: '$0.05' },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Multimodal Model Studio
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Audio • Video • Image • Presentation
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-heading">
            Multimodal Generation & Media Intelligence Studio
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Synthesize video PR demos, voice debug audio summaries, technical architecture diagrams, and executive presentations using specialized multimodal models.
          </p>
        </div>
      </div>

      {/* Modality Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'image', label: 'Image & Diagrams', icon: ImageIcon, color: 'text-purple-400' },
          { key: 'video', label: 'Video & UI Demos', icon: Video, color: 'text-cyan-400' },
          { key: 'audio', label: 'Audio & Speech', icon: Volume2, color: 'text-amber-400' },
          { key: 'presentation', label: 'Presentations & Docs', icon: FileText, color: 'text-emerald-400' },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = selectedModality === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setSelectedModality(item.key as any);
                setGeneratedArtifact(null);
              }}
              className={`p-4 rounded-xl border transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-6 h-6 ${item.color}`} />
              <span className="text-xs font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Prompt & Model Configuration */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              {activeGroup.group_name} Prompt & Parameters
            </h3>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Synthesis Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Target Model Tier</label>
              <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                {activeGroup.tiers.map((t) => (
                  <option key={t.model_id} value={t.model_id}>
                    {t.name} ({t.cost_estimate})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  isGenerating
                    ? 'bg-indigo-700 text-indigo-200 cursor-not-allowed animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                {isGenerating ? 'Synthesizing Multimodal Artifact...' : 'Generate Artifact'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Rendered Artifact Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm min-h-[380px] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" /> Rendered Output Preview
              </h3>
              {generatedArtifact && (
                <button className="px-2.5 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              )}
            </div>

            {generatedArtifact ? (
              <div className="my-auto space-y-4 text-xs">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-3">
                  <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    {generatedArtifact.type === 'image' && <ImageIcon className="w-10 h-10 text-purple-400" />}
                    {generatedArtifact.type === 'video' && <Video className="w-10 h-10 text-cyan-400" />}
                    {generatedArtifact.type === 'audio' && <Volume2 className="w-10 h-10 text-amber-400" />}
                    {generatedArtifact.type === 'presentation' && <FileText className="w-10 h-10 text-emerald-400" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{generatedArtifact.title}</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      {generatedArtifact.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  {Object.entries(generatedArtifact.meta).map(([k, v]) => (
                    <div key={k} className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 capitalize">{k}: </span>
                      <strong className="text-slate-200">{v}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center my-auto text-slate-500 text-xs py-16 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-slate-600" />
                <p>No artifact generated yet.</p>
                <p className="text-[11px] text-slate-600">Select a modality and click Generate Artifact to synthesize media.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
