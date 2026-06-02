import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  type?: 'error' | 'success';
}

const STYLES = {
  error: {
    container: 'bg-red-50 border-red-200 text-red-700',
    icon: 'text-red-400 hover:text-red-600',
    path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  success: {
    container: 'bg-green-50 border-green-200 text-green-700',
    icon: 'text-green-400 hover:text-green-600',
    path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
};

export default function Toast({ message, onClose, type = 'error' }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  const style = STYLES[type];

  return ( 
    <div className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 border px-4 py-3 rounded-xl shadow-lg text-sm whitespace-nowrap ${style.container}`}>
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={style.path} />
      </svg>
      {message}
      <button onClick={onClose} className={`ml-1 ${style.icon}`}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
