import { displaySessionTitle } from '@/features/sessions/utils'

export function ProjectPath({
  projectName,
  sessionTitle,
}: {
  projectName: string
  sessionTitle?: string | null
}) {
  const hasSession = sessionTitle !== undefined
  const { text, isUntitled } = displaySessionTitle(sessionTitle)

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-13 font-medium text-text-muted">{projectName}</span>
      {hasSession && (
        <>
          <span className="shrink-0 text-13 text-text-hint">/</span>
          <span className={`truncate text-15 ${isUntitled ? 'text-text-muted' : 'font-bold text-text-primary'}`}>
            {text}
          </span>
        </>
      )}
    </div>
  )
}
