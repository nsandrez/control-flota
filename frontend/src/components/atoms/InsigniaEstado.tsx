import type { EstadoProyecto } from '../../interface/proyecto.interface'

const ESTILOS: Record<EstadoProyecto, string> = {
  ACTIVO: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  INACTIVO: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
}

const TEXTOS: Record<EstadoProyecto, string> = { ACTIVO: 'Activo', INACTIVO: 'Inactivo' }

export function InsigniaEstado({ estado }: { estado: EstadoProyecto }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTILOS[estado]}`}>
      {TEXTOS[estado]}
    </span>
  )
}
