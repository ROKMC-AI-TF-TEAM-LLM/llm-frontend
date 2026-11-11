import { useLocation, useNavigate } from 'react-router-dom'
import { confirm } from '@/shared/store/confirmStore'
import { useDeleteProject } from './projects'

// 프로젝트 삭제 진입점(프로젝트 페이지 메뉴·사이드바 목록·즐겨찾기)을 하나로 묶는다.
// 확인 → 서버 삭제 → 보고 있던 프로젝트면 새 채팅으로 이동.
export const useConfirmDeleteProject = () => {
  const { mutate } = useDeleteProject()
  const navigate = useNavigate()
  const location = useLocation()
  return async (project: { id: string; name: string }) => {
    const ok = await confirm({
      title: `'${project.name}' 프로젝트를 삭제하시겠습니까?`,
      message:
        '하위 대화와 메시지, 업로드한 참고 파일이 모두 함께 삭제되며 되돌릴 수 없습니다.',
      danger: true,
    })
    if (!ok) return
    mutate(project.id)
    const base = `/projects/${project.id}`
    if (location.pathname === base || location.pathname.startsWith(`${base}/`))
      navigate('/chat')
  }
}
