'use client'

import { useAppContext } from '@/context/app-context'
import useDocumentTitle from '@/hooks/use-document-title'
import GreetingSection from './greeting-section'
import ChatAssistant from './chat-assistant'
import AgentPlaza from './agent-plaza'

const HomePage = () => {
  const { userProfile } = useAppContext()

  useDocumentTitle('首页')

  return (
    <div className="h-full overflow-y-auto bg-background-body">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col px-4 py-6 sm:px-8 lg:px-12">
        <GreetingSection userName={userProfile.name} />
        <div className="flex-1">
          <ChatAssistant />
        </div>
        <AgentPlaza />
      </div>
    </div>
  )
}

export default HomePage
