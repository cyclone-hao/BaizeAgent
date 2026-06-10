'use client'

const BrandingPanel = () => {
  return (
    <div className="relative hidden h-full w-1/2 flex-col overflow-hidden lg:flex"
      style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
      }}
    >
      {/* Dot grid pattern overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-12">
        {/* Logo */}
        <div>
          <img
            src="/logo/logo1.png"
            alt="AgentFlow logo"
            className="h-8 w-auto object-contain"
          />
        </div>

        {/* Center hero */}
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Build AI Agents,<br />
            <span className="text-white/80">Not Infrastructure</span>
          </h1>
          <p className="text-lg leading-relaxed text-white/70">
            Design, deploy, and manage intelligent AI agents with an intuitive visual workflow editor.
          </p>

          {/* Feature list */}
          <div className="mt-4 flex flex-col gap-4">
            <FeatureItem text="Visual Workflow Editor" />
            <FeatureItem text="Multi-Model Support" />
            <FeatureItem text="RAG Knowledge Base" />
            <FeatureItem text="Plugin Ecosystem" />
          </div>
        </div>

        {/* Footer */}
        <div className="text-sm text-white/40">
          © {new Date().getFullYear()} AgentFlow. All rights reserved.
        </div>
      </div>

      {/* Decorative circles */}
      <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/5" />
      <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-white/5" />
    </div>
  )
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className="text-sm font-medium text-white/80">{text}</span>
    </div>
  )
}

export default BrandingPanel
