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
      script.onload = () => {
        const pdfjs = (window as any).pdfjsLib;
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';
        resolve(pdfjs);
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js library.'));
      document.head.appendChild(script);
    });
  };

  const extractPdfText = async (arrayBuffer: ArrayBuffer, pdfjs: any): Promise<string> => {
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const blocks: string[] = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((it: any) => it.str).join(' ');
      blocks.push(pageText);
    }

    return blocks.join('\n\n');
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
