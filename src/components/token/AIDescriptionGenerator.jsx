import React, { useState } from 'react';
import { Sparkles, RefreshCw, Copy, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AIDescriptionGenerator({ 
  tokenName, 
  tokenSymbol, 
  tokenWebsite,
  onApplyDescription 
}) {
  const [generating, setGenerating] = useState(false);
  const [descriptions, setDescriptions] = useState([]);
  const [selectedTone, setSelectedTone] = useState('professional');
  const [copiedIndex, setCopiedIndex] = useState(null);

  const tones = [
    { value: 'professional', label: 'Professional', emoji: '💼' },
    { value: 'community', label: 'Community-Focused', emoji: '👥' },
    { value: 'innovative', label: 'Innovative', emoji: '🚀' },
    { value: 'fun', label: 'Fun & Engaging', emoji: '🎉' }
  ];

  const generateDescriptions = async () => {
    if (!tokenName || !tokenSymbol) {
      alert('Please enter token name and symbol first');
      return;
    }

    setGenerating(true);
    try {
      const prompt = `Generate 3 unique and compelling token descriptions for a cryptocurrency token with the following details:
      
Token Name: ${tokenName}
Token Symbol: ${tokenSymbol}
${tokenWebsite ? `Website: ${tokenWebsite}` : ''}

Tone: ${selectedTone}

Requirements:
- Each description should be 2-3 sentences long
- Make them unique from each other
- ${selectedTone === 'professional' ? 'Use professional, business-oriented language' : ''}
${selectedTone === 'community' ? 'Focus on community building and engagement' : ''}
${selectedTone === 'innovative' ? 'Emphasize innovation and cutting-edge technology' : ''}
${selectedTone === 'fun' ? 'Use playful, engaging language that excites users' : ''}
- Include the token name and symbol naturally
- Make them exciting but credible

Also generate 5 relevant tags/keywords for this token.

Format the response as JSON:
{
  "descriptions": ["description1", "description2", "description3"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            descriptions: {
              type: "array",
              items: { type: "string" }
            },
            tags: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setDescriptions(result.descriptions || []);
    } catch (error) {
      alert('Failed to generate descriptions: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">AI Description Generator</h3>
          <p className="text-xs text-slate-400">Generate compelling descriptions with AI</p>
        </div>
      </div>

      {/* Tone Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">Tone</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {tones.map(tone => (
            <button
              key={tone.value}
              onClick={() => setSelectedTone(tone.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                selectedTone === tone.value
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <span className="mr-1">{tone.emoji}</span>
              {tone.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateDescriptions}
        disabled={generating || !tokenName || !tokenSymbol}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 mb-4"
      >
        {generating ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate Descriptions
          </>
        )}
      </button>

      {/* Generated Descriptions */}
      {descriptions.length > 0 && (
        <div className="space-y-3">
          {descriptions.map((desc, index) => (
            <div key={index} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
              <div className="flex justify-between items-start gap-3 mb-2">
                <span className="text-xs font-semibold text-purple-400">Option {index + 1}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(desc, index)}
                    className="p-1.5 hover:bg-slate-600/50 rounded-lg transition"
                  >
                    {copiedIndex === index ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={() => onApplyDescription(desc)}
                    className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs font-medium transition"
                  >
                    Use This
                  </button>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}