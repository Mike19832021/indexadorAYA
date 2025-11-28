import React, { useCallback } from 'react';
import { IconUpload } from './Icon';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, isLoading }) => {
  const isAllowedFile = (file: File) => {
    const name = file.name.toLowerCase();
    return name.endsWith('.tar.gz') || name.endsWith('.tgz') || name.endsWith('.gz');
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (isLoading) return;
      const files = Array.from(e.dataTransfer.files).filter(isAllowedFile);
      if (files.length > 0) onFilesSelected(files);
    },
    [onFilesSelected, isLoading]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && !isLoading) {
      const files = Array.from(e.target.files).filter(isAllowedFile);
      if (files.length > 0) onFilesSelected(files);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
        ${isLoading ? 'opacity-50 cursor-not-allowed border-gray-600' : 'border-aya-500 hover:border-aya-400 hover:bg-aya-900/20 cursor-pointer'}
      `}
    >
      <input
        type="file"
        multiple
        accept=".tar.gz,.tgz,.gz"
        className="hidden"
        id="file-upload"
        onChange={handleChange}
        disabled={isLoading}
      />
      <label htmlFor="file-upload" className="flex flex-col items-center justify-center h-full cursor-pointer">
        <IconUpload className="w-16 h-16 text-aya-500 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          {isLoading ? 'Procesando Archivos...' : 'Arrastra archivos .tar.gz o .gz aquí'}
        </h3>
        <p className="text-gray-400">
          o haz clic para seleccionar
        </p>
      </label>
    </div>
  );
};

export default FileUpload;