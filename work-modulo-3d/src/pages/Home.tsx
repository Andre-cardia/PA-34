// HOME — `/` — Portal do Dossiê Técnico PA-34 Seneca (design/home.md).

import HeroSection from '@/components/home/HeroSection'
import StatsBar from '@/components/home/StatsBar'
import ModuleCards from '@/components/home/ModuleCards'
import SopIndex from '@/components/home/SopIndex'
import BlueprintSection from '@/components/home/BlueprintSection'
import StudyPath from '@/components/home/StudyPath'
import FinalCta from '@/components/home/FinalCta'

export default function Home() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <ModuleCards />
      <SopIndex />
      <BlueprintSection />
      <StudyPath />
      <FinalCta />
    </>
  )
}
