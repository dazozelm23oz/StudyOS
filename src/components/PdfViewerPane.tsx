import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Highlighter,
  Trash2,
  List,
  Maximize2,
  Check,
  X,
} from 'lucide-react';
import { Resource, Highlight, TocItem } from '../types';
import { dbService } from '../services/db';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfViewerPaneProps {
  resource: Resource;
  paneId: string;
  onClose?: () => void;
}

export const PdfViewerPane: React.FC<PdfViewerPaneProps> = ({ resource, paneId, onClose }) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(resource.last_page || 1);
  const [totalPages, setTotalPages] = useState<number>(resource.page_count || 1);
  const [zoom, setZoom] = useState<number>(resource.last_zoom || 1.2);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [highlightColor, setHighlightColor] = useState<string>('#fde047'); // Soft yellow
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ page: number; text: string }[]>([]);
  const [currentSearchIdx, setCurrentSearchIdx] = useState<number>(0);
  const [showToc, setShowToc] = useState<boolean>(false);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadPdfDocument();
    loadHighlights();
    if (resource.toc_json) {
      try {
        setTocItems(JSON.parse(resource.toc_json));
      } catch (e) {
        console.warn('Failed to parse TOC:', e);
      }
    }
  }, [resource.stored_path]);

  const loadPdfDocument = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let dataBuffer: Uint8Array | null = null;

      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { readFile } = await import('@tauri-apps/plugin-fs');
        dataBuffer = await readFile(resource.stored_path);
      }

      if (dataBuffer) {
        const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
      } else {
        // Fallback for browser testing mode: load dummy or sample doc
        setErrorMsg('Tauri native FS plugin required to load file at: ' + resource.stored_path);
      }
    } catch (err: any) {
      console.error('Failed to load PDF:', err);
      setErrorMsg('Failed to render PDF: ' + err.toString());
    } finally {
      setLoading(false);
    }
  };

  const loadHighlights = async () => {
    try {
      const h = await dbService.getHighlights(resource.id);
      setHighlights(h);
    } catch (e) {
      console.warn('Failed to load highlights:', e);
    }
  };

  // Render current page onto canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const viewport = page.getViewport({ scale: zoom * (window.devicePixelRatio || 1) });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / (window.devicePixelRatio || 1)}px`;
        canvas.style.height = `${viewport.height / (window.devicePixelRatio || 1)}px`;

        const renderContext = {
          canvasContext: ctx,
          viewport,
        };

        await page.render(renderContext).promise;

        // Persist session state to SQLite
        if (containerRef.current) {
          await dbService.updateResourceSession(
            resource.id,
            currentPage,
            zoom,
            containerRef.current.scrollTop
          );
        }
      } catch (err) {
        console.warn('Page render cancelled or failed:', err);
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, currentPage, zoom]);

  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleAddHighlight = async () => {
    const newHighlight: Highlight = {
      id: 'hl-' + Date.now(),
      resource_id: resource.id,
      page_number: currentPage,
      rects_json: JSON.stringify([[50, 100, 200, 24]]), // Normalized highlight box
      text_snippet: `Page ${currentPage} Highlight Annotation`,
      color: highlightColor,
      created_at: new Date().toISOString(),
    };
    await dbService.saveHighlight(newHighlight);
    setHighlights([...highlights, newHighlight]);
  };

  const handleDeleteHighlight = async (id: string) => {
    await dbService.deleteHighlight(id);
    setHighlights(highlights.filter((h) => h.id !== id));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !pdfDoc) return;

    const results: { page: number; text: string }[] = [];
    const query = searchQuery.toLowerCase();

    for (let p = 1; p <= pdfDoc.numPages; p++) {
      const page = await pdfDoc.getPage(p);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ')
        .toLowerCase();

      if (pageText.includes(query)) {
        results.push({ page: p, text: `Match found on page ${p}` });
      }
    }

    setSearchResults(results);
    setCurrentSearchIdx(0);
    if (results.length > 0) {
      setCurrentPage(results[0].page);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-surface border border-border rounded-xl overflow-hidden shadow-md relative">
      {/* Pane Toolbar */}
      <div className="h-12 border-b border-border bg-canvas/80 px-3 flex items-center justify-between font-mono text-xs select-none">
        <div className="flex items-center space-x-2 truncate max-w-[200px] sm:max-w-[320px]">
          <span className="font-bold text-text-main truncate" title={resource.title}>
            {resource.title}
          </span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface border border-border text-text-faint">
            P.{currentPage}/{totalPages}
          </span>
        </div>

        {/* Central Page & Zoom Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1 rounded bg-surface border border-border text-text-main disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => changePage(Number(e.target.value))}
            className="w-12 bg-surface border border-border text-center rounded px-1 py-0.5 text-xs text-text-main focus:outline-none focus:border-primary"
          />
          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1 rounded bg-surface border border-border text-text-main disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-text-faint px-1">|</span>

          <button
            onClick={() => setZoom(Math.max(0.6, zoom - 0.15))}
            className="p-1 rounded bg-surface border border-border text-text-main hover:border-primary"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-text-muted font-bold min-w-[38px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(3.0, zoom + 0.15))}
            className="p-1 rounded bg-surface border border-border text-text-main hover:border-primary"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Actions: Highlight, Search, TOC, Close */}
        <div className="flex items-center space-x-1.5">
          {/* Highlight Color Button */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1.5 rounded bg-surface border border-border hover:border-primary text-text-main flex items-center space-x-1"
              title="Add Highlight"
            >
              <div
                className="w-3.5 h-3.5 rounded-full border border-black/20"
                style={{ backgroundColor: highlightColor }}
              />
              <Highlighter className="w-3.5 h-3.5" />
            </button>

            {showColorPicker && (
              <div className="absolute right-0 top-9 p-2 rounded-xl bg-surface border border-border shadow-xl z-50 flex items-center space-x-1.5 animate-fadeIn">
                {['#fde047', '#86efac', '#93c5fd', '#f472b6', '#c084fc', '#fdba74'].map((col) => (
                  <button
                    key={col}
                    onClick={() => {
                      setHighlightColor(col);
                      setShowColorPicker(false);
                      handleAddHighlight();
                    }}
                    className="w-6 h-6 rounded-full border border-border cursor-pointer hover:scale-110 transition"
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* TOC / Bookmarks Drawer Toggle */}
          <button
            onClick={() => setShowToc(!showToc)}
            className={`p-1.5 rounded border transition ${
              showToc
                ? 'bg-primary text-canvas border-primary font-bold'
                : 'bg-surface border-border text-text-main hover:border-primary'
            }`}
            title="Table of Contents"
          >
            <List className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded bg-surface border border-border hover:text-danger text-text-muted transition"
              title="Close Pane"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body: PDF Canvas + SVG Highlights */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-canvas/90 flex justify-center p-4 relative"
      >
        {loading && (
          <div className="flex items-center justify-center font-mono text-xs text-text-muted">
            RENDERING PDF CANVAS...
          </div>
        )}

        {errorMsg && (
          <div className="max-w-md my-auto p-4 rounded-xl bg-surface border border-danger/40 text-danger text-xs font-mono text-center">
            {errorMsg}
          </div>
        )}

        <div className="relative inline-block shadow-2xl">
          <canvas ref={canvasRef} className="block rounded bg-white" />

          {/* Non-Destructive SQLite SVG Highlight Overlay */}
          <svg className="absolute inset-0 pointer-events-none w-full h-full">
            {highlights
              .filter((h) => h.page_number === currentPage)
              .map((h) => {
                let rects: number[][] = [];
                try {
                  rects = JSON.parse(h.rects_json);
                } catch (e) {}

                return rects.map((r, i) => (
                  <rect
                    key={`${h.id}-${i}`}
                    x={r[0] * zoom}
                    y={r[1] * zoom}
                    width={r[2] * zoom}
                    height={r[3] * zoom}
                    fill={h.color}
                    opacity="0.4"
                    className="cursor-pointer pointer-events-auto hover:opacity-70 transition"
                    onClick={() => handleDeleteHighlight(h.id)}
                  />
                ));
              })}
          </svg>
        </div>

        {/* TOC Sidebar Overlay */}
        {showToc && (
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-surface/95 backdrop-blur-md border-l border-border p-4 overflow-y-auto z-40 space-y-3 font-mono text-xs animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-bold text-text-main">TABLE OF CONTENTS</span>
              <button onClick={() => setShowToc(false)} className="text-text-muted hover:text-text-main">
                <X className="w-4 h-4" />
              </button>
            </div>

            {tocItems.length === 0 ? (
              <div className="text-text-faint text-[11px] py-4">No embedded TOC in document.</div>
            ) : (
              <div className="space-y-1">
                {tocItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      changePage(item.page);
                      setShowToc(false);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-canvas text-text-muted hover:text-text-main transition flex justify-between items-center"
                  >
                    <span className="truncate">{item.title}</span>
                    <span className="text-[10px] text-text-faint shrink-0 ml-1">P.{item.page}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Highlights List Footer Banner */}
      {highlights.length > 0 && (
        <div className="h-9 border-t border-border bg-canvas/90 px-3 flex items-center justify-between font-mono text-[11px]">
          <span className="text-text-muted">
            {highlights.filter((h) => h.page_number === currentPage).length} annotations on page {currentPage}
          </span>
          <div className="flex items-center space-x-2">
            {highlights
              .filter((h) => h.page_number === currentPage)
              .map((h) => (
                <button
                  key={h.id}
                  onClick={() => handleDeleteHighlight(h.id)}
                  className="px-2 py-0.5 rounded bg-surface border border-border text-text-main hover:text-danger flex items-center space-x-1"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: h.color }} />
                  <span>Delete</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
