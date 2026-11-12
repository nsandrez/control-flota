import { FileText } from 'lucide-react'
import { formatearFechaPlana } from '../../utils/fechas'
import type { Requisito } from '../../utils/requisitosDocumento'
import { Boton } from '../atoms/Boton'
import { InsigniaEstadoDocumento } from '../atoms/InsigniaEstadoDocumento'
import { InsigniaObligatorio } from '../atoms/InsigniaObligatorio'

interface PropsListaRequisitosDocumento {
  requisitos: Requisito[]
  // Upload / renew (active project and active owner)
  puedeSubir: boolean
  onSubir: (tipoDocumentoId: number) => void
}

function Nombre({ requisito }: { requisito: Requisito }) {
  return (
    <span className="inline-flex items-start gap-2 font-medium break-words">
      <FileText aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-slate-500 dark:text-slate-400" />
      {requisito.asignacion.tipoDocumento.nombre}
    </span>
  )
}

function Vencimiento({ requisito }: { requisito: Requisito }) {
  const { actual } = requisito
  if (!actual) return <>—</>
  if (actual.fechaVencimiento === null) return <>Sin vencimiento</>
  return <>{formatearFechaPlana(actual.fechaVencimiento)}</>
}

export function ListaRequisitosDocumento({
  requisitos,
  puedeSubir,
  onSubir,
}: PropsListaRequisitosDocumento) {
  const accion = (requisito: Requisito) => {
    if (!puedeSubir) return null
    const nombre = requisito.asignacion.tipoDocumento.nombre
    const renovar = requisito.actual !== null
    return (
      <Boton
        variante={renovar ? 'secundario' : 'primario'}
        aria-label={`${renovar ? 'Renovar' : 'Subir'} ${nombre}`}
        onClick={() => onSubir(requisito.asignacion.tipoDocumentoId)}
      >
        {renovar ? 'Renovar' : 'Subir'}
      </Boton>
    )
  }

  return (
    <>
      {/* Phone: cards */}
      <ul className="space-y-3 md:hidden">
        {requisitos.map((requisito) => (
          <li
            key={requisito.asignacion.tipoDocumentoId}
            className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <h3>
                <Nombre requisito={requisito} />
              </h3>
              <InsigniaEstadoDocumento
                estado={requisito.estado}
                obligatorio={requisito.asignacion.obligatorio}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <InsigniaObligatorio obligatorio={requisito.asignacion.obligatorio} />
              {requisito.actual && (
                <span>
                  Vence: <Vencimiento requisito={requisito} />
                </span>
              )}
            </div>
            {accion(requisito)}
          </li>
        ))}
      </ul>

      {/* Tablet / desktop: table */}
      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Documentos requeridos y su estado actual</caption>
          <thead className="bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th scope="col" className="px-4 py-3">Tipo de documento</th>
              <th scope="col" className="px-4 py-3">Obligatoriedad</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3">Vencimiento</th>
              {puedeSubir && (
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {requisitos.map((requisito) => (
              <tr key={requisito.asignacion.tipoDocumentoId} className="align-middle">
                <td className="px-4 py-3">
                  <Nombre requisito={requisito} />
                </td>
                <td className="px-4 py-3">
                  <InsigniaObligatorio obligatorio={requisito.asignacion.obligatorio} />
                </td>
                <td className="px-4 py-3">
                  <InsigniaEstadoDocumento
                    estado={requisito.estado}
                    obligatorio={requisito.asignacion.obligatorio}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Vencimiento requisito={requisito} />
                </td>
                {puedeSubir && <td className="px-4 py-3">{accion(requisito)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
