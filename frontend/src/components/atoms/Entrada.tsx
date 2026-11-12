import type { InputHTMLAttributes } from 'react'
import { estilosControl } from './estilosControl'

interface PropsEntrada extends InputHTMLAttributes<HTMLInputElement> {
  invalido?: boolean
}

export function Entrada({ invalido = false, className = '', ...resto }: PropsEntrada) {
  return (
    <input
      aria-invalid={invalido || undefined}
      className={`${estilosControl(invalido)} ${className}`}
      {...resto}
    />
  )
}
