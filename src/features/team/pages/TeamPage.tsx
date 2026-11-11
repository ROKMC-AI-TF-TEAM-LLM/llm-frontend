import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useRevealOnScroll } from '@/shared/hooks/useRevealOnScroll'
import LandingFooter from '@/features/landing/components/LandingFooter'
import TeamHero from '../components/sections/TeamHero'
import TeamValues from '../components/sections/TeamValues'
import TeamDomains from '../components/sections/TeamDomains'
import TeamVoices from '../components/sections/TeamVoices'
import TeamCta from '../components/sections/TeamCta'
import PageNav from '@/features/landing/components/PageNav'

export default function TeamPage() {
  useDocumentTitle('팀 소개')

  useRevealOnScroll()

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
