import { IdCard, Truck } from 'lucide-react'
import type { AplicaA } from '../../interface/tipoDocumento.interface'
import { ETIQUETA_APLICA_A } from '../../utils/validacionTipoDocumento'

const ICONOS = { VEHICULO: Truck, CONDUCTOR: IdCard }

export function InsigniaAplicaA({ aplicaA }: { aplicaA: AplicaA }) {
  const Icono = ICONOS[aplicaA]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
      <Icono aria-hidden="true" className="size-3.5 shrink-0" />
      {ETIQUETA_APLICA_A[aplicaA]}
    </span>
  )
}
