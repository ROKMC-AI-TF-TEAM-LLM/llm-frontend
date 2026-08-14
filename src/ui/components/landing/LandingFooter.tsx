import { useNavigate } from 'react-router-dom'
import { GUIDE_SECTIONS, GUIDE_EXTRAS } from './guideSections'
import { setPostLoginRedirect } from '../../../utils/postLoginRedirect'
import { TUTORIALS } from '../../../features/tutorials/tutorials'

export default function LandingFooter({ onStart }: { onStart?: () => void }) {
  const navigate = useNavigate()
  const year = new Date().getFullYear()

  const goAuth = (to: string) => {
    setPostLoginRedirect(to)
    if (onStart) onStart()
    else navigate('/')
  }

  const goTop = (to: string) => {
    navigate(to)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  return (
    <footer className="mars-footer">
      <div className="mars-footer-inner">
        <div className="mars-footer-brand">
          <div className="mars-footer-word">MARS</div>
          <p className="mars-footer-org">
            대한민국 해병대
            <br />
            해병대사령부 지휘통신참모처
            <br />
            지능정보화발전과 AI DATA TF
          </p>
          <p className="mars-footer-copy">© {year} Republic of Korea Marine Corps</p>
        </div>

        <div className="mars-footer-cols">
          <FooterCol title="서비스">
            <FooterBtn onClick={() => goAuth('/chat')}>대화 시작하기</FooterBtn>
            <FooterBtn onClick={() => goAuth('/search')}>문서 검색</FooterBtn>
            <FooterBtn onClick={() => goAuth('/rag')}>문서함 열람</FooterBtn>
          </FooterCol>

          <FooterCol title="이용법">
            {GUIDE_SECTIONS.map((s) => (
              <FooterBtn key={s.id} onClick={() => navigate(`/guide#${s.id}`)}>
                {s.label}
              </FooterBtn>
            ))}
          </FooterCol>

          <FooterCol title="더 알아보기">
            {GUIDE_EXTRAS.map((s) => (
              <FooterBtn key={s.id} onClick={() => navigate(`/guide#${s.id}`)}>
                {s.label}
              </FooterBtn>
            ))}
          </FooterCol>

          <FooterCol title="알아보기">
            <FooterBtn onClick={() => {}}>팀 소개</FooterBtn>
            <FooterBtn onClick={() => goTop('/tutorials')}>튜토리얼 전체</FooterBtn>
            {TUTORIALS.slice(0, 3).map((t) => (
              <FooterBtn key={t.slug} onClick={() => goTop(`/tutorials/${t.slug}`)}>
                {t.title}
              </FooterBtn>
            ))}
          </FooterCol>
        </div>
      </div>

      <div className="mars-footer-bottom">
        <span className="mars-footer-ver">MARS v1.0.0</span>
        <span className="mars-footer-disclaim">
          본 시스템은 군 내부 업무 참고용 인공지능이며, 생성된 답변에 오류가 있을 수 있습니다.
        </span>
      </div>
    </footer>
  )
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mars-footer-col">
      <div className="mars-footer-coltitle">{title}</div>
      {children}
    </div>
  )
}

function FooterBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="mars-footer-link" onClick={onClick}>
      {children}
    </button>
  )
}
