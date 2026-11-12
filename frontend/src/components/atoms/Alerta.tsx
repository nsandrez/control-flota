import type { ReactNode } from 'react'

type VarianteAlerta = 'error' | 'exito' | 'info'

const ESTILOS: Record<VarianteAlerta, string> = {
  error: 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
  exito:
    'border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
  info: 'border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
}

interface PropsAlerta {
  variante?: VarianteAlerta
  children: ReactNode
}

// Errors are announced assertively (role=alert); the rest politely (role=status)
export function Alerta({ variante = 'info', children }: PropsAlerta) {
  return (
    <div
      role={variante === 'error' ? 'alert' : 'status'}
      className={`rounded-md border px-4 py-3 text-sm ${ESTILOS[variante]}`}
    >
      {children}
    </div>
  )
}
