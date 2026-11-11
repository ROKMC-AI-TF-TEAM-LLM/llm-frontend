import { FileIcon } from '@/shared/components/icons';
interface ImageAttachmentProps {
  filename?: string;
  caption?: string;
}

export default function ImageAttachment({
  filename = 'unknown',
  caption,
}: ImageAttachmentProps) {
  const ext = filename.includes('.') ? filename.split('.').pop()?.toUpperCase() : null;

  return (
    <div className="flex justify-end mb-1">
      <div className="max-w-[70%] bg-brand text-white rounded-2xl rounded-tr-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3">
          <div className="bg-brand-soft rounded-lg p-2 shrink-0">
            <FileIcon width={20} height={20} className="text-brand" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{filename}</span>
            {ext && <span className="text-xs text-white/70 uppercase tracking-wide">{ext}</span>}
          </div>
        </div>
        {caption && (
          <>
            <div className="border-t border-white/20 mx-4" />
            <div className="px-4 pt-3 pb-3 text-sm leading-relaxed wrap-break-word">
              {caption}
            </div>
          </>
        )}
      </div>
    </div>
  );
}