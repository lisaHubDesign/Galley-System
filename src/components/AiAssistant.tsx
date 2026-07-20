import React, { useState } from 'react';
import { Sparkles, Loader2, RotateCcw, Check, BookOpen, PenTool, BrainCircuit } from 'lucide-react';
import { ArticleState } from '../types';

interface AiAssistantProps {
  articleState: ArticleState;
  onApplyAbstract: (abstract: string, keywords: string) => void;
  onApplyReferences: (referencesText: string) => void;
  onApplyToneParagraph: (originalText: string, polishedText: string) => void;
}

export default function AiAssistant({
  articleState,
  onApplyAbstract,
  onApplyReferences,
  onApplyToneParagraph
}: AiAssistantProps) {
  const [activeTab, setActiveTab] = useState<'abstract' | 'references' | 'tone'>('abstract');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab: Abstract generator state
  const [generatedAbstract, setGeneratedAbstract] = useState('');
  const [generatedKeywords, setGeneratedKeywords] = useState('');

  // Tab: Reference formatting state
  const [messyRefs, setMessyRefs] = useState('');
  const [formattedRefs, setFormattedRefs] = useState('');

  // Tab: Tone polisher state
  const [originalToneText, setOriginalToneText] = useState('');
  const [polishedToneText, setPolishedToneText] = useState('');

  const handleAiCall = async (action: string, text: string, context?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, text, context })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server returned an error.');
      }
      return data.result;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to contact the AI server. Is the development server running?');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAbstract = async () => {
    const context = {
      title: articleState.title,
      authors: articleState.authors,
      sections: articleState.sections.map(s => ({
        heading: s.heading,
        paragraphsCount: s.paragraphs.length,
        excerpt: s.paragraphs[0] || ''
      }))
    };

    const result = await handleAiCall('generate-abstract', 'Generate abstract please', context);
    if (result) {
      try {
        // Parse the JSON returned by Gemini
        const parsed = JSON.parse(result.replace(/```json|```/gi, '').trim());
        setGeneratedAbstract(parsed.abstract || '');
        setGeneratedKeywords(parsed.keywords || '');
      } catch (e) {
        // Fallback if not valid JSON
        setGeneratedAbstract(result);
        setGeneratedKeywords('');
      }
    }
  };

  const handleFormatReferences = async () => {
    const input = messyRefs || articleState.referencesText;
    if (!input.trim()) {
      setError('Please provide some references to format.');
      return;
    }
    const result = await handleAiCall('format-references', input);
    if (result) {
      setFormattedRefs(result);
    }
  };

  const handlePolishTone = async () => {
    if (!originalToneText.trim()) {
      setError('Please input a paragraph or draft block to polish.');
      return;
    }
    const result = await handleAiCall('academic-tone', originalToneText);
    if (result) {
      setPolishedToneText(result);
    }
  };

  return (
    <div className="bg-chrome-panel border border-line rounded-lg p-4 space-y-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
          <h3 className="font-semibold text-sm text-paper flex items-center gap-1.5">
            AI Academic Co-Writer
            <span className="bg-amber-500/10 text-amber-500 text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold border border-amber-500/20">
              Gemini Powered
            </span>
          </h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line/50 p-0.5 bg-chrome rounded-md">
        <button
          onClick={() => setActiveTab('abstract')}
          className={`flex-1 py-1.5 text-xs font-medium rounded transition flex items-center justify-center gap-1.5 ${
            activeTab === 'abstract' ? 'bg-chrome-panel text-paper shadow-sm' : 'text-muted hover:text-paper'
          }`}
        >
          <BrainCircuit className="h-3.5 w-3.5" /> Abstract Synth
        </button>
        <button
          onClick={() => setActiveTab('references')}
          className={`flex-1 py-1.5 text-xs font-medium rounded transition flex items-center justify-center gap-1.5 ${
            activeTab === 'references' ? 'bg-chrome-panel text-paper shadow-sm' : 'text-muted hover:text-paper'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" /> Ref Formatter
        </button>
        <button
          onClick={() => setActiveTab('tone')}
          className={`flex-1 py-1.5 text-xs font-medium rounded transition flex items-center justify-center gap-1.5 ${
            activeTab === 'tone' ? 'bg-chrome-panel text-paper shadow-sm' : 'text-muted hover:text-paper'
          }`}
        >
          <PenTool className="h-3.5 w-3.5" /> Tone Polisher
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-900/40 text-red-300 text-xs rounded space-y-1.5">
          <p className="font-semibold">Service Notification:</p>
          <p className="leading-relaxed">{error}</p>
          <p className="text-[10px] text-red-400">
            Make sure your `GEMINI_API_KEY` is loaded in the Secrets panel in AI Studio!
          </p>
        </div>
      )}

      {/* Tab: Abstract */}
      {activeTab === 'abstract' && (
        <div className="space-y-3.5 text-xs">
          <p className="text-muted leading-relaxed">
            Generate a concise academic abstract and keywords based on your draft's sections, titles, and structural headings.
          </p>

          <button
            onClick={handleGenerateAbstract}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 bg-amber-500 hover:bg-amber-600 text-chrome font-bold rounded shadow transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing sections & writing...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" /> Synthesize Abstract & Keywords
              </>
            )}
          </button>

          {generatedAbstract && (
            <div className="space-y-3 p-3 bg-chrome/50 rounded border border-line/40">
              <div>
                <label className="block text-[10px] text-amber-500 uppercase font-bold tracking-wider mb-1">
                  Synthesized Abstract
                </label>
                <p className="text-paper leading-relaxed text-justify italic">{generatedAbstract}</p>
              </div>
              {generatedKeywords && (
                <div>
                  <label className="block text-[10px] text-amber-500 uppercase font-bold tracking-wider mb-1">
                    Keywords
                  </label>
                  <p className="text-muted font-mono">{generatedKeywords}</p>
                </div>
              )}

              <button
                onClick={() => onApplyAbstract(generatedAbstract, generatedKeywords)}
                className="w-full mt-2 py-1.5 bg-green-700 hover:bg-green-800 text-white font-semibold rounded flex items-center justify-center gap-1 shadow-sm transition"
              >
                <Check className="h-3.5 w-3.5" /> Apply to Galley Article
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: References */}
      {activeTab === 'references' && (
        <div className="space-y-3 text-xs">
          <p className="text-muted leading-relaxed">
            Format your messy, unstructured references (like raw web links, copied text, or incomplete citations) into perfectly numbered IEEE entries.
          </p>

          <div className="space-y-2">
            <label className="block text-[10px] text-muted uppercase font-bold">Messy References Input</label>
            <textarea
              value={messyRefs}
              onChange={(e) => setMessyRefs(e.target.value)}
              placeholder="Paste unstructured text or existing citations. Leave blank to clean your current galley's references list."
              className="w-full bg-chrome border border-line focus:border-proof-red rounded p-2 text-xs text-paper focus:outline-none font-mono"
              rows={4}
            />
          </div>

          <button
            onClick={handleFormatReferences}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 bg-amber-500 hover:bg-amber-600 text-chrome font-bold rounded shadow transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Formatting bibliographic entries...
              </>
            ) : (
              <>
                <BookOpen className="h-3.5 w-3.5" /> Format to IEEE Standard
              </>
            )}
          </button>

          {formattedRefs && (
            <div className="space-y-2 p-3 bg-chrome/50 rounded border border-line/40">
              <label className="block text-[10px] text-green-500 uppercase font-bold">Standardized Bibliography</label>
              <pre className="text-paper font-mono text-[10px] whitespace-pre-wrap leading-relaxed max-h-[160px] overflow-y-auto">
                {formattedRefs}
              </pre>

              <button
                onClick={() => onApplyReferences(formattedRefs)}
                className="w-full mt-2 py-1.5 bg-green-700 hover:bg-green-800 text-white font-semibold rounded flex items-center justify-center gap-1 shadow-sm transition"
              >
                <Check className="h-3.5 w-3.5" /> Inject Standard References
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Tone Polisher */}
      {activeTab === 'tone' && (
        <div className="space-y-3 text-xs">
          <p className="text-muted leading-relaxed">
            Select a raw paragraph or passive draft text block and polish it into rigorous, formal academic phrasing.
          </p>

          <div className="space-y-2">
            <label className="block text-[10px] text-muted uppercase font-bold">Draft Text</label>
            <textarea
              value={originalToneText}
              onChange={(e) => setOriginalToneText(e.target.value)}
              placeholder="Enter a paragraph or phrase that feels too casual (e.g. 'We build this app because users hate writing tables manually...')"
              className="w-full bg-chrome border border-line focus:border-proof-red rounded p-2 text-xs text-paper focus:outline-none"
              rows={3}
            />
          </div>

          <button
            onClick={handlePolishTone}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 bg-amber-500 hover:bg-amber-600 text-chrome font-bold rounded shadow transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Enhancing scholarly rigor...
              </>
            ) : (
              <>
                <PenTool className="h-3.5 w-3.5" /> Improve Academic Tone
              </>
            )}
          </button>

          {polishedToneText && (
            <div className="space-y-2 p-3 bg-chrome/50 rounded border border-line/40">
              <label className="block text-[10px] text-green-500 uppercase font-bold">Scholarly Translation</label>
              <p className="text-paper leading-relaxed text-justify">{polishedToneText}</p>

              <div className="text-[10px] text-muted italic mt-1 bg-chrome-panel p-2 rounded">
                💡 **Hint**: Copy the polished text or use it to replace a section's text.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
