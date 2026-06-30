'use client'

import { RiQuestionLine } from '@remixicon/react'
import cn from '@/utils/classnames'
import Switch from '@/app/components/base/switch'
import Tooltip from '@/app/components/base/tooltip'
import { VIDEO_RESOLUTIONS, VIDEO_RATIOS, VIDEO_DURATIONS } from './config'
import type { VideoParams } from './config'

type VideoParamsPanelProps = {
  params: VideoParams
  onChange: (params: VideoParams) => void
  disabled?: boolean
}

// ── Row Label ──────────────────────────────────────

const RowLabel = ({ children, tip }: { children: React.ReactNode; tip: string }) => (
  <div className="flex w-[72px] shrink-0 items-center gap-1">
    <span className="text-[12px] font-medium text-text-tertiary">{children}</span>
    <Tooltip popupContent={<span className="text-xs">{tip}</span>}>
      <RiQuestionLine className="h-3 w-3 cursor-help text-text-quaternary" />
    </Tooltip>
  </div>
)

// ── Pill Button ────────────────────────────────────

const PillButton = ({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) => (
  <button
    type="button"
    className={cn(
      'rounded-md border px-2 py-1 text-[11px] font-medium transition-all duration-150',
      active
        ? 'border-rose-300 bg-rose-50 text-rose-600 shadow-xs shadow-rose-500/10'
        : 'border-divider-regular bg-transparent text-text-tertiary hover:border-rose-200 hover:bg-rose-50/30 hover:text-rose-500',
      disabled && 'cursor-not-allowed opacity-50',
    )}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
)

// ── Main Component ─────────────────────────────────

const VideoParamsPanel = ({
  params,
  onChange,
  disabled,
}: VideoParamsPanelProps) => {
  const updateParam = <K extends keyof VideoParams>(key: K, value: VideoParams[K]) => {
    onChange({ ...params, [key]: value })
  }

  return (
    <div className="px-4 pt-1">
      <div className="space-y-1.5 rounded-xl border border-components-panel-border bg-components-panel-on-panel-item-bg px-3 py-2">

        {/* Row 1: Resolution */}
        <div className="flex items-center gap-2">
          <RowLabel tip="选择视频输出分辨率，分辨率越高画质越清晰，生成时间越长">分辨率</RowLabel>
          <div className="flex items-center gap-1.5">
            {VIDEO_RESOLUTIONS.map(r => (
              <PillButton
                key={r.value}
                active={params.resolution === r.value}
                onClick={() => updateParam('resolution', r.value)}
                disabled={disabled}
              >
                {r.label}
              </PillButton>
            ))}
          </div>
        </div>

        {/* Row 2: Duration */}
        <div className="flex items-center gap-2">
          <RowLabel tip="视频时长（秒），时长越长生成时间越久">时长</RowLabel>
          <div className="flex items-center gap-1.5">
            {VIDEO_DURATIONS.map(d => (
              <PillButton
                key={d.value}
                active={params.duration === d.value}
                onClick={() => updateParam('duration', d.value)}
                disabled={disabled}
              >
                {d.label}
              </PillButton>
            ))}
          </div>
        </div>

        {/* Row 3: Aspect Ratio */}
        <div className="flex items-center gap-2">
          <RowLabel tip="选择视频画面宽高比，横屏适合风景/电影，竖屏适合手机/短视频">宽高比</RowLabel>
          <div className="flex items-center gap-1.5">
            {VIDEO_RATIOS.map(r => (
              <PillButton
                key={r.value}
                active={params.ratio === r.value}
                onClick={() => updateParam('ratio', r.value)}
                disabled={disabled}
              >
                <span>{r.label}</span>
                <span className="ml-0.5 text-[9px] opacity-60">{r.desc}</span>
              </PillButton>
            ))}
          </div>
        </div>

        {/* Row 4: Prompt Extend */}
        <div className="flex items-center gap-2">
          <RowLabel tip="开启后 AI 将自动优化和扩展你的提示词，提升生成效果">智能扩写</RowLabel>
          <div className="flex items-center gap-2">
            <Switch
              size="sm"
              defaultValue={params.promptExtend}
              onChange={(checked) => updateParam('promptExtend', checked)}
              disabled={disabled}
            />
            <span className={cn(
              'text-[11px] transition-colors',
              params.promptExtend ? 'text-rose-500' : 'text-text-quaternary',
            )}>
              {params.promptExtend ? '已开启' : '已关闭'}
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}

export default VideoParamsPanel
