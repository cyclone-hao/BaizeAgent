'use client'

import { useMemo } from 'react'

type GreetingSectionProps = {
  userName: string
}

const getGreeting = (): string => {
  const hour = new Date().getHours()
  if (hour < 6)
    return '夜深了'
  if (hour < 9)
    return '早上好'
  if (hour < 12)
    return '上午好'
  if (hour < 14)
    return '中午好'
  if (hour < 18)
    return '下午好'
  return '晚上好'
}

const GreetingSection = ({ userName }: GreetingSectionProps) => {
  const greeting = useMemo(() => getGreeting(), [])

  return (
    <div className="mb-8">
      <h1 className="mb-1 text-2xl font-semibold text-text-secondary">
        {greeting}，{userName || '用户'}
      </h1>
      <p className="text-sm text-text-tertiary">
        有什么我可以帮你的？
      </p>
    </div>
  )
}

export default GreetingSection
