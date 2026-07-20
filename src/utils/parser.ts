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

  const children = Array.from(body.children);

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

  // Pre-pass to find where the abstract, keywords or first heading begins
  let bodyStartIndex = children.length;
  const leadingParagraphs: string[] = [];

  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    const text = el.textContent?.trim() || '';
    if (!text) continue;

    // Check if we hit abstract, keywords, or heading
    const isAbstract = /^\s*abstract\b/i.test(text);
    const isKeywords = /^\s*keywords\b/i.test(text);
    const isHeading = checkIsHeading(text, el);

    if (isAbstract || isKeywords || isHeading) {
      bodyStartIndex = i;
      break;
    }

    // Only collect <p> texts or similar as leading paragraphs
    const tagName = el.tagName.toLowerCase();
    if (tagName === 'p' || tagName.startsWith('h')) {
      leadingParagraphs.push(text);
    }
  }

  // Parse leading paragraphs for metadata & core info
  const remainingLeading: string[] = [];
  for (const p of leadingParagraphs) {
    const trimmed = p.trim();
    if (!trimmed) continue;

    // 1. Journal / Volume line
    if (/advances\s+in|journal\s+of|proceedings\s+of|acsr/i.test(trimmed)) {
      const volMatch = trimmed.match(/volume\s*(\d+)/i) || trimmed.match(/vol\.\s*(\d+)/i);
      if (volMatch) {
        volume = volMatch[1];
      }
      journalName = trimmed.replace(/,\s*volume\s*\d+/i, '').replace(/,\s*vol\.\s*\d+/i, '').trim();
      continue;
    }

    // 2. Conference line
    if (/conference\s+on|symposium\s+on|proceedings\s+of\s+the|workshop\s+on|meeting\s+on/i.test(trimmed)) {
      conferenceLine = trimmed;
      const yearMatch = trimmed.match(/\b(20\d{2}|19\d{2})\b/);
      if (yearMatch) {
        copyrightYear = yearMatch[1];
      }
      continue;
    }

    // 3. Publisher
    if (/atlantis\s+press/i.test(trimmed) && trimmed.length < 25) {
      publisher = trimmed;
      continue;
    }

    // 4. License / CC line
    if (/open\s+access|creativecommons|cc\s+by/i.test(trimmed)) {
      licenseLine = trimmed;
      continue;
    }

    // 5. Copyright line
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

    // 6. Page number
    if (/^\d+$/.test(trimmed)) {
      startPageNumber = trimmed;
      continue;
    }

    // Otherwise, core content line
    remainingLeading.push(trimmed);
  }

  // Assign core details from remaining leading paragraphs
  if (remainingLeading.length > 0) title = remainingLeading[0];
  if (remainingLeading.length > 1) authors = remainingLeading[1];
  if (remainingLeading.length > 2) affiliation = remainingLeading.slice(2).join(', ');

  // Now parse from bodyStartIndex to the end
  let currentSection: Section | null = null;
  let inReferences = false;
  let expectingAbstractBody = false;

  let figCount = 0;
  let tblCount = 0;

  for (let i = bodyStartIndex; i < children.length; i++) {
    const el = children[i];
    const tagName = el.tagName.toLowerCase();
    const text = el.textContent?.trim() || '';

    // A. Check for Heading
    const isHeading = checkIsHeading(text, el);
    if (isHeading) {
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
    if (/^keywords\b/i.test(text)) {
      keywords = text.replace(/^keywords\.?\s*[-:]*/i, '').trim();
      expectingAbstractBody = false;
      continue;
    }

    // D. Check for Abstract
    if (/^abstract\b/i.test(text)) {
      const abstractContent = text.replace(/^abstract\.?\s*[-:]*/i, '').trim();
      if (abstractContent) {
        abstract = abstractContent;
      } else {
        expectingAbstractBody = true;
      }
      continue;
    }

    if (expectingAbstractBody && text) {
      abstract = text;
      expectingAbstractBody = false;
      continue;
    }

    // E. Handle Images/Figures
    if (tagName === 'img' || el.querySelector('img')) {
      const imgEl = tagName === 'img' ? (el as HTMLImageElement) : el.querySelector('img')!;
      const src = imgEl.getAttribute('src') || '';
      
      let caption = `Figure ${++figCount}.  Figure Caption`;
      let foundCaptionInSibling = false;

      // 1. Look ahead 1 or 2 siblings
      for (let j = 1; j <= 2; j++) {
        const nextEl = children[i + j];
        if (nextEl && nextEl.tagName.toLowerCase() === 'p') {
          const nextText = nextEl.textContent?.trim() || '';
          if (/^fig(ure)?\.?\s*\d+/i.test(nextText)) {
            caption = nextText;
            if (j === 1) i++; // Consume it
            foundCaptionInSibling = true;
            break;
          }
        }
      }

      // 2. If not found ahead, look backward 1 sibling
      if (!foundCaptionInSibling && i > 0) {
        const prevEl = children[i - 1];
        if (prevEl && prevEl.tagName.toLowerCase() === 'p') {
          const prevText = prevEl.textContent?.trim() || '';
          if (/^fig(ure)?\.?\s*\d+/i.test(prevText)) {
            caption = prevText;
            // Remove from current section's paragraphs if it was added
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
        imageDataUrl: src,
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

    // F. Handle Tables
    if (tagName === 'table') {
      const tableEl = el as HTMLTableElement;
      const rows: string[][] = [];
      const headers: string[] = [];

      let caption = `Table ${++tblCount}.  Table Caption`;
      const captionTag = tableEl.querySelector('caption');
      if (captionTag) {
        caption = captionTag.textContent?.trim() || caption;
      } else {
        // Look back up to 2 siblings or ahead up to 2 siblings for table caption
        let foundCaption = false;
        for (let j = 1; j <= 2; j++) {
          const prevEl = children[i - j];
          if (prevEl && prevEl.tagName.toLowerCase() === 'p') {
            const prevText = prevEl.textContent?.trim() || '';
            if (/^(table|tbl\.?)\s*\d+/i.test(prevText)) {
              caption = prevText;
              foundCaption = true;
              // Remove from current section paragraphs if added
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
            const nextEl = children[i + j];
            if (nextEl && nextEl.tagName.toLowerCase() === 'p') {
              const nextText = nextEl.textContent?.trim() || '';
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

    // G. Regular paragraphs
    if (tagName === 'p' && text) {
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
 * Fallback raw text parser (for PDFs or plain text)
 */
export function parseRawTextToArticleState(rawText: string): Partial<ArticleState> {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

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

  let bodyStartIndex = lines.length;
  const leadingLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    const isAbstract = /^\s*abstract\b/i.test(line);
    const isKeywords = /^\s*keywords\b/i.test(line);
    const isHeading = checkIsHeading(line);

    if (isAbstract || isKeywords || isHeading) {
      bodyStartIndex = i;
      break;
    }

    leadingLines.push(line);
  }

  // Parse leading lines for metadata & core info
  const remainingLeading: string[] = [];
  for (const line of leadingLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 1. Journal / Volume line
    if (/advances\s+in|journal\s+of|proceedings\s+of|acsr/i.test(trimmed)) {
      const volMatch = trimmed.match(/volume\s*(\d+)/i) || trimmed.match(/vol\.\s*(\d+)/i);
      if (volMatch) {
        volume = volMatch[1];
      }
      journalName = trimmed.replace(/,\s*volume\s*\d+/i, '').replace(/,\s*vol\.\s*\d+/i, '').trim();
      continue;
    }

    // 2. Conference line
    if (/conference\s+on|symposium\s+on|proceedings\s+of\s+the|workshop\s+on|meeting\s+on/i.test(trimmed)) {
      conferenceLine = trimmed;
      const yearMatch = trimmed.match(/\b(20\d{2}|19\d{2})\b/);
      if (yearMatch) {
        copyrightYear = yearMatch[1];
      }
      continue;
    }

    // 3. Publisher
    if (/atlantis\s+press/i.test(trimmed) && trimmed.length < 25) {
      publisher = trimmed;
      continue;
    }

    // 4. License / CC line
    if (/open\s+access|creativecommons|cc\s+by/i.test(trimmed)) {
      licenseLine = trimmed;
      continue;
    }

    // 5. Copyright line
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

    // 6. Page number
    if (/^\d+$/.test(trimmed)) {
      startPageNumber = trimmed;
      continue;
    }

    remainingLeading.push(trimmed);
  }

  // Assign details
  if (remainingLeading.length > 0) title = remainingLeading[0];
  if (remainingLeading.length > 1) authors = remainingLeading[1];
  if (remainingLeading.length > 2) affiliation = remainingLeading.slice(2).join(', ');

  // Parse remaining lines
  let currentSection: Section | null = null;
  let inReferences = false;
  let expectingAbstractBody = false;

  for (let i = bodyStartIndex; i < lines.length; i++) {
    const line = lines[i];

    const isHeading = checkIsHeading(line);
    if (isHeading) {
      if (/references/i.test(line)) {
        inReferences = true;
        currentSection = null;
      } else {
        inReferences = false;
        currentSection = {
          id: generateId(),
          heading: line,
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
      const cleanedRef = line.replace(/^\[?\d+\]\.?\s*/, '').trim();
      if (cleanedRef) {
        references.push(cleanedRef);
      }
      continue;
    }

    if (/^keywords\b/i.test(line)) {
      keywords = line.replace(/^keywords\.?\s*[-:]*/i, '').trim();
      expectingAbstractBody = false;
      continue;
    }

    if (/^abstract\b/i.test(line)) {
      const abstractContent = line.replace(/^abstract\.?\s*[-:]*/i, '').trim();
      if (abstractContent) {
        abstract = abstractContent;
      } else {
        expectingAbstractBody = true;
      }
      continue;
    }

    if (expectingAbstractBody && line) {
      abstract = line;
      expectingAbstractBody = false;
      continue;
    }

    // General body paragraph line
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
