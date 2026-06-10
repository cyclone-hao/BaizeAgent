'use client'
import type { FC } from 'react'
import classNames from '@/utils/classnames'
import { basePath } from '@/utils/var'
export type LogoStyle = 'default' | 'monochromeWhite'

export type LogoSize = 'large' | 'medium' | 'small'

export const logoSizeMap: Record<LogoSize, string> = {
  large: 'w-16 h-7',
  medium: 'w-12 h-[22px]',
  small: 'w-9 h-4',
}

type DifyLogoProps = {
  style?: LogoStyle
  size?: LogoSize
  className?: string
}

const DifyLogo: FC<DifyLogoProps> = ({
  size = 'medium',
  className,
}) => {
  return (
    <img
      src={`${basePath}/logo/logo1.png`}
      className={classNames('block object-contain', logoSizeMap[size], className)}
      alt='AgentFlow logo'
    />
  )
}

export default DifyLogo
