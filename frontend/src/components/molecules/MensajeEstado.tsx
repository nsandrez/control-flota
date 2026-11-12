import type { ReactNode } from 'react'

interface PropsMensajeEstado {
  titulo: string
  descripcion?: string
  accion?: ReactNode
}

// Empty / not-found style block
export function MensajeEstado({ titulo, descripcion, accion }: PropsMensajeEstado) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
      <h2 className="text-base font-semibold">{titulo}</h2>
      {descripcion && <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">{descripcion}</p>}
      {accion}
    </div>
  )
}
