import type { EstadoRequisito } from '../../utils/requisitosDocumento'

const ESTILOS: Record<EstadoRequisito, string> = {
  VIGENTE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  POR_VENCER: 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100',
  VENCIDO: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  SIN_DOCUMENTO: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
}

const TEXTOS: Record<EstadoRequisito, string> = {
  VIGENTE: 'Vigente',
  POR_VENCER: 'Por vencer',
  VENCIDO: 'Vencido',
  SIN_DOCUMENTO: 'Sin documento',
}

interface PropsInsigniaEstadoDocumento {
  estado: EstadoRequisito
  // A missing mandatory document is a warning (amber) instead of neutral
  obligatorio?: boolean
}

export function InsigniaEstadoDocumento({ estado, obligatorio = false }: PropsInsigniaEstadoDocumento) {
  const estilo =
    estado === 'SIN_DOCUMENTO' && obligatorio ? ESTILOS.POR_VENCER : ESTILOS[estado]
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${estilo}`}>
      {TEXTOS[estado]}
    </span>
  )
}
