'use client'
import cn from '@/utils/classnames'
import { useGlobalPublicStore } from '@/context/global-public-context'
import useDocumentTitle from '@/hooks/use-document-title'
import s from '../signin/page.module.css'

export default function SignUpLayout({ children }: any) {
  const { systemFeatures } = useGlobalPublicStore()
  useDocumentTitle('注册')

  return (
    <div className={cn('relative flex min-h-screen w-full flex-col bg-[#fafbfc]', s['no-scrollbar'])}>
      {/* Fixed background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #6938ef 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className={cn('absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full opacity-[0.07]', s['orb-1'])} style={{ background: 'radial-gradient(circle, #6938ef 0%, transparent 70%)' }} />
        <div className={cn('absolute -bottom-32 -right-32 h-[450px] w-[450px] rounded-full opacity-[0.06]', s['orb-2'])} style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)' }} />
      </div>

      {/* Header */}
      <header className="relative z-20 flex w-full items-center justify-between bg-[#fafbfc]/80 px-6 py-5 backdrop-blur-md md:px-10 lg:px-14">
        <a href="/signin" className="flex items-center gap-2.5">
          <img src="/logo/logo1.png" alt="AgentFlow" className="h-8 w-auto object-contain" />
          <span className="text-[18px] font-bold" style={{ color: '#6938ef' }}>AgentFlow</span>
        </a>
        <a href="/signin" className="text-[14px] font-medium text-[#667085] transition-colors hover:text-[#6938ef]">
          已有账户？去登录
        </a>
      </header>

      {/* Content */}
      <div className="relative z-10 flex grow items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] rounded-xl border border-[#eaecf0] bg-white p-8 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_1px_2px_rgba(16,24,40,0.04)]">
          {children}
        </div>
      </div>

      {/* Footer */}
      {systemFeatures.branding.enabled === false && (
        <footer className="relative z-10 py-6 text-center text-[13px] text-[#98a2b3]">
          © {new Date().getFullYear()} 中国广电 - 中广数智科技（北京）有限责任公司
        </footer>
      )}
    </div>
  )
}
