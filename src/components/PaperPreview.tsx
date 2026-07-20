import React, { useState } from 'react';
import { ArticleState, Section, Figure, Table } from '../types';
import { Printer, Columns, FileText } from 'lucide-react';

interface PaperPreviewProps {
  article: ArticleState;
}

export default function PaperPreview({ article }: PaperPreviewProps) {
  const [layoutMode, setLayoutMode] = useState<'pages' | 'continuous'>('pages');
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

  // Safe attribute getters
  const getFigureById = (id: string): Figure | undefined => {
    for (const sec of article.sections) {
      const found = sec.figures.find(f => f.id === id);
      if (found) return found;
    }
    return undefined;
  };

  const getTableById = (id: string): Table | undefined => {
    for (const sec of article.sections) {
      const found = sec.tables.find(t => t.id === id);
      if (found) return found;
    }
    return undefined;
  };

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
        <div className="text-[11px] text-zinc-800 max-w-[85%] mx-auto leading-normal text-center">
          <span className="font-bold">{label}</span>
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
        <div className="text-[11px] text-zinc-800 max-w-[85%] mx-auto leading-normal text-center mb-1">
          <span className="font-bold">{label}</span>
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

  // Header template for subsequent pages (Page 2-5)
  const renderSubsequentHeader = () => (
    <div className="w-full flex items-center justify-between border-b border-zinc-300 pb-2 mb-6 text-[10px] text-zinc-800 font-serif select-none">
      <div className="flex items-center gap-1.5">
        <svg viewBox="0 0 120 120" className="h-5 w-5 text-zinc-900 fill-current shrink-0">
          <path d="M45.5,108.5 C40,108.5 35,105 31.5,100 C25,90.5 24,78.5 29.5,66.5 C34.5,55.5 45.5,43.5 56.5,33.5 C59.5,31 62.5,28 65,25.5 C66.5,24 68.5,22.5 70,22.5 C71.5,22.5 72,23.5 72,25 C72.5,30.5 70.5,37 67,43.5 C62.5,52 56,61 49.5,69.5 C46,74 42.5,78 40.5,82 C39,85 39,87.5 40.5,89 C42,90.5 44.5,90.5 47.5,89 C51.5,87 56,83.5 61,79 C68,72.5 75.5,65 82.5,57 C85.5,53.5 88.5,50 91,47 C92.5,45.5 94,44.5 95,44.5 C96,44.5 96.5,45.5 96.5,47 C96.5,52.5 93.5,59.5 88.5,67 C82.5,76 74.5,85 66.5,93 C61.5,98 56.5,102.5 52,105.5 C49.5,107.5 47.5,108.5 45.5,108.5 Z" />
          <path d="M72.5,20.5 C74.5,20.5 76.5,22.5 76.5,25.5 C76.5,29.5 73.5,34.5 68.5,38.5 C66.5,40 64.5,40.5 63.5,39.5 C62.5,38.5 63,36 64.5,33.5 C67.5,28.5 70.5,22.5 72.5,20.5 Z" />
        </svg>
        <span className="font-bold text-[8px] tracking-[0.08em] font-sans">ATLANTIS PRESS</span>
      </div>
      <div className="italic text-right text-[9.5px]">
        {journalLine}
      </div>
    </div>
  );

  // Flatten the article content into sequential flowable items
  interface FlowableItem {
    id: string;
    type: 'heading' | 'paragraph' | 'figure' | 'table' | 'references';
    sectionId?: string;
    headingText?: string;
    paragraphText?: string;
    figure?: Figure;
    table?: Table;
    references?: string[];
    estimatedHeight: number;
  }

  const estimateItemHeight = (item: Omit<FlowableItem, 'estimatedHeight'>): number => {
    switch (item.type) {
      case 'heading':
        return 50;
      case 'paragraph': {
        const text = item.paragraphText || '';
        const linesCount = Math.max(1, Math.ceil(text.length / 95));
        return linesCount * 18 + 12;
      }
      case 'figure':
        return 220;
      case 'table': {
        const rowCount = item.table?.rows.length || 0;
        return 50 + rowCount * 22 + 30;
      }
      case 'references': {
        const refCount = item.references?.length || 0;
        return 40 + refCount * 18;
      }
      default:
        return 0;
    }
  };

  const flowableItems: FlowableItem[] = [];

  article.sections.forEach((sec) => {
    if (sec.heading.trim()) {
      const baseItem: Omit<FlowableItem, 'estimatedHeight'> = {
        id: `heading-${sec.id}`,
        type: 'heading',
        sectionId: sec.id,
        headingText: sec.heading
      };
      flowableItems.push({ ...baseItem, estimatedHeight: estimateItemHeight(baseItem) });
    }

    const renderedFigIds = new Set<string>();
    const renderedTblIds = new Set<string>();

    sec.paragraphs.forEach((p, pIdx) => {
      const pItem: Omit<FlowableItem, 'estimatedHeight'> = {
        id: `p-${sec.id}-${pIdx}`,
        type: 'paragraph',
        sectionId: sec.id,
        paragraphText: p
      };
      flowableItems.push({ ...pItem, estimatedHeight: estimateItemHeight(pItem) });

      sec.figures.forEach((fig) => {
        const figNum = fig.id.replace('fig-', '');
        const isReferenced = p.toLowerCase().includes(`fig. ${figNum}`) ||
                             p.toLowerCase().includes(`figure ${figNum}`) ||
                             p.toLowerCase().includes(`fig.  ${figNum}`);
        if (isReferenced && !renderedFigIds.has(fig.id)) {
          renderedFigIds.add(fig.id);
          const figItem: Omit<FlowableItem, 'estimatedHeight'> = {
            id: `fig-${fig.id}`,
            type: 'figure',
            sectionId: sec.id,
            figure: fig
          };
          flowableItems.push({ ...figItem, estimatedHeight: estimateItemHeight(figItem) });
        }
      });

      sec.tables.forEach((tbl) => {
        const tblNum = tbl.id.replace('tbl-', '');
        const isReferenced = p.toLowerCase().includes(`table ${tblNum}`) ||
                             p.toLowerCase().includes(`tbl. ${tblNum}`);
        if (isReferenced && !renderedTblIds.has(tbl.id)) {
          renderedTblIds.add(tbl.id);
          const tblItem: Omit<FlowableItem, 'estimatedHeight'> = {
            id: `tbl-${tbl.id}`,
            type: 'table',
            sectionId: sec.id,
            table: tbl
          };
          flowableItems.push({ ...tblItem, estimatedHeight: estimateItemHeight(tblItem) });
        }
      });
    });

    sec.figures.forEach((fig) => {
      if (!renderedFigIds.has(fig.id)) {
        const figItem: Omit<FlowableItem, 'estimatedHeight'> = {
          id: `fig-${fig.id}`,
          type: 'figure',
          sectionId: sec.id,
          figure: fig
        };
        flowableItems.push({ ...figItem, estimatedHeight: estimateItemHeight(figItem) });
      }
    });

    sec.tables.forEach((tbl) => {
      if (!renderedTblIds.has(tbl.id)) {
        const tblItem: Omit<FlowableItem, 'estimatedHeight'> = {
          id: `tbl-${tbl.id}`,
          type: 'table',
          sectionId: sec.id,
          table: tbl
        };
        flowableItems.push({ ...tblItem, estimatedHeight: estimateItemHeight(tblItem) });
      }
    });
  });

  if (article.referencesText.trim()) {
    const refs = article.referencesText.split('\n').filter(Boolean);
    const refsItem: Omit<FlowableItem, 'estimatedHeight'> = {
      id: 'references-block',
      type: 'references',
      references: refs
    };
    flowableItems.push({ ...refsItem, estimatedHeight: estimateItemHeight(refsItem) });
  }

  // Calculate metadata heights on Page 1
  const titleText = article.title || '';
  const authorsText = article.authors || '';
  const affiliationText = article.affiliation || '';
  const keywordsText = article.keywords || '';
  const abstractText = article.abstract || '';

  const titleHeight = Math.max(40, Math.ceil(titleText.length / 45) * 26);
  const authorsHeight = 25;
  const affiliationHeight = Math.max(20, Math.ceil(affiliationText.length / 80) * 16);
  const abstractHeight = Math.max(50, Math.ceil((abstractText.length + keywordsText.length) / 90) * 16 + 30);
  const metadataHeight = 140 + titleHeight + authorsHeight + affiliationHeight + abstractHeight + 40;

  // Greedy pagination
  const paginatedPages: FlowableItem[][] = [];
  let currentPage: FlowableItem[] = [];
  let currentAccumulatedHeight = 0;
  let isPage1 = true;

  flowableItems.forEach((item) => {
    const itemHeight = item.estimatedHeight;
    const maxCapacity = isPage1 ? Math.max(250, 850 - metadataHeight) : 850;

    if (currentPage.length > 0 && currentAccumulatedHeight + itemHeight > maxCapacity) {
      paginatedPages.push(currentPage);
      currentPage = [item];
      currentAccumulatedHeight = itemHeight;
      isPage1 = false;
    } else {
      currentPage.push(item);
      currentAccumulatedHeight += itemHeight;
    }
  });

  if (currentPage.length > 0) {
    paginatedPages.push(currentPage);
  }

  return (
    <div className="space-y-4 w-full max-w-[850px] mx-auto no-print">
      {/* Control Utility bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-chrome-panel/80 border border-line/50 p-2.5 rounded-lg">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-proof-red animate-pulse" />
          <span className="text-xs font-mono font-medium text-muted">A4 Galley Sheet Proof Viewer</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Layout Mode Toggler */}
          <div className="flex border border-line rounded p-0.5 bg-chrome">
            <button
              onClick={() => setLayoutMode('pages')}
              className={`px-2.5 py-1 text-[11px] rounded transition font-medium ${
                layoutMode === 'pages' ? 'bg-chrome-panel text-paper shadow-sm' : 'text-muted hover:text-paper'
              }`}
            >
              Page-by-Page
            </button>
            <button
              onClick={() => setLayoutMode('continuous')}
              className={`px-2.5 py-1 text-[11px] rounded transition font-medium ${
                layoutMode === 'continuous' ? 'bg-chrome-panel text-paper shadow-sm' : 'text-muted hover:text-paper'
              }`}
            >
              Continuous Flow
            </button>
          </div>

          {layoutMode === 'continuous' && (
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
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-proof-red hover:bg-red-800 text-paper font-semibold text-xs rounded transition duration-150 shadow"
          >
            <Printer className="h-3.5 w-3.5" /> Print PDF / Save
          </button>
        </div>
      </div>

      {/* Pages View or Continuous Scroll View */}
      {layoutMode === 'pages' ? (
        <div id="print-area" className="space-y-6 w-full font-serif text-zinc-900 select-text">
          {paginatedPages.map((pageItems, pageIdx) => {
            const isFirstPage = pageIdx === 0;
            const pageNum = Number(article.startPageNumber || '1222') + pageIdx;

            return (
              <div key={pageIdx} className="bg-white text-zinc-900 shadow-xl rounded-sm p-[20mm] border border-zinc-200 w-full max-w-[210mm] min-h-[297mm] mx-auto flex flex-col justify-between box-border page-sheet">
                <div>
                  {isFirstPage ? (
                    /* First Page Masthead */
                    <div className="relative select-none mb-8 pb-3 min-h-[3.25rem] flex flex-col items-center justify-center border-b border-zinc-300">
                      <div className="absolute left-0 top-0 flex items-center gap-1.5">
                        <svg viewBox="0 0 120 120" className="h-9 w-9 text-zinc-900 fill-current shrink-0">
                          <path d="M45.5,108.5 C40,108.5 35,105 31.5,100 C25,90.5 24,78.5 29.5,66.5 C34.5,55.5 45.5,43.5 56.5,33.5 C59.5,31 62.5,28 65,25.5 C66.5,24 68.5,22.5 70,22.5 C71.5,22.5 72,23.5 72,25 C72.5,30.5 70.5,37 67,43.5 C62.5,52 56,61 49.5,69.5 C46,74 42.5,78 40.5,82 C39,85 39,87.5 40.5,89 C42,90.5 44.5,90.5 47.5,89 C51.5,87 56,83.5 61,79 C68,72.5 75.5,65 82.5,57 C85.5,53.5 88.5,50 91,47 C92.5,45.5 94,44.5 95,44.5 C96,44.5 96.5,45.5 96.5,47 C96.5,52.5 93.5,59.5 88.5,67 C82.5,76 74.5,85 66.5,93 C61.5,98 56.5,102.5 52,105.5 C49.5,107.5 47.5,108.5 45.5,108.5 Z" />
                          <path d="M72.5,20.5 C74.5,20.5 76.5,22.5 76.5,25.5 C76.5,29.5 73.5,34.5 68.5,38.5 C66.5,40 64.5,40.5 63.5,39.5 C62.5,38.5 63,36 64.5,33.5 C67.5,28.5 70.5,22.5 72.5,20.5 Z" />
                        </svg>
                        <div className="flex flex-col text-left text-zinc-900 leading-none">
                          <span className="font-extrabold text-[11px] tracking-[0.08em] font-sans">ATLANTIS</span>
                          <span className="font-bold text-[8.5px] tracking-[0.25em] mt-0.5 pl-[1px] font-sans">PRESS</span>
                        </div>
                      </div>
                      <div className="text-center max-w-[70%] mx-auto flex flex-col items-center">
                        {journalLine && (
                          <div className="text-zinc-900 italic text-[10.5px] leading-tight font-medium">
                            {journalLine}
                          </div>
                        )}
                        {article.conferenceLine && (
                          <div className="text-[9.5px] leading-tight font-normal text-zinc-800 mt-1.5 max-w-[95%]">
                            {article.conferenceLine}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Subsequent Pages Header */
                    renderSubsequentHeader()
                  )}

                  {isFirstPage && (
                    /* First Page Metadata: Title, Authors, Affiliations, Keywords, Abstract */
                    <div className="mb-6">
                      <h1 className="text-center font-bold text-[20px] leading-tight text-zinc-900 mb-4 max-w-[95%] mx-auto">
                        {article.title || 'Untitled Research Article'}
                      </h1>
                      <div className="text-center text-[12.5px] text-zinc-900 mb-1.5 font-medium">
                        {article.authors || 'Author Names'}
                      </div>
                      <div className="text-center text-[10.5px] text-zinc-700 mb-5 max-w-[90%] mx-auto leading-relaxed">
                        {article.affiliation || 'Department, University, City, Country'}
                      </div>

                      <div className="mx-[0.4in] space-y-2.5 mb-6 text-[11px] leading-[1.35] text-zinc-900 text-justify border-b border-zinc-100 pb-5">
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
                    </div>
                  )}

                  {/* Render Page Items Dynamically */}
                  <div className="space-y-4 text-[11.5px] leading-[1.4] text-zinc-900">
                    {pageItems.map((item) => {
                      if (item.type === 'heading') {
                        return (
                          <h2 key={item.id} className="font-bold text-[13.5px] text-zinc-900 mt-4 mb-2">
                            {item.headingText}
                          </h2>
                        );
                      }
                      if (item.type === 'paragraph' && item.paragraphText) {
                        const isBullet = item.paragraphText.startsWith('• ') || item.paragraphText.match(/^\d+\.\s/);
                        const isFirstOfSection = !isBullet && pageItems[pageItems.indexOf(item) - 1]?.type === 'heading';

                        return (
                          <p key={item.id} className={`text-justify mb-2.5 leading-relaxed ${isBullet ? 'pl-4' : isFirstOfSection ? '' : 'indent-6'}`}>
                            {item.paragraphText}
                          </p>
                        );
                      }
                      if (item.type === 'figure' && item.figure) {
                        return renderFigure(item.figure);
                      }
                      if (item.type === 'table' && item.table) {
                        return renderTable(item.table);
                      }
                      if (item.type === 'references' && item.references) {
                        return (
                          <div key={item.id} className="mt-8">
                            <h3 className="font-bold text-[13px] text-zinc-900 mb-2.5 border-b border-zinc-200 pb-1">
                              References
                            </h3>
                            <div className="space-y-1.5 text-[9.5px] leading-relaxed">
                              {item.references.map((ref, idx) => {
                                const cleaned = ref.replace(/^\[?\d+\]\.?\s*/, '').trim();
                                return (
                                  <div key={idx} className="text-justify flex items-start gap-1">
                                    <span className="shrink-0 font-medium">[{idx + 1}].</span>
                                    <span>{cleaned}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>

                {/* Page Footer */}
                {isFirstPage ? (
                  <div className="border-t border-zinc-200 pt-3 flex justify-between items-end text-[9.5px] text-zinc-700 select-none">
                    <div className="space-y-0.5 leading-normal flex-1">
                      <div>{copyrightLine}</div>
                      <div>{article.licenseLine}</div>
                    </div>
                    <div className="text-right shrink-0 pl-4 font-sans font-medium text-[11px]">
                      {pageNum}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end text-[11px] font-sans font-medium text-zinc-700 select-none">
                    {pageNum}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Fallback / Continuous Scroll View */
        <div id="paperPreview" className="paper-page bg-paper text-ink p-14 relative shadow-2xl rounded-sm font-serif max-w-full text-zinc-900 select-text" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
          {/* Masthead matching Atlantis Press layout exactly */}
          <div className="relative select-none mb-10 pb-4 min-h-[3.25rem] flex flex-col items-center justify-center border-b border-zinc-300">
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

          <h1 className="text-center font-bold text-[22px] leading-tight text-zinc-900 mb-5 max-w-[95%] mx-auto">
            {article.title || 'Untitled Research Article'}
          </h1>

          <div className="text-center text-[13.5px] text-zinc-900 mb-2 font-medium">
            {article.authors || 'Author Names'}
          </div>

          <div className="text-center text-[11px] text-zinc-700 mb-6 max-w-[90%] mx-auto leading-relaxed">
            {article.affiliation || 'Department, University, City, Country'}
          </div>

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

          <div className={layoutColumns === 2 ? 'grid grid-cols-2 gap-6' : 'space-y-5'}>
            {article.sections.map((sec) => {
              const hasHeading = sec.heading.trim().length > 0;
              const hasParagraphs = sec.paragraphs.length > 0;
              const hasFigs = sec.figures.length > 0;
              const hasTbls = sec.tables.length > 0;

              if (!hasHeading && !hasParagraphs && !hasFigs && !hasTbls) return null;

              const renderedFigIds = new Set<string>();
              const renderedTblIds = new Set<string>();

              return (
                <div key={sec.id} className="space-y-3.5 break-inside-avoid-page">
                  {hasHeading && (
                    <h2 className="font-bold text-[14.5px] text-zinc-900 mt-6 mb-3">
                      {sec.heading}
                    </h2>
                  )}

                  {sec.paragraphs.map((p, pIdx) => {
                    const isFirstParagraph = pIdx === 0;
                    return (
                      <React.Fragment key={pIdx}>
                        <p className={`text-[12.5px] leading-[1.45] text-justify text-zinc-900 mb-3 ${isFirstParagraph ? '' : 'indent-6'}`}>
                          {p}
                        </p>

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

                  {sec.figures
                    .filter((fig) => !renderedFigIds.has(fig.id))
                    .map((fig) => renderFigure(fig))}

                  {sec.tables
                    .filter((tbl) => !renderedTblIds.has(tbl.id))
                    .map((tbl) => renderTable(tbl))}
                </div>
              );
            })}
          </div>

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

          <div className="mt-16 pt-4 font-serif text-[10px] text-zinc-800 select-none flex justify-between items-end border-t border-zinc-200">
            <div className="space-y-1 text-[9.5px] leading-normal text-zinc-700 flex-1">
              <div>Copyright © {article.copyrightYear}, the Authors. Published by {article.publisher}.</div>
              <div>{article.licenseLine}</div>
            </div>
            <div className="text-right shrink-0 pl-4">
              <span className="text-[11.5px] text-zinc-800">{article.startPageNumber || '1222'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
