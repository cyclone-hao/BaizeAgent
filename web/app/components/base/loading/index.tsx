import React from 'react'

import './style.css'
type ILoadingProps = {
  type?: 'area' | 'app'
}
const Loading = (
  { type = 'area' }: ILoadingProps = { type: 'area' },
) => {
  return (
    <div className={`flex w-full flex-col items-center justify-center gap-3 ${type === 'app' ? 'h-full' : ''}`}>
      <div className="loading-logo-wrapper">
        <img
          src="/loading-logo.png"
          alt="AgentFlow"
          className="loading-logo"
        />
      </div>
      <div className="loading-dots">
        <span className="loading-dot" style={{ animationDelay: '0s' }} />
        <span className="loading-dot" style={{ animationDelay: '0.2s' }} />
        <span className="loading-dot" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  )
}
export default Loading
