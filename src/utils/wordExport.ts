import { ArticleState, Figure, Table } from '../types';

/**
 * Escapes characters for safe HTML parsing
 */
function esc(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Normalizes text to handle empty elements safely
 */
function slugify(s: string): string {
  return (s || 'galley')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'galley';
}

/**
 * Generates Microsoft Word-compliant XML-HTML structure
 */
export function generateWordHtml(state: ArticleState): string {
  const journalLine = [
    state.journalName,
    state.volume ? `volume ${state.volume}` : ''
  ].filter(Boolean).join(', ');

  const copyrightLine = `Copyright © ${state.copyrightYear}, the Authors. Published by ${state.publisher}.`;

  // Render sections
  let sectionsHtml = '';
  state.sections.forEach((sec) => {
    const hasHeading = sec.heading.trim().length > 0;
    const hasParagraphs = sec.paragraphs.length > 0;
    const hasFigs = sec.figures.length > 0;
    const hasTbls = sec.tables.length > 0;

    if (!hasHeading && !hasParagraphs && !hasFigs && !hasTbls) return;

    if (hasHeading) {
      sectionsHtml += `<p style="font-family:'Times New Roman', serif; font-weight:bold; font-size:12.5pt; margin:18pt 0 6pt; color:#000000; page-break-after:avoid;">${esc(sec.heading)}</p>`;
    }

    const renderedFigIds = new Set<string>();
    const renderedTblIds = new Set<string>();

    const exportFigure = (fig: Figure) => {
      const normalizedCaption = fig.caption.replace(/^(fig\.|fig|figure)\s*(\d+)\.?\s*/i, 'Figure $2.  ');
      const dotIndex = normalizedCaption.indexOf('.');
      const label = dotIndex !== -1 ? normalizedCaption.substring(0, dotIndex + 1) : 'Figure.';
      const content = dotIndex !== -1 ? normalizedCaption.substring(dotIndex + 1) : normalizedCaption;

      let figHtml = `<div style="text-align:center; margin:14pt 0; page-break-inside:avoid;">`;
      if (fig.imageDataUrl) {
        figHtml += `<img src="${fig.imageDataUrl}" style="max-width:5.5in; display:block; margin:0 auto;" />`;
      } else {
        figHtml += `<div style="border:1px solid #999; background:#eee; padding:20px; font-style:italic; display:inline-block;">[Figure Image placeholder: ${esc(fig.caption)}]</div>`;
      }
      figHtml += `<p style="font-family:'Times New Roman', serif; font-size:10pt; margin:6pt 0 0; text-align:center; color:#333333;">${esc(label)} ${esc(content)}</p></div>`;
      return figHtml;
    };

    const exportTable = (tbl: Table) => {
      const normalizedCaption = tbl.caption.replace(/^(tbl\.|table)\s*(\d+)\.?\s*/i, 'Table $2. ');
      const dotIndex = normalizedCaption.indexOf('.');
      const label = dotIndex !== -1 ? normalizedCaption.substring(0, dotIndex + 1) : 'Table.';
      const content = dotIndex !== -1 ? normalizedCaption.substring(dotIndex + 1) : normalizedCaption;

      let tblHtml = `<div style="margin:14pt 0; text-align:center; page-break-inside:avoid;">`;
      tblHtml += `<p style="font-family:'Times New Roman', serif; font-size:10pt; margin:0 0 6pt; text-align:center; color:#333333;">${esc(label)} ${esc(content)}</p>`;

      let tableStyle = 'width:90%; border-collapse:collapse; margin:0 auto; font-family:\'Times New Roman\', serif; font-size:10pt;';
      let rowBorderStyles = '';

      if (tbl.style === 'booktabs') {
        tableStyle += 'border-top:1.5pt solid black; border-bottom:1.5pt solid black;';
        rowBorderStyles = 'border-bottom:0.5pt solid black;';
      } else if (tbl.style === 'simple') {
        tableStyle += 'border:0.5pt solid #777777;';
      } else {
        tableStyle += 'border:1.5pt solid black;';
      }

      tblHtml += `<table style="${tableStyle}" align="center">`;
      tblHtml += `<tr style="${rowBorderStyles}">`;
      tbl.headers.forEach((h, hIdx) => {
        const align = tbl.alignments[hIdx] || 'center';
        let cellStyle = `padding:5pt; font-weight:bold; text-align:${align};`;
        if (tbl.style === 'grid') {
          cellStyle += 'border:1pt solid black;';
        } else if (tbl.style === 'simple') {
          cellStyle += 'border:0.5pt solid #777777;';
        }
        tblHtml += `<th style="${cellStyle}">${esc(h)}</th>`;
      });
      tblHtml += `</tr>`;

      tbl.rows.forEach((row, rIdx) => {
        const isLastRow = rIdx === tbl.rows.length - 1;
        let trStyle = '';
        if (tbl.style === 'grid') {
          trStyle = '';
        } else if (tbl.style === 'simple' && !isLastRow) {
          trStyle = 'border-bottom:0.5pt solid #cccccc;';
        }

        tblHtml += `<tr style="${trStyle}">`;
        row.forEach((cell, cIdx) => {
          const align = tbl.alignments[cIdx] || 'center';
          let cellStyle = `padding:5pt; text-align:${align};`;
          if (tbl.style === 'grid') {
            cellStyle += 'border:1pt solid black;';
          } else if (tbl.style === 'simple') {
            cellStyle += 'border:0.5pt solid #777777;';
          }
          tblHtml += `<td style="${cellStyle}">${esc(cell)}</td>`;
        });
        tblHtml += `</tr>`;
      });

      tblHtml += `</table></div>`;
      return tblHtml;
    };

    // Paragraphs - fully justified with first-paragraph-no-indent rule to match PDF template
    sec.paragraphs.forEach((p, pIdx) => {
      const isFirstParagraph = pIdx === 0;
      const indentStyle = isFirstParagraph ? '' : 'text-indent: 0.25in;';
      sectionsHtml += `<p style="font-family:'Times New Roman', serif; text-align:justify; font-size:11pt; margin:0 0 8pt; line-height:1.25; color:#000000; ${indentStyle}">${esc(p)}</p>`;

      // Interleaved Figures: if referenced in this paragraph
      sec.figures.forEach((fig) => {
        const figNum = fig.id.replace('fig-', '');
        const isReferenced = p.toLowerCase().includes(`fig. ${figNum}`) ||
                             p.toLowerCase().includes(`figure ${figNum}`) ||
                             p.toLowerCase().includes(`fig.  ${figNum}`);

        if (isReferenced && !renderedFigIds.has(fig.id)) {
          renderedFigIds.add(fig.id);
          sectionsHtml += exportFigure(fig);
        }
      });

      // Interleaved Tables: if referenced in this paragraph
      sec.tables.forEach((tbl) => {
        const tblNum = tbl.id.replace('tbl-', '');
        const isReferenced = p.toLowerCase().includes(`table ${tblNum}`) ||
                             p.toLowerCase().includes(`tbl. ${tblNum}`);

        if (isReferenced && !renderedTblIds.has(tbl.id)) {
          renderedTblIds.add(tbl.id);
          sectionsHtml += exportTable(tbl);
        }
      });
    });

    // Fallbacks for remaining non-referenced figures/tables
    sec.figures.forEach((fig) => {
      if (!renderedFigIds.has(fig.id)) {
        renderedFigIds.add(fig.id);
        sectionsHtml += exportFigure(fig);
      }
    });

    sec.tables.forEach((tbl) => {
      if (!renderedTblIds.has(tbl.id)) {
        renderedTblIds.add(tbl.id);
        sectionsHtml += exportTable(tbl);
      }
    });
  });

  // Assemble full Word HTML Document with namespaces
  return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>${esc(state.title) || 'Galley System Article'}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page Section1 {
  size: 8.27in 11.69in;
  margin: 1in 1in 1in 1in;
  mso-header-margin: .5in;
  mso-footer-margin: .5in;
  mso-header: h1;
  mso-footer: f1;
}
div.Section1 { page: Section1; }
body { font-family: 'Times New Roman', serif; font-size: 11pt; color:#000000; }
</style>
</head>
<body>

<div style='mso-element:header' id=h1>
  <p style='text-align:center; font-style:italic; font-size:9pt; margin:0; font-family:serif;'>${esc(journalLine)}</p>
  ${state.conferenceLine ? `<p style='text-align:center; font-style:italic; font-size:9pt; margin:0; font-family:serif;'>${esc(state.conferenceLine)}</p>` : ''}
  <p style='border-bottom:0.75pt solid black; margin:4pt 0 0;'>&nbsp;</p>
</div>

<div style='mso-element:footer' id=f1>
  <p style='border-top:0.75pt solid black; font-size:8.5pt; margin:0 0 2pt; font-family:serif;'>${copyrightLine}<span style='mso-tab-count:1'>&#9;</span>${state.startPageNumber || '1222'}</p>
  <p style='font-size:8.5pt; margin:0; font-family:serif; color:#555555;'>${esc(state.licenseLine)}</p>
</div>

<div class="Section1">
  <!-- Title -->
  <p style="font-family:'Times New Roman', serif; font-weight:bold; font-size:18pt; text-align:center; margin:0 0 12pt; line-height:1.2;">${esc(state.title) || 'Untitled article'}</p>
  
  <!-- Authors -->
  <p style="font-family:'Times New Roman', serif; text-align:center; font-size:11.5pt; margin:0 0 4pt; font-weight:bold;">${esc(state.authors)}</p>
  
  <!-- Affiliation -->
  <p style="font-family:'Times New Roman', serif; text-align:center; font-size:10.5pt; margin:0 0 16pt; color:#444444;">${esc(state.affiliation)}</p>
  
  <!-- Keywords and Abstract Area (Keywords first, Abstract second, no italicized abstract body, fully justified) -->
  <div style="margin:16pt 0.5in; text-align:justify;">
    ${state.keywords ? `<p style="font-family:'Times New Roman', serif; font-size:10pt; line-height:1.3; margin:0 0 6pt;"><b>Keywords:</b> ${esc(state.keywords)}</p>` : ''}
    ${state.abstract ? `<p style="font-family:'Times New Roman', serif; font-size:10pt; line-height:1.3; margin:0;"><b>Abstract.</b> ${esc(state.abstract)}</p>` : ''}
  </div>

  <!-- Sections & Elements -->
  ${sectionsHtml}

  <!-- References -->
  ${
    state.referencesText.trim()
      ? `<p style="font-family:'Times New Roman', serif; font-weight:bold; font-size:12.5pt; margin:22pt 0 6pt;">References</p>` +
        state.referencesText
          .split('\n')
          .filter(Boolean)
          .map((r, i) => {
            const cleaned = r.replace(/^\[?\d+\]\.?\s*/, '').trim();
            return `<p style="font-family:'Times New Roman', serif; font-size:9.5pt; margin:0 0 6pt; text-align:justify;">[${i + 1}]. ${esc(cleaned)}</p>`;
          })
          .join('')
      : ''
  }
</div>
</body>
</html>`;
}

/**
 * Initiates the client download of the Word Document
 */
export function downloadWordDoc(state: ArticleState): void {
  const html = generateWordHtml(state);
  const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(state.title)}-galley-proof.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
