import React, { useState, useEffect, useMemo } from 'react';
import FileUpload from './components/FileUpload';
import LogViewer from './components/LogViewer';
import AISidebar from './components/AISidebar';
import { processLogArchive } from './services/tarHelper';
import { LogFile, AppState, SearchResult } from './types';
import { IconSearch, IconRobot, IconFile } from './components/Icon';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [files, setFiles] = useState<LogFile[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);

  // Handle file processing
  const handleFilesSelected = async (selectedFiles: File[]) => {
    setState(AppState.PROCESSING);
    setFiles([]); // Clear previous
    const newLogFiles: LogFile[] = [];

    try {
      for (const file of selectedFiles) {
        setStatusMsg(`Procesando ${file.name}...`);
        const extracted = await processLogArchive(file);
        newLogFiles.push(...extracted);
      }
      setFiles(newLogFiles);
      setState(AppState.READY);
      setStatusMsg('');
    } catch (error) {
      console.error(error);
      setState(AppState.ERROR);
      setStatusMsg('Error al procesar archivos. Asegúrate de que son .tar.gz o .gz válidos.');
    }
  };

  // Search Logic
  const searchResults = useMemo(() => {
    if (!searchQuery && !selectedFileId) return [];

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];
    const limit = 2000; // Hard limit for rendering performance

    // Filter files: if a file is selected, only search that one. Else search all.
    const targetFiles = selectedFileId 
      ? files.filter(f => f.id === selectedFileId)
      : files;

    let count = 0;

    for (const file of targetFiles) {
      if (count >= limit) break;
      
      const lines = file.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // If query is empty but file is selected, show all lines
        if (!query) {
             results.push({
                fileId: file.id,
                fileName: file.name,
                lineContent: line,
                lineNumber: i + 1,
                matchIndex: 0
            });
            count++;
             if (count >= limit) break;
             continue;
        }

        // Search match
        const idx = line.toLowerCase().indexOf(query);
        if (idx !== -1) {
          results.push({
            fileId: file.id,
            fileName: file.name,
            lineContent: line,
            lineNumber: i + 1,
            matchIndex: idx
          });
          count++;
          if (count >= limit) break;
        }
      }
    }

    return results;
  }, [files, searchQuery, selectedFileId]);

  // Aggregate visible text for AI context
  const visibleLogsContext = useMemo(() => {
      return searchResults.map(r => r.lineContent).join('\n');
  }, [searchResults]);


  return (
    <div className="flex h-screen bg-aya-darker text-slate-200">
      {/* Sidebar: File List */}
      <div className="w-64 flex-shrink-0 bg-[#0f172a] border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold text-aya-500 tracking-tight">AYA Traffic</h1>
          <p className="text-xs text-gray-500">Indexador Profesional v1.0</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
            {files.length === 0 && state === AppState.READY && (
                <div className="text-center text-xs text-gray-600 mt-4">Sin archivos</div>
            )}
            
            <div className="space-y-1">
                <button
                    onClick={() => setSelectedFileId(null)}
                    className={`w-full text-left px-3 py-2 rounded text-sm flex items-center ${selectedFileId === null && files.length > 0 ? 'bg-aya-900/50 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <span className="truncate">Todos los archivos</span>
                    <span className="ml-auto text-xs bg-gray-800 px-1.5 rounded">{files.length}</span>
                </button>

                {files.map(file => (
                <button
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`w-full text-left px-3 py-2 rounded text-sm flex items-center group ${selectedFileId === file.id ? 'bg-aya-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <IconFile className="w-4 h-4 mr-2 opacity-70" />
                    <span className="truncate w-32" title={file.name}>{file.name}</span>
                    <span className="ml-auto text-[10px] opacity-50">{(file.size / 1024).toFixed(0)}kb</span>
                </button>
                ))}
            </div>
        </div>
        
        <div className="p-4 border-t border-gray-800">
             <button 
                onClick={() => setFiles([]) && setState(AppState.IDLE)}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
             >
                Limpiar Todo
             </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header / Search */}
        <div className="h-16 border-b border-gray-800 flex items-center px-6 bg-[#0f172a] gap-4">
            <div className="relative flex-1 max-w-2xl">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Buscar (ej: 'error', '500', '192.168.1.1')..." 
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-aya-500 focus:ring-1 focus:ring-aya-500 outline-none transition-all placeholder-gray-600"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="ml-auto flex items-center gap-3">
                 <button 
                    onClick={() => setIsAiOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-purple-900/20"
                 >
                    <IconRobot className="w-4 h-4" />
                    <span>Preguntar a IA</span>
                 </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-hidden relative bg-[#020617]">
            {state === AppState.IDLE && (
                <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto">
                    <h2 className="text-2xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-aya-400 to-purple-400">
                        Centro de Análisis de Logs
                    </h2>
                    <FileUpload onFilesSelected={handleFilesSelected} isLoading={false} />
                    <p className="mt-8 text-sm text-gray-500 text-center max-w-md">
                        Sube tus archivos .tar.gz o .gz conteniendo logs. Todo el procesamiento se realiza localmente en tu navegador por seguridad.
                    </p>
                </div>
            )}

            {state === AppState.PROCESSING && (
                <div className="h-full flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-aya-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-aya-400 font-mono animate-pulse">{statusMsg}</p>
                </div>
            )}

            {state === AppState.ERROR && (
                <div className="h-full flex flex-col items-center justify-center text-red-400">
                    <p className="text-lg font-semibold mb-2">⚠ Ocurrió un error</p>
                    <p className="text-sm opacity-80">{statusMsg}</p>
                    <button 
                        onClick={() => setState(AppState.IDLE)} 
                        className="mt-4 text-white bg-red-900/50 hover:bg-red-900/80 px-4 py-2 rounded text-sm border border-red-800"
                    >
                        Intentar de nuevo
                    </button>
                </div>
            )}

            {state === AppState.READY && (
                <div className="h-full flex flex-col">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                            {selectedFileId ? files.find(f => f.id === selectedFileId)?.name : 'Resultados Globales'}
                        </h3>
                        <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">
                            {searchResults.length} líneas encontradas
                        </span>
                     </div>
                     <div className="flex-1 overflow-hidden rounded-xl border border-gray-800 bg-[#0b1120] shadow-2xl">
                        <LogViewer files={files} searchResults={searchResults} searchQuery={searchQuery} />
                     </div>
                </div>
            )}
        </div>
      </div>

      {/* AI Sidebar Overlay */}
      <AISidebar 
        visibleLogs={visibleLogsContext} 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
      />
    </div>
  );
};

export default App;