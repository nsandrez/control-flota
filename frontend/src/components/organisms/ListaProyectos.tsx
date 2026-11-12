import { Link } from 'react-router'
import type { Proyecto } from '../../interface/proyecto.interface'
import { formatearFecha } from '../../utils/fechas'
import { Boton } from '../atoms/Boton'
import { InsigniaEstado } from '../atoms/InsigniaEstado'

interface PropsListaProyectos {
  proyectos: Proyecto[]
  // Write actions are only rendered when true (ADMIN)
  puedeEditar: boolean
  onDesactivar: (proyecto: Proyecto) => void
  onReactivar: (proyecto: Proyecto) => void
}

interface PropsAcciones {
  proyecto: Proyecto
  puedeEditar: boolean
  onDesactivar: (proyecto: Proyecto) => void
  onReactivar: (proyecto: Proyecto) => void
}

const ESTILO_ENLACE =
  'inline-flex min-h-10 items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-600 dark:hover:bg-slate-700'

function Acciones({ proyecto, puedeEditar, onDesactivar, onReactivar }: PropsAcciones) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Visible for every role */}
      <Link
        to={`/proyectos/${proyecto.id}/vehiculos`}
        aria-label={`Vehículos de ${proyecto.nombre}`}
        className={ESTILO_ENLACE}
      >
        Vehículos
      </Link>
      <Link
        to={`/proyectos/${proyecto.id}/conductores`}
        aria-label={`Conductores de ${proyecto.nombre}`}
        className={ESTILO_ENLACE}
      >
        Conductores
      </Link>
      {puedeEditar && (
        <Link
          to={`/proyectos/${proyecto.id}/editar`}
          aria-label={`Editar ${proyecto.nombre}`}
          className={ESTILO_ENLACE}
        >
          Editar
        </Link>
      )}
      {!puedeEditar ? null : proyecto.estado === 'ACTIVO' ? (
        <Boton
          variante="peligro"
          aria-label={`Desactivar ${proyecto.nombre}`}
          onClick={() => onDesactivar(proyecto)}
        >
          Desactivar
        </Boton>
      ) : (
        <Boton
          variante="secundario"
          aria-label={`Reactivar ${proyecto.nombre}`}
          onClick={() => onReactivar(proyecto)}
        >
          Reactivar
        </Boton>
      )}
    </div>
  )
}

function Periodo({ proyecto }: { proyecto: Proyecto }) {
  return (
    <>
      {formatearFecha(proyecto.fechaInicio)} – {formatearFecha(proyecto.fechaFin)}
    </>
  )
}

export function ListaProyectos({
  proyectos,
  puedeEditar,
  onDesactivar,
  onReactivar,
}: PropsListaProyectos) {
  return (
    <>
      {/* Phone: cards */}
      <ul className="space-y-3 md:hidden">
        {proyectos.map((proyecto) => (
          <li
            key={proyecto.id}
            className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold break-words">{proyecto.nombre}</h3>
              <InsigniaEstado estado={proyecto.estado} />
            </div>
            {proyecto.descripcion && (
              <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                {proyecto.descripcion}
              </p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <Periodo proyecto={proyecto} />
            </p>
            <Acciones
              proyecto={proyecto}
              puedeEditar={puedeEditar}
              onDesactivar={onDesactivar}
              onReactivar={onReactivar}
            />
          </li>
        ))}
      </ul>

      {/* Tablet / desktop: table */}
      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Listado de proyectos</caption>
          <thead className="bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th scope="col" className="px-4 py-3">Nombre</th>
              <th scope="col" className="px-4 py-3">Periodo</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {proyectos.map((proyecto) => (
              <tr key={proyecto.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-medium">{proyecto.nombre}</p>
                  {proyecto.descripcion && (
                    <p className="mt-0.5 line-clamp-2 max-w-md text-slate-600 dark:text-slate-300">
                      {proyecto.descripcion}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Periodo proyecto={proyecto} />
                </td>
                <td className="px-4 py-3">
                  <InsigniaEstado estado={proyecto.estado} />
                </td>
                <td className="px-4 py-3">
                  <Acciones
                    proyecto={proyecto}
                    puedeEditar={puedeEditar}
                    onDesactivar={onDesactivar}
                    onReactivar={onReactivar}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
