import { FileText } from 'lucide-react'
import type { ProyectoTipoDocumento } from '../../interface/proyectoTipoDocumento.interface'
import { Boton } from '../atoms/Boton'
import { CasillaVerificacion } from '../atoms/CasillaVerificacion'
import { InsigniaAplicaA } from '../atoms/InsigniaAplicaA'
import { InsigniaObligatorio } from '../atoms/InsigniaObligatorio'
import { MarcaVencimiento } from '../atoms/MarcaVencimiento'

interface PropsListaTiposDocumentoProyecto {
  asignaciones: ProyectoTipoDocumento[]
  // Toggle "obligatorio" and unassign (ADMIN on an active project)
  puedeEditar: boolean
  // Type id with a request in flight (its controls are disabled)
  procesandoId: number | null
  onCambiarObligatorio: (asignacion: ProyectoTipoDocumento, obligatorio: boolean) => void
  onQuitar: (asignacion: ProyectoTipoDocumento) => void
}

function Nombre({ asignacion }: { asignacion: ProyectoTipoDocumento }) {
  return (
    <span className="inline-flex items-start gap-2 font-medium break-words">
      <FileText aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-slate-500 dark:text-slate-400" />
      {asignacion.tipoDocumento.nombre}
    </span>
  )
}

export function ListaTiposDocumentoProyecto({
  asignaciones,
  puedeEditar,
  procesandoId,
  onCambiarObligatorio,
  onQuitar,
}: PropsListaTiposDocumentoProyecto) {
  const control = (asignacion: ProyectoTipoDocumento) =>
    puedeEditar ? (
      <CasillaVerificacion
        etiqueta="Obligatorio"
        aria-label={`Obligatorio: ${asignacion.tipoDocumento.nombre}`}
        checked={asignacion.obligatorio}
        disabled={procesandoId === asignacion.tipoDocumentoId}
        onChange={(e) => onCambiarObligatorio(asignacion, e.target.checked)}
      />
    ) : (
      <InsigniaObligatorio obligatorio={asignacion.obligatorio} />
    )

  const quitar = (asignacion: ProyectoTipoDocumento) =>
    puedeEditar ? (
      <Boton
        variante="peligro"
        aria-label={`Quitar ${asignacion.tipoDocumento.nombre}`}
        disabled={procesandoId === asignacion.tipoDocumentoId}
        onClick={() => onQuitar(asignacion)}
      >
        Quitar
      </Boton>
    ) : null

  return (
    <>
      {/* Phone: cards */}
      <ul className="space-y-3 md:hidden">
        {asignaciones.map((asignacion) => (
          <li
            key={asignacion.tipoDocumentoId}
            className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <h3>
              <Nombre asignacion={asignacion} />
            </h3>
            {asignacion.tipoDocumento.descripcion && (
              <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                {asignacion.tipoDocumento.descripcion}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <InsigniaAplicaA aplicaA={asignacion.tipoDocumento.aplicaA} />
              {asignacion.tipoDocumento.requiereVencimiento && <MarcaVencimiento />}
              {!puedeEditar && control(asignacion)}
            </div>
            {puedeEditar && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                {control(asignacion)}
                {quitar(asignacion)}
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Tablet / desktop: table */}
      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Tipos de documento requeridos por el proyecto</caption>
          <thead className="bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th scope="col" className="px-4 py-3">Tipo de documento</th>
              <th scope="col" className="px-4 py-3">Aplica a</th>
              <th scope="col" className="px-4 py-3">Vencimiento</th>
              <th scope="col" className="px-4 py-3">Obligatoriedad</th>
              {puedeEditar && (
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {asignaciones.map((asignacion) => (
              <tr key={asignacion.tipoDocumentoId} className="align-middle">
                <td className="px-4 py-3">
                  <Nombre asignacion={asignacion} />
                  {asignacion.tipoDocumento.descripcion && (
                    <p className="mt-0.5 line-clamp-2 max-w-md text-slate-600 dark:text-slate-300">
                      {asignacion.tipoDocumento.descripcion}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <InsigniaAplicaA aplicaA={asignacion.tipoDocumento.aplicaA} />
                </td>
                <td className="px-4 py-3">
                  {asignacion.tipoDocumento.requiereVencimiento ? (
                    <MarcaVencimiento />
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">No requiere</span>
                  )}
                </td>
                <td className="px-4 py-3">{control(asignacion)}</td>
                {puedeEditar && <td className="px-4 py-3">{quitar(asignacion)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
