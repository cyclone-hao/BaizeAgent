'use client'

import { useState } from 'react'
import { useAppContext } from '@/context/app-context'
import useDocumentTitle from '@/hooks/use-document-title'
import GreetingSection from './greeting-section'
import RecentlyUsed from './recently-used'
import AgentPlaza from './agent-plaza'

const HomePage = () => {
  const { userProfile } = useAppContext()
  const [searchKeywords, setSearchKeywords] = useState('')

  useDocumentTitle('首页')

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background-body">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:px-12">
        <GreetingSection
          userName={userProfile.name}
          searchKeywords={searchKeywords}
          onSearchChange={setSearchKeywords}
        />
        <RecentlyUsed />
        <AgentPlaza searchKeywords={searchKeywords} />
      </div>
    </div>
  )
}

export default HomePage
