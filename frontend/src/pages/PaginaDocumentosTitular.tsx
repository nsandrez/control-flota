import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Alerta } from '../components/atoms/Alerta'
import { Boton } from '../components/atoms/Boton'
import { Cargando } from '../components/atoms/Cargando'
import { InsigniaEstado } from '../components/atoms/InsigniaEstado'
import { MensajeEstado } from '../components/molecules/MensajeEstado'
import { ModalDialogo } from '../components/molecules/ModalDialogo'
import { NavegacionProyecto } from '../components/molecules/NavegacionProyecto'
import { Paginacion } from '../components/molecules/Paginacion'
import { DialogoConfirmacion } from '../components/organisms/DialogoConfirmacion'
import { FiltrosDocumentos } from '../components/organisms/FiltrosDocumentos'
import { FormularioSubirDocumento } from '../components/organisms/FormularioSubirDocumento'
import { FormularioVencimientoDocumento } from '../components/organisms/FormularioVencimientoDocumento'
import { ListaDocumentos } from '../components/organisms/ListaDocumentos'
import { ListaRequisitosDocumento } from '../components/organisms/ListaRequisitosDocumento'
import { useAuth } from '../hooks/useAuth'
import { useDocumentos } from '../hooks/useDocumentos'
import { useProyecto } from '../hooks/useProyecto'
import { useTiposDocumentoProyecto } from '../hooks/useTiposDocumentoProyecto'
import { useTitularDocumento, type ResumenTitular } from '../hooks/useTitularDocumento'
import type {
  DatosSubidaDocumento,
  Documento,
  EstadoDocumento,
  TitularDocumento,
} from '../interface/documento.interface'
import { mensajeDeError } from '../interface/error.interface'
import type { Proyecto } from '../interface/proyecto.interface'
import {
  actualizarVencimientoDocumento,
  descargarDocumento,
  eliminarDocumento,
  subirDocumento,
} from '../services/documento.service'
import { fechaHoy } from '../utils/fechas'
import { calcularRequisitos, estaAlDia } from '../utils/requisitosDocumento'

const LIMITE_HISTORIAL = 10
// The backend caps a page at 100 items. The checklist is computed from the owner's latest 100
// documents (list is ordered by id DESC, so the current document of each type is among them
// unless an owner has more than 100 newer documents of other types); a notice is shown past that.
const LIMITE_REQUISITOS = 100

const TEXTOS: Record<
  TitularDocumento,
  { segmento: string; volver: string; inactivo: string; noEncontrado: string }
> = {
  VEHICULO: {
    segmento: 'vehiculos',
    volver: '← Volver a vehículos',
    inactivo: 'El vehículo está inactivo: puede consultar y descargar sus documentos, pero no subir nuevos.',
    noEncontrado: 'El vehículo solicitado no existe en este proyecto.',
  },
  CONDUCTOR: {
    segmento: 'conductores',
    volver: '← Volver a conductores',
    inactivo: 'El conductor está inactivo: puede consultar y descargar sus documentos, pero no subir nuevos.',
    noEncontrado: 'El conductor solicitado no existe en este proyecto.',
  },
}

function leerEntero(valor: string | null): number | undefined {
  const numero = Number(valor)
  return valor !== null && Number.isInteger(numero) && numero >= 1 ? numero : undefined
}

function leerEstado(valor: string | null): EstadoDocumento | undefined {
  return valor === 'VIGENTE' || valor === 'VENCIDO' ? valor : undefined
}

function EnlaceVolver({ destino, texto }: { destino: string; texto: string }) {
  return (
    <Link to={destino} className="text-sm text-blue-700 underline dark:text-blue-300">
      {texto}
    </Link>
  )
}

interface PropsPanel {
  proyecto: Proyecto
  tipoTitular: TitularDocumento
  titularId: number
  titular: ResumenTitular
}

interface EstadoSubida {
  // Type launched from the checklist (preselected in the form)
  tipoInicial: number | null
}

function PanelDocumentos({ proyecto, tipoTitular, titularId, titular }: PropsPanel) {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'ADMIN'
  // Inactive projects can be read but not modified (the backend answers 409 to writes)
  const proyectoActivo = proyecto.estado === 'ACTIVO'
  // The backend also refuses uploads for inactive owners
  const puedeSubir = proyectoActivo && titular.activo
  const puedeEliminar = proyectoActivo && esAdmin

  // Filters live in the URL: shareable, and preserved on reload
  const [parametros, setParametros] = useSearchParams()
  const tipoFiltro = leerEntero(parametros.get('tipo'))
  const estadoFiltro = leerEstado(parametros.get('estado'))
  const pagina = leerEntero(parametros.get('pagina')) ?? 1

  const asignaciones = useTiposDocumentoProyecto(proyecto.id)
  const todos = useDocumentos(tipoTitular, proyecto.id, titularId, {
    pagina: 1,
    limite: LIMITE_REQUISITOS,
  })
  const historial = useDocumentos(tipoTitular, proyecto.id, titularId, {
    tipoDocumentoId: tipoFiltro,
    estado: estadoFiltro,
    pagina,
    limite: LIMITE_HISTORIAL,
  })

  const [aviso, setAviso] = useState<string | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const [subida, setSubida] = useState<EstadoSubida | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [errorSubida, setErrorSubida] = useState<string | null>(null)

  const [aEditar, setAEditar] = useState<Documento | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null)

  const [aEliminar, setAEliminar] = useState<Documento | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)

  const [descargandoId, setDescargandoId] = useState<number | null>(null)

  function actualizarParametros(cambios: Record<string, string>, reiniciarPagina: boolean) {
    setParametros(
      (previos) => {
        const siguientes = new URLSearchParams(previos)
        for (const [clave, valor] of Object.entries(cambios)) {
          if (valor) siguientes.set(clave, valor)
          else siguientes.delete(clave)
        }
        if (reiniciarPagina) siguientes.delete('pagina')
        return siguientes
      },
      { replace: true },
    )
  }

  const { resultado: resultadoHistorial } = historial
  // If the current page no longer exists (e.g. last item removed), go back
  useEffect(() => {
    if (resultadoHistorial && resultadoHistorial.items.length === 0 && pagina > 1) {
      const ultima = Math.max(1, Math.ceil(resultadoHistorial.total / LIMITE_HISTORIAL))
      actualizarParametros({ pagina: ultima > 1 ? String(ultima) : '' }, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultadoHistorial])

  function recargarDocumentos() {
    todos.recargar()
    historial.recargar()
  }

  function recargarTodo() {
    asignaciones.recargar()
    recargarDocumentos()
  }

  const tiposDelTitular = (asignaciones.asignaciones ?? []).filter(
    (a) => a.tipoDocumento.aplicaA === tipoTitular,
  )
  // Only active types can still receive documents
  const tiposParaSubir = tiposDelTitular.filter((a) => a.tipoDocumento.activo).map((a) => a.tipoDocumento)

  function puedeEditarVencimiento(documento: Documento): boolean {
    if (!proyectoActivo) return false
    const asignacion = (asignaciones.asignaciones ?? []).find(
      (a) => a.tipoDocumentoId === documento.tipoDocumentoId,
    )
    // Only types that require a due date can have it edited (null is not accepted for them)
    return asignacion?.tipoDocumento.requiereVencimiento ?? false
  }

  function abrirSubida(tipoInicial: number | null) {
    setAviso(null)
    setErrorAccion(null)
    setErrorSubida(null)
    setSubida({ tipoInicial })
  }

  function cerrarSubida() {
    setSubida(null)
    setErrorSubida(null)
  }

  async function subir(datos: DatosSubidaDocumento) {
    setSubiendo(true)
    setErrorSubida(null)
    try {
      const documento = await subirDocumento(tipoTitular, proyecto.id, titularId, datos)
      setAviso(`Se subió «${documento.nombreArchivo}» (${documento.tipoDocumentoNombre}).`)
      setSubida(null)
      // The newest document is listed first
      actualizarParametros({ pagina: '' }, false)
      recargarDocumentos()
    } catch (e) {
      setErrorSubida(mensajeDeError(e))
    } finally {
      setSubiendo(false)
    }
  }

  async function guardarVencimiento(fechaVencimiento: string) {
    if (!aEditar) return
    setGuardando(true)
    setErrorEdicion(null)
    try {
      await actualizarVencimientoDocumento(proyecto.id, aEditar.id, fechaVencimiento)
      setAviso(`Se actualizó el vencimiento de «${aEditar.nombreArchivo}».`)
      setAEditar(null)
      recargarDocumentos()
    } catch (e) {
      setErrorEdicion(mensajeDeError(e))
    } finally {
      setGuardando(false)
    }
  }

  async function confirmarEliminar() {
    if (!aEliminar) return
    setEliminando(true)
    setErrorEliminar(null)
    try {
      await eliminarDocumento(proyecto.id, aEliminar.id)
      setAviso(`Se eliminó «${aEliminar.nombreArchivo}».`)
      setAEliminar(null)
      recargarDocumentos()
    } catch (e) {
      setErrorEliminar(mensajeDeError(e))
    } finally {
      setEliminando(false)
    }
  }

  async function descargar(documento: Documento) {
    setDescargandoId(documento.id)
    setAviso(null)
    setErrorAccion(null)
    try {
      await descargarDocumento(proyecto.id, documento)
    } catch (e) {
      setErrorAccion(mensajeDeError(e))
    } finally {
      setDescargandoId(null)
    }
  }

  const requisitos =
    asignaciones.asignaciones && todos.resultado
      ? calcularRequisitos(asignaciones.asignaciones, todos.resultado.items, tipoTitular, fechaHoy())
      : null
  const obligatorios = requisitos?.filter((r) => r.asignacion.obligatorio) ?? []
  const obligatoriosAlDia = obligatorios.filter((r) => estaAlDia(r.estado)).length

  const errorRequisitos = asignaciones.error ?? todos.error
  const hayFiltros = Boolean(tipoFiltro || estadoFiltro)

  return (
    <div className="space-y-6">
      <div>
        <EnlaceVolver
          destino={`/proyectos/${proyecto.id}/${TEXTOS[tipoTitular].segmento}`}
          texto={TEXTOS[tipoTitular].volver}
        />
        <div className="mt-2 space-y-1">
          <h1 className="text-2xl font-bold">Documentos</h1>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-lg font-semibold break-words">{titular.titulo}</span>
            <InsigniaEstado estado={titular.activo ? 'ACTIVO' : 'INACTIVO'} />
          </p>
          {titular.detalle && (
            <p className="text-sm text-slate-600 dark:text-slate-300">{titular.detalle}</p>
          )}
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Proyecto: <span className="font-medium break-words">{proyecto.nombre}</span>
          </p>
        </div>
      </div>

      <NavegacionProyecto proyectoId={proyecto.id} />

      {!proyectoActivo && (
        <Alerta variante="info">
          El proyecto está inactivo: puede consultar y descargar documentos, pero no subir, editar
          ni eliminar ninguno.
        </Alerta>
      )}
      {proyectoActivo && !titular.activo && <Alerta variante="info">{TEXTOS[tipoTitular].inactivo}</Alerta>}

      {aviso && <Alerta variante="exito">{aviso}</Alerta>}
      {errorAccion && <Alerta variante="error">{errorAccion}</Alerta>}

      <section aria-labelledby="titulo-requeridos" className="space-y-3">
        <h2 id="titulo-requeridos" className="text-lg font-semibold">
          Documentos requeridos
        </h2>

        {errorRequisitos && (
          <div className="space-y-3">
            <Alerta variante="error">{errorRequisitos}</Alerta>
            <Boton variante="secundario" onClick={recargarTodo}>
              Reintentar
            </Boton>
          </div>
        )}

        {!errorRequisitos && !requisitos && <Cargando texto="Cargando documentos requeridos…" />}

        {requisitos &&
          (requisitos.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
              Este proyecto no tiene tipos de documento activos asignados para{' '}
              {tipoTitular === 'VEHICULO' ? 'vehículos' : 'conductores'}. Se asignan en la sección
              «Documentos requeridos» del proyecto.
            </p>
          ) : (
            <>
              {obligatorios.length > 0 && (
                <p className="text-sm font-medium" aria-live="polite">
                  {obligatoriosAlDia} de {obligatorios.length} obligatorios al día
                </p>
              )}
              {todos.resultado && todos.resultado.total > todos.resultado.items.length && (
                <Alerta variante="info">
                  Este titular tiene más de {LIMITE_REQUISITOS} documentos: el estado de los
                  requeridos se calcula con los {LIMITE_REQUISITOS} más recientes.
                </Alerta>
              )}
              <div
                className={todos.cargando ? 'opacity-60' : undefined}
                aria-busy={todos.cargando}
              >
                <ListaRequisitosDocumento
                  requisitos={requisitos}
                  puedeSubir={puedeSubir}
                  onSubir={(tipoId) => abrirSubida(tipoId)}
                />
              </div>
            </>
          ))}
      </section>

      <section aria-labelledby="titulo-historial" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="titulo-historial" className="text-lg font-semibold">
            Historial de documentos
          </h2>
          {puedeSubir && (
            <Boton onClick={() => abrirSubida(null)} disabled={tiposParaSubir.length === 0}>
              Subir documento
            </Boton>
          )}
        </div>

        <FiltrosDocumentos
          tipos={tiposDelTitular.map((a) => ({
            id: a.tipoDocumentoId,
            nombre: a.tipoDocumento.nombre,
          }))}
          tipoDocumentoId={tipoFiltro ? String(tipoFiltro) : ''}
          estado={estadoFiltro ?? ''}
          onTipoChange={(valor) => actualizarParametros({ tipo: valor }, true)}
          onEstadoChange={(valor) => actualizarParametros({ estado: valor }, true)}
        />

        {historial.error && (
          <div className="space-y-3">
            <Alerta variante="error">{historial.error}</Alerta>
            <Boton variante="secundario" onClick={historial.recargar}>
              Reintentar
            </Boton>
          </div>
        )}

        {!historial.error && historial.cargando && !historial.resultado && (
          <Cargando texto="Cargando documentos…" />
        )}

        {historial.resultado && (
          <div
            className={historial.cargando ? 'space-y-4 opacity-60' : 'space-y-4'}
            aria-busy={historial.cargando}
          >
            {historial.resultado.items.length === 0 ? (
              <MensajeEstado
                titulo={hayFiltros ? 'Sin resultados' : 'Aún no hay documentos'}
                descripcion={
                  hayFiltros
                    ? 'Ningún documento coincide con los filtros aplicados.'
                    : puedeSubir
                      ? 'Suba el primer documento desde la lista de documentos requeridos o con el botón «Subir documento».'
                      : 'Todavía no se ha subido ningún documento.'
                }
                accion={
                  hayFiltros ? (
                    <Boton variante="secundario" onClick={() => setParametros({}, { replace: true })}>
                      Limpiar filtros
                    </Boton>
                  ) : undefined
                }
              />
            ) : (
              <>
                <ListaDocumentos
                  documentos={historial.resultado.items}
                  descargandoId={descargandoId}
                  puedeEditarVencimiento={puedeEditarVencimiento}
                  puedeEliminar={puedeEliminar}
                  onDescargar={descargar}
                  onEditarVencimiento={(documento) => {
                    setAviso(null)
                    setErrorAccion(null)
                    setErrorEdicion(null)
                    setAEditar(documento)
                  }}
                  onEliminar={(documento) => {
                    setAviso(null)
                    setErrorAccion(null)
                    setAEliminar(documento)
                  }}
                />
                <Paginacion
                  pagina={historial.resultado.pagina}
                  limite={historial.resultado.limite}
                  total={historial.resultado.total}
                  onCambiar={(nueva) =>
                    actualizarParametros({ pagina: nueva > 1 ? String(nueva) : '' }, false)
                  }
                />
              </>
            )}
          </div>
        )}
      </section>

      <ModalDialogo
        abierto={subida !== null}
        titulo="Subir documento"
        onCerrar={cerrarSubida}
        bloqueado={subiendo}
      >
        <FormularioSubirDocumento
          tipos={tiposParaSubir}
          tipoInicial={subida?.tipoInicial ?? null}
          enviando={subiendo}
          errorServidor={errorSubida}
          onSubir={subir}
          onCancelar={cerrarSubida}
        />
      </ModalDialogo>

      <ModalDialogo
        abierto={aEditar !== null}
        titulo="Editar vencimiento"
        onCerrar={() => setAEditar(null)}
        bloqueado={guardando}
      >
        {aEditar && (
          <>
            <p className="text-sm text-slate-700 break-all dark:text-slate-300">
              {aEditar.tipoDocumentoNombre} · {aEditar.nombreArchivo}
            </p>
            <FormularioVencimientoDocumento
              fechaInicial={aEditar.fechaVencimiento}
              enviando={guardando}
              errorServidor={errorEdicion}
              onGuardar={guardarVencimiento}
              onCancelar={() => setAEditar(null)}
            />
          </>
        )}
      </ModalDialogo>

      <DialogoConfirmacion
        abierto={aEliminar !== null}
        titulo="Eliminar documento"
        mensaje={
          aEliminar
            ? `¿Desea eliminar «${aEliminar.nombreArchivo}» (${aEliminar.tipoDocumentoNombre})? El archivo se borrará de forma permanente.`
            : ''
        }
        textoConfirmar="Eliminar"
        peligro
        procesando={eliminando}
        error={errorEliminar}
        onConfirmar={confirmarEliminar}
        onCancelar={() => {
          setAEliminar(null)
          setErrorEliminar(null)
        }}
      />
    </div>
  )
}

interface PropsContenido {
  proyecto: Proyecto
  tipoTitular: TitularDocumento
  titularId: number
}

function ContenidoDocumentos({ proyecto, tipoTitular, titularId }: PropsContenido) {
  const { titular, cargando, error, noEncontrado } = useTitularDocumento(
    tipoTitular,
    proyecto.id,
    titularId,
  )
  const destinoLista = `/proyectos/${proyecto.id}/${TEXTOS[tipoTitular].segmento}`

  if (cargando) return <Cargando texto="Cargando datos…" />

  if (noEncontrado) {
    return (
      <div className="space-y-5">
        <EnlaceVolver destino={destinoLista} texto={TEXTOS[tipoTitular].volver} />
        <MensajeEstado titulo="No encontrado" descripcion={TEXTOS[tipoTitular].noEncontrado} />
      </div>
    )
  }

  if (error || !titular) {
    return (
      <div className="space-y-5">
        <EnlaceVolver destino={destinoLista} texto={TEXTOS[tipoTitular].volver} />
        <Alerta variante="error">{error ?? 'No se pudieron cargar los datos'}</Alerta>
      </div>
    )
  }

  return (
    <PanelDocumentos
      key={`${tipoTitular}-${titularId}`}
      proyecto={proyecto}
      tipoTitular={tipoTitular}
      titularId={titularId}
      titular={titular}
    />
  )
}

interface PropsPagina {
  tipoTitular: TitularDocumento
}

// Shared container for the documents of a vehicle or a driver (the route picks `tipoTitular`)
export function PaginaDocumentosTitular({ tipoTitular }: PropsPagina) {
  const { proyectoId: idProyectoCrudo, vehiculoId, conductorId } = useParams()
  const proyectoId = Number(idProyectoCrudo)
  const titularId = Number(tipoTitular === 'VEHICULO' ? vehiculoId : conductorId)
  const { proyecto, cargando, error, noEncontrado } = useProyecto(proyectoId)

  if (cargando) return <Cargando texto="Cargando proyecto…" />

  if (noEncontrado) {
    return (
      <div className="space-y-5">
        <EnlaceVolver destino="/proyectos" texto="← Volver a proyectos" />
        <MensajeEstado
          titulo="Proyecto no encontrado"
          descripcion="El proyecto solicitado no existe o ya no está disponible."
        />
      </div>
    )
  }

  if (error || !proyecto) {
    return (
      <div className="space-y-5">
        <EnlaceVolver destino="/proyectos" texto="← Volver a proyectos" />
        <Alerta variante="error">{error ?? 'No se pudo cargar el proyecto'}</Alerta>
      </div>
    )
  }

  return (
    <ContenidoDocumentos
      key={`${proyecto.id}-${tipoTitular}-${titularId}`}
      proyecto={proyecto}
      tipoTitular={tipoTitular}
      titularId={titularId}
    />
  )
}
