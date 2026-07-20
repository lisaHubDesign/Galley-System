import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { parseHtmlToArticleState, parseRawTextToArticleState, generateId } from '../utils/parser';
import { ArticleState, Section } from '../types';
import mammoth from 'mammoth';

interface DocumentImporterProps {
  onImportComplete: (imported: Partial<ArticleState>) => void;
}

export default function DocumentImporter({ onImportComplete }: DocumentImporterProps) {
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });

  // Dynamically load PDF.js from CDN to bypass Vite worker compiling complexities
  const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js';
      script.onload = async () => {
        const pdfjs = (window as any).pdfjsLib;
        try {
          // Fetch and load worker via a local Blob URL to bypass iframe/sandbox CORS constraints
          const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js');
          const workerCode = await response.text();
          const blob = new Blob([workerCode], { type: 'application/javascript' });
          pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
        } catch (e) {
          console.warn('Failed to load PDF worker via Blob URL, falling back to direct CDN:', e);
          pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';
        }
        resolve(pdfjs);
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js library.'));
      document.head.appendChild(script);
    });
  };

  const extractPdfText = async (arrayBuffer: ArrayBuffer, pdfjs: any): Promise<string> => {
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const allPagesText: string[] = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const textContent = await page.getTextContent();
      
      interface PdfTextItem {
        str: string;
        x: number;
        y: number;
        fontSize: number;
      }
      
      const items: PdfTextItem[] = [];
      for (const it of textContent.items) {
        if (!it || typeof it.str !== 'string') continue;
        let x = 0;
        let y = 0;
        let fontSize = 10;
        if (it.transform && Array.isArray(it.transform) && it.transform.length >= 6) {
          x = it.transform[4];
          y = it.transform[5];
          fontSize = Math.abs(it.transform[3]) || Math.abs(it.transform[0]) || 10;
        }
        items.push({ str: it.str, x, y, fontSize });
      }

      if (items.length === 0) continue;

      // Group items into visual lines based on Y coordinate similarity
      const lines: { y: number; items: PdfTextItem[] }[] = [];
      for (const item of items) {
        let foundLine = lines.find(l => Math.abs(l.y - item.y) < Math.max(item.fontSize * 0.45, 4.5));
        if (foundLine) {
          foundLine.items.push(item);
        } else {
          lines.push({ y: item.y, items: [item] });
        }
      }

      // Sort lines by Y descending (top-to-bottom of the page)
      lines.sort((a, b) => b.y - a.y);

      interface LineInfo {
        text: string;
        y: number;
        fontSize: number;
      }
      const lineInfos: LineInfo[] = [];

      for (const line of lines) {
        // Sort items in this line by X coordinate ascending (left-to-right)
        line.items.sort((a, b) => a.x - b.x);

        let lineText = '';
        for (let idx = 0; idx < line.items.length; idx++) {
          const item = line.items[idx];
          if (idx > 0) {
            const prev = line.items[idx - 1];
            // If there's a visible gap between words, add a space
            const gap = item.x - (prev.x + prev.str.length * (prev.fontSize * 0.42));
            if (gap > 2) {
              lineText += ' ';
            }
          }
          lineText += item.str;
        }

        lineText = lineText.replace(/\s+/g, ' ').trim();
        if (lineText) {
          const avgFontSize = line.items.reduce((sum, it) => sum + it.fontSize, 0) / line.items.length;
          lineInfos.push({
            text: lineText,
            y: line.y,
            fontSize: avgFontSize
          });
        }
      }

      // Reconstruct paragraphs on this page by checking vertical gaps between consecutive lines
      const pageBlocks: string[] = [];
      for (let idx = 0; idx < lineInfos.length; idx++) {
        const cur = lineInfos[idx];
        pageBlocks.push(cur.text);

        if (idx < lineInfos.length - 1) {
          const next = lineInfos[idx + 1];
          const gap = cur.y - next.y;
          // If the gap is significantly larger than normal line height (e.g. 1.5 times font size),
          // insert an empty line to signal a block/paragraph break.
          if (gap > cur.fontSize * 1.55) {
            pageBlocks.push('');
          }
        }
      }

      allPagesText.push(pageBlocks.join('\n'));
    }

    // Join pages with two blank lines
    return allPagesText.join('\n\n\n');
  };

  const processFile = async (file: File) => {
    setStatus({ type: 'loading', message: 'Reading selected file...' });
    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        setStatus({ type: 'loading', message: 'Converting DOCX structure using Mammoth...' });
        
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;

        if (!html.trim()) {
          throw new Error('Word document was read successfully but returned empty text content.');
        }

        setStatus({ type: 'loading', message: 'Parsing headings, tables, figures, and metadata...' });
        const parsedState = parseHtmlToArticleState(html);
        onImportComplete(parsedState);
        
        setStatus({
          type: 'success',
          message: `Successfully imported "${file.name}" with standard ACSR layouts.`
        });
      } else if (ext === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        setStatus({ type: 'loading', message: 'Loading PDF core parser engine...' });
        
        const pdfjs = await loadPdfJs();
        setStatus({ type: 'loading', message: `Reading ${file.name} metadata and page text...` });
        
        const extractedText = await extractPdfText(arrayBuffer, pdfjs);
        if (!extractedText.trim()) {
          throw new Error('PDF file was loaded but is likely a scanned image. Text extraction returned zero data.');
        }

        setStatus({ type: 'loading', message: 'Heuristically parsing document blocks...' });
        const parsedState = parseRawTextToArticleState(extractedText);
        onImportComplete(parsedState);

        setStatus({
          type: 'success',
          message: `Successfully extracted text structure from "${file.name}".`
        });
      } else {
        throw new Error('Unsupported format. Please upload a Word Document (.docx) or PDF (.pdf).');
      }
    } catch (err: any) {
      console.error(err);
      setStatus({
        type: 'error',
        message: err.message || 'An unexpected failure occurred while reading your file.'
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div id="document-importer-root" className="space-y-3">
      {/* Upload area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center transition duration-150 min-h-[140px] cursor-pointer ${
          dragActive
            ? 'border-proof-red bg-proof-red/5'
            : 'border-line/80 bg-chrome-panel/30 hover:border-proof-red/50 hover:bg-chrome-panel/40'
        }`}
      >
        <Upload className={`h-7 w-7 mb-2 ${dragActive ? 'text-proof-red' : 'text-muted'}`} />
        <span className="text-xs font-semibold text-paper">Drag & Drop Draft Document</span>
        <span className="text-[10px] text-muted mt-1 mb-2">Accepts Microsoft Word (.docx) or PDF (.pdf)</span>
        
        <label className="px-3 py-1.5 bg-chrome hover:bg-chrome/60 border border-line rounded text-[11px] font-semibold text-paper cursor-pointer transition">
          Browse Files
          <input
            type="file"
            accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
      </div>

      {/* Upload/Extraction Logs */}
      {status.type !== 'idle' && (
        <div
          className={`p-3 rounded border text-xs flex items-start gap-2.5 leading-relaxed ${
            status.type === 'loading'
              ? 'bg-amber-950/20 border-amber-800/30 text-amber-200'
              : status.type === 'success'
              ? 'bg-green-950/20 border-green-800/30 text-green-200'
              : 'bg-red-950/20 border-red-800/30 text-red-200'
          }`}
        >
          {status.type === 'loading' && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-500 mt-0.5" />}
          {status.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />}
          {status.type === 'error' && <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />}
          <p>{status.message}</p>
        </div>
      )}
    </div>
  );
}
