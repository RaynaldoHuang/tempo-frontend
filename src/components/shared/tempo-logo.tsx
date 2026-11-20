import { appConfig } from '@/config/app'
import { cn } from '@/lib/utils'

export function TempoLogo({ className }: { className?: string }) {
  return (
    <span className={cn('block max-w-full overflow-hidden', className)} style={{ aspectRatio: '2006 / 392' }}>
      <img src={appConfig.logo} alt="Tempo" width={2006} height={468} className="block h-auto w-full max-w-none brightness-0" />
    </span>
  )
}
