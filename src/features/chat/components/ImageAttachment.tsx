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
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-brand"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
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