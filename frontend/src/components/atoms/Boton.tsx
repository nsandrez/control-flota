import type { ButtonHTMLAttributes } from 'react'

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma'

interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  cargando?: boolean
}

const ESTILOS: Record<Variante, string> = {
  primario: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600',
  secundario:
    'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 focus-visible:outline-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  peligro: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  fantasma:
    'text-blue-700 hover:bg-blue-50 focus-visible:outline-blue-600 dark:text-blue-300 dark:hover:bg-slate-800',
}

export function Boton({
  variante = 'primario',
  cargando = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...resto
}: PropsBoton) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${ESTILOS[variante]} ${className}`}
      {...resto}
    >
      {children}
    </button>
  )
}
