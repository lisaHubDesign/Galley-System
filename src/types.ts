export interface Figure {
  id: string;
  caption: string;
  imageDataUrl: string; // Base64 data URL
  widthPercent: number; // e.g. 50, 70, 100
}

export interface Table {
  id: string;
  caption: string;
  headers: string[];
  rows: string[][];
  alignments: ('left' | 'center' | 'right')[];
  style: 'booktabs' | 'simple' | 'grid';
}

export interface Section {
  id: string;
  heading: string;
  paragraphs: string[];
  figures: Figure[];
  tables: Table[];
}

export interface ArticleState {
  journalName: string;
  volume: string;
  conferenceLine: string;
  publisher: string;
  copyrightYear: string;
  licenseLine: string;
  startPageNumber?: string;
  title: string;
  authors: string;
  affiliation: string;
  keywords: string;
  abstract: string;
  sections: Section[];
  referencesText: string;
}
