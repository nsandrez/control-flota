import type { SelectHTMLAttributes } from 'react'
import { estilosControl } from './estilosControl'

export function Selector({ className = '', ...resto }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${estilosControl(false)} ${className}`} {...resto} />
}
