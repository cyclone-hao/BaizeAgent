'use client'

import type { FC } from 'react'
import classNames from '@/utils/classnames'
import type { AppIconType } from '@/types/app'

export type AnswerIconProps = {
  iconType?: AppIconType | null
  icon?: string | null
  background?: string | null
  imageUrl?: string | null
}

const AnswerIcon: FC<AnswerIconProps> = ({
  iconType,
  icon,
  background,
  imageUrl,
}) => {
  const wrapperClassName = classNames(
    'flex',
    'items-center',
    'justify-center',
    'w-full',
    'h-full',
    'rounded-full',
    'border-[0.5px]',
    'border-black/5',
    'text-xl',
  )
  const isValidImageIcon = iconType === 'image' && imageUrl
  const emojiChar = (icon && icon !== '') ? icon : null
  const isDefaultIcon = !isValidImageIcon && !emojiChar
  return <div
    className={wrapperClassName}
    style={{ background: background || '#D5F5F6' }}
  >
    {isDefaultIcon
      ? <img src="/default-bot-icon.jpeg" className="h-full w-full rounded-full object-cover" alt="default bot icon" />
      : isValidImageIcon
        ? <img src={imageUrl} className="h-full w-full rounded-full" alt="answer icon" />
        : <span className="not-emoji">{emojiChar}</span>
    }
  </div>
}

export default AnswerIcon
