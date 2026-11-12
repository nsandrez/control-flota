import { FileText } from 'lucide-react'
import type { Documento } from '../../interface/documento.interface'
import { formatearFecha, formatearFechaPlana } from '../../utils/fechas'
import { Boton } from '../atoms/Boton'
import { InsigniaEstadoDocumento } from '../atoms/InsigniaEstadoDocumento'

interface PropsListaDocumentos {
  documentos: Documento[]
  // Document id being downloaded (its button is disabled)
  descargandoId: number | null
  // Edit the due date: depends on the document's type, so it is decided per document
  puedeEditarVencimiento: (documento: Documento) => boolean
  // Delete (ADMIN on an active project)
  puedeEliminar: boolean
  onDescargar: (documento: Documento) => void
  onEditarVencimiento: (documento: Documento) => void
  onEliminar: (documento: Documento) => void
}

interface PropsAcciones extends Omit<PropsListaDocumentos, 'documentos'> {
  documento: Documento
}

function Acciones({
  documento,
  descargandoId,
  puedeEditarVencimiento,
  puedeEliminar,
  onDescargar,
  onEditarVencimiento,
  onEliminar,
}: PropsAcciones) {
  const descargando = descargandoId === documento.id
  return (
    <div className="flex flex-wrap gap-2">
      <Boton
        variante="secundario"
        aria-label={`Descargar ${documento.nombreArchivo}`}
        cargando={descargando}
        disabled={descargandoId !== null}
        onClick={() => onDescargar(documento)}
      >
        {descargando ? 'Descargando…' : 'Descargar'}
      </Boton>
      {puedeEditarVencimiento(documento) && (
        <Boton
          variante="secundario"
          aria-label={`Editar vencimiento de ${documento.nombreArchivo}`}
          onClick={() => onEditarVencimiento(documento)}
        >
          Editar vencimiento
        </Boton>
      )}
      {puedeEliminar && (
        <Boton
          variante="peligro"
          aria-label={`Eliminar ${documento.nombreArchivo}`}
          onClick={() => onEliminar(documento)}
        >
          Eliminar
        </Boton>
      )}
    </div>
  )
}

function Archivo({ documento }: { documento: Documento }) {
  return (
    <span className="inline-flex items-start gap-2 break-all">
      <FileText aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-slate-500 dark:text-slate-400" />
      {documento.nombreArchivo}
    </span>
  )
}

export function ListaDocumentos({ documentos, ...resto }: PropsListaDocumentos) {
  return (
    <>
      {/* Phone: cards */}
      <ul className="space-y-3 md:hidden">
        {documentos.map((documento) => (
          <li
            key={documento.id}
            className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium break-words">{documento.tipoDocumentoNombre}</h3>
              <InsigniaEstadoDocumento estado={documento.estado} />
            </div>
            <p className="text-sm">
              <Archivo documento={documento} />
            </p>
            <dl className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex gap-2">
                <dt className="font-medium">Vencimiento:</dt>
                <dd>
                  {documento.fechaVencimiento
                    ? formatearFechaPlana(documento.fechaVencimiento)
                    : 'Sin vencimiento'}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium">Subido:</dt>
                <dd>{formatearFecha(documento.creadoEn)}</dd>
              </div>
            </dl>
            <Acciones documento={documento} {...resto} />
          </li>
        ))}
      </ul>

      {/* Tablet / desktop: table */}
      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Historial de documentos</caption>
          <thead className="bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th scope="col" className="px-4 py-3">Tipo</th>
              <th scope="col" className="px-4 py-3">Archivo</th>
              <th scope="col" className="px-4 py-3">Vencimiento</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3">Subido</th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {documentos.map((documento) => (
              <tr key={documento.id} className="align-middle">
                <td className="px-4 py-3 font-medium">{documento.tipoDocumentoNombre}</td>
                <td className="px-4 py-3 max-w-64">
                  <Archivo documento={documento} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {documento.fechaVencimiento
                    ? formatearFechaPlana(documento.fechaVencimiento)
                    : 'Sin vencimiento'}
                </td>
                <td className="px-4 py-3">
                  <InsigniaEstadoDocumento estado={documento.estado} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatearFecha(documento.creadoEn)}</td>
                <td className="px-4 py-3">
                  <Acciones documento={documento} {...resto} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
