'use client'
import cn from '@/utils/classnames'
import s from './page.module.css'

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 4h14M3 8h10M3 12h14M3 16h8" stroke="#6938ef" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: '可视化工作流',
    desc: '拖拽式编排，直观构建 AI 流程',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="#6938ef" strokeWidth="1.5" />
        <path d="M7 10l2 2 4-4" stroke="#6938ef" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: '多模型支持',
    desc: '统一接入 100+ 主流大模型',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 5h12v10H4z" stroke="#6938ef" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7 8h6M7 11h4" stroke="#6938ef" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: 'RAG 知识库',
    desc: '智能检索增强，精准知识问答',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="#6938ef" strokeWidth="1.5" />
        <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="#6938ef" strokeWidth="1.5" />
        <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="#6938ef" strokeWidth="1.5" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="#6938ef" strokeWidth="1.5" />
      </svg>
    ),
    title: '插件生态',
    desc: '丰富插件扩展，灵活定制能力',
  },
]

const TOKEN_HIGHLIGHTS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2v4M11 16v4M4.93 4.93l2.83 2.83M14.24 14.24l2.83 2.83M2 11h4M16 11h4M4.93 17.07l2.83-2.83M14.24 7.76l2.83-2.83" stroke="#6938ef" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: '一次接入',
    desc: '统一 API 网关，一次对接即可调用全部模型，无需逐一集成',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 17l4-6 4 3 4-8 4 5" stroke="#6938ef" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 20h16" stroke="#6938ef" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: '智能降本',
    desc: '智能路由调度 + 缓存复用，Token 用量成本降低 30%~60%',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2a9 9 0 110 18 9 9 0 010-18z" stroke="#6938ef" strokeWidth="1.5" />
        <path d="M8 11l2 2 4-4" stroke="#6938ef" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: '可靠易用',
    desc: '实时监控面板、自动告警与故障切换，99.9% 高可用保障',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="4" y="9" width="14" height="10" rx="2" stroke="#6938ef" strokeWidth="1.5" />
        <path d="M8 9V6a3 3 0 016 0v3" stroke="#6938ef" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="11" cy="14" r="1.5" fill="#6938ef" />
      </svg>
    ),
    title: '安全可信',
    desc: '多级权限管控、API Key 加密、审计日志，数据安全合规',
  },
]

const TOKEN_CAPABILITIES = [
  'Token 集约化运营',
  '智能路由调度',
  '用量配额管理',
  '实时数据监控',
  '多模型统一接入',
  'API Key 生命周期管理',
]

const PARTICLES = [
  { className: 'particle-1', style: { left: '15%', top: '12%', width: 6, height: 6 } },
  { className: 'particle-2', style: { left: '75%', top: '8%', width: 4, height: 4 } },
  { className: 'particle-3', style: { left: '85%', top: '45%', width: 5, height: 5 } },
  { className: 'particle-4', style: { left: '10%', top: '55%', width: 4, height: 4 } },
  { className: 'particle-1', style: { left: '50%', top: '65%', width: 3, height: 3 } },
  { className: 'particle-2', style: { left: '30%', top: '30%', width: 5, height: 5 } },
]

const LandingContent = () => {
  return (
    <div className="relative flex grow flex-col items-center px-6 pb-12 pt-4">
      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className={cn('absolute rounded-full bg-[#6938ef] opacity-30', s[p.className])}
          style={p.style}
        />
      ))}

      {/* Decorative floating rings */}
      <div className={cn('absolute right-[12%] top-[6%] h-16 w-16 rounded-full border-2 border-[#6938ef]/10', s['orb-3'])} />
      <div className={cn('absolute left-[8%] top-[40%] h-10 w-10 rounded-full border-2 border-[#a78bfa]/15', s['orb-3'])} style={{ animationDelay: '2s' }} />

      {/* ====== Section 1: Hero ====== */}
      <div className="relative z-10 flex max-w-2xl flex-col items-center text-center">
        <h1 className={cn(
          'text-[42px] font-bold leading-[1.15] tracking-tight md:text-[52px] lg:text-[56px]',
          s['heading-shimmer'],
          s['anim-fade-up'],
        )}>
          构建 AI 智能体
        </h1>
        <p className={cn(
          'mt-6 max-w-lg text-[17px] leading-relaxed text-[#667085]',
          s['anim-fade-up'],
          s['anim-delay-1'],
        )}>
          设计、部署和管理智能 AI 工作流，强大的可视化平台让一切变得简单。
        </p>
        <div className={cn('mt-8 h-[2px] w-24 rounded-full', s['deco-line'], s['anim-fade-up'], s['anim-delay-2'])} />
      </div>

      {/* ====== Section 2: Platform Feature Cards ====== */}
      <div className="relative z-10 mt-12 grid w-full max-w-[880px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className={cn(
              'rounded-xl border border-[#eaecf0] bg-white p-5',
              s['feature-card'],
              s['anim-fade-up'],
              s[`anim-delay-${i + 3}`],
            )}
          >
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-[#f3f0ff]', s['feature-icon'])}>
              {f.icon}
            </div>
            <h3 className="mt-3.5 text-[15px] font-semibold text-[#101828]">{f.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#667085]">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* ====== Section 3: Token Service ====== */}
      <div className="relative z-10 mt-20 w-full max-w-[960px]">
        {/* Section header */}
        <div className={cn('flex flex-col items-center text-center', s['anim-fade-up'])}>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#6938ef]/15 bg-[#f3f0ff] px-4 py-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="#6938ef" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-[13px] font-semibold text-[#6938ef]">高效 · 易接入</span>
          </div>
          <h2 className="text-[28px] font-bold text-[#101828] md:text-[34px]">
            功能丰富的 <span style={{ color: '#6938ef' }}>Token 服务</span>
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#667085]">
            Token 集约化运营 + 智能路由降本，主打&ldquo;一次接入、智能降本、可靠易用、安全可信&rdquo;
          </p>
        </div>

        {/* Token highlight cards - 2x2 grid */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {TOKEN_HIGHLIGHTS.map((h) => (
            <div
              key={h.title}
              className={cn(
                'group flex gap-4 rounded-xl border border-[#eaecf0] bg-white p-6',
                s['feature-card'],
              )}
            >
              <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f3f0ff]', s['feature-icon'])}>
                {h.icon}
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#101828]">{h.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#667085]">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Capability tags */}
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {TOKEN_CAPABILITIES.map((cap) => (
            <div
              key={cap}
              className="rounded-full border border-[#eaecf0] bg-white px-4 py-2 text-[13px] font-medium text-[#344054] transition-colors hover:border-[#6938ef]/20 hover:bg-[#f9f7ff]"
            >
              <span className="mr-1.5 text-[#6938ef]">✦</span>
              {cap}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LandingContent
