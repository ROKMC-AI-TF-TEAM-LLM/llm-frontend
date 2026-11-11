/** `512B` · `85.9KB` · `1.2MB`. 크기를 모르면(없거나 0 이하) null */
export const formatFileSize = (size?: number | null): string | null => {
  if (!size || size <= 0) return null
  if (size < 1024) return `${size}B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`
  return `${(size / 1024 / 1024).toFixed(1)}MB`
}
