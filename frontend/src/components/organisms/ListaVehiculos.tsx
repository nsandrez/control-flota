import { Truck } from 'lucide-react'
import { Link } from 'react-router'
import type { Vehiculo } from '../../interface/vehiculo.interface'
import { Boton } from '../atoms/Boton'
import { InsigniaEstado } from '../atoms/InsigniaEstado'

interface PropsListaVehiculos {
  vehiculos: Vehiculo[]
  proyectoId: number
  // Create/edit (ADMIN, OPERADOR) on an active project
  puedeEditar: boolean
  // Deactivate/reactivate (ADMIN) on an active project
  puedeCambiarEstado: boolean
  onDesactivar: (vehiculo: Vehiculo) => void
  onReactivar: (vehiculo: Vehiculo) => void
}

interface PropsAcciones {
  vehiculo: Vehiculo
  proyectoId: number
  puedeEditar: boolean
  puedeCambiarEstado: boolean
  onDesactivar: (vehiculo: Vehiculo) => void
  onReactivar: (vehiculo: Vehiculo) => void
}

function Acciones({
  vehiculo,
  proyectoId,
  puedeEditar,
  puedeCambiarEstado,
  onDesactivar,
  onReactivar,
}: PropsAcciones) {
  // The backend rejects edits on inactive vehicles, so the action is not offered
  const editable = puedeEditar && vehiculo.activo
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        to={`/proyectos/${proyectoId}/vehiculos/${vehiculo.id}/documentos`}
        aria-label={`Documentos de ${vehiculo.patente}`}
        className="inline-flex min-h-10 items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-600 dark:hover:bg-slate-700"
      >
        Documentos
      </Link>
      {editable && (
        <Link
          to={`/proyectos/${proyectoId}/vehiculos/${vehiculo.id}/editar`}
          aria-label={`Editar ${vehiculo.patente}`}
          className="inline-flex min-h-10 items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-600 dark:hover:bg-slate-700"
        >
          Editar
        </Link>
      )}
      {puedeCambiarEstado &&
        (vehiculo.activo ? (
          <Boton
            variante="peligro"
            aria-label={`Desactivar ${vehiculo.patente}`}
            onClick={() => onDesactivar(vehiculo)}
          >
            Desactivar
          </Boton>
        ) : (
          <Boton
            variante="secundario"
            aria-label={`Reactivar ${vehiculo.patente}`}
            onClick={() => onReactivar(vehiculo)}
          >
            Reactivar
          </Boton>
        ))}
    </div>
  )
}

function Patente({ vehiculo }: { vehiculo: Vehiculo }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-base font-semibold tracking-wide">
      <Truck aria-hidden="true" className="size-5 shrink-0 text-slate-500 dark:text-slate-400" />
      {vehiculo.patente}
    </span>
  )
}

function Descripcion({ vehiculo }: { vehiculo: Vehiculo }) {
  const texto = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ')
  return <>{texto || '—'}</>
}

export function ListaVehiculos({
  vehiculos,
  proyectoId,
  puedeEditar,
  puedeCambiarEstado,
  onDesactivar,
  onReactivar,
}: PropsListaVehiculos) {
  const acciones = (vehiculo: Vehiculo) => (
    <Acciones
      vehiculo={vehiculo}
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
        {vehiculos.map((vehiculo) => (
          <li
            key={vehiculo.id}
            className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <h3>
                <Patente vehiculo={vehiculo} />
              </h3>
              <InsigniaEstado estado={vehiculo.activo ? 'ACTIVO' : 'INACTIVO'} />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <Descripcion vehiculo={vehiculo} />
              {vehiculo.anio !== null && ` · ${vehiculo.anio}`}
            </p>
            {acciones(vehiculo)}
          </li>
        ))}
      </ul>

      {/* Tablet / desktop: table */}
      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Listado de vehículos</caption>
          <thead className="bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th scope="col" className="px-4 py-3">Patente</th>
              <th scope="col" className="px-4 py-3">Marca y modelo</th>
              <th scope="col" className="px-4 py-3">Año</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {vehiculos.map((vehiculo) => (
              <tr key={vehiculo.id} className="align-middle">
                <td className="px-4 py-3 whitespace-nowrap">
                  <Patente vehiculo={vehiculo} />
                </td>
                <td className="px-4 py-3">
                  <Descripcion vehiculo={vehiculo} />
                </td>
                <td className="px-4 py-3">{vehiculo.anio ?? '—'}</td>
                <td className="px-4 py-3">
                  <InsigniaEstado estado={vehiculo.activo ? 'ACTIVO' : 'INACTIVO'} />
                </td>
                <td className="px-4 py-3">{acciones(vehiculo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
