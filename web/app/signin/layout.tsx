'use client'
import { useState, useCallback } from 'react'
import LandingContent from './branding-panel'
import cn from '@/utils/classnames'
import { useGlobalPublicStore } from '@/context/global-public-context'
import useDocumentTitle from '@/hooks/use-document-title'
import s from './page.module.css'

export default function SignInLayout({ children }: any) {
  const { systemFeatures } = useGlobalPublicStore()
  useDocumentTitle('')
  const [showLogin, setShowLogin] = useState(false)

  const openLogin = useCallback(() => setShowLogin(true), [])
  const closeLogin = useCallback(() => setShowLogin(false), [])

  return (
    <div className={cn('relative h-screen w-full bg-[#fafbfc]', s['no-scrollbar'])}>
      {/* Fixed background layer — stays in place during scroll */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Subtle dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #6938ef 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Animated decorative blobs */}
        <div className={cn('absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full opacity-[0.07]', s['orb-1'])}
          style={{ background: 'radial-gradient(circle, #6938ef 0%, transparent 70%)' }} />
        <div className={cn('absolute -bottom-32 -right-32 h-[450px] w-[450px] rounded-full opacity-[0.06]', s['orb-2'])}
          style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)' }} />
        <div className={cn('absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full opacity-[0.04]', s['orb-3'])}
          style={{ background: 'radial-gradient(circle, #c084fc 0%, transparent 70%)' }} />
      </div>

      {/* Header: logo + login button — sticky so always visible */}
      <header className="sticky top-0 z-30 flex w-full items-center justify-between bg-[#fafbfc]/80 px-6 py-5 backdrop-blur-md md:px-10 lg:px-14">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo/logo1.png"
            alt="白泽智能体平台"
            className="h-8 w-auto object-contain"
          />
          <span className="text-[18px] font-bold" style={{ color: '#6938ef' }}>白泽智能体平台</span>
        </div>
        <button
          onClick={openLogin}
          className="group flex items-center gap-2 rounded-full px-7 py-3 text-[15px] font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(105,56,239,0.5)] active:translate-y-0"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6938ef, #5b21b6)', boxShadow: '0 4px 14px rgba(105,56,239,0.4)' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="transition-transform group-hover:translate-x-0.5">
            <path d="M7 3l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          登录
        </button>
      </header>

      {/* Landing content */}
      <div className="relative z-10">
        <LandingContent />
      </div>

      {/* Footer */}
      {systemFeatures.branding.enabled === false && (
        <footer className="relative z-10 py-6 text-center text-[13px] text-[#98a2b3]">
          © {new Date().getFullYear()} 中国广电 - 中广数智科技（北京）有限责任公司
        </footer>
      )}

      {/* Login Modal */}
      {showLogin && (
        <div
          className={cn('fixed inset-0 z-50 flex items-center justify-center p-4', s['modal-backdrop'])}
          style={{ background: 'rgba(16,24,40,0.5)' }}
          onClick={closeLogin}
        >
          <div
            className={cn(
              'relative w-full max-w-[420px] rounded-xl border border-[#eaecf0] bg-white p-8 shadow-[0_24px_64px_-16px_rgba(16,24,40,0.14),0_8px_24px_-8px_rgba(16,24,40,0.08)]',
              s['modal-content'],
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="mb-7 flex items-center justify-between">
              <h2 className="text-[22px] font-semibold text-[#101828]">欢迎登录</h2>
              <button
                onClick={closeLogin}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#98a2b3] transition-colors hover:bg-[#f2f4f7] hover:text-[#344054]"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Form (children) */}
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
