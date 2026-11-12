import type { InputHTMLAttributes, ReactNode } from 'react'

interface PropsCasillaVerificacion extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  etiqueta: ReactNode
}

export function CasillaVerificacion({
  etiqueta,
  className = '',
  ...resto
}: PropsCasillaVerificacion) {
  return (
    <label className={`inline-flex min-h-10 items-center gap-2 text-sm ${className}`}>
      <input
        type="checkbox"
        className="size-4 rounded border-slate-300 accent-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60"
        {...resto}
      />
      {etiqueta}
    </label>
  )
}
