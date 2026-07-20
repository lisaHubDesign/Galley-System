import React, { useState } from 'react';
import { ArticleState, Section, Figure, Table } from '../types';
import { Printer, Columns, FileText } from 'lucide-react';

interface PaperPreviewProps {
  article: ArticleState;
}

export default function PaperPreview({ article }: PaperPreviewProps) {
  const [layoutColumns, setLayoutColumns] = useState<1 | 2>(1);

  // Trigger browser print dialog for high-quality PDF printout
  const handlePrint = () => {
    window.print();
  };

  const journalLine = [
    article.journalName,
    article.volume ? `Volume ${article.volume}` : ''
  ].filter(Boolean).join(', ');

  const copyrightLine = `Copyright © ${article.copyrightYear}, the Authors. Published by ${article.publisher}.`;

  return (
    <div className="space-y-4 w-full max-w-[760px] mx-auto no-print">
      {/* Control Utility bar */}
      <div className="flex items-center justify-between bg-chrome-panel/80 border border-line/50 p-2.5 rounded-lg">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-proof-red" />
          <span className="text-xs font-mono font-medium text-muted">Galley Sheet Proof Preview</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-line rounded p-0.5 bg-chrome">
            <button
              onClick={() => setLayoutColumns(1)}
              className={`px-2.5 py-1 text-[11px] rounded transition flex items-center gap-1.5 font-medium ${
                layoutColumns === 1 ? 'bg-chrome-panel text-paper shadow-sm' : 'text-muted hover:text-paper'
              }`}
            >
              <Columns className="h-3 w-3 rotate-90" /> Single Col
            </button>
            <button
              onClick={() => setLayoutColumns(2)}
              className={`px-2.5 py-1 text-[11px] rounded transition flex items-center gap-1.5 font-medium ${
                layoutColumns === 2 ? 'bg-chrome-panel text-paper shadow-sm' : 'text-muted hover:text-paper'
              }`}
            >
              <Columns className="h-3 w-3" /> Dual Col
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-proof-red hover:bg-red-800 text-paper font-semibold text-xs rounded transition duration-150 shadow"
          >
            <Printer className="h-3.5 w-3.5" /> PDF / Print
          </button>
        </div>
      </div>
      {/* Actual Paper Sheet Container */}
      <div id="paperPreview" className="paper-page bg-paper text-ink p-14 relative shadow-2xl rounded-sm font-serif max-w-full text-zinc-900" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
        {/* Masthead matching Atlantis Press layout exactly */}
        <div className="relative select-none mb-10 pb-4 min-h-[3.25rem] flex flex-col items-center justify-center">
          {/* Logo on the far left (absolute positioned to not affect centering) */}
          <div className="absolute left-0 top-0 flex items-center gap-1.5">
            <svg viewBox="0 0 120 120" className="h-10 w-10 text-zinc-900 fill-current shrink-0">
              <path d="M45.5,108.5 C40,108.5 35,105 31.5,100 C25,90.5 24,78.5 29.5,66.5 C34.5,55.5 45.5,43.5 56.5,33.5 C59.5,31 62.5,28 65,25.5 C66.5,24 68.5,22.5 70,22.5 C71.5,22.5 72,23.5 72,25 C72.5,30.5 70.5,37 67,43.5 C62.5,52 56,61 49.5,69.5 C46,74 42.5,78 40.5,82 C39,85 39,87.5 40.5,89 C42,90.5 44.5,90.5 47.5,89 C51.5,87 56,83.5 61,79 C68,72.5 75.5,65 82.5,57 C85.5,53.5 88.5,50 91,47 C92.5,45.5 94,44.5 95,44.5 C96,44.5 96.5,45.5 96.5,47 C96.5,52.5 93.5,59.5 88.5,67 C82.5,76 74.5,85 66.5,93 C61.5,98 56.5,102.5 52,105.5 C49.5,107.5 47.5,108.5 45.5,108.5 Z" />
              <path d="M72.5,20.5 C74.5,20.5 76.5,22.5 76.5,25.5 C76.5,29.5 73.5,34.5 68.5,38.5 C66.5,40 64.5,40.5 63.5,39.5 C62.5,38.5 63,36 64.5,33.5 C67.5,28.5 70.5,22.5 72.5,20.5 Z" />
            </svg>
            <div className="flex flex-col text-left text-zinc-900 leading-none">
              <span className="font-extrabold text-[12px] tracking-[0.08em] font-sans">ATLANTIS</span>
              <span className="font-bold text-[9.5px] tracking-[0.25em] mt-0.5 pl-[1px] font-sans">PRESS</span>
            </div>
          </div>

          {/* Centered Journal and Conference details */}
          <div className="text-center max-w-[70%] mx-auto flex flex-col items-center">
            {journalLine && (
              <div className="text-zinc-900 italic text-[11px] leading-tight font-medium">
                {journalLine}
              </div>
            )}
            {article.conferenceLine && (
              <div className="text-[10px] leading-tight font-normal text-zinc-800 mt-1.5 max-w-[95%]">
                {article.conferenceLine}
              </div>
            )}
          </div>
        </div>

        {/* Article Title */}
        <h1 className="text-center font-bold text-[22px] leading-tight text-zinc-900 mb-5 max-w-[95%] mx-auto">
          {article.title || 'Untitled Research Article'}
        </h1>

        {/* Authors */}
        <div className="text-center text-[13.5px] text-zinc-900 mb-2 font-medium">
          {article.authors || 'Author Names'}
        </div>

        {/* Affiliation */}
        <div className="text-center text-[11px] text-zinc-700 mb-6 max-w-[90%] mx-auto leading-relaxed">
          {article.affiliation || 'Department, University, City, Country'}
        </div>

        {/* Keywords and Abstract Area (Indented on both sides, keywords first, abstract second, regular text, fully justified) */}
        <div className="mx-[0.5in] space-y-3 mb-8 text-[11.5px] leading-[1.4] text-zinc-900 text-justify">
          {article.keywords && (
            <div>
              <span className="font-bold mr-1.5">Keywords:</span>
              <span>{article.keywords}</span>
            </div>
          )}

          {article.abstract && (
            <div>
              <span className="font-bold mr-1.5">Abstract.</span>
              <span>{article.abstract}</span>
            </div>
          )}
        </div>

        {/* Core Body Content */}
        <div className={layoutColumns === 2 ? 'grid grid-cols-2 gap-6' : 'space-y-5'}>
          {article.sections.map((sec) => {
            const hasHeading = sec.heading.trim().length > 0;
            const hasParagraphs = sec.paragraphs.length > 0;
            const hasFigs = sec.figures.length > 0;
            const hasTbls = sec.tables.length > 0;

            if (!hasHeading && !hasParagraphs && !hasFigs && !hasTbls) return null;

            // Tracking which figures and tables are dynamically rendered near references
            const renderedFigIds = new Set<string>();
            const renderedTblIds = new Set<string>();

            const renderFigure = (fig: Figure) => {
              const normalizedCaption = fig.caption.replace(/^(fig\.|fig|figure)\s*(\d+)\.?\s*/i, 'Figure $2.  ');
              const dotIndex = normalizedCaption.indexOf('.');
              const label = dotIndex !== -1 ? normalizedCaption.substring(0, dotIndex + 1) : 'Figure.';
              const content = dotIndex !== -1 ? normalizedCaption.substring(dotIndex + 1) : normalizedCaption;

              return (
                <div key={fig.id} className="my-5 text-center space-y-2 page-break-inside-avoid select-none">
                  {fig.imageDataUrl ? (
                    <div className="flex justify-center">
                      <img
                        src={fig.imageDataUrl}
                        alt={fig.caption}
                        style={{ width: `${fig.widthPercent}%` }}
                        referrerPolicy="no-referrer"
                        className="max-h-[300px] object-contain border border-zinc-200/50 p-1 bg-white"
                      />
                    </div>
                  ) : (
                    <div className="mx-auto h-[120px] bg-zinc-100 border border-zinc-300 rounded-sm flex items-center justify-center text-xs text-zinc-400 font-medium italic">
                      [Image content not uploaded]
                    </div>
                  )}
                  {/* Caption under the figure matching original regular font-weight style */}
                  <div className="text-[11px] text-zinc-800 max-w-[85%] mx-auto leading-normal text-center">
                    <span>{label}</span>
                    <span>{content}</span>
                  </div>
                </div>
              );
            };

            const renderTable = (tbl: Table) => {
              const normalizedCaption = tbl.caption.replace(/^(tbl\.|table)\s*(\d+)\.?\s*/i, 'Table $2. ');
              const dotIndex = normalizedCaption.indexOf('.');
              const label = dotIndex !== -1 ? normalizedCaption.substring(0, dotIndex + 1) : 'Table.';
              const content = dotIndex !== -1 ? normalizedCaption.substring(dotIndex + 1) : normalizedCaption;

              return (
                <div key={tbl.id} className="my-5 text-center space-y-2 page-break-inside-avoid">
                  {/* Caption above the table */}
                  <div className="text-[11px] text-zinc-800 max-w-[85%] mx-auto leading-normal text-center mb-1">
                    <span>{label}</span>
                    <span>{content}</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table
                      className={`mx-auto text-[11.5px] leading-relaxed text-zinc-900 border-collapse max-w-full ${
                        tbl.style === 'booktabs'
                          ? 'border-t-2 border-b-2 border-zinc-900'
                          : tbl.style === 'simple'
                          ? 'border border-zinc-400'
                          : 'border-2 border-zinc-900'
                      }`}
                      style={{ minWidth: '70%' }}
                    >
                      <thead>
                        <tr className={tbl.style === 'booktabs' ? 'border-b border-zinc-900' : 'border-b border-zinc-400'}>
                          {tbl.headers.map((header, hIdx) => (
                            <th
                              key={hIdx}
                              className={`p-1.5 font-bold text-center ${
                                tbl.style === 'grid' ? 'border-r border-zinc-900' : tbl.style === 'simple' ? 'border-r border-zinc-400' : ''
                              }`}
                              style={{ textAlign: tbl.alignments[hIdx] || 'center' }}
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tbl.rows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className={
                              tbl.style === 'grid'
                                ? 'border-b border-zinc-900'
                                : tbl.style === 'simple' && rIdx < tbl.rows.length - 1
                                ? 'border-b border-zinc-300'
                                : ''
                            }
                          >
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className={`p-1.5 ${
                                  tbl.style === 'grid' ? 'border-r border-zinc-900' : tbl.style === 'simple' ? 'border-r border-zinc-400' : ''
                                }`}
                                style={{ textAlign: tbl.alignments[cIdx] || 'center' }}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            };

            return (
              <div key={sec.id} className="space-y-3.5 break-inside-avoid-page">
                {/* Section Heading */}
                {hasHeading && (
                  <h2 className="font-bold text-[14.5px] text-zinc-900 mt-6 mb-3 select-none">
                    {sec.heading}
                  </h2>
                )}

                {/* Paragraphs fully justified to match the PDF template without indentation */}
                {sec.paragraphs.map((p, pIdx) => {
                  return (
                    <React.Fragment key={pIdx}>
                      <p className="text-[12.5px] leading-[1.45] text-justify text-zinc-900 mb-3 select-none">
                        {p}
                      </p>

                      {/* Interleaved Figures: if the figure matches a reference in this paragraph */}
                      {sec.figures.map((fig) => {
                        const figNum = fig.id.replace('fig-', '');
                        const isReferenced = p.toLowerCase().includes(`fig. ${figNum}`) ||
                                             p.toLowerCase().includes(`figure ${figNum}`) ||
                                             p.toLowerCase().includes(`fig.  ${figNum}`);

                        if (isReferenced && !renderedFigIds.has(fig.id)) {
                          renderedFigIds.add(fig.id);
                          return renderFigure(fig);
                        }
                        return null;
                      })}

                      {/* Interleaved Tables: if the table matches a reference in this paragraph */}
                      {sec.tables.map((tbl) => {
                        const tblNum = tbl.id.replace('tbl-', '');
                        const isReferenced = p.toLowerCase().includes(`table ${tblNum}`) ||
                                             p.toLowerCase().includes(`tbl. ${tblNum}`);

                        if (isReferenced && !renderedTblIds.has(tbl.id)) {
                          renderedTblIds.add(tbl.id);
                          return renderTable(tbl);
                        }
                        return null;
                      })}
                    </React.Fragment>
                  );
                })}

                {/* Fallback rendering of remaining figures if they are not explicitly referenced */}
                {sec.figures
                  .filter((fig) => !renderedFigIds.has(fig.id))
                  .map((fig) => renderFigure(fig))}

                {/* Fallback rendering of remaining tables if they are not explicitly referenced */}
                {sec.tables
                  .filter((tbl) => !renderedTblIds.has(tbl.id))
                  .map((tbl) => renderTable(tbl))}
              </div>
            );
          })}
        </div>

        {/* References List */}
        {article.referencesText.trim() && (
          <div className="mt-10 break-inside-avoid-page">
            <h3 className="font-bold text-[14.5px] text-zinc-900 mb-3">
              References
            </h3>
            <div className="space-y-2 font-serif text-[11px] leading-relaxed">
              {article.referencesText.split('\n').filter(Boolean).map((ref, idx) => {
                const cleaned = ref.replace(/^\[?\d+\]\.?\s*/, '').trim();
                return (
                  <div key={idx} className="text-justify text-zinc-900">
                    <span className="mr-1.5">[{idx + 1}].</span>
                    <span>{cleaned}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Area matching Page 1 of the template exactly (no horizontal line) */}
        <div className="mt-16 pt-4 font-serif text-[10px] text-zinc-800 select-none flex justify-between items-end">
          <div className="space-y-1 text-[9.5px] leading-normal text-zinc-700 flex-1">
            <div>Copyright © {article.copyrightYear}, the Authors. Published by {article.publisher}.</div>
            <div>{article.licenseLine}</div>
          </div>
          <div className="text-right shrink-0 pl-4">
            <span className="text-[11.5px] text-zinc-800">{article.startPageNumber || '1222'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
