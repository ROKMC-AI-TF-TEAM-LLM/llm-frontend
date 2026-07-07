// 클립보드 복사. 보안 컨텍스트(https/localhost)에서는 표준 Clipboard API를 쓰고,
// 비보안 컨텍스트(예: http://LAN-IP)에서는 navigator.clipboard가 없으므로 임시 textarea + execCommand 폴백.
// Promise를 반환하므로 기존 .then()/.catch() 체인을 그대로 쓸 수 있다.
export function copyText(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise<void>((resolve, reject) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) resolve();
      else reject(new Error('execCommand copy failed'));
    } catch (e) {
      reject(e);
    }
  });
}
