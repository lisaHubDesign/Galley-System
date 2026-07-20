import { ArticleState, Section, Figure, Table } from '../types';

/**
 * Generate a random 6-character ID for keys
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 8);
}

/**
 * Heuristically parses an HTML string (from Mammoth.js) into ArticleState
 */
export function parseHtmlToArticleState(html: string): Partial<ArticleState> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  let title = '';
  let authors = '';
  let affiliation = '';
  let keywords = '';
  let abstract = '';
  const sections: Section[] = [];
  const references: string[] = [];

  let currentSection: Section | null = null;
  let inReferences = false;
  let textElementsProcessed = 0;

  // Track global figure and table counts for default captions
  let figCount = 0;
  let tblCount = 0;

  const children = Array.from(body.children);

  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    const tagName = el.tagName.toLowerCase();
    const text = el.textContent?.trim() || '';

    // 1. Identify Headings
    const isHeading = 
      /^(h[1-6])$/.test(tagName) || 
      (tagName === 'p' && el.querySelector('strong') && text.length < 100 && /^[1-9]\d*\s+[A-Z]/i.test(text)) ||
      (tagName === 'p' && /^(introduction|related work|methodology|system design|results|evaluation|discussion|conclusion|references|acknowledgements)$/i.test(text));

    if (isHeading) {
      const headingText = text;
      
      if (/references/i.test(headingText)) {
        inReferences = true;
        currentSection = null;
      } else {
        inReferences = false;
        currentSection = {
          id: generateId(),
          heading: headingText,
          paragraphs: [],
          figures: [],
          tables: []
        };
        sections.push(currentSection);
      }
      continue;
    }

    // 2. Handle References
    if (inReferences) {
      if (text) {
        // Strip numbers or prefix like [1]
        const cleanedRef = text.replace(/^\[?\d+\]\.?\s*/, '').trim();
        if (cleanedRef) {
          references.push(cleanedRef);
        }
      }
      continue;
    }

    // 3. Handle Images/Figures
    if (tagName === 'img' || el.querySelector('img')) {
      const imgEl = tagName === 'img' ? (el as HTMLImageElement) : el.querySelector('img')!;
      const src = imgEl.getAttribute('src') || '';
      
      // If we have an image, let's look ahead for a caption in subsequent paragraphs
      let caption = `Fig. ${++figCount}. Figure Caption`;
      
      // Look ahead up to 2 siblings for a paragraph starting with "fig"
      for (let j = 1; j <= 2; j++) {
        const nextEl = children[i + j];
        if (nextEl && nextEl.tagName.toLowerCase() === 'p') {
          const nextText = nextEl.textContent?.trim() || '';
          if (/^fig(ure)?\.?\s*\d+/i.test(nextText)) {
            caption = nextText;
            // Advance the outer loop if we consumed this element
            if (j === 1) i++;
            break;
          }
        }
      }

      const newFigure: Figure = {
        id: generateId(),
        caption,
        imageDataUrl: src,
        widthPercent: 70
      };

      if (currentSection) {
        currentSection.figures.push(newFigure);
      } else {
        // Add to abstract/preamble section or save for first section
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

    // 4. Handle Tables
    if (tagName === 'table') {
      const tableEl = el as HTMLTableElement;
      const rows: string[][] = [];
      const headers: string[] = [];

      // Extract caption if it's in a previous sibling or table caption tag
      let caption = `Table ${++tblCount}. Table Caption`;
      const captionTag = tableEl.querySelector('caption');
      if (captionTag) {
        caption = captionTag.textContent?.trim() || caption;
      } else {
        // Look back up to 2 siblings for table caption
        for (let j = 1; j <= 2; j++) {
          const prevEl = children[i - j];
          if (prevEl && prevEl.tagName.toLowerCase() === 'p') {
            const prevText = prevEl.textContent?.trim() || '';
            if (/^table\s*\d+/i.test(prevText)) {
              caption = prevText;
              break;
            }
          }
        }
      }

      // Parse TRs
      const trElements = Array.from(tableEl.querySelectorAll('tr'));
      trElements.forEach((tr, trIdx) => {
        const cells = Array.from(tr.querySelectorAll('th, td')).map(cell => cell.textContent?.trim() || '');
        if (trIdx === 0 && tr.querySelector('th')) {
          headers.push(...cells);
        } else if (trIdx === 0 && headers.length === 0) {
          // Heuristic: first row is headers if it looks like it
          headers.push(...cells);
        } else {
          rows.push(cells);
        }
      });

      // If headers are still empty, create default ones
      if (headers.length === 0 && rows.length > 0) {
        const colCount = rows[0].length;
        for (let c = 1; c <= colCount; c++) {
          headers.push(`Column ${c}`);
        }
      }

      const alignments = headers.map(() => 'center' as const);

      const newTable: Table = {
        id: generateId(),
        caption,
        headers,
        rows,
        alignments,
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

    // 5. Parse regular paragraphs
    if (tagName === 'p' && text) {
      // Check for abstract
      if (/^abstract\b/i.test(text)) {
        abstract = text.replace(/^abstract\.?\s*[-:]*/i, '').trim();
        continue;
      }
      // Check for keywords
      if (/^keywords\b/i.test(text)) {
        keywords = text.replace(/^keywords\.?\s*[-:]*/i, '').trim();
        continue;
      }

      textElementsProcessed++;

      // Heuristic for Title, Authors, Affiliation at the very beginning
      if (textElementsProcessed === 1 && !title) {
        title = text;
        continue;
      }
      if (textElementsProcessed === 2 && !authors) {
        authors = text;
        continue;
      }
      if (textElementsProcessed === 3 && !affiliation) {
        affiliation = text;
        continue;
      }

      // Add to current section
      if (currentSection) {
        currentSection.paragraphs.push(text);
      } else {
        // No section heading has been seen yet, put into introductory block
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

  return {
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
 * Fallback raw text parser (for PDFs or plain text)
 */
export function parseRawTextToArticleState(rawText: string): Partial<ArticleState> {
  const lines = rawText.split(/\r?\n/).map(l => l.trim());

  let title = '';
  let authors = '';
  let affiliation = '';
  let keywords = '';
  let abstract = '';
  const sections: Section[] = [];
  const references: string[] = [];

  let currentSection: Section | null = null;
  let inAbstract = false;
  let inKeywords = false;
  let inReferences = false;
  let textCount = 0;

  const isHeading = (line: string): boolean => {
    if (!line || line.length > 100) return false;
    if (/[.;,:]$/.test(line)) return false;
    // Standard section heading pattern e.g., "1. Introduction" or "Introduction"
    const isStandardName = /^(introduction|related work|methodology|literature review|system design|system architecture|results|evaluation|discussion|conclusion|references|acknowledgements)$/i.test(line);
    const hasSectionNumber = /^[1-9]\d*(\.\d+)*\.?\s+[A-Z]/i.test(line);
    return isStandardName || hasSectionNumber;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Check references
    if (/^references\b/i.test(line) || inReferences) {
      if (!inReferences) {
        inReferences = true;
        continue;
      }
      const cleaned = line.replace(/^\[?\d+\]\.?\s*/, '').trim();
      if (cleaned) {
        references.push(cleaned);
      }
      continue;
    }

    // Check heading
    if (isHeading(line)) {
      inReferences = false;
      currentSection = {
        id: generateId(),
        heading: line,
        paragraphs: [],
        figures: [],
        tables: []
      };
      sections.push(currentSection);
      continue;
    }

    // Check abstract
    if (/^abstract\b/i.test(line)) {
      const rest = line.replace(/^abstract\.?\s*[-:]*/i, '').trim();
      abstract = rest;
      inAbstract = true;
      continue;
    }

    if (inAbstract) {
      if (/^keywords\b/i.test(line) || isHeading(line)) {
        inAbstract = false;
      } else {
        abstract += ' ' + line;
        continue;
      }
    }

    // Check keywords
    if (/^keywords\b/i.test(line)) {
      keywords = line.replace(/^keywords\.?\s*[-:]*/i, '').trim();
      continue;
    }

    // Heuristics for Title, Authors, Affiliation
    textCount++;
    if (textCount === 1) {
      title = line;
      continue;
    }
    if (textCount === 2) {
      authors = line;
      continue;
    }
    if (textCount === 3) {
      affiliation = line;
      continue;
    }

    // Paragraph
    if (currentSection) {
      currentSection.paragraphs.push(line);
    } else {
      if (sections.length === 0) {
        sections.push({
          id: generateId(),
          heading: 'Introduction',
          paragraphs: [line],
          figures: [],
          tables: []
        });
        currentSection = sections[0];
      } else {
        sections[0].paragraphs.push(line);
      }
    }
  }

  // Clean up spacing in abstract
  abstract = abstract.replace(/\s+/g, ' ').trim();

  return {
    title,
    authors,
    affiliation,
    keywords,
    abstract,
    sections: sections.length > 0 ? sections : [{ id: generateId(), heading: 'Introduction', paragraphs: [], figures: [], tables: [] }],
    referencesText: references.join('\n')
  };
}
