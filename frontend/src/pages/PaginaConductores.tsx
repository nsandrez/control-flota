import { useEffect, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router'
import { Alerta } from '../components/atoms/Alerta'
import { Boton } from '../components/atoms/Boton'
import { Cargando } from '../components/atoms/Cargando'
import { MensajeEstado } from '../components/molecules/MensajeEstado'
import { NavegacionProyecto } from '../components/molecules/NavegacionProyecto'
import { Paginacion } from '../components/molecules/Paginacion'
import { DialogoConfirmacion } from '../components/organisms/DialogoConfirmacion'
import { FiltrosConductores } from '../components/organisms/FiltrosConductores'
import { ListaConductores } from '../components/organisms/ListaConductores'
import { useAuth } from '../hooks/useAuth'
import { useConductores } from '../hooks/useConductores'
import { useProyecto } from '../hooks/useProyecto'
import { useRetardo } from '../hooks/useRetardo'
import type { Conductor } from '../interface/conductor.interface'
import { mensajeDeError } from '../interface/error.interface'
import type { Proyecto } from '../interface/proyecto.interface'
import { desactivarConductor, reactivarConductor } from '../services/conductor.service'

const LIMITE = 10

type AccionEstado = 'desactivar' | 'reactivar'

interface Pendiente {
  conductor: Conductor
  accion: AccionEstado
}

function leerPagina(valor: string | null): number {
  const numero = Number(valor)
  return Number.isInteger(numero) && numero >= 1 ? numero : 1
}

function EnlaceVolver() {
  return (
    <Link to="/proyectos" className="text-sm text-blue-700 underline dark:text-blue-300">
      ← Volver a proyectos
    </Link>
  )
}

interface PropsContenido {
  proyecto: Proyecto
}

function ContenidoConductores({ proyecto }: PropsContenido) {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'ADMIN'
  // Inactive projects can be read but not modified (the backend answers 409 to writes)
  const proyectoActivo = proyecto.estado === 'ACTIVO'
  const puedeEditar = proyectoActivo
  const puedeCambiarEstado = proyectoActivo && esAdmin

  // Success notice handed over by the form page after create/edit
  const ubicacion = useLocation()
  const avisoInicial = (ubicacion.state as { aviso?: string } | null)?.aviso ?? null

  // Filters live in the URL: shareable, and preserved when coming back from the form
  const [parametros, setParametros] = useSearchParams()
  const busquedaUrl = parametros.get('busqueda') ?? ''
  const mostrarActivos = parametros.get('activo') !== 'false'
  const pagina = leerPagina(parametros.get('pagina'))

  const [textoBusqueda, setTextoBusqueda] = useState(busquedaUrl)
  const busquedaRetardada = useRetardo(textoBusqueda.trim(), 400)

  const { resultado, cargando, error, recargar } = useConductores(proyecto.id, {
    activo: mostrarActivos,
    busqueda: busquedaUrl || undefined,
    pagina,
    limite: LIMITE,
  })

  const [pendiente, setPendiente] = useState<Pendiente | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(avisoInicial)

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

  // Debounced search text -> URL
  useEffect(() => {
    if (busquedaRetardada !== busquedaUrl) {
      actualizarParametros({ busqueda: busquedaRetardada }, true)
    }
    // Only react to the debounced value, not to URL changes made elsewhere
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedaRetardada])

  // If the current page no longer exists (e.g. last item removed from a filtered list), go back
  useEffect(() => {
    if (resultado && resultado.items.length === 0 && pagina > 1) {
      const ultima = Math.max(1, Math.ceil(resultado.total / LIMITE))
      actualizarParametros({ pagina: ultima > 1 ? String(ultima) : '' }, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado])

  function cerrarDialogo() {
    setPendiente(null)
    setErrorAccion(null)
  }

  async function confirmarAccion() {
    if (!pendiente) return
    setProcesando(true)
    setErrorAccion(null)
    try {
      const { conductor, accion } = pendiente
      if (accion === 'desactivar') await desactivarConductor(proyecto.id, conductor.id)
      else await reactivarConductor(proyecto.id, conductor.id)
      setAviso(
        `Conductor ${conductor.nombre} ${accion === 'desactivar' ? 'desactivado' : 'reactivado'}.`,
      )
      setPendiente(null)
      recargar()
    } catch (e) {
      setErrorAccion(mensajeDeError(e))
    } finally {
      setProcesando(false)
    }
  }

  const hayFiltros = Boolean(busquedaUrl || !mostrarActivos)
  const rutaNuevo = `/proyectos/${proyecto.id}/conductores/nuevo`

  return (
    <div className="space-y-5">
      <div>
        <EnlaceVolver />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Conductores</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Proyecto: <span className="font-medium break-words">{proyecto.nombre}</span>
            </p>
          </div>
          {puedeEditar && (
            <Link
              to={rutaNuevo}
              className="inline-flex min-h-10 items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Nuevo conductor
            </Link>
          )}
        </div>
      </div>

      <NavegacionProyecto proyectoId={proyecto.id} />

      {!proyectoActivo && (
        <Alerta variante="info">
          El proyecto está inactivo: puede consultar sus conductores, pero no crear, editar ni
          cambiar el estado de ninguno.
        </Alerta>
      )}

      <FiltrosConductores
        busqueda={textoBusqueda}
        mostrarActivos={mostrarActivos}
        onBusquedaChange={setTextoBusqueda}
        onMostrarActivosChange={(activos) =>
          actualizarParametros({ activo: activos ? '' : 'false' }, true)
        }
      />

      {aviso && <Alerta variante="exito">{aviso}</Alerta>}

      {error && (
        <div className="space-y-3">
          <Alerta variante="error">{error}</Alerta>
          <Boton variante="secundario" onClick={recargar}>
            Reintentar
          </Boton>
        </div>
      )}

      {!error && cargando && !resultado && <Cargando texto="Cargando conductores…" />}

      {resultado && (
        <div className={cargando ? 'space-y-4 opacity-60' : 'space-y-4'} aria-busy={cargando}>
          {resultado.items.length === 0 ? (
            <MensajeEstado
              titulo={hayFiltros ? 'Sin resultados' : 'Aún no hay conductores'}
              descripcion={
                hayFiltros
                  ? 'Ningún conductor coincide con los filtros aplicados.'
                  : puedeEditar
                    ? 'Registre el primer conductor de este proyecto.'
                    : 'Este proyecto todavía no tiene conductores registrados.'
              }
              accion={
                hayFiltros ? (
                  <Boton
                    variante="secundario"
                    onClick={() => {
                      setTextoBusqueda('')
                      setParametros({}, { replace: true })
                    }}
                  >
                    Limpiar filtros
                  </Boton>
                ) : undefined
              }
            />
          ) : (
            <>
              <ListaConductores
                conductores={resultado.items}
                proyectoId={proyecto.id}
                puedeEditar={puedeEditar}
                puedeCambiarEstado={puedeCambiarEstado}
                onDesactivar={(conductor) => {
                  setAviso(null)
                  setPendiente({ conductor, accion: 'desactivar' })
                }}
                onReactivar={(conductor) => {
                  setAviso(null)
                  setPendiente({ conductor, accion: 'reactivar' })
                }}
              />
              <Paginacion
                pagina={resultado.pagina}
                limite={resultado.limite}
                total={resultado.total}
                onCambiar={(nueva) =>
                  actualizarParametros({ pagina: nueva > 1 ? String(nueva) : '' }, false)
                }
              />
            </>
          )}
        </div>
      )}

      <DialogoConfirmacion
        abierto={pendiente !== null}
        titulo={pendiente?.accion === 'desactivar' ? 'Desactivar conductor' : 'Reactivar conductor'}
        mensaje={
          pendiente
            ? pendiente.accion === 'desactivar'
              ? `¿Desea desactivar al conductor ${pendiente.conductor.nombre}? Podrá reactivarlo más adelante.`
              : `¿Desea reactivar al conductor ${pendiente.conductor.nombre}?`
            : ''
        }
        textoConfirmar={pendiente?.accion === 'desactivar' ? 'Desactivar' : 'Reactivar'}
        peligro={pendiente?.accion === 'desactivar'}
        procesando={procesando}
        error={errorAccion}
        onConfirmar={confirmarAccion}
        onCancelar={cerrarDialogo}
      />
    </div>
  )
}

export function PaginaConductores() {
  const { proyectoId: idCrudo } = useParams()
  const proyectoId = Number(idCrudo)
  const { proyecto, cargando, error, noEncontrado } = useProyecto(proyectoId)

  if (cargando) return <Cargando texto="Cargando proyecto…" />

  if (noEncontrado) {
    return (
      <div className="space-y-5">
        <EnlaceVolver />
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
        <EnlaceVolver />
        <Alerta variante="error">{error ?? 'No se pudo cargar el proyecto'}</Alerta>
      </div>
    )
  }

  return <ContenidoConductores key={proyecto.id} proyecto={proyecto} />
}
