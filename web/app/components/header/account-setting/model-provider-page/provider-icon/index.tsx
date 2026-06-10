import type { FC } from 'react'
import { useState } from 'react'
import type { ModelProvider } from '../declarations'
import { useLanguage } from '../hooks'
import { Openai } from '@/app/components/base/icons/src/vender/other'
import { AnthropicDark, AnthropicLight } from '@/app/components/base/icons/src/public/llm'
import { renderI18nObject } from '@/i18n-config'
import { Theme } from '@/types/app'
import cn from '@/utils/classnames'
import useTheme from '@/hooks/use-theme'

type ProviderIconProps = {
  provider: ModelProvider
  className?: string
}
const ProviderIcon: FC<ProviderIconProps> = ({
  provider,
  className,
}) => {
  const { theme } = useTheme()
  const language = useLanguage()
  const [imgError, setImgError] = useState(false)

  if (provider.provider === 'langgenius/anthropic/anthropic') {
    return (
      <div className='mb-2 py-[7px]'>
        {theme === Theme.dark && <AnthropicLight className='h-2.5 w-[90px]' />}
        {theme === Theme.light && <AnthropicDark className='h-2.5 w-[90px]' />}
      </div>
    )
  }

  if (provider.provider === 'langgenius/openai/openai') {
    return (
      <div className='mb-2'>
        <Openai className='h-6 w-auto text-text-inverted-dimmed' />
      </div>
    )
  }

  const iconUrl = provider.icon_small ? renderI18nObject(provider.icon_small, language) : ''

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {iconUrl && !imgError
        ? (
          <img
            alt='provider-icon'
            src={iconUrl}
            className='h-6 w-6 object-contain'
            onError={() => setImgError(true)}
          />
        )
        : (
          <div className='flex h-6 w-6 items-center justify-center rounded-md border-[0.5px] border-components-panel-border-subtle bg-background-default-subtle'>
            <span className='text-xs text-text-quaternary'>
              {renderI18nObject(provider.label, language)?.[0] || '?'}
            </span>
          </div>
        )}
      <div className='system-md-semibold text-text-primary'>
        {renderI18nObject(provider.label, language)}
      </div>
    </div>
  )
}

export default ProviderIcon
