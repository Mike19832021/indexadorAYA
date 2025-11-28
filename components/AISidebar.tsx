import React, { useState } from 'react';
import { analyzeLogs } from '../services/geminiService';
import { IconRobot } from './Icon';
import ReactMarkdown from 'react-markdown';

interface AISidebarProps {
  visibleLogs: string; // Aggregated text of currently visible results
  isOpen: boolean;
  onClose: () => void;
}

const AISidebar: React.FC<AISidebarProps> = ({ visibleLogs, isOpen, onClose }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('');
    
    // Provide context based on whether there are filtered results or not
    const context = visibleLogs.length > 0 
      ? visibleLogs 
      : "No logs selected or visible.";

    const result = await analyzeLogs(question, context);
    setAnswer(result);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-gray-900 border-l border-gray-700 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <IconRobot className="w-5 h-5 text-purple-400" />
          Analista AYA AI
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {answer && (
           <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-200 border border-purple-500/30">
             <div className="prose prose-invert prose-sm max-w-none">
                {/* We render markdown safely */}
                <ReactMarkdown>{answer}</ReactMarkdown>
             </div>
           </div>
        )}
      </div>

      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="relative">
            <textarea 
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                rows={3}
                placeholder="Pregunta sobre los logs (ej: ¿Hay errores 500?)"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAsk();
                    }
                }}
            />
            <button 
                className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-500 text-white rounded p-1.5 transition-colors disabled:opacity-50"
                onClick={handleAsk}
                disabled={loading || !question.trim()}
            >
                {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                )}
            </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
            Analiza los logs visibles en la pantalla actual.
        </p>
      </div>
    </div>
  );
};

export default AISidebar;