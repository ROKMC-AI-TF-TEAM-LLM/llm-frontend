import { useDocumentTitle } from '../hooks/useDocumentTitle'
import DocGenWorkspace from '../features/docgen/DocGenWorkspace'

export default function DocGenPage() {
  useDocumentTitle('문서 제작')
  return (
    <div className="custom-scroll h-full overflow-y-auto">
      <DocGenWorkspace />
    </div>
  )
}
