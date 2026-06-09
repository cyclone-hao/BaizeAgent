import cn from '@/utils/classnames'

type ProgressBarProps = {
  percent: number
  color: string
}

const ProgressBar = ({
  percent = 0,
  color = '#a855f7',
}: ProgressBarProps) => {
  return (
    <div className='overflow-hidden rounded-[6px] bg-components-progress-bar-bg'>
      <div
        className={cn('h-1 rounded-[6px]', color)}
        style={{
          width: `${Math.min(percent, 100)}%`,
        }}
      />
    </div>
  )
}

export default ProgressBar
