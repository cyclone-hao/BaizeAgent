'use client'
import cn from '@/utils/classnames'
import s from './page.module.css'

const FEATURES = [
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M3 5h18M3 10h14M3 15h18M3 20h10" stroke="#6938ef" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: '可视化工作流',
    desc: '拖拽式编排，直观构建 AI 流程',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#6938ef" strokeWidth="2" />
        <path d="M8 12l3 3 5-5" stroke="#6938ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: '多模型支持',
    desc: '统一接入 400+ 主流大模型',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M4 6h16v12H4z" stroke="#6938ef" strokeWidth="2" strokeLinejoin="round" />
        <path d="M8 10h8M8 14h5" stroke="#6938ef" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: 'RAG 知识库',
    desc: '智能检索增强，精准知识问答',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="2" stroke="#6938ef" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" stroke="#6938ef" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" stroke="#6938ef" strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" stroke="#6938ef" strokeWidth="2" />
      </svg>
    ),
    title: '插件生态',
    desc: '丰富插件扩展，灵活定制能力',
  },
]

const TOKEN_HIGHLIGHTS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M12 2v5M12 17v5M4.93 4.93l3.54 3.54M15.54 15.54l3.54 3.54M2 12h5M17 12h5M4.93 19.07l3.54-3.54M15.54 8.46l3.54-3.54" stroke="#6938ef" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: '一次接入',
    desc: '统一 API 网关，一次对接即可调用全部模型，无需逐一集成',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M3 18l5-7 4 4 5-10 4 6" stroke="#6938ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 22h18" stroke="#6938ef" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: '智能降本',
    desc: '智能路由调度 + 缓存复用，Token 用量成本降低 30%~60%',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M12 2a10 10 0 110 20 10 10 0 010-20z" stroke="#6938ef" strokeWidth="2" />
        <path d="M8 12l3 3 5-5" stroke="#6938ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: '可靠易用',
    desc: '实时监控面板、自动告警与故障切换，99.9% 高可用保障',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="10" width="16" height="11" rx="2" stroke="#6938ef" strokeWidth="2" />
        <path d="M8 10V7a4 4 0 018 0v3" stroke="#6938ef" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16" r="2" fill="#6938ef" />
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
  { className: 'particle-1', style: { left: '15%', top: '8%', width: 8, height: 8 } },
  { className: 'particle-2', style: { left: '78%', top: '5%', width: 5, height: 5 } },
  { className: 'particle-3', style: { left: '88%', top: '40%', width: 6, height: 6 } },
  { className: 'particle-4', style: { left: '8%', top: '50%', width: 5, height: 5 } },
  { className: 'particle-1', style: { left: '55%', top: '70%', width: 4, height: 4 } },
  { className: 'particle-2', style: { left: '25%', top: '35%', width: 6, height: 6 } },
]

const LandingContent = () => {
  return (
    <div className="relative flex flex-col items-center px-6 pb-10 pt-6">
      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className={cn('absolute rounded-full bg-[#6938ef] opacity-30', s[p.className])}
          style={p.style}
        />
      ))}

      {/* Decorative floating rings */}
      <div className={cn('absolute right-[10%] top-[5%] h-20 w-20 rounded-full border-2 border-[#6938ef]/10', s['orb-3'])} />
      <div className={cn('absolute left-[6%] top-[35%] h-14 w-14 rounded-full border-2 border-[#a78bfa]/15', s['orb-3'])} style={{ animationDelay: '2s' }} />

      {/* ====== Section 1: Hero ====== */}
      <div className="relative z-10 flex max-w-3xl flex-col items-center text-center">
        <h1 className={cn(
          'text-[44px] font-bold leading-[1.15] tracking-tight md:text-[56px] lg:text-[64px]',
          s['heading-shimmer'],
          s['anim-fade-up'],
        )}>
          构建 AI 智能体
        </h1>
        <p className={cn(
          'mt-5 max-w-3xl whitespace-nowrap text-[18px] leading-relaxed text-[#667085] md:text-[20px]',
          s['anim-fade-up'],
          s['anim-delay-1'],
        )}>
          设计、部署和管理智能 AI 工作流，强大的可视化平台让一切变得简单。
        </p>
        <div className={cn('mt-7 h-[3px] w-32 rounded-full', s['deco-line'], s['anim-fade-up'], s['anim-delay-2'])} />
      </div>

      {/* ====== Section 2: Platform Feature Cards ====== */}
      <div className="relative z-10 mt-12 grid w-full max-w-[1000px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className={cn(
              'rounded-2xl border border-[#eaecf0] bg-white p-6',
              s['feature-card'],
              s['anim-fade-up'],
              s[`anim-delay-${i + 3}`],
            )}
          >
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3f0ff]', s['feature-icon'])}>
              {f.icon}
            </div>
            <h3 className="mt-4 text-[17px] font-semibold text-[#101828]">{f.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#667085]">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* ====== Section 3: Token Service ====== */}
      <div className="relative z-10 mt-16 w-full max-w-[1060px]">
        {/* Section header */}
        <div className={cn('flex flex-col items-center text-center', s['anim-fade-up'])}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#6938ef]/15 bg-[#f3f0ff] px-5 py-2">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="#6938ef" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-[14px] font-semibold text-[#6938ef]">高效 · 易接入</span>
          </div>
          <h2 className="text-[30px] font-bold text-[#101828] md:text-[38px]">
            同时平台提供功能丰富的 <span style={{ color: '#6938ef' }}>Token 服务</span>
          </h2>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-[#667085] md:text-[18px]">
            Token 集约化运营 + 智能路由降本，主打&ldquo;一次接入、智能降本、可靠易用、安全可信&rdquo;
          </p>
        </div>

        {/* Token highlight cards - 2x2 grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {TOKEN_HIGHLIGHTS.map((h) => (
            <div
              key={h.title}
              className={cn(
                'group flex gap-5 rounded-2xl border border-[#eaecf0] bg-white p-7',
                s['feature-card'],
              )}
            >
              <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#f3f0ff]', s['feature-icon'])}>
                {h.icon}
              </div>
              <div>
                <h3 className="text-[18px] font-semibold text-[#101828]">{h.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#667085]">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Capability tags */}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {TOKEN_CAPABILITIES.map((cap) => (
            <div
              key={cap}
              className="rounded-full border border-[#eaecf0] bg-white px-5 py-2.5 text-[14px] font-medium text-[#344054] transition-colors hover:border-[#6938ef]/20 hover:bg-[#f9f7ff]"
            >
              <span className="mr-2 text-[#6938ef]">✦</span>
              {cap}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LandingContent
