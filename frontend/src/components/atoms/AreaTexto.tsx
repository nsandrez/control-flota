import type { TextareaHTMLAttributes } from 'react'
import { estilosControl } from './estilosControl'

interface PropsAreaTexto extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalido?: boolean
}

export function AreaTexto({ invalido = false, className = '', ...resto }: PropsAreaTexto) {
  return (
    <textarea
      aria-invalid={invalido || undefined}
      className={`${estilosControl(invalido)} ${className}`}
      {...resto}
    />
  )
}
