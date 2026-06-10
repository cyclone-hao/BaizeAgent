'use client'

import { useAppContext } from '@/context/app-context'
import useDocumentTitle from '@/hooks/use-document-title'
import GreetingSection from './greeting-section'
import AiAssistant from './ai-assistant'
import RecentlyUsed from './recently-used'
import AgentPlaza from './agent-plaza'

const HomePage = () => {
  const { userProfile } = useAppContext()

  useDocumentTitle('首页')

  return (
    <div className="h-full overflow-y-auto bg-background-body">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 lg:px-12">
        <GreetingSection userName={userProfile.name} />
        <AiAssistant />
        <RecentlyUsed />
        <AgentPlaza />
      </div>
    </div>
  )
}

export default HomePage
