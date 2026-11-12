import { FileText } from 'lucide-react'
import { Link } from 'react-router'
import type { TipoDocumento } from '../../interface/tipoDocumento.interface'
import { Boton } from '../atoms/Boton'
import { InsigniaAplicaA } from '../atoms/InsigniaAplicaA'
import { InsigniaEstado } from '../atoms/InsigniaEstado'
import { MarcaVencimiento } from '../atoms/MarcaVencimiento'

interface PropsListaTiposDocumento {
  tipos: TipoDocumento[]
  // Create/edit/deactivate/reactivate are ADMIN only; read-only otherwise
  puedeEditar: boolean
  onDesactivar: (tipo: TipoDocumento) => void
  onReactivar: (tipo: TipoDocumento) => void
}

interface PropsAcciones {
  tipo: TipoDocumento
  onDesactivar: (tipo: TipoDocumento) => void
  onReactivar: (tipo: TipoDocumento) => void
}

function Acciones({ tipo, onDesactivar, onReactivar }: PropsAcciones) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        to={`/tipos-documento/${tipo.id}/editar`}
        aria-label={`Editar ${tipo.nombre}`}
        className="inline-flex min-h-10 items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-600 dark:hover:bg-slate-700"
      >
        Editar
      </Link>
      {tipo.activo ? (
        <Boton
          variante="peligro"
          aria-label={`Desactivar ${tipo.nombre}`}
          onClick={() => onDesactivar(tipo)}
        >
          Desactivar
        </Boton>
      ) : (
        <Boton
          variante="secundario"
          aria-label={`Reactivar ${tipo.nombre}`}
          onClick={() => onReactivar(tipo)}
        >
          Reactivar
        </Boton>
      )}
    </div>
  )
}

function Nombre({ tipo }: { tipo: TipoDocumento }) {
  return (
    <span className="inline-flex items-start gap-2 font-medium break-words">
      <FileText aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-slate-500 dark:text-slate-400" />
      {tipo.nombre}
    </span>
  )
}

export function ListaTiposDocumento({
  tipos,
  puedeEditar,
  onDesactivar,
  onReactivar,
}: PropsListaTiposDocumento) {
  const acciones = (tipo: TipoDocumento) => (
    <Acciones tipo={tipo} onDesactivar={onDesactivar} onReactivar={onReactivar} />
  )

  return (
    <>
      {/* Phone: cards */}
      <ul className="space-y-3 md:hidden">
        {tipos.map((tipo) => (
          <li
            key={tipo.id}
            className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <h3>
                <Nombre tipo={tipo} />
              </h3>
              <InsigniaEstado estado={tipo.activo ? 'ACTIVO' : 'INACTIVO'} />
            </div>
            {tipo.descripcion && (
              <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                {tipo.descripcion}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <InsigniaAplicaA aplicaA={tipo.aplicaA} />
              {tipo.requiereVencimiento && <MarcaVencimiento />}
            </div>
            {puedeEditar && acciones(tipo)}
          </li>
        ))}
      </ul>

      {/* Tablet / desktop: table */}
      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Listado de tipos de documento</caption>
          <thead className="bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th scope="col" className="px-4 py-3">Nombre</th>
              <th scope="col" className="px-4 py-3">Aplica a</th>
              <th scope="col" className="px-4 py-3">Vencimiento</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              {puedeEditar && (
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {tipos.map((tipo) => (
              <tr key={tipo.id} className="align-top">
                <td className="px-4 py-3">
                  <Nombre tipo={tipo} />
                  {tipo.descripcion && (
                    <p className="mt-0.5 line-clamp-2 max-w-md text-slate-600 dark:text-slate-300">
                      {tipo.descripcion}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <InsigniaAplicaA aplicaA={tipo.aplicaA} />
                </td>
                <td className="px-4 py-3">
                  {tipo.requiereVencimiento ? (
                    <MarcaVencimiento />
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">No requiere</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <InsigniaEstado estado={tipo.activo ? 'ACTIVO' : 'INACTIVO'} />
                </td>
                {puedeEditar && <td className="px-4 py-3">{acciones(tipo)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
