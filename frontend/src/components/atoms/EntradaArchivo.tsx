import type { InputHTMLAttributes } from 'react'
import { estilosControl } from './estilosControl'

interface PropsEntradaArchivo extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  invalido?: boolean
}

// Native file picker (keyboard and screen reader friendly)
export function EntradaArchivo({ invalido = false, className = '', ...resto }: PropsEntradaArchivo) {
  return (
    <input
      type="file"
      aria-invalid={invalido || undefined}
      className={`${estilosControl(invalido)} file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-800 hover:file:bg-slate-200 dark:file:bg-slate-700 dark:file:text-slate-100 dark:hover:file:bg-slate-600 ${className}`}
      {...resto}
    />
  )
}
