import React, { useState } from 'react';
import { Figure } from '../types';
import { Image, Trash2, Plus, Upload, Maximize2 } from 'lucide-react';
import { generateId } from '../utils/parser';

interface FigureEditorProps {
  figures: Figure[];
  onChange: (figures: Figure[]) => void;
}

export default function FigureEditor({ figures, onChange }: FigureEditorProps) {
  const [activeFigId, setActiveFigId] = useState<string | null>(figures[0]?.id || null);

  const activeFigure = figures.find(f => f.id === activeFigId) || figures[0];

  React.useEffect(() => {
    if (figures.length > 0 && !activeFigId) {
      setActiveFigId(figures[0].id);
    }
  }, [figures, activeFigId]);

  const updateFigure = (updated: Figure) => {
    const next = figures.map(f => f.id === updated.id ? updated : f);
    onChange(next);
  };

  const handleAddFigure = () => {
    const newId = generateId();
    const newFigure: Figure = {
      id: newId,
      caption: `Fig. ${figures.length + 1}. Schematic diagram of the proposed model framework.`,
      imageDataUrl: '', // Starts empty, letting the user upload
      widthPercent: 70
    };
    onChange([...figures, newFigure]);
    setActiveFigId(newId);
  };

  const handleRemoveFigure = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = figures.filter(f => f.id !== id);
    onChange(next);
    if (activeFigId === id) {
      setActiveFigId(next[0]?.id || null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeFigure) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateFigure({
        ...activeFigure,
        imageDataUrl: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div id="figure-editor-root" className="space-y-4">
      {/* Figure Selection Bar */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <Image className="h-4 w-4 text-proof-red" />
          <h3 className="font-mono text-xs uppercase tracking-wider text-proof-red font-semibold">
            Figures Manager
          </h3>
        </div>
        <button
          onClick={handleAddFigure}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-proof-red hover:bg-red-800 text-paper rounded transition duration-150"
        >
          <Plus className="h-3.5 w-3.5" /> Add Figure
        </button>
      </div>

      {figures.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-line rounded bg-chrome/40 text-muted">
          <p className="text-sm">No figures in the article yet.</p>
          <p className="text-xs mt-1">Click the "Add Figure" button above to insert one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Figures List */}
          <div className="md:col-span-1 space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {figures.map((fig, index) => (
              <button
                key={fig.id}
                onClick={() => setActiveFigId(fig.id)}
                className={`w-full text-left p-2.5 rounded text-xs transition duration-150 flex items-center justify-between border ${
                  activeFigure?.id === fig.id
                    ? 'bg-proof-red/10 border-proof-red/40 text-paper'
                    : 'bg-chrome-panel/80 border-line/40 text-muted hover:border-line hover:text-paper'
                }`}
              >
                <span className="truncate font-medium">
                  Fig {index + 1}: {fig.caption.replace(/^Fig\s*\d+\.?\s*/i, '') || 'Untitled'}
                </span>
                <Trash2
                  className="h-3.5 w-3.5 text-muted hover:text-proof-red shrink-0 ml-1"
                  onClick={(e) => handleRemoveFigure(fig.id, e)}
                />
              </button>
            ))}
          </div>

          {/* Active Figure Editor */}
          {activeFigure && (
            <div className="md:col-span-3 space-y-4 bg-chrome-panel/40 p-4 border border-line/40 rounded">
              <div className="space-y-3">
                {/* Image Upload Area */}
                <div>
                  <label className="block text-xs font-medium text-muted mb-2">
                    Upload Illustration / Diagram
                  </label>
                  
                  {activeFigure.imageDataUrl ? (
                    <div className="relative group rounded border border-line/50 overflow-hidden bg-chrome flex items-center justify-center p-4 max-h-[220px]">
                      <img
                        src={activeFigure.imageDataUrl}
                        alt="Figure content"
                        style={{ width: `${activeFigure.widthPercent}%` }}
                        className="object-contain max-h-[180px] rounded transition duration-200"
                      />
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        <label className="bg-chrome-panel border border-line hover:border-proof-red text-xs text-paper px-2.5 py-1.5 rounded cursor-pointer transition duration-150 flex items-center gap-1">
                          <Upload className="h-3 w-3" /> Replace
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="border border-dashed border-line/80 hover:border-proof-red/60 bg-chrome/50 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition duration-150 min-h-[140px]">
                      <Upload className="h-6 w-6 text-muted mb-2" />
                      <span className="text-xs text-paper font-medium">Upload Image File</span>
                      <span className="text-[10px] text-muted mt-1">PNG, JPG, SVG, WebP</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Width selection */}
                <div className="grid grid-cols-2 gap-4 border-t border-line/20 pt-3">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Caption (Placed BELOW the image in standard ACSR)
                    </label>
                    <input
                      type="text"
                      value={activeFigure.caption}
                      onChange={(e) => updateFigure({ ...activeFigure, caption: e.target.value })}
                      className="w-full bg-chrome border border-line/80 focus:border-proof-red rounded px-3 py-2 text-sm text-paper focus:outline-none"
                      placeholder="Fig 1. Schematic layout"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Display Width in Galley Proof: <span className="text-proof-red font-mono">{activeFigure.widthPercent}%</span>
                    </label>
                    <div className="flex items-center gap-3 mt-1.5">
                      <input
                        type="range"
                        min="30"
                        max="100"
                        step="5"
                        value={activeFigure.widthPercent}
                        onChange={(e) => updateFigure({ ...activeFigure, widthPercent: parseInt(e.target.value) })}
                        className="w-full accent-proof-red"
                      />
                      <span className="text-xs font-mono text-muted w-8 shrink-0">{activeFigure.widthPercent}%</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-muted bg-chrome/30 p-2.5 rounded border border-line/20">
                  💡 **Pro Tip**: In Word (`.doc`) and PDF exports, figures will remain embedded at high resolution using their responsive widths.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
