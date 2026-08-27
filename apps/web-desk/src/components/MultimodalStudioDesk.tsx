import React, { useState } from 'react';
import {
  Sparkles,
  Mic,
  Video,
  Image,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';
import type { ModalityType } from '../types';

export const MultimodalStudioDesk: React.FC = () => {
  const { multimodalSpecs, addLiveEvent } = useRemedaiStore();
  const [selectedModality, setSelectedModality] = useState<ModalityType>('audio');
  const [prompt, setPrompt] = useState('Generate an executive architecture summary presentation with audio voiceover for the multi-tier LLM system.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationOutput, setGenerationOutput] = useState<string | null>(null);

  const activeSpec = multimodalSpecs.find((s) => s.modality === selectedModality);

  const handleGenerate = () => {
    setIsGenerating(true);
    setGenerationOutput(null);

    addLiveEvent({
      type: 'AGENT_DISPATCH',
      title: `Multimodal Agent Triggered: ${selectedModality.toUpperCase()}`,
      description: `Processing prompt with multimodal group ${activeSpec?.group_name}`,
      severity: 'info',
    });

    setTimeout(() => {
      setIsGenerating(false);
      if (selectedModality === 'audio') {
        setGenerationOutput('Audio synthesis ready: ElevenLabs Flash 2.5 voice stream rendered at 24kHz (Duration: 34s).');
      } else if (selectedModality === 'video') {
        setGenerationOutput('Video synthesis ready: Luma Ray 2 Flash rendered 720p UI reproduction walkthrough video.');
      } else if (selectedModality === 'image') {
        setGenerationOutput('Image synthesis ready: FLUX.1 Schnell generated architecture diagram schematic.');
      } else {
        setGenerationOutput('Presentation synthesis ready: Marp 12-slide deck with code blocks generated.');
      }
    }, 1800);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Multimodal Studio (Audio, Video & Decks)</h1>
          </div>
          <p className="text-slate-600 text-sm">
            Separate tiered groupings for audio voiceover, video reproduction clips, architecture diagrams, and executive presentation decks.
          </p>
        </div>
      </div>

      {/* Modality Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'audio', label: 'Audio & Voice', icon: Mic },
          { id: 'video', label: 'Video Remediation', icon: Video },
          { id: 'image', label: 'Diagrams & Images', icon: Image },
          { id: 'presentation', label: 'Presentation Decks', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedModality === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedModality(tab.id as ModalityType);
                setGenerationOutput(null);
              }}
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all cursor-pointer shadow-2xs ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-500/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-bold text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Modality Info & Execution Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-base">{activeSpec?.group_name}</h3>
            <p className="text-xs text-slate-600">{activeSpec?.description}</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-slate-700">Multimodal Prompt / Intent</label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? 'Generating Asset...' : 'Generate Multimodal Asset'}
          </button>

          {generationOutput && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{generationOutput}</span>
            </div>
          )}
        </div>

        {/* Tiers in this Modality */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h4 className="font-bold text-slate-900 text-sm">Configured Multimodal Tiers</h4>
          <div className="space-y-3">
            {activeSpec?.tiers.map((t) => (
              <div key={t.model_id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{t.name}</span>
                  <span className="text-[11px] font-mono font-semibold text-indigo-600">{t.cost_estimate}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">Model: {t.model_id}</div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {t.capabilities.map((cap) => (
                    <span key={cap} className="px-1.5 py-0.2 bg-white text-slate-600 rounded text-[10px] border border-slate-200">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
