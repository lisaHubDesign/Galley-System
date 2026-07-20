import React, { useState } from 'react';
import { Table } from '../types';
import { Plus, Trash2, ArrowLeft, ArrowRight, AlignLeft, AlignCenter, AlignRight, FileSpreadsheet } from 'lucide-react';
import { generateId } from '../utils/parser';

interface TableEditorProps {
  tables: Table[];
  onChange: (tables: Table[]) => void;
}

export default function TableEditor({ tables, onChange }: TableEditorProps) {
  const [activeTableId, setActiveTableId] = useState<string | null>(tables[0]?.id || null);

  const activeTable = tables.find(t => t.id === activeTableId) || tables[0];

  React.useEffect(() => {
    if (tables.length > 0 && !activeTableId) {
      setActiveTableId(tables[0].id);
    }
  }, [tables, activeTableId]);

  const updateTable = (updated: Table) => {
    const next = tables.map(t => t.id === updated.id ? updated : t);
    onChange(next);
  };

  const handleAddTable = () => {
    const newId = generateId();
    const newTable: Table = {
      id: newId,
      caption: `Table ${tables.length + 1}. Experimental results and performance analysis.`,
      headers: ['Parameter', 'Method A', 'Method B', 'Improvement (%)'],
      rows: [
        ['Throughput (Mpps)', '45.2', '78.9', '+74.5%'],
        ['Latency (ms)', '12.4', '4.2', '-66.1%'],
        ['CPU Overhead (%)', '28.1', '14.5', '-48.4%']
      ],
      alignments: ['left', 'center', 'center', 'center'],
      style: 'booktabs'
    };
    onChange([...tables, newTable]);
    setActiveTableId(newId);
  };

  const handleRemoveTable = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = tables.filter(t => t.id !== id);
    onChange(next);
    if (activeTableId === id) {
      setActiveTableId(next[0]?.id || null);
    }
  };

  // Cell & Header changes
  const handleHeaderChange = (index: number, val: string) => {
    if (!activeTable) return;
    const nextHeaders = [...activeTable.headers];
    nextHeaders[index] = val;
    updateTable({ ...activeTable, headers: nextHeaders });
  };

  const handleCellChange = (rIdx: number, cIdx: number, val: string) => {
    if (!activeTable) return;
    const nextRows = activeTable.rows.map((row, idx) => {
      if (idx === rIdx) {
        const nextRow = [...row];
        nextRow[cIdx] = val;
        return nextRow;
      }
      return row;
    });
    updateTable({ ...activeTable, rows: nextRows });
  };

  const handleAlignmentChange = (index: number, alignment: 'left' | 'center' | 'right') => {
    if (!activeTable) return;
    const nextAlign = [...activeTable.alignments];
    nextAlign[index] = alignment;
    updateTable({ ...activeTable, alignments: nextAlign });
  };

  // Dimensions
  const addColumn = () => {
    if (!activeTable) return;
    const nextHeaders = [...activeTable.headers, `Header ${activeTable.headers.length + 1}`];
    const nextRows = activeTable.rows.map(row => [...row, '']);
    const nextAlign = [...activeTable.alignments, 'center' as const];
    updateTable({
      ...activeTable,
      headers: nextHeaders,
      rows: nextRows,
      alignments: nextAlign
    });
  };

  const removeColumn = (index: number) => {
    if (!activeTable || activeTable.headers.length <= 1) return;
    const nextHeaders = activeTable.headers.filter((_, idx) => idx !== index);
    const nextRows = activeTable.rows.map(row => row.filter((_, idx) => idx !== index));
    const nextAlign = activeTable.alignments.filter((_, idx) => idx !== index);
    updateTable({
      ...activeTable,
      headers: nextHeaders,
      rows: nextRows,
      alignments: nextAlign
    });
  };

  const addRow = () => {
    if (!activeTable) return;
    const newRow = Array(activeTable.headers.length).fill('');
    updateTable({
      ...activeTable,
      rows: [...activeTable.rows, newRow]
    });
  };

  const removeRow = (rIdx: number) => {
    if (!activeTable) return;
    updateTable({
      ...activeTable,
      rows: activeTable.rows.filter((_, idx) => idx !== rIdx)
    });
  };

  return (
    <div id="table-editor-root" className="space-y-4">
      {/* Table Selection Bar */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-proof-red" />
          <h3 className="font-mono text-xs uppercase tracking-wider text-proof-red font-semibold">
            Tables Manager
          </h3>
        </div>
        <button
          onClick={handleAddTable}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-proof-red hover:bg-red-800 text-paper rounded transition duration-150"
        >
          <Plus className="h-3.5 w-3.5" /> Add Table
        </button>
      </div>

      {tables.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-line rounded bg-chrome/40 text-muted">
          <p className="text-sm">No tables in the article yet.</p>
          <p className="text-xs mt-1">Click the "Add Table" button above to insert one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Table List */}
          <div className="md:col-span-1 space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {tables.map((tbl, index) => (
              <button
                key={tbl.id}
                onClick={() => setActiveTableId(tbl.id)}
                className={`w-full text-left p-2.5 rounded text-xs transition duration-150 flex items-center justify-between border ${
                  activeTable?.id === tbl.id
                    ? 'bg-proof-red/10 border-proof-red/40 text-paper'
                    : 'bg-chrome-panel/80 border-line/40 text-muted hover:border-line hover:text-paper'
                }`}
              >
                <span className="truncate font-medium">
                  Table {index + 1}: {tbl.caption.replace(/^Table\s*\d+\.?\s*/i, '') || 'Untitled'}
                </span>
                <Trash2
                  className="h-3.5 w-3.5 text-muted hover:text-proof-red shrink-0 ml-1"
                  onClick={(e) => handleRemoveTable(tbl.id, e)}
                />
              </button>
            ))}
          </div>

          {/* Active Table Spreadsheet */}
          {activeTable && (
            <div className="md:col-span-3 space-y-4 bg-chrome-panel/40 p-4 border border-line/40 rounded">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Table Caption (Placed ABOVE the table in standard ACSR)
                  </label>
                  <input
                    type="text"
                    value={activeTable.caption}
                    onChange={(e) => updateTable({ ...activeTable, caption: e.target.value })}
                    className="w-full bg-chrome border border-line/80 focus:border-proof-red rounded px-3 py-2 text-sm text-paper focus:outline-none"
                    placeholder="Table 1. Table Description"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/30 pt-3">
                  {/* Style Settings */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">Style:</span>
                    <select
                      value={activeTable.style}
                      onChange={(e) => updateTable({ ...activeTable, style: e.target.value as any })}
                      className="bg-chrome border border-line/80 rounded px-2 py-1 text-xs text-paper focus:outline-none focus:border-proof-red"
                    >
                      <option value="booktabs">Three-line Academic (Booktabs)</option>
                      <option value="simple">Simple Borders</option>
                      <option value="grid">Full Grid Borders</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={addColumn}
                      className="px-2.5 py-1 text-xs bg-chrome hover:bg-chrome/60 border border-line rounded flex items-center gap-1 text-paper"
                    >
                      <Plus className="h-3 w-3" /> Col
                    </button>
                    <button
                      onClick={addRow}
                      className="px-2.5 py-1 text-xs bg-chrome hover:bg-chrome/60 border border-line rounded flex items-center gap-1 text-paper"
                    >
                      <Plus className="h-3 w-3" /> Row
                    </button>
                  </div>
                </div>

                {/* Grid Spreadsheet Interface */}
                <div className="overflow-x-auto border border-line/60 rounded">
                  <table className="w-full text-xs text-paper border-collapse">
                    <thead>
                      <tr className="bg-chrome border-b border-line">
                        <th className="p-2 border-r border-line/50 text-center text-muted font-mono w-10"></th>
                        {activeTable.headers.map((header, hIdx) => (
                          <th key={hIdx} className="p-2 border-r border-line/50 font-normal min-w-[120px]">
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={header}
                                onChange={(e) => handleHeaderChange(hIdx, e.target.value)}
                                className="w-full bg-chrome-panel border border-line/50 focus:border-proof-red/80 rounded px-1.5 py-1 text-center font-semibold focus:outline-none"
                                placeholder={`Header ${hIdx + 1}`}
                              />
                              {/* Alignment controls & remove col */}
                              <div className="flex items-center justify-between px-1">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleAlignmentChange(hIdx, 'left')}
                                    className={`p-0.5 rounded hover:bg-chrome-panel ${activeTable.alignments[hIdx] === 'left' ? 'text-proof-red bg-chrome-panel/80' : 'text-muted'}`}
                                  >
                                    <AlignLeft className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleAlignmentChange(hIdx, 'center')}
                                    className={`p-0.5 rounded hover:bg-chrome-panel ${activeTable.alignments[hIdx] === 'center' ? 'text-proof-red bg-chrome-panel/80' : 'text-muted'}`}
                                  >
                                    <AlignCenter className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleAlignmentChange(hIdx, 'right')}
                                    className={`p-0.5 rounded hover:bg-chrome-panel ${activeTable.alignments[hIdx] === 'right' ? 'text-proof-red bg-chrome-panel/80' : 'text-muted'}`}
                                  >
                                    <AlignRight className="h-3 w-3" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => removeColumn(hIdx)}
                                  disabled={activeTable.headers.length <= 1}
                                  className="text-[10px] text-muted hover:text-proof-red disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeTable.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-line/30 hover:bg-chrome/20">
                          <td className="p-2 border-r border-line/50 text-center text-muted font-mono bg-chrome/10">
                            <div className="flex flex-col items-center gap-1">
                              <span>{rIdx + 1}</span>
                              <button
                                onClick={() => removeRow(rIdx)}
                                className="text-[10px] text-muted hover:text-proof-red hover:scale-110"
                                title="Delete row"
                              >
                                &times;
                              </button>
                            </div>
                          </td>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-1.5 border-r border-line/30">
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                className={`w-full bg-transparent border border-transparent hover:border-line focus:border-proof-red rounded px-1.5 py-1 focus:outline-none text-${activeTable.alignments[cIdx] || 'center'}`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between text-[11px] text-muted">
                  <p>✓ Alignment and headers map dynamically to the live galley proof sheet.</p>
                  <p>Spreadsheet dimensions: {activeTable.rows.length} rows &times; {activeTable.headers.length} columns</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
