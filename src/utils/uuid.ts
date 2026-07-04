// crypto.randomUUID()는 보안 컨텍스트(HTTPS 또는 localhost)에서만 제공된다.
// HTTP + IP(예: http://172.16.3.205)로 접속하면 undefined라 호출 시 에러가 나므로,
// 없을 때는 crypto.getRandomValues 기반으로 직접 RFC4122 v4 UUID를 만든다.
export const uuid = (): string => {
  const c = globalThis.crypto
  if (c?.randomUUID) return c.randomUUID()

  const bytes = new Uint8Array(16)
  if (c?.getRandomValues) {
    c.getRandomValues(bytes)
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256)
  }

  // version(4) / variant 비트 설정
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
    .slice(6, 8)
    .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`
}