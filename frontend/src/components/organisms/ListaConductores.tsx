import { IdCard } from 'lucide-react'
import { Link } from 'react-router'
import type { Conductor } from '../../interface/conductor.interface'
import { Boton } from '../atoms/Boton'
import { InsigniaEstado } from '../atoms/InsigniaEstado'

interface PropsListaConductores {
  conductores: Conductor[]
  proyectoId: number
  // Create/edit (ADMIN, OPERADOR) on an active project
  puedeEditar: boolean
  // Deactivate/reactivate (ADMIN) on an active project
  puedeCambiarEstado: boolean
  onDesactivar: (conductor: Conductor) => void
  onReactivar: (conductor: Conductor) => void
}

interface PropsAcciones {
  conductor: Conductor
  proyectoId: number
  puedeEditar: boolean
  puedeCambiarEstado: boolean
  onDesactivar: (conductor: Conductor) => void
  onReactivar: (conductor: Conductor) => void
}

function Acciones({
  conductor,
  proyectoId,
  puedeEditar,
  puedeCambiarEstado,
  onDesactivar,
  onReactivar,
}: PropsAcciones) {
  // The backend rejects edits on inactive drivers, so the action is not offered
  const editable = puedeEditar && conductor.activo
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        to={`/proyectos/${proyectoId}/conductores/${conductor.id}/documentos`}
        aria-label={`Documentos de ${conductor.nombre}`}
        className="inline-flex min-h-10 items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-600 dark:hover:bg-slate-700"
      >
        Documentos
      </Link>
      {editable && (
        <Link
          to={`/proyectos/${proyectoId}/conductores/${conductor.id}/editar`}
          aria-label={`Editar ${conductor.nombre}`}
          className="inline-flex min-h-10 items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-600 dark:hover:bg-slate-700"
        >
          Editar
        </Link>
      )}
      {puedeCambiarEstado &&
        (conductor.activo ? (
          <Boton
            variante="peligro"
            aria-label={`Desactivar ${conductor.nombre}`}
            onClick={() => onDesactivar(conductor)}
          >
            Desactivar
          </Boton>
        ) : (
          <Boton
            variante="secundario"
            aria-label={`Reactivar ${conductor.nombre}`}
            onClick={() => onReactivar(conductor)}
          >
            Reactivar
          </Boton>
        ))}
    </div>
  )
}

function Nombre({ conductor }: { conductor: Conductor }) {
  return (
    <span className="inline-flex items-center gap-2 text-base font-semibold">
      <IdCard aria-hidden="true" className="size-5 shrink-0 text-slate-500 dark:text-slate-400" />
      <span className="break-words">{conductor.nombre}</span>
    </span>
  )
}

export function ListaConductores({
  conductores,
  proyectoId,
  puedeEditar,
  puedeCambiarEstado,
  onDesactivar,
  onReactivar,
}: PropsListaConductores) {
  const acciones = (conductor: Conductor) => (
    <Acciones
      conductor={conductor}
      proyectoId={proyectoId}
      puedeEditar={puedeEditar}
      puedeCambiarEstado={puedeCambiarEstado}
      onDesactivar={onDesactivar}
      onReactivar={onReactivar}
    />
  )

  return (
    <>
      {/* Phone: cards */}
      <ul className="space-y-3 md:hidden">
        {conductores.map((conductor) => (
          <li
            key={conductor.id}
            className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <h3>
                <Nombre conductor={conductor} />
              </h3>
              <InsigniaEstado estado={conductor.activo ? 'ACTIVO' : 'INACTIVO'} />
            </div>
            <dl className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex gap-2">
                <dt className="font-medium">Documento:</dt>
                <dd className="font-mono break-all">{conductor.documentoIdentidad}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium">Teléfono:</dt>
                <dd>{conductor.telefono ?? '—'}</dd>
              </div>
            </dl>
            {acciones(conductor)}
          </li>
        ))}
      </ul>

      {/* Tablet / desktop: table */}
      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Listado de conductores</caption>
          <thead className="bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th scope="col" className="px-4 py-3">Nombre</th>
              <th scope="col" className="px-4 py-3">Documento de identidad</th>
              <th scope="col" className="px-4 py-3">Teléfono</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {conductores.map((conductor) => (
              <tr key={conductor.id} className="align-middle">
                <td className="px-4 py-3">
                  <Nombre conductor={conductor} />
                </td>
                <td className="px-4 py-3 font-mono whitespace-nowrap">
                  {conductor.documentoIdentidad}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{conductor.telefono ?? '—'}</td>
                <td className="px-4 py-3">
                  <InsigniaEstado estado={conductor.activo ? 'ACTIVO' : 'INACTIVO'} />
                </td>
                <td className="px-4 py-3">{acciones(conductor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
