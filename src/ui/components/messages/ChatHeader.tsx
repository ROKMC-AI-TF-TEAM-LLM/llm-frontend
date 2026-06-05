interface ChatHeaderProps {
  title: string;
}

export default function ChatHeader({ title }: ChatHeaderProps) {
  return (
    <header className="h-16 px-6 flex items-center border-b border-surface-border">
      <h1 className="text-base font-bold text-text-primary truncate">{title}</h1>
    </header>
  );
}