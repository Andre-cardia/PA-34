import PA34ThreeView from '@/components/assets/PA34ThreeView'

type StaticReason = 'webgl' | 'motion' | 'runtime' | 'loading' | 'error'

const LABELS: Record<StaticReason, string> = {
  webgl: 'VISTA ESTÁTICA · WEBGL INDISPONÍVEL',
  motion: 'VISTA ESTÁTICA · MOVIMENTO REDUZIDO',
  runtime: 'VISTA ESTÁTICA · MODO COMPATIBILIDADE',
  loading: 'VISTA TÉCNICA · CARREGANDO',
  error: 'VISTA TÉCNICA · FALLBACK',
}

export default function HeroStaticFallback({ className = '', reason = 'webgl' }: { className?: string; reason?: StaticReason }) {
  return (
    <div className={`absolute inset-0 flex items-center justify-center px-8 ${className}`} role="img" aria-label="Vista técnica estática do Seneca I">
      <PA34ThreeView className="max-h-[70%] w-full opacity-80" />
      <span className="absolute bottom-8 right-8 max-w-[calc(100%-4rem)] border border-cyan-dim bg-abyss/80 px-3 py-2 text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-cyan sm:max-w-none sm:text-left">
        {LABELS[reason]}
      </span>
    </div>
  )
}
