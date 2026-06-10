import type { FC } from 'react'
import { useState } from 'react'
import type {
  Model,
  ModelProvider,
} from '../declarations'
import { useLanguage } from '../hooks'
import { Group } from '@/app/components/base/icons/src/vender/other'
import { OpenaiBlue, OpenaiTeal, OpenaiViolet, OpenaiYellow } from '@/app/components/base/icons/src/public/llm'
import cn from '@/utils/classnames'
import { renderI18nObject } from '@/i18n-config'

type ModelIconProps = {
  provider?: Model | ModelProvider
  modelName?: string
  className?: string
  iconClassName?: string
  isDeprecated?: boolean
}
const ModelIcon: FC<ModelIconProps> = ({
  provider,
  className,
  modelName,
  iconClassName,
  isDeprecated = false,
}) => {
  const language = useLanguage()
  const [imgError, setImgError] = useState(false)

  if (provider?.provider && ['openai', 'langgenius/openai/openai'].includes(provider.provider) && modelName?.startsWith('o'))
    return <div className='flex items-center justify-center'><OpenaiYellow className={cn('h-5 w-5', className)} /></div>
  if (provider?.provider && ['openai', 'langgenius/openai/openai'].includes(provider.provider) && modelName?.includes('gpt-4.1'))
    return <div className='flex items-center justify-center'><OpenaiTeal className={cn('h-5 w-5', className)} /></div>
  if (provider?.provider && ['openai', 'langgenius/openai/openai'].includes(provider.provider) && modelName?.includes('gpt-4o'))
    return <div className='flex items-center justify-center'><OpenaiBlue className={cn('h-5 w-5', className)} /></div>
  if (provider?.provider && ['openai', 'langgenius/openai/openai'].includes(provider.provider) && modelName?.startsWith('gpt-4'))
    return <div className='flex items-center justify-center'><OpenaiViolet className={cn('h-5 w-5', className)} /></div>

  const iconUrl = provider?.icon_small ? renderI18nObject(provider.icon_small, language) : ''

  if (iconUrl && !imgError) {
    return (
      <div className={cn('flex h-5 w-5 items-center justify-center', isDeprecated && 'opacity-50', className)}>
        <img
          alt='model-icon'
          src={iconUrl}
          className={cn('h-5 w-5 object-contain', iconClassName)}
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  return (
    <div className={cn(
      'flex h-5 w-5 items-center justify-center rounded-md border-[0.5px] border-components-panel-border-subtle bg-background-default-subtle',
      className,
    )}>
      <div className={cn('flex h-5 w-5 items-center justify-center opacity-35', iconClassName)}>
        <Group className='h-3 w-3 text-text-tertiary' />
      </div>
    </div>
  )
}

export default ModelIcon
