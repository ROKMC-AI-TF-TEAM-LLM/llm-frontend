import { useNavigate } from 'react-router-dom'
import { GUIDE_SECTIONS, GUIDE_EXTRAS } from './guideSections'
import { setPostLoginRedirect } from '../../../utils/postLoginRedirect'
import { TUTORIALS } from '../../../features/tutorials/tutorials'

/**
 * 랜딩·가이드 공용 하단 푸터.
 *
 * 링크는 실제로 존재하는 경로만 넣는다 — 없는 페이지를 적어두면
 * 눌렀을 때 빈 화면이 나와 오히려 신뢰를 깎는다.
 * (문서 검색·문서함 등 로그인이 필요한 메뉴는 로그인 화면으로 보낸다)
 */
export default function LandingFooter({ onStart }: { onStart?: () => void }) {
  const navigate = useNavigate()
  const year = new Date().getFullYear()

  // 로그인해야 볼 수 있는 메뉴 — 목적지를 적어 두고 로그인 화면을 연다.
  // 로그인에 성공하면 AuthLayout이 그 목적지로 보내준다.
  const goAuth = (to: string) => {
    setPostLoginRedirect(to)
    if (onStart) onStart()   // 랜딩이면 로그인 패널만 슬라이드로 연다
    else navigate('/')       // 가이드 등 다른 페이지면 랜딩으로 이동
  }

  // 푸터는 페이지 맨 아래에 있어서, 그냥 이동하면 새 페이지도 아래쪽부터 보인다.
  // (같은 화면으로 가는 경우엔 리마운트도 안 돼 스크롤이 그대로 남는다)
  // 그래서 푸터에서 나가는 이동은 항상 맨 위로 올려준다.
  const goTop = (to: string) => {
    navigate(to)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  return (
    <footer className="mars-footer">
      <div className="mars-footer-inner">
        {/* 왼쪽 : 브랜드 + 소속 */}
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

        {/* 오른쪽 : 링크 다단 */}
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

          {/* 튜토리얼 + 팀 소개 — 로그인 없이 볼 수 있는 안내성 페이지들 */}
          <FooterCol title="알아보기">
            <FooterBtn onClick={() => goTop('/team')}>팀 소개</FooterBtn>
            <FooterBtn onClick={() => goTop('/tutorials')}>튜토리얼 전체</FooterBtn>
            {TUTORIALS.slice(0, 3).map((t) => (
              <FooterBtn key={t.slug} onClick={() => goTop(`/tutorials/${t.slug}`)}>
                {t.title}
              </FooterBtn>
            ))}
          </FooterCol>
        </div>
      </div>

      {/* 최하단 : 버전 + 고지 */}
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
