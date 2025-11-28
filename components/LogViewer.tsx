import React from 'react';
import { LogFile, SearchResult } from '../types';

interface LogViewerProps {
  files: LogFile[];
  searchResults: SearchResult[];
  searchQuery: string;
}

const LogViewer: React.FC<LogViewerProps> = ({ files, searchResults, searchQuery }) => {
  // If we have search results, show them. Otherwise show empty state or raw files (simplified for this demo to results view)
  
  if (!searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p>Selecciona un archivo a la izquierda o realiza una búsqueda para ver resultados.</p>
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p>No se encontraron coincidencias para "{searchQuery}"</p>
      </div>
    );
  }

  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    // Simple robust regex escape
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-yellow-500/50 text-white font-bold px-0.5 rounded">{part}</span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="h-full overflow-y-auto log-scroll bg-[#0b1120] p-4 rounded-lg border border-gray-800 font-mono text-sm">
      {searchResults.map((result, idx) => (
        <div key={`${result.fileId}-${idx}`} className="mb-2 group hover:bg-white/5 p-2 rounded transition-colors">
          <div className="flex items-center text-xs text-aya-500 mb-1 opacity-70 group-hover:opacity-100">
            <span className="font-semibold mr-2">[{result.fileName}]</span>
            <span className="text-gray-500">Línea {result.lineNumber}</span>
          </div>
          <div className="text-gray-300 break-all whitespace-pre-wrap">
             {highlightText(result.lineContent, searchQuery)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LogViewer;