import { useState, useRef, useEffect } from 'react';
import {
    HiOutlinePhotograph, HiOutlineVideoCamera, HiOutlineDocumentText,
    HiOutlineTable, HiOutlineExternalLink, HiOutlinePencil, HiOutlineTrash,
    HiOutlineDownload, HiOutlineCheck, HiX, HiOutlineTag,
} from 'react-icons/hi';
import type { AssetFile, FileType, Label } from '../types';
import { formatFileSize } from '../utils/fileUtils';
import { detectLinkType } from './AddLinkModal';
import FileLabelPicker from './FileLabelPicker';

interface FileCardProps {
    file: AssetFile;
    appLabels: Label[];
    onClick: (file: AssetFile) => void;
    onRename?: (file: AssetFile, newName: string) => void;
    onDelete?: (file: AssetFile) => void;
    onUpdateTags?: (fileId: string, tags: string[]) => void;
    onManageLabels?: () => void;
    isSelected?: boolean;
    onToggleSelect?: (fileId: string) => void;
}

function TypeBadge({ type, linkUrl }: { type: FileType; linkUrl?: string }) {
    if (type === 'link' && linkUrl) {
        const meta = detectLinkType(linkUrl);
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                style={{ background: meta.bgColor, color: meta.color }}>
                {meta.emoji} {meta.label.toUpperCase().slice(0, 6)}
            </span>
        );
    }

    const config: Record<FileType, { icon: React.ReactNode; className: string; label: string }> = {
        image: { icon: <HiOutlinePhotograph size={11} />, className: 'badge-image', label: 'IMG' },
        video: { icon: <HiOutlineVideoCamera size={11} />, className: 'badge-video', label: 'VID' },
        text: { icon: <HiOutlineDocumentText size={11} />, className: 'badge-text', label: 'TXT' },
        pdf: { icon: <HiOutlineDocumentText size={11} />, className: 'badge-pdf', label: 'PDF' },
        xlsx: { icon: <HiOutlineTable size={11} />, className: 'badge-xlsx', label: 'XLS' },
        link: { icon: <HiOutlineExternalLink size={11} />, className: 'badge-other', label: 'LINK' },
        other: { icon: <HiOutlineDocumentText size={11} />, className: 'badge-other', label: 'FILE' },
    };
    const c = config[type];
    return (
        <span className={`${c.className} inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase`}>
            {c.icon} {c.label}
        </span>
    );
}

function getDomain(url: string): string {
    try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
}

export default function FileCard({ file, appLabels, onClick, onRename, onDelete, onUpdateTags, onManageLabels, isSelected, onToggleSelect }: FileCardProps) {
    const hasThumb = file.thumbnailUrl && (file.type === 'image' || file.type === 'video');
    const isLink = file.type === 'link';
    const linkMeta = isLink ? detectLinkType(file.webViewLink || file.downloadUrl || '') : null;

    // Context menu state
    const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
    const ctxRef = useRef<HTMLDivElement>(null);

    // Label Picker popup
    const [labelPickerPos, setLabelPickerPos] = useState<{ x: number; y: number } | null>(null);

    // Rename state
    const [isRenaming, setIsRenaming] = useState(false);
    const [editName, setEditName] = useState(file.name);
    const editRef = useRef<HTMLInputElement>(null);

    // Delete confirm state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Close context menu on outside click
    useEffect(() => {
        if (!ctxMenu) return;
        const handle = (e: MouseEvent) => {
            if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) setCtxMenu(null);
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [ctxMenu]);

    // Focus rename input
    useEffect(() => {
        if (isRenaming) {
            setEditName(file.name);
            setTimeout(() => {
                editRef.current?.focus();
                editRef.current?.select();
            }, 50);
        }
    }, [isRenaming, file.name]);

    const handleClick = (e: React.MouseEvent) => {
        if (isRenaming) return;
        if (onToggleSelect && (e.ctrlKey || e.metaKey)) {
            e.stopPropagation();
            onToggleSelect(file.id);
        } else if (isLink && file.webViewLink) {
            window.open(file.webViewLink, '_blank', 'noopener,noreferrer');
        } else {
            onClick(file);
        }
    };

    function handleSelectClick(e: React.MouseEvent) {
        e.stopPropagation();
        onToggleSelect?.(file.id);
    }

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ x: e.clientX, y: e.clientY });
    };

    const handleRenameSubmit = () => {
        const trimmed = editName.trim();
        if (trimmed && trimmed !== file.name && onRename) {
            onRename(file, trimmed);
        }
        setIsRenaming(false);
    };

    return (
        <>
            <div
                className={`group relative flex flex-col rounded-xl overflow-hidden
          bg-surface-2 border transition-all duration-200 hover:shadow-lg hover:shadow-primary/5
          hover:-translate-y-0.5 text-left w-full cursor-pointer
          ${isSelected
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-border hover:border-primary/40'}`}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
            >
                {/* Selection checkbox overlay */}
                {onToggleSelect && (
                    <button
                        onClick={handleSelectClick}
                        className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md flex items-center justify-center
                            transition-all duration-200 border
                            ${isSelected
                                ? 'bg-primary border-primary text-black opacity-100'
                                : 'bg-black/40 border-white/30 text-transparent opacity-0 group-hover:opacity-100'}`}
                    >
                        <HiOutlineCheck size={14} />
                    </button>
                )}
                {/* Thumbnail / placeholder */}
                <div className="relative aspect-square bg-surface-3 flex items-center justify-center overflow-hidden">
                    {hasThumb ? (
                        <>
                            <img src={file.thumbnailUrl} alt={file.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            {file.type === 'video' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                                        <div className="w-0 h-0 ml-1 border-t-[8px] border-t-transparent border-l-[14px] border-l-gray-800 border-b-[8px] border-b-transparent" />
                                    </div>
                                </div>
                            )}
                        </>
                    ) : isLink && linkMeta ? (
                        <div className="flex flex-col items-center gap-2 w-full h-full justify-center"
                            style={{ background: `linear-gradient(135deg, ${linkMeta.bgColor}, transparent)` }}>
                            <span className="text-5xl select-none group-hover:scale-110 transition-transform duration-200">
                                {linkMeta.emoji}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                style={{ color: linkMeta.color, background: linkMeta.bgColor }}>
                                {linkMeta.label}
                            </span>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-6 h-6 rounded-full bg-surface/80 backdrop-blur flex items-center justify-center">
                                    <HiOutlineExternalLink size={12} className="text-text-secondary" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 opacity-60">
                            <span style={{ color: { image: '#10B981', video: '#8B5CF6', text: '#3B82F6', pdf: '#EF4444', xlsx: '#F59E0B', link: '#60A5FA', other: '#6B7280' }[file.type] }}>
                                {{ image: <HiOutlinePhotograph size={40} />, video: <HiOutlineVideoCamera size={40} />, text: <HiOutlineDocumentText size={40} />, pdf: <HiOutlineDocumentText size={40} />, xlsx: <HiOutlineTable size={40} />, link: <HiOutlineExternalLink size={40} />, other: <HiOutlineDocumentText size={40} /> }[file.type]}
                            </span>
                            <span className="text-xs text-text-muted uppercase font-mono">
                                {file.mimeType.split('/').pop()?.split('.').pop()}
                            </span>
                        </div>
                    )}

                    {/* Type badge overlay */}
                    <div className="absolute top-2 left-2">
                        <TypeBadge type={file.type} linkUrl={isLink ? (file.webViewLink || file.downloadUrl) : undefined} />
                    </div>

                    {/* Hover action buttons (top right) */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Open in Drive */}
                        <a
                            href={`https://drive.google.com/file/d/${file.driveId}/view`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 rounded-lg bg-surface/80 backdrop-blur-sm flex items-center justify-center
                  text-text-secondary hover:text-primary hover:bg-primary/10 transition-all"
                            title="Mở trên Drive"
                        >
                            <HiOutlineExternalLink size={13} />
                        </a>
                        {onRename && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }}
                                className="w-7 h-7 rounded-lg bg-surface/80 backdrop-blur-sm flex items-center justify-center
                  text-text-secondary hover:text-white hover:bg-surface-3 transition-all"
                                title="Đổi tên"
                            >
                                <HiOutlinePencil size={13} />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                                className="w-7 h-7 rounded-lg bg-surface/80 backdrop-blur-sm flex items-center justify-center
                  text-text-secondary hover:text-error hover:bg-error/10 transition-all"
                                title="Xóa"
                            >
                                <HiOutlineTrash size={13} />
                            </button>
                        )}
                    </div>
                </div>

                {/* File info */}
                <div className="p-3 flex flex-col gap-1.5">
                    {isRenaming ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                                ref={editRef}
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameSubmit();
                                    if (e.key === 'Escape') setIsRenaming(false);
                                }}
                                onBlur={handleRenameSubmit}
                                className="flex-1 min-w-0 px-2 py-0.5 rounded-md text-xs bg-surface-3 border border-primary
                  text-white outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <button onClick={handleRenameSubmit} className="text-success hover:text-success/80">
                                <HiOutlineCheck size={14} />
                            </button>
                            <button onClick={() => setIsRenaming(false)} className="text-text-muted hover:text-error">
                                <HiX size={12} />
                            </button>
                        </div>
                    ) : (
                        <p className="text-xs font-medium text-white truncate leading-tight" title={file.name}>
                            {file.name}
                        </p>
                    )}

                    <div className="flex items-center gap-1.5 flex-wrap">
                        {file.tags.slice(0, 3).map((tagId) => {
                            const lbl = appLabels.find(l => l.id === tagId);
                            if (lbl) {
                                return (
                                    <span key={tagId} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium"
                                        style={{ backgroundColor: `${lbl.color}20`, color: lbl.color, border: `1px solid ${lbl.color}40` }}>
                                        {lbl.name}
                                    </span>
                                );
                            }
                            // Fallback for old simple tags
                            return <span key={tagId} className="tag-chip text-[9px]">#{tagId}</span>;
                        })}
                        {file.tags.length > 3 && (
                            <span className="text-[9px] text-text-muted">+{file.tags.length - 3}</span>
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-text-muted">
                            {isLink ? getDomain(file.webViewLink || '') || 'Link' : formatFileSize(file.size)}
                        </span>
                        <span className="text-[10px] text-text-muted">
                            {file.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Context menu */}
            {ctxMenu && (
                <div
                    ref={ctxRef}
                    className="fixed z-50 w-48 py-1.5 rounded-xl glass-strong animate-scale-in"
                    style={{
                        left: ctxMenu.x, top: ctxMenu.y,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                    }}
                >
                    {onRename && (
                        <button
                            onClick={() => { setCtxMenu(null); setIsRenaming(true); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <HiOutlinePencil size={14} /> Đổi tên
                        </button>
                    )}
                    {file.webViewLink && (
                        <button
                            onClick={() => { setCtxMenu(null); window.open(file.webViewLink, '_blank'); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <HiOutlineDownload size={14} /> Mở trên Drive
                        </button>
                    )}
                    {onUpdateTags && onManageLabels && (
                        <button
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setLabelPickerPos({ x: rect.right + 10, y: rect.top });
                                setCtxMenu(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <HiOutlineTag size={14} /> Gắn Label
                        </button>
                    )}
                    {onDelete && (
                        <>
                            <div className="my-1 border-t border-border" />
                            <button
                                onClick={() => { setCtxMenu(null); setShowDeleteConfirm(true); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-error hover:bg-error/10 transition-colors"
                            >
                                <HiOutlineTrash size={14} /> Xóa
                            </button>
                        </>
                    )}
                </div>
            )}

            {labelPickerPos && onUpdateTags && onManageLabels && (
                <FileLabelPicker
                    file={file}
                    appLabels={appLabels}
                    onUpdateFileTags={onUpdateTags}
                    onManageLabels={onManageLabels}
                    position={labelPickerPos}
                    onClose={() => setLabelPickerPos(null)}
                />
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="relative bg-surface p-6 rounded-2xl w-[320px] shadow-2xl border border-white/10 animate-scale-in"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-error/15 flex items-center justify-center text-lg shrink-0">
                                ⚠️
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white leading-tight">Xóa file?</h3>
                                <p className="text-[11px] text-text-muted mt-0.5">Hành động không thể hoàn tác</p>
                            </div>
                        </div>
                        <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                            Bạn có chắc muốn xóa <strong className="text-white break-all">"{file.name}"</strong>?
                            <br /><span className="text-[11px] opacity-80 mt-1 block">File sẽ bị xóa khỏi Google Drive.</span>
                        </p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 rounded-xl text-xs font-medium text-white hover:bg-white/10 transition-all border border-white/10">
                                Hủy
                            </button>
                            <button onClick={() => { setShowDeleteConfirm(false); onDelete?.(file); }}
                                className="px-4 py-2 rounded-xl text-xs font-semibold bg-error text-white hover:bg-error/90 transition-all shadow-lg shadow-error/20 border border-error/50">
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
