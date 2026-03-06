import { useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import type { AssetFile, Label } from '../types';
import FileCard from './FileCard';
import { HiOutlineCloudUpload } from 'react-icons/hi';

interface FileGalleryProps {
    files: AssetFile[];
    appLabels: Label[];
    onFileClick: (file: AssetFile) => void;
    onFileDrop: (files: File[]) => void;
    onFileRename?: (file: AssetFile, newName: string) => void;
    onFileDelete?: (file: AssetFile) => void;
    onUpdateTags?: (fileId: string, tags: string[]) => void;
    onManageLabels?: () => void;
    selectedFileIds?: Set<string>;
    onToggleSelect?: (fileId: string) => void;
    isLoading: boolean;
    gridSize?: 'small' | 'medium' | 'large';
}

function SkeletonCard() {
    return (
        <div className="rounded-xl overflow-hidden bg-surface-2 border border-border">
            <div className="aspect-square animate-shimmer" />
            <div className="p-3 space-y-2">
                <div className="h-3 w-3/4 rounded animate-shimmer" />
                <div className="h-2 w-1/2 rounded animate-shimmer" />
            </div>
        </div>
    );
}

export default function FileGallery({ files, appLabels, onFileClick, onFileDrop, onFileRename, onFileDelete, onUpdateTags, onManageLabels, selectedFileIds, onToggleSelect, isLoading, gridSize = 'medium' }: FileGalleryProps) {
    const handleDrop = useCallback((accepted: File[]) => {
        if (accepted.length > 0) onFileDrop(accepted);
    }, [onFileDrop]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: handleDrop,
        noClick: files.length > 0, // only clickable when empty
        accept: {
            'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
            'video/*': ['.mp4', '.mov', '.webm'],
            'text/*': ['.txt'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/csv': ['.csv'],
        },
    });

    const gridClass = useMemo(() => {
        if (gridSize === 'small') return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3';
        if (gridSize === 'large') return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6';
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4';
    }, [gridSize]);

    if (isLoading) {
        return (
            <div className={`grid ${gridClass}`}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        );
    }

    if (files.length === 0) {
        return (
            <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed
          cursor-pointer transition-all duration-200 animate-fade-in
          ${isDragActive
                        ? 'border-primary bg-primary/8 dropzone-active'
                        : 'border-border/50 hover:border-primary/40 hover:bg-primary/3'}`}
            >
                <input {...getInputProps()} />
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors
          ${isDragActive ? 'bg-primary/20 text-primary' : 'bg-surface-3 text-text-muted'}`}>
                    <HiOutlineCloudUpload size={32} />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">
                    {isDragActive ? 'Drop files here!' : 'No files here'}
                </h3>
                <p className="text-sm text-text-secondary text-center max-w-xs mb-3">
                    Drag & drop files, paste images (⌘V), or click to upload
                </p>
                <span className="text-xs text-text-muted px-4 py-1.5 rounded-full bg-surface-3/50">
                    JPG · PNG · MP4 · PDF · XLSX · TXT
                </span>
            </div>
        );
    }

    return (
        <div {...getRootProps()} className={`relative rounded-2xl transition-all
      ${isDragActive ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-surface' : ''}`}>
            <input {...getInputProps()} />
            {isDragActive && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl
          bg-surface/80 backdrop-blur-sm border-2 border-dashed border-primary animate-fade-in">
                    <div className="flex flex-col items-center gap-2">
                        <HiOutlineCloudUpload size={40} className="text-primary" />
                        <p className="text-sm font-semibold text-white">Drop to upload</p>
                    </div>
                </div>
            )}
            <div className={`grid ${gridClass}`}>
                {files.map((file, i) => (
                    <div key={file.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                        <FileCard
                            file={file}
                            appLabels={appLabels}
                            onClick={onFileClick}
                            onRename={onFileRename}
                            onDelete={onFileDelete}
                            onUpdateTags={onUpdateTags}
                            onManageLabels={onManageLabels}
                            isSelected={selectedFileIds?.has(file.id)}
                            onToggleSelect={onToggleSelect}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
