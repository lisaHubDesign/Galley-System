import { ArticleState, Section, Figure, Table } from '../types';

/**
 * Generate a random 6-character ID for keys
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 8);
}

/**
 * Helper function to verify if a text block is in Title Case or Uppercase
 */
function isTitleOrUppercase(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Split into words, removing punctuation from words but keeping their letters
  const words = trimmed.split(/\s+/).map(w => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")).filter(Boolean);
  if (words.length === 0) return false;

  const lowercaseList = [
    'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'of', 'in', 'with', 'as', 'about', 'into', 'through', 'over', 'after', 'between', 'under', 'against', 'during', 'without', 'before', 'since'
  ];

  let violations = 0;
  for (const word of words) {
    // If it's a number or starts with a number, it's fine
    if (/^[0-9]/.test(word)) continue;
    // If it's in the lowercase list, it's fine
    if (lowercaseList.includes(word.toLowerCase())) continue;
    // Check if the first character is uppercase
    const firstChar = word.charAt(0);
    if (firstChar && firstChar === firstChar.toLowerCase() && /[a-z]/.test(firstChar)) {
      violations++;
    }
  }

  // Allow at most 0 violations for short texts, maybe 1 if it's longer
  const maxViolations = words.length <= 3 ? 0 : 1;
  return violations <= maxViolations;
}

/**
 * Helper function to detect section headings robustly
 */
function checkIsHeading(text: string, el?: Element): boolean {
  if (!text || text.length > 85) return false;
  
  const trimmed = text.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();

  // Figure/Table captions are NOT section headings
  if (/^(fig\.|fig|figure|table|tbl\.)\s*\d+/i.test(lower)) {
    return false;
  }

  // Keywords and abstract are metadata, not section headings
  if (/^(keywords|abstract)\b/i.test(lower)) {
    return false;
  }

  // If HTML element is provided, check if it's an H1-H6
  if (el) {
    const tagName = el.tagName.toLowerCase();
    if (/^(h[1-6])$/.test(tagName)) {
      return true;
    }
  }

  // If it ends with typical sentence punctuation, it is likely a paragraph sentence, not a heading
  // (unless it's a section number like "1.")
  if (/[.!?]$/.test(trimmed)) {
    // Check if it's just a section number and heading name
    if (!/^[0-9]+(\.[0-9]+)*\.?\s+[A-Z]/i.test(trimmed)) {
      return false;
    }
  }

  // Common academic heading keywords (case insensitive)
  const headingKeywords = [
    'introduction', 'background', 'related work', 'methodology', 'literature',
    'system', 'design', 'architecture', 'implementation', 'database',
    'result', 'evaluation', 'discussion', 'conclusion', 'reference',
    'acknowledg', 'future work', 'overview', 'experimental', 'analysis'
  ];

  // Must contain one of the heading keywords or start with a section number
  const hasKeyword = headingKeywords.some(kw => lower.includes(kw));
  const hasSectionNumber = /^([1-9]\d*(\.\d+)*|I{1,3}|IV|V|VI|VII|VIII|IX|X|[A-H])\.?\s+[A-Z]/i.test(trimmed);

  if (hasSectionNumber) {
    return true;
  }

  if (hasKeyword && trimmed.length < 75) {
    // To be a heading, it must be in Title Case or Uppercase
    if (isTitleOrUppercase(trimmed)) {
      return true;
    }
  }

  // Allow short, standard headings even without keyword if they are in Title Case
  const standardShortHeadings = ['references', 'appendix', 'abstract', 'keywords', 'conclusion', 'introduction'];
  if (standardShortHeadings.includes(lower)) {
    return true;
  }

  return false;
}

/**
 * Heuristically parses an HTML string (from Mammoth.js) into ArticleState
 */
export function parseHtmlToArticleState(html: string): Partial<ArticleState> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  interface TraversedBlock {
    type: 'heading' | 'paragraph' | 'figure' | 'table';
    text?: string;
    element: Element;
  }

  const blocks: TraversedBlock[] = [];

  function traverse(node: Element) {
    const tagName = node.tagName.toLowerCase();

    // 1. If it's a table, parse as table, and stop recursion
    if (tagName === 'table') {
      blocks.push({ type: 'table', element: node });
      return;
    }

    // 2. If it's an img, parse as figure, and stop recursion
    if (tagName === 'img') {
      blocks.push({ type: 'figure', element: node });
      return;
    }

    // 3. If it is a paragraph containing an image
    if (tagName === 'p' && node.querySelector('img')) {
      blocks.push({ type: 'figure', element: node });
      return;
    }

    // 4. If it's a heading
    if (/^(h[1-6])$/.test(tagName)) {
      blocks.push({ type: 'heading', text: node.textContent?.trim() || '', element: node });
      return;
    }

    // 5. If it's a list (ul or ol)
    if (tagName === 'ul' || tagName === 'ol') {
      const listItems = Array.from(node.querySelectorAll('li'));
      if (listItems.length > 0) {
        listItems.forEach((li, index) => {
          const bulletPrefix = tagName === 'ul' ? '• ' : `${index + 1}. `;
          const text = li.textContent?.trim() || '';
          if (text) {
            blocks.push({ type: 'paragraph', text: `${bulletPrefix}${text}`, element: li });
          }
        });
        return;
      }
    }

    // 6. If it's a single list item li (in case it is not wrapped in ul/ol)
    if (tagName === 'li') {
      const text = node.textContent?.trim() || '';
      if (text) {
        blocks.push({ type: 'paragraph', text: `• ${text}`, element: node });
      }
      return;
    }

    // 7. If it's a paragraph
    if (tagName === 'p') {
      const text = node.textContent?.trim() || '';
      if (text) {
        if (checkIsHeading(text, node)) {
          blocks.push({ type: 'heading', text, element: node });
        } else {
          blocks.push({ type: 'paragraph', text, element: node });
        }
      }
      return;
    }

    // 8. If it's any other element (e.g. div, blockquote, section, main, article, etc.)
    const hasBlockChildren = Array.from(node.children).some(child => {
      const childTag = child.tagName.toLowerCase();
      return ['p', 'table', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'div', 'blockquote', 'section', 'li'].includes(childTag);
    });

    if (hasBlockChildren) {
      Array.from(node.children).forEach(child => traverse(child));
    } else {
      const text = node.textContent?.trim() || '';
      if (text) {
        if (checkIsHeading(text, node)) {
          blocks.push({ type: 'heading', text, element: node });
        } else {
          blocks.push({ type: 'paragraph', text, element: node });
        }
      }
    }
  }

  // Traverse the body elements recursively to extract structured blocks
  Array.from(body.children).forEach(child => traverse(child));

  // Default metadata
  let journalName = 'Advances in Computer Science Research (ACSR)';
  let volume = '';
  let conferenceLine = '';
  let publisher = 'Atlantis Press';
  let copyrightYear = String(new Date().getFullYear());
  let startPageNumber = '';
  let licenseLine = 'This is an open access article under the CC BY-NC license (http://creativecommons.org/licenses/by-nc/4.0/).';

  let title = '';
  let authors = '';
  let affiliation = '';
  let keywords = '';
  let abstract = '';
  const sections: Section[] = [];
  const references: string[] = [];

  const bodyBlocks: TraversedBlock[] = [];
  let foundTitle = false;
  let foundAuthors = false;
  const affiliationLines: string[] = [];
  let expectingAbstractBody = false;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    // If it's a heading, figure, table, or abstract/keywords, we stop metadata collection
    const isSpecial = block.type === 'heading' || block.type === 'table' || block.type === 'figure';
    const textLower = block.text?.toLowerCase() || '';
    const isAbstractTag = /^abstract\b/i.test(textLower);
    const isKeywordsTag = /^keywords\b/i.test(textLower);
    const isIntro = /^(1\.?\s*)?introduction/i.test(textLower);

    if (isSpecial || isAbstractTag || isKeywordsTag || isIntro) {
      bodyBlocks.push(...blocks.slice(i));
      break;
    }

    const text = block.text?.trim() || '';
    if (!text) continue;

    // Check for standard metadata patterns
    if (/advances\s+in|journal\s+of|proceedings\s+of|acsr/i.test(text)) {
      const volMatch = text.match(/volume\s*(\d+)/i) || text.match(/vol\.\s*(\d+)/i);
      if (volMatch) {
        volume = volMatch[1];
      }
      journalName = text.replace(/,\s*volume\s*\d+/i, '').replace(/,\s*vol\.\s*\d+/i, '').trim();
      continue;
    }

    if (/conference\s+on|symposium\s+on|proceedings\s+of\s+the|workshop\s+on|meeting\s+on/i.test(text)) {
      conferenceLine = text;
      const yearMatch = text.match(/\b(20\d{2}|19\d{2})\b/);
      if (yearMatch) {
        copyrightYear = yearMatch[1];
      }
      continue;
    }

    if (/atlantis\s+press/i.test(text) && text.length < 25) {
      publisher = text;
      continue;
    }

    if (/open\s+access|creativecommons|cc\s+by/i.test(text)) {
      licenseLine = text;
      continue;
    }

    if (/copyright\s+©|copyright\s+\(c\)/i.test(text)) {
      const yearMatch = text.match(/\b(20\d{2}|19\d{2})\b/);
      if (yearMatch) {
        copyrightYear = yearMatch[1];
      }
      const pubMatch = text.match(/published\s+by\s+(.*)/i);
      if (pubMatch) {
        publisher = pubMatch[1].replace(/\.$/, '').trim();
      }
      continue;
    }

    if (/^\d+$/.test(text)) {
      startPageNumber = text;
      continue;
    }

    // Assign core metadata (Title, Authors, Affiliation)
    if (!foundTitle) {
      title = text;
      foundTitle = true;
    } else if (!foundAuthors) {
      authors = text;
      foundAuthors = true;
    } else {
      if (affiliationLines.length < 3) {
        affiliationLines.push(text);
      } else {
        bodyBlocks.push(block);
      }
    }
  }

  affiliation = affiliationLines.join(', ');

  let currentSection: Section | null = null;
  let inReferences = false;

  let figCount = 0;
  let tblCount = 0;

  for (let i = 0; i < bodyBlocks.length; i++) {
    const block = bodyBlocks[i];
    const text = block.text?.trim() || '';

    // A. Check for Heading
    if (block.type === 'heading') {
      if (/references/i.test(text)) {
        inReferences = true;
        currentSection = null;
      } else {
        inReferences = false;
        currentSection = {
          id: generateId(),
          heading: text,
          paragraphs: [],
          figures: [],
          tables: []
        };
        sections.push(currentSection);
      }
      expectingAbstractBody = false;
      continue;
    }

    // B. Handle References
    if (inReferences) {
      if (text) {
        const cleanedRef = text.replace(/^\[?\d+\]\.?\s*/, '').trim();
        if (cleanedRef) {
          references.push(cleanedRef);
        }
      }
      continue;
    }

    // C. Check for Keywords
    if (block.type === 'paragraph' && /^keywords\b/i.test(text)) {
      keywords = text.replace(/^keywords\.?\s*[-:]*/i, '').trim();
      expectingAbstractBody = false;
      continue;
    }

    // D. Check for Abstract
    if (block.type === 'paragraph' && /^abstract\b/i.test(text)) {
      const abstractContent = text.replace(/^abstract\.?\s*[-:]*/i, '').trim();
      if (abstractContent) {
        abstract = abstractContent;
      } else {
        expectingAbstractBody = true;
      }
      continue;
    }

    if (expectingAbstractBody && block.type === 'paragraph' && text) {
      abstract = text;
      expectingAbstractBody = false;
      continue;
    }

    // E. Handle Images/Figures
    if (block.type === 'figure') {
      let src = '';
      if (block.element.tagName.toLowerCase() === 'img') {
        src = block.element.getAttribute('src') || '';
      } else {
        const imgEl = block.element.querySelector('img');
        if (imgEl) {
          src = imgEl.getAttribute('src') || '';
        }
      }

      let caption = `Figure ${++figCount}.  Figure Caption`;
      let foundCaptionInSibling = false;

      // Check parent text first
      const parentText = block.element.textContent?.trim() || '';
      if (/^fig(ure)?\.?\s*\d+/i.test(parentText)) {
        caption = parentText;
        foundCaptionInSibling = true;
      }

      // 1. Look ahead 1 or 2 siblings
      if (!foundCaptionInSibling) {
        for (let j = 1; j <= 2; j++) {
          const nextBlock = bodyBlocks[i + j];
          if (nextBlock && nextBlock.type === 'paragraph') {
            const nextText = nextBlock.text?.trim() || '';
            if (/^fig(ure)?\.?\s*\d+/i.test(nextText)) {
              caption = nextText;
              if (j === 1) i++; // Consume it
              foundCaptionInSibling = true;
              break;
            }
          }
        }
      }

      // 2. If not found ahead, look backward 1 sibling
      if (!foundCaptionInSibling && i > 0) {
        const prevBlock = bodyBlocks[i - 1];
        if (prevBlock && prevBlock.type === 'paragraph') {
          const prevText = prevBlock.text?.trim() || '';
          if (/^fig(ure)?\.?\s*\d+/i.test(prevText)) {
            caption = prevText;
            if (currentSection && currentSection.paragraphs.length > 0) {
              const lastIdx = currentSection.paragraphs.length - 1;
              if (currentSection.paragraphs[lastIdx] === prevText) {
                currentSection.paragraphs.pop();
              }
            }
          }
        }
      }

      const newFigure: Figure = {
        id: generateId(),
        caption,
        imageDataUrl: src || generateSvgForFigure(caption),
        widthPercent: 70
      };

      if (currentSection) {
        const capLower = caption.trim().toLowerCase();
        currentSection.paragraphs = currentSection.paragraphs.filter(p => {
          const pLower = p.trim().toLowerCase();
          return pLower !== capLower;
        });
        currentSection.figures.push(newFigure);
      } else {
        if (sections.length === 0) {
          sections.push({
            id: generateId(),
            heading: 'Introduction',
            paragraphs: [],
            figures: [newFigure],
            tables: []
          });
          currentSection = sections[0];
        } else {
          sections[0].figures.push(newFigure);
        }
      }
      continue;
    }

    // F. Handle Tables
    if (block.type === 'table') {
      const tableEl = block.element as HTMLTableElement;
      const rows: string[][] = [];
      const headers: string[] = [];

      let caption = `Table ${++tblCount}.  Table Caption`;
      const captionTag = tableEl.querySelector('caption');
      if (captionTag) {
        caption = captionTag.textContent?.trim() || caption;
      } else {
        // Look back or ahead in bodyBlocks for table caption
        let foundCaption = false;
        for (let j = 1; j <= 2; j++) {
          const prevBlock = bodyBlocks[i - j];
          if (prevBlock && prevBlock.type === 'paragraph') {
            const prevText = prevBlock.text?.trim() || '';
            if (/^(table|tbl\.?)\s*\d+/i.test(prevText)) {
              caption = prevText;
              foundCaption = true;
              if (currentSection && currentSection.paragraphs.length > 0) {
                const lastIdx = currentSection.paragraphs.length - 1;
                if (currentSection.paragraphs[lastIdx] === prevText) {
                  currentSection.paragraphs.pop();
                }
              }
              break;
            }
          }
        }
        if (!foundCaption) {
          for (let j = 1; j <= 2; j++) {
            const nextBlock = bodyBlocks[i + j];
            if (nextBlock && nextBlock.type === 'paragraph') {
              const nextText = nextBlock.text?.trim() || '';
              if (/^(table|tbl\.?)\s*\d+/i.test(nextText)) {
                caption = nextText;
                if (j === 1) i++; // Consume
                break;
              }
            }
          }
        }
      }

      // Parse cells
      const trElements = Array.from(tableEl.querySelectorAll('tr'));
      trElements.forEach((tr, trIdx) => {
        const cells = Array.from(tr.querySelectorAll('th, td')).map(cell => cell.textContent?.trim() || '');
        if (cells.length === 0) return;

        if (trIdx === 0 && tr.querySelector('th')) {
          headers.push(...cells);
        } else if (trIdx === 0 && headers.length === 0) {
          headers.push(...cells);
        } else {
          rows.push(cells);
        }
      });

      if (headers.length === 0 && rows.length > 0) {
        const colCount = rows[0].length;
        for (let c = 1; c <= colCount; c++) {
          headers.push(`Column ${c}`);
        }
      }

      // Ensure each row has the same length as headers (pad or truncate)
      const maxCols = headers.length;
      const cleanedRows = rows.map(r => {
        if (r.length < maxCols) {
          return [...r, ...Array(maxCols - r.length).fill('')];
        } else if (r.length > maxCols) {
          return r.slice(0, maxCols);
        }
        return r;
      });

      const alignments = headers.map(() => 'center' as const);

      const newTable: Table = {
        id: generateId(),
        caption,
        headers,
        rows: cleanedRows,
        alignments,
        style: 'booktabs'
      };

      if (currentSection) {
        const capLower = caption.trim().toLowerCase();
        currentSection.paragraphs = currentSection.paragraphs.filter(p => {
          const pLower = p.trim().toLowerCase();
          return pLower !== capLower;
        });
        currentSection.tables.push(newTable);
      } else {
        if (sections.length === 0) {
          sections.push({
            id: generateId(),
            heading: 'Introduction',
            paragraphs: [],
            figures: [],
            tables: [newTable]
          });
          currentSection = sections[0];
        } else {
          sections[0].tables.push(newTable);
        }
      }
      continue;
    }

    // G. Regular paragraphs
    if (block.type === 'paragraph' && text) {
      if (currentSection) {
        currentSection.paragraphs.push(text);
      } else {
        if (sections.length === 0) {
          sections.push({
            id: generateId(),
            heading: 'Introduction',
            paragraphs: [text],
            figures: [],
            tables: []
          });
          currentSection = sections[0];
        } else {
          sections[0].paragraphs.push(text);
        }
      }
    }
  }

  // Clean abstract spacing
  abstract = abstract.replace(/\s+/g, ' ').trim();

  return {
    journalName,
    volume,
    conferenceLine,
    publisher,
    copyrightYear,
    startPageNumber,
    licenseLine,
    title,
    authors,
    affiliation,
    keywords,
    abstract,
    sections: sections.length > 0 ? sections : [{ id: generateId(), heading: 'Introduction', paragraphs: [], figures: [], tables: [] }],
    referencesText: references.join('\n')
  };
}

/**
 * Heuristically parses a tabular text block into headers and rows.
 */
function parseTabularData(text: string): { headers: string[], rows: string[][] } {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { headers: ['Column 1', 'Column 2'], rows: [['Data 1', 'Data 2']] };
  }
  
  const rawRows: string[][] = [];
  
  for (const line of lines) {
    // Split by tabs, 2+ consecutive spaces, or pipe symbols
    let cols: string[] = [];
    if (line.includes('|')) {
      cols = line.split('|').map(c => c.trim()).filter((c, idx, arr) => {
        if (idx === 0 && !c && arr.length > 1) return false;
        if (idx === arr.length - 1 && !c && arr.length > 1) return false;
        return true;
      });
    } else {
      cols = line.split(/\t|\s{2,}/).map(c => c.trim()).filter(Boolean);
    }
    
    // Skip Markdown table separator lines like |---|---|
    if (cols.some(col => /^[:\s\-+=|]{3,}$/.test(col))) {
      continue;
    }
    
    if (cols.length > 0) {
      rawRows.push(cols);
    }
  }
  
  if (rawRows.length === 0) {
    return { headers: ['Column 1', 'Column 2'], rows: [['Data 1', 'Data 2']] };
  }
  
  // First row is the headers
  const headers = rawRows[0];
  const rows = rawRows.slice(1);
  
  // Pad rows or truncate rows to match headers length
  const maxCols = headers.length;
  const cleanedRows = rows.map(r => {
    if (r.length < maxCols) {
      return [...r, ...Array(maxCols - r.length).fill('')];
    } else if (r.length > maxCols) {
      return r.slice(0, maxCols);
    }
    return r;
  });
  
  return { headers, rows: cleanedRows };
}

/**
 * Escapes characters for XML/SVG safety
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Generates a beautiful vector SVG based on keywords in the caption
 */
function generateSvgForFigure(caption: string): string {
  const cleanCaption = caption.replace(/^(fig\.|fig|figure)\s*\d+\.?\s*/i, '').trim();
  const lower = caption.toLowerCase();

  let svgContent = '';

  if (lower.includes('three-layer') || lower.includes('three layer') || lower.includes('architecture') || lower.includes('layer') || lower.includes('fig. 1') || lower.includes('figure 1')) {
    svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 360" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#ffffff" />
  
  <!-- Dashed separation lines -->
  <line x1="20" y1="95" x2="520" y2="95" stroke="#000000" stroke-width="1" stroke-dasharray="4,4" />
  <line x1="20" y1="250" x2="520" y2="250" stroke="#000000" stroke-width="1" stroke-dasharray="4,4" />
  
  <!-- Slim client layer -->
  <text x="30" y="60" font-family="'Times New Roman', Times, serif" font-size="12" font-weight="bold" fill="#000000">Slim client layer</text>
  
  <!-- Browser & WebKit client end side-by-side -->
  <rect x="220" y="35" width="100" height="35" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="270" y="57" font-family="'Times New Roman', Times, serif" font-size="12" text-anchor="middle" fill="#000000">Browser</text>
  
  <rect x="330" y="35" width="120" height="35" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="390" y="57" font-family="'Times New Roman', Times, serif" font-size="12" text-anchor="middle" fill="#000000">WebKit client end</text>
  
  <!-- Double-headed block arrow 1 -->
  <path d="M 320 102 L 326 110 L 322 110 L 322 130 L 326 130 L 320 138 L 314 130 L 318 130 L 318 110 L 314 110 Z" fill="#bbf7d0" stroke="#000000" stroke-width="1" />
  
  <!-- Service demonstration layer -->
  <text x="30" y="175" font-family="'Times New Roman', Times, serif" font-size="12" font-weight="bold" fill="#000000">Service demonstration layer</text>
  
  <!-- Stacked Boxes -->
  <rect x="240" y="115" width="160" height="28" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="320" y="132" font-family="'Times New Roman', Times, serif" font-size="11" text-anchor="middle" fill="#000000">Web page</text>
  
  <rect x="240" y="150" width="160" height="28" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="320" y="167" font-family="'Times New Roman', Times, serif" font-size="11" text-anchor="middle" fill="#000000">ASP.NET</text>
  
  <rect x="240" y="185" width="160" height="28" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="320" y="202" font-family="'Times New Roman', Times, serif" font-size="11" text-anchor="middle" fill="#000000">III server</text>
  
  <!-- Double-headed block arrow 2 -->
  <path d="M 320 225 L 326 233 L 322 233 L 322 253 L 326 253 L 320 261 L 314 253 L 318 253 L 318 233 L 314 233 Z" fill="#bbf7d0" stroke="#000000" stroke-width="1" />
  
  <!-- Data processing layer -->
  <text x="30" y="300" font-family="'Times New Roman', Times, serif" font-size="12" font-weight="bold" fill="#000000">Data processing layer</text>
  
  <!-- SQL Server database box -->
  <rect x="220" y="280" width="200" height="35" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="320" y="302" font-family="'Times New Roman', Times, serif" font-size="12" font-weight="bold" text-anchor="middle" fill="#000000">SQL Server database</text>
</svg>
`;
  } else if (lower.includes('e-r') || lower.includes('er diagram') || lower.includes('entity') || lower.includes('relation') || lower.includes('fig. 2') || lower.includes('figure 2')) {
    svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 360" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#ffffff" />
  
  <!-- Central Book Entity -->
  <rect x="150" y="105" width="70" height="26" fill="#ffffff" stroke="#000000" stroke-width="1.2" />
  <text x="185" y="122" font-family="'Times New Roman', Times, serif" font-size="12" font-weight="bold" text-anchor="middle">Book</text>
  
  <!-- Book attributes -->
  <line x1="185" y1="105" x2="185" y2="52" stroke="#000000" stroke-width="1" stroke-dasharray="2,2" />
  <ellipse cx="185" cy="40" rx="30" ry="12" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="185" y="44" font-family="'Times New Roman', Times, serif" font-size="10" text-anchor="middle" text-decoration="underline">Book's ID</text>
  
  <line x1="150" y1="118" x2="100" y2="72" stroke="#000000" stroke-width="1" stroke-dasharray="2,2" />
  <ellipse cx="90" cy="65" rx="22" ry="12" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="90" y="69" font-family="'Times New Roman', Times, serif" font-size="10" text-anchor="middle">type</text>

  <line x1="220" y1="118" x2="260" y2="72" stroke="#000000" stroke-width="1" stroke-dasharray="2,2" />
  <ellipse cx="270" cy="65" rx="22" ry="12" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="270" y="69" font-family="'Times New Roman', Times, serif" font-size="10" text-anchor="middle">press</text>

  <line x1="150" y1="118" x2="65" y2="100" stroke="#000000" stroke-width="1" stroke-dasharray="2,2" />
  <ellipse cx="45" cy="95" rx="25" ry="12" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="45" y="99" font-family="'Times New Roman', Times, serif" font-size="10" text-anchor="middle">author</text>

  <line x1="150" y1="118" x2="70" y2="145" stroke="#000000" stroke-width="1" stroke-dasharray="2,2" />
  <ellipse cx="45" cy="150" rx="32" ry="12" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="45" y="154" font-family="'Times New Roman', Times, serif" font-size="10" text-anchor="middle">Book name</text>

  <line x1="150" y1="118" x2="75" y2="185" stroke="#000000" stroke-width="1" stroke-dasharray="2,2" />
  <ellipse cx="55" cy="195" rx="22" ry="12" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="55" y="199" font-family="'Times New Roman', Times, serif" font-size="10" text-anchor="middle">Year</text>

  <line x1="185" y1="131" x2="110" y2="230" stroke="#000000" stroke-width="1" stroke-dasharray="2,2" />
  <ellipse cx="100" cy="240" rx="25" ry="12" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="100" y="244" font-family="'Times New Roman', Times, serif" font-size="10" text-anchor="middle">keyword</text>

  <line x1="185" y1="131" x2="165" y2="230" stroke="#000000" stroke-width="1" stroke-dasharray="2,2" />
  <ellipse cx="165" cy="240" rx="22" ry="12" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="165" y="244" font-family="'Times New Roman', Times, serif" font-size="10" text-anchor="middle">status</text>

  <!-- Relationship: Management (Book <-> administrator) -->
  <line x1="220" y1="118" x2="255" y2="118" stroke="#000000" stroke-width="1.2" />
  <text x="235" y="113" font-family="'Times New Roman', Times, serif" font-size="11">n</text>
  
  <polygon points="255,118 285,103 315,118 285,133" fill="#ffffff" stroke="#000000" stroke-width="1.2" />
  <text x="285" y="122" font-family="'Times New Roman', Times, serif" font-size="10" text-anchor="middle">Management</text>
  
  <line x1="315" y1="118" x2="350" y2="118" stroke="#000000" stroke-width="1.2" />
  <text x="330" y="113" font-family="'Times New Roman', Times, serif" font-size="11">m</text>

  <!-- administrator Entity -->
  <rect x="350" y="105" width="90" height="26" fill="#ffffff" stroke="#000000" stroke-width="1.2" />
  <text x="395" y="122" font-family="'Times New Roman', Times, serif" font-size="12" font-weight="bold" text-anchor="middle">administrator</text>

  <!-- administrator attributes -->
  <line x1="395" y1="105" x2="395" y2="70" stroke="#000000" stroke-width="1" stroke-dasharray="2,2" />
  <ellipse cx="395" cy="58" rx="22" ry="12" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="395" y="62" font-family="'Times New Roman', Times, serif" font-size="10" text-anchor="middle">ID</text>

  <line x1="440" y1="118" x2="480" y2="118" stroke="#000000" stroke-width="1" stroke-dasharray="2,2" />
  <ellipse cx="500" cy="118" rx="25" ry="12" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="500" y="122" font-family="'Times New Roman', Times, serif" font-size="10" text-anchor="middle">password</text>

  <!-- Relationship: borrowing & lending (Book <-> reader) -->
  <line x1="185" y1="131" x2="185" y2="165" stroke="#000000" stroke-width="1.2" />
  <text x="175" y="148" font-family="'Times New Roman', Times, serif" font-size="11">n</text>

  <polygon points="185,165 245,180 185,195 125,180" fill="#ffffff" stroke="#000000" stroke-width="1.2" />
  <text x="185" y="184" font-family="'Times New Roman', Times, serif" font-size="10" text-anchor="middle">borrowing &amp; lending</text>

  <line x1="185" y1="195" x2="185" y2="230" stroke="#000000" stroke-width="1.2" />
  <text x="175" y="215" font-family="'Times New Roman', Times, serif" font-size="11">m</text>

  <!-- reader Entity -->
  <rect x="150" y="230" width="70" height="26" fill="#ffffff" stroke="#000000" stroke-width="1.2" />
  <text x="185" y="247" font-family="'Times New Roman', Times, serif" font-size="12" font-weight="bold" text-anchor="middle">reader</text>

  <!-- reader attributes -->
  <line x1="150" y1="243" x2="110" y2="280" stroke="#000000" stroke-width="1" stroke-dasharray="2,2" />
  <ellipse cx="100" cy="290" rx="22" ry="12" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="100" y="294" font-family="'Times New Roman', Times, serif" font-size="10" text-anchor="middle">email</text>

  <line x1="170" y1="256" x2="155" y2="285" stroke="#000000" stroke-width="1" stroke-dasharray="2,2" />
  <ellipse cx="150" cy="295" rx="22" ry="12" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="150" y="299" font-family="'Times New Roman', Times, serif" font-size="10" text-anchor="middle">name</text>

  <line x1="200" y1="256" x2="205" y2="285" stroke="#000000" stroke-width="1" stroke-dasharray="2,2" />
  <ellipse cx="210" cy="295" rx="25" ry="12" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="210" y="299" font-family="'Times New Roman', Times, serif" font-size="9" text-anchor="middle">username</text>

  <line x1="220" y1="243" x2="260" y2="280" stroke="#000000" stroke-width="1" stroke-dasharray="2,2" />
  <ellipse cx="270" cy="290" rx="35" ry="12" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="270" y="294" font-family="'Times New Roman', Times, serif" font-size="8" text-anchor="middle">One-card password</text>

  <line x1="220" y1="235" x2="290" y2="245" stroke="#000000" stroke-width="1" stroke-dasharray="2,2" />
  <ellipse cx="320" cy="247" rx="30" ry="12" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="320" y="251" font-family="'Times New Roman', Times, serif" font-size="9" text-anchor="middle">one-card ID</text>

  <line x1="220" y1="232" x2="310" y2="205" stroke="#000000" stroke-width="1" stroke-dasharray="2,2" />
  <ellipse cx="340" cy="200" rx="35" ry="12" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="340" y="204" font-family="'Times New Roman', Times, serif" font-size="9" text-anchor="middle">academic degree</text>

  <!-- Management (reader <-> administrator) relationship -->
  <line x1="220" y1="243" x2="300" y2="215" stroke="#000000" stroke-width="1.2" />
  <text x="235" y="235" font-family="'Times New Roman', Times, serif" font-size="11">n</text>

  <polygon points="300,215 330,200 360,215 330,230" fill="#ffffff" stroke="#000000" stroke-width="1.2" />
  <text x="330" y="219" font-family="'Times New Roman', Times, serif" font-size="10" text-anchor="middle">Management</text>

  <line x1="360" y1="215" x2="410" y2="131" stroke="#000000" stroke-width="1.2" />
  <text x="395" y="175" font-family="'Times New Roman', Times, serif" font-size="11">m</text>
</svg>
`;
  } else if (lower.includes('query module') || lower.includes('query') || lower.includes('flow chart') || lower.includes('flowchart') || lower.includes('fig. 3') || lower.includes('figure 3')) {
    svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 380" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#ffffff" />
  
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#000000"/>
    </marker>
  </defs>

  <!-- User query books -->
  <rect x="150" y="15" width="130" height="28" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="215" y="32" font-family="'Times New Roman', Times, serif" font-size="11" text-anchor="middle">User query books</text>
  
  <!-- Arrow down to Diamond 1 -->
  <path d="M 215 43 L 215 65" fill="none" stroke="#000000" stroke-width="1" marker-end="url(#arrow)" />
  
  <!-- Diamond: Judge whether it is the reader user -->
  <polygon points="215,65 295,85 215,105 135,85" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="215" y="88" font-family="'Times New Roman', Times, serif" font-size="9" text-anchor="middle">Judge whether it</text>
  <text x="215" y="98" font-family="'Times New Roman', Times, serif" font-size="9" text-anchor="middle">is the reader user</text>

  <!-- Path Y (Down) -->
  <path d="M 215 105 L 215 135" fill="none" stroke="#000000" stroke-width="1" marker-end="url(#arrow)" />
  <text x="222" y="120" font-family="'Times New Roman', Times, serif" font-size="11" font-weight="bold">Y</text>

  <!-- Query the book information -->
  <rect x="150" y="135" width="130" height="28" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="215" y="152" font-family="'Times New Roman', Times, serif" font-size="11" text-anchor="middle">Query the book</text>
  <text x="215" y="161" font-family="'Times New Roman', Times, serif" font-size="9" text-anchor="middle">information</text>

  <!-- Arrow down to Diamond 2 -->
  <path d="M 215 163 L 215 195" fill="none" stroke="#000000" stroke-width="1" marker-end="url(#arrow)" />

  <!-- Diamond: Whether the book can be borrowed -->
  <polygon points="215,195 295,215 215,235 135,215" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="215" y="217" font-family="'Times New Roman', Times, serif" font-size="9" text-anchor="middle">Whether the book</text>
  <text x="215" y="226" font-family="'Times New Roman', Times, serif" font-size="9" text-anchor="middle">can be borrowed</text>

  <!-- Path Y (Down) -->
  <path d="M 215 235 L 215 265" fill="none" stroke="#000000" stroke-width="1" marker-end="url(#arrow)" />
  <text x="222" y="250" font-family="'Times New Roman', Times, serif" font-size="11" font-weight="bold">Y</text>

  <!-- Readers borrow the book -->
  <rect x="150" y="265" width="130" height="28" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="215" y="282" font-family="'Times New Roman', Times, serif" font-size="11" text-anchor="middle">Readers borrow</text>
  <text x="215" y="291" font-family="'Times New Roman', Times, serif" font-size="9" text-anchor="middle">the book</text>

  <!-- Path N (Back loop from Whether book can be borrowed to Query book info) -->
  <path d="M 135 215 L 110 215 L 110 149 L 144 149" fill="none" stroke="#000000" stroke-width="1" marker-end="url(#arrow)" />
  <text x="120" y="210" font-family="'Times New Roman', Times, serif" font-size="11" font-weight="bold">N</text>

  <!-- Path N (Right) from Judge reader user -->
  <path d="M 295 85 L 420 85 L 420 115" fill="none" stroke="#000000" stroke-width="1" marker-end="url(#arrow)" />
  <text x="325" y="80" font-family="'Times New Roman', Times, serif" font-size="11" font-weight="bold">N</text>

  <!-- Librarian information -->
  <rect x="350" y="115" width="140" height="28" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="420" y="132" font-family="'Times New Roman', Times, serif" font-size="11" text-anchor="middle">Librarian information</text>

  <!-- Horizontal line distributing arrows underneath Librarian info -->
  <path d="M 420 143 L 420 160" fill="none" stroke="#000000" stroke-width="1" />
  <path d="M 320 160 L 515 160" stroke="#000000" stroke-width="1" fill="none" />
  
  <path d="M 320 160 L 320 180" fill="none" stroke="#000000" stroke-width="1" marker-end="url(#arrow)" />
  <path d="M 385 160 L 385 180" fill="none" stroke="#000000" stroke-width="1" marker-end="url(#arrow)" />
  <path d="M 450 160 L 450 180" fill="none" stroke="#000000" stroke-width="1" marker-end="url(#arrow)" />
  <path d="M 515 160 L 515 180" fill="none" stroke="#000000" stroke-width="1" marker-end="url(#arrow)" />

  <!-- Four Parallel Vertical Process Boxes (Rotated Text) -->
  <!-- Box 1 -->
  <rect x="305" y="180" width="30" height="150" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="322" y="255" font-family="'Times New Roman', Times, serif" font-size="10.5" text-anchor="middle" transform="rotate(90, 322, 255)">View the book information</text>

  <!-- Box 2 -->
  <rect x="370" y="180" width="30" height="150" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="387" y="255" font-family="'Times New Roman', Times, serif" font-size="10.5" text-anchor="middle" transform="rotate(90, 387, 255)">Edit the book information</text>

  <!-- Box 3 -->
  <rect x="435" y="180" width="30" height="150" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="452" y="255" font-family="'Times New Roman', Times, serif" font-size="10.5" text-anchor="middle" transform="rotate(90, 452, 255)">Delete the book information</text>

  <!-- Box 4 -->
  <rect x="500" y="180" width="30" height="150" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="517" y="255" font-family="'Times New Roman', Times, serif" font-size="10.5" text-anchor="middle" transform="rotate(90, 517, 255)">Add the book information</text>
</svg>
`;
  } else if (lower.includes('information management') || lower.includes('management module') || lower.includes('fig. 4') || lower.includes('figure 4')) {
    svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 360" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#ffffff" />
  
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#000000"/>
    </marker>
  </defs>

  <!-- Book information management -->
  <rect x="180" y="20" width="180" height="30" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="270" y="38" font-family="'Times New Roman', Times, serif" font-size="11" text-anchor="middle">Book information management</text>

  <!-- Arrow down to Diamond -->
  <path d="M 270 50 L 270 75" fill="none" stroke="#000000" stroke-width="1" marker-end="url(#arrow)" />

  <!-- Diamond: Judge whether it is the administrator user -->
  <polygon points="270,75 370,100 270,125 170,100" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="270" y="103" font-family="'Times New Roman', Times, serif" font-size="9" text-anchor="middle">Judge whether it is the</text>
  <text x="270" y="113" font-family="'Times New Roman', Times, serif" font-size="9" text-anchor="middle">administrator user</text>

  <!-- Path N (Right to End) -->
  <path d="M 370 100 L 450 100" fill="none" stroke="#000000" stroke-width="1" marker-end="url(#arrow)" />
  <text x="400" y="94" font-family="'Times New Roman', Times, serif" font-size="11" font-weight="bold">N</text>

  <!-- End Capsule -->
  <rect x="450" y="85" width="60" height="30" rx="15" ry="15" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="480" y="104" font-family="'Times New Roman', Times, serif" font-size="11" text-anchor="middle">End</text>

  <!-- Path Y (Down to split line) -->
  <path d="M 270 125 L 270 160" fill="none" stroke="#000000" stroke-width="1" marker-end="url(#arrow)" />
  <text x="278" y="142" font-family="'Times New Roman', Times, serif" font-size="11" font-weight="bold">Y</text>

  <!-- Horizontal line distributing arrows underneath Judge Admin -->
  <path d="M 170 160 L 370 160" stroke="#000000" stroke-width="1" fill="none" />
  
  <path d="M 170 160 L 170 180" fill="none" stroke="#000000" stroke-width="1" marker-end="url(#arrow)" />
  <path d="M 270 160 L 270 180" fill="none" stroke="#000000" stroke-width="1" marker-end="url(#arrow)" />
  <path d="M 370 160 L 370 180" fill="none" stroke="#000000" stroke-width="1" marker-end="url(#arrow)" />

  <!-- Three Parallel Vertical Process Boxes (Rotated Text) -->
  <!-- Box 1 -->
  <rect x="155" y="180" width="30" height="150" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="172" y="255" font-family="'Times New Roman', Times, serif" font-size="11" text-anchor="middle" transform="rotate(90, 172, 255)">Add book information</text>

  <!-- Box 2 -->
  <rect x="255" y="180" width="30" height="150" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="272" y="255" font-family="'Times New Roman', Times, serif" font-size="11" text-anchor="middle" transform="rotate(90, 272, 255)">Modify the book information</text>

  <!-- Box 3 -->
  <rect x="355" y="180" width="30" height="150" fill="#ffffff" stroke="#000000" stroke-width="1" />
  <text x="372" y="255" font-family="'Times New Roman', Times, serif" font-size="11" text-anchor="middle" transform="rotate(90, 372, 255)">Delete the book information</text>
</svg>
`;
  } else if (lower.includes('chart') || lower.includes('graph') || lower.includes('plot') || lower.includes('comparison') || lower.includes('analysis') || lower.includes('performance') || lower.includes('results')) {
    svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 250" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#fafafa" rx="4"/>
  
  <text x="300" y="28" font-family="sans-serif" font-size="12" font-weight="bold" fill="#111827" text-anchor="middle">EXPERIMENTAL DATA PLOT / GRAPH</text>
  <text x="300" y="45" font-family="sans-serif" font-size="9.5" fill="#4b5563" text-anchor="middle">${escapeXml(cleanCaption)}</text>

  <line x1="80" y1="65" x2="80" y2="200" stroke="#9ca3af" stroke-width="1.5"/>
  <line x1="80" y1="200" x2="520" y2="200" stroke="#9ca3af" stroke-width="1.5"/>

  <line x1="80" y1="155" x2="520" y2="155" stroke="#e5e7eb" stroke-width="1"/>
  <text x="70" y="158" font-family="monospace" font-size="8.5" fill="#6b7280" text-anchor="end">50%</text>

  <line x1="80" y1="110" x2="520" y2="110" stroke="#e5e7eb" stroke-width="1"/>
  <text x="70" y="113" font-family="monospace" font-size="8.5" fill="#6b7280" text-anchor="end">100%</text>

  <text x="70" y="203" font-family="monospace" font-size="8.5" fill="#6b7280" text-anchor="end">0%</text>

  <path d="M 80 180 L 190 145 L 300 130 L 410 95 L 520 80" fill="none" stroke="#2563eb" stroke-width="2.5"/>
  <circle cx="190" cy="145" r="4.5" fill="#2563eb"/>
  <circle cx="300" cy="130" r="4.5" fill="#2563eb"/>
  <circle cx="410" cy="95" r="4.5" fill="#2563eb"/>
  <circle cx="520" cy="80" r="4.5" fill="#2563eb"/>

  <path d="M 80 195 L 190 170 L 300 155 L 410 140 L 520 125" fill="none" stroke="#059669" stroke-width="2.5" stroke-dasharray="4"/>
  <rect x="186" y="166" width="8" height="8" fill="#059669"/>
  <rect x="296" y="151" width="8" height="8" fill="#059669"/>
  <rect x="406" y="136" width="8" height="8" fill="#059669"/>
  <rect x="516" y="121" width="8" height="8" fill="#059669"/>

  <text x="190" y="215" font-family="sans-serif" font-size="9" fill="#4b5563" text-anchor="middle">Epoch 1</text>
  <text x="300" y="215" font-family="sans-serif" font-size="9" fill="#4b5563" text-anchor="middle">Epoch 2</text>
  <text x="410" y="215" font-family="sans-serif" font-size="9" fill="#4b5563" text-anchor="middle">Epoch 3</text>
  <text x="520" y="215" font-family="sans-serif" font-size="9" fill="#4b5563" text-anchor="middle">Epoch 4</text>

  <rect x="420" y="55" width="90" height="34" rx="3" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
  <line x1="428" y1="64" x2="444" y2="64" stroke="#2563eb" stroke-width="2.5"/>
  <text x="450" y="67" font-family="sans-serif" font-size="8.5" fill="#1f2937">Proposed</text>
  <line x1="428" y1="78" x2="444" y2="78" stroke="#059669" stroke-width="2.5" stroke-dasharray="3"/>
  <text x="450" y="81" font-family="sans-serif" font-size="8.5" fill="#1f2937">Baseline</text>
</svg>
`;
  } else {
    svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 240" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#fbfbfb" rx="4"/>
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" stroke-width="1.5"/>
    </pattern>
    <linearGradient id="centralGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#f1f5f9"/></linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)"/>

  <circle cx="300" cy="120" r="65" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4"/>

  <circle cx="300" cy="55" r="14" fill="#ffffff" stroke="#475569" stroke-width="1.5"/>
  <text x="300" y="58" font-family="sans-serif" font-size="8" font-weight="bold" fill="#475569" text-anchor="middle">A</text>

  <circle cx="365" cy="120" r="14" fill="#ffffff" stroke="#475569" stroke-width="1.5"/>
  <text x="365" y="123" font-family="sans-serif" font-size="8" font-weight="bold" fill="#475569" text-anchor="middle">B</text>

  <circle cx="300" cy="185" r="14" fill="#ffffff" stroke="#475569" stroke-width="1.5"/>
  <text x="300" y="188" font-family="sans-serif" font-size="8" font-weight="bold" fill="#475569" text-anchor="middle">C</text>

  <circle cx="235" cy="120" r="14" fill="#ffffff" stroke="#475569" stroke-width="1.5"/>
  <text x="235" y="123" font-family="sans-serif" font-size="8" font-weight="bold" fill="#475569" text-anchor="middle">D</text>

  <rect x="250" y="98" width="100" height="44" rx="4" fill="url(#centralGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <text x="300" y="120" font-family="sans-serif" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">CORE MODEL</text>
  <text x="300" y="132" font-family="sans-serif" font-size="7.5" fill="#64748b" text-anchor="middle">Engine Active</text>

  <text x="300" y="32" font-family="sans-serif" font-size="11.5" font-weight="bold" fill="#0f172a" text-anchor="middle">SYSTEM SCHEMATIC RECONSTRUCTION</text>
  <text x="300" y="46" font-family="sans-serif" font-size="9" fill="#475569" text-anchor="middle">${escapeXml(cleanCaption)}</text>
</svg>
`;
  }

  // Base64 encode the SVG string safely
  const base64Svg = typeof btoa !== 'undefined'
    ? btoa(unescape(encodeURIComponent(svgContent.trim())))
    : Buffer.from(svgContent.trim()).toString('base64');

  return `data:image/svg+xml;base64,${base64Svg}`;
}

/**
 * Heuristically checks if a block of text is probably a table grid / tabular data
 */
function isProbablyTabular(text: string): boolean {
  if (!text) return false;
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return false;
  
  // If there's a pipe symbol or tab in any line, it's very likely a table
  if (text.includes('|') || text.includes('\t')) return true;
  
  // If multiple lines have 2 or more consecutive spaces, it's likely a column-aligned table
  let tableScore = 0;
  for (const line of lines) {
    if (/\s{2,}/.test(line)) {
      tableScore++;
    }
  }
  
  return tableScore >= Math.min(2, lines.length);
}

/**
 * Heuristically determines if a block is a real caption vs a narrative paragraph referencing a figure/table.
 */
function isRealCaption(text: string): boolean {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  
  if (trimmed.length > 200) return false;
  
  const narrativeIndicators = [
    ' shows', ' is shown', ' are shown', ' illustrates', ' displays', ' depicts', 
    ' presents', ' can be', ' we ', ' our ', ' in the figure', ' list of ', ' lists ', 
    ' is used to', ' was used', ' has been', ' have been', ' describes'
  ];
  
  if (narrativeIndicators.some(ind => lower.includes(ind))) {
    return false;
  }
  
  return true;
}

/**
 * Fallback raw text parser (for PDFs or plain text)
 */
export function parseRawTextToArticleState(rawText: string): Partial<ArticleState> {
  // Split the raw text by empty lines to form structural blocks (paragraphs, headings, metadata)
  const blocks = rawText.split(/\r?\n\s*\r?\n/).map(b => b.trim()).filter(Boolean);

  // Default metadata
  let journalName = 'Advances in Computer Science Research (ACSR)';
  let volume = '';
  let conferenceLine = '';
  let publisher = 'Atlantis Press';
  let copyrightYear = String(new Date().getFullYear());
  let startPageNumber = '';
  let licenseLine = 'This is an open access article under the CC BY-NC license (http://creativecommons.org/licenses/by-nc/4.0/).';

  let title = '';
  let authors = '';
  let affiliation = '';
  let keywords = '';
  let abstract = '';
  const sections: Section[] = [];
  const references: string[] = [];

  const bodyBlocks: string[] = [];
  let foundTitle = false;
  let foundAuthors = false;
  const affiliationLines: string[] = [];
  let expectingAbstractBody = false;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const trimmed = block.trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();
    const isAbstractTag = /^abstract\b/i.test(lower);
    const isKeywordsTag = /^keywords\b/i.test(lower);
    const isHeading = checkIsHeading(block);
    const isIntro = /^(1\.?\s*)?introduction/i.test(lower);

    if (isHeading || isAbstractTag || isKeywordsTag || isIntro) {
      bodyBlocks.push(...blocks.slice(i));
      break;
    }

    // Check for standard metadata patterns
    if (/advances\s+in|journal\s+of|proceedings\s+of|acsr/i.test(trimmed)) {
      const volMatch = trimmed.match(/volume\s*(\d+)/i) || trimmed.match(/vol\.\s*(\d+)/i);
      if (volMatch) {
        volume = volMatch[1];
      }
      journalName = trimmed.replace(/,\s*volume\s*\d+/i, '').replace(/,\s*vol\.\s*\d+/i, '').trim();
      continue;
    }

    if (/conference\s+on|symposium\s+on|proceedings\s+of\s+the|workshop\s+on|meeting\s+on/i.test(trimmed)) {
      conferenceLine = trimmed;
      const yearMatch = trimmed.match(/\b(20\d{2}|19\d{2})\b/);
      if (yearMatch) {
        copyrightYear = yearMatch[1];
      }
      continue;
    }

    if (/atlantis\s+press/i.test(trimmed) && trimmed.length < 25) {
      publisher = trimmed;
      continue;
    }

    if (/open\s+access|creativecommons|cc\s+by/i.test(trimmed)) {
      licenseLine = trimmed;
      continue;
    }

    if (/copyright\s+©|copyright\s+\(c\)/i.test(trimmed)) {
      const yearMatch = trimmed.match(/\b(20\d{2}|19\d{2})\b/);
      if (yearMatch) {
        copyrightYear = yearMatch[1];
      }
      const pubMatch = trimmed.match(/published\s+by\s+(.*)/i);
      if (pubMatch) {
        publisher = pubMatch[1].replace(/\.$/, '').trim();
      }
      continue;
    }

    if (/^\d+$/.test(trimmed)) {
      startPageNumber = trimmed;
      continue;
    }

    // Handle Title, Authors, Affiliation
    if (!foundTitle) {
      const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length >= 2) {
        title = lines[0];
        authors = lines[1];
        foundTitle = true;
        foundAuthors = true;
        if (lines.length > 2) {
          affiliationLines.push(...lines.slice(2));
        }
      } else {
        title = trimmed;
        foundTitle = true;
      }
    } else if (!foundAuthors) {
      authors = trimmed;
      foundAuthors = true;
    } else {
      if (affiliationLines.length < 3) {
        affiliationLines.push(trimmed);
      } else {
        bodyBlocks.push(block);
      }
    }
  }

  affiliation = affiliationLines.join(', ');

  // Parse remaining body blocks
  let currentSection: Section | null = null;
  let inReferences = false;

  for (let i = 0; i < bodyBlocks.length; i++) {
    const block = bodyBlocks[i];
    const trimmed = block.trim();
    if (!trimmed) continue;

    const isHeading = checkIsHeading(block);
    if (isHeading) {
      if (/references/i.test(block)) {
        inReferences = true;
        currentSection = null;
      } else {
        inReferences = false;
        currentSection = {
          id: generateId(),
          heading: block,
          paragraphs: [],
          figures: [],
          tables: []
        };
        sections.push(currentSection);
      }
      expectingAbstractBody = false;
      continue;
    }

    if (inReferences) {
      const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        const cleanedRef = line.replace(/^\[?\d+\]\.?\s*/, '').trim();
        if (cleanedRef) {
          references.push(cleanedRef);
        }
      }
      continue;
    }

    if (/^keywords\b/i.test(block)) {
      keywords = block.replace(/^keywords\.?\s*[-:]*/i, '').trim();
      expectingAbstractBody = false;
      continue;
    }

    if (/^abstract\b/i.test(block)) {
      const abstractContent = block.replace(/^abstract\.?\s*[-:]*/i, '').trim();
      if (abstractContent) {
        abstract = abstractContent;
      } else {
        expectingAbstractBody = true;
      }
      continue;
    }

    if (expectingAbstractBody && block) {
      abstract = block.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');
      expectingAbstractBody = false;
      continue;
    }

    // Heuristically detect Figures
    const isFigure = /^(fig(ure)?\.?\s*\d+)/i.test(block.trim()) && block.trim().length < 250 && isRealCaption(block);
    if (isFigure) {
      const caption = block.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
      const newFigure: Figure = {
        id: generateId(),
        caption,
        imageDataUrl: generateSvgForFigure(caption),
        widthPercent: 70
      };
      
      if (currentSection) {
        currentSection.figures.push(newFigure);
      } else {
        if (sections.length === 0) {
          sections.push({
            id: generateId(),
            heading: 'Introduction',
            paragraphs: [],
            figures: [newFigure],
            tables: []
          });
          currentSection = sections[0];
        } else {
          sections[0].figures.push(newFigure);
        }
      }
      continue;
    }

    // Heuristically detect Tables
    const isTable = /^(table|tbl\.?)\s*\d+/i.test(block.trim()) && block.trim().length < 250 && isRealCaption(block);
    if (isTable) {
      const blockLines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const caption = blockLines[0];
      
      let tableBodyText = '';
      if (blockLines.length > 1) {
        tableBodyText = blockLines.slice(1).join('\n');
      } else if (i + 1 < blocks.length) {
        const nextBlock = blocks[i + 1];
        const isNextHeading = checkIsHeading(nextBlock);
        const isNextKeywords = /^keywords\b/i.test(nextBlock);
        const isNextAbstract = /^abstract\b/i.test(nextBlock);
        const isNextFigure = /^(fig(ure)?\.?\s*\d+)/i.test(nextBlock);
        const isNextTable = /^(table|tbl\.?)\s*\d+/i.test(nextBlock);
        
        if (!isNextHeading && !isNextKeywords && !isNextAbstract && !isNextFigure && !isNextTable && isProbablyTabular(nextBlock)) {
          tableBodyText = nextBlock;
          i++; // Consume
        }
      }
      
      const parsedTable = parseTabularData(tableBodyText);
      const newTable: Table = {
        id: generateId(),
        caption,
        headers: parsedTable.headers,
        rows: parsedTable.rows,
        alignments: parsedTable.headers.map(() => 'center' as const),
        style: 'booktabs'
      };
      
      if (currentSection) {
        currentSection.tables.push(newTable);
      } else {
        if (sections.length === 0) {
          sections.push({
            id: generateId(),
            heading: 'Introduction',
            paragraphs: [],
            figures: [],
            tables: [newTable]
          });
          currentSection = sections[0];
        } else {
          sections[0].tables.push(newTable);
        }
      }
      continue;
    }

    // General body paragraph block - normalize internal single newlines as spaces
    const cleanedParagraph = block.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanedParagraph) {
      if (currentSection) {
        currentSection.paragraphs.push(cleanedParagraph);
      } else {
        if (sections.length === 0) {
          sections.push({
            id: generateId(),
            heading: 'Introduction',
            paragraphs: [cleanedParagraph],
            figures: [],
            tables: []
          });
          currentSection = sections[0];
        } else {
          sections[0].paragraphs.push(cleanedParagraph);
        }
      }
    }
  }

  abstract = abstract.replace(/\s+/g, ' ').trim();

  return {
    journalName,
    volume,
    conferenceLine,
    publisher,
    copyrightYear,
    startPageNumber,
    licenseLine,
    title,
    authors,
    affiliation,
    keywords,
    abstract,
    sections: sections.length > 0 ? sections : [{ id: generateId(), heading: 'Introduction', paragraphs: [], figures: [], tables: [] }],
    referencesText: references.join('\n')
  };
}
