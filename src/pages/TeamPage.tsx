import { useEffect } from 'react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import LandingFooter from '../ui/components/landing/LandingFooter'
import TeamHero from '../features/team/sections/TeamHero'
import TeamValues from '../features/team/sections/TeamValues'
import TeamDomains from '../features/team/sections/TeamDomains'
import TeamVoices from '../features/team/sections/TeamVoices'
import TeamCta from '../features/team/sections/TeamCta'
import PageNav from '../ui/components/landing/PageNav'

export default function TeamPage() {
  useDocumentTitle('팀 소개')

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-shown')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.15 },
    )
    document.querySelectorAll('.mars-reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-surface text-text-primary">
      <PageNav current="team" />

      <main>
        <TeamHero />
        <TeamValues />
        <TeamDomains />
        <TeamVoices />
        <TeamCta />
      </main>

      <LandingFooter />
    </div>
  )
}
