import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  type?: 'error' | 'success';
}

export default function Toast({ message, onClose, type = 'error' }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const fadeOut = setTimeout(() => setVisible(false), 2500);
    const close = setTimeout(onClose, 3000);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(fadeOut);
      clearTimeout(close);
    };
  }, [message, onClose]);

  const styles = type === 'success'
    ? { wrap: 'bg-green-50 border-green-200 text-green-700', btn: 'text-green-400 hover:text-green-600' }
    : { wrap: 'bg-red-50 border-red-200 text-red-700', btn: 'text-red-400 hover:text-red-600' };

  const icon = type === 'success' ? (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  return (
    <div className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 border px-6 py-4 rounded-xl shadow-lg text-base font-medium whitespace-nowrap transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'} ${styles.wrap}`}>
      {icon}
      {message}
      <button onClick={onClose} className={`ml-1 ${styles.btn}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
