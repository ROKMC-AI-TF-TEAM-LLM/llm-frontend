interface ChatHeaderProps {
  title: string;
}

export default function ChatHeader({ title }: ChatHeaderProps) {
  return (
    <header className="h-15 px-6 flex items-center border-b border-[#D1CFCC]">
      <h1 className="text-base font-bold text-text-primary truncate">{title}</h1>
    </header>
  );
}
