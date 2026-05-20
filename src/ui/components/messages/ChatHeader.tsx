interface ChatHeaderProps {
  title: string;
}

export default function ChatHeader({ title }: ChatHeaderProps) {
  return (
    <header className="px-6 py-4 border-b border-surface-border">
      <h1 className="text-sm font-medium text-text-primary truncate">{title}</h1>
    </header>
  );
}