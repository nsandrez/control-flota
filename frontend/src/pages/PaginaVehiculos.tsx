import { useEffect, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router'
import { Alerta } from '../components/atoms/Alerta'
import { Boton } from '../components/atoms/Boton'
import { Cargando } from '../components/atoms/Cargando'
import { MensajeEstado } from '../components/molecules/MensajeEstado'
import { NavegacionProyecto } from '../components/molecules/NavegacionProyecto'
import { Paginacion } from '../components/molecules/Paginacion'
import { DialogoConfirmacion } from '../components/organisms/DialogoConfirmacion'
import { FiltrosVehiculos } from '../components/organisms/FiltrosVehiculos'
import { ListaVehiculos } from '../components/organisms/ListaVehiculos'
import { useAuth } from '../hooks/useAuth'
import { useProyecto } from '../hooks/useProyecto'
import { useRetardo } from '../hooks/useRetardo'
import { useVehiculos } from '../hooks/useVehiculos'
import { mensajeDeError } from '../interface/error.interface'
import type { Proyecto } from '../interface/proyecto.interface'
import type { Vehiculo } from '../interface/vehiculo.interface'
import { desactivarVehiculo, reactivarVehiculo } from '../services/vehiculo.service'

const LIMITE = 10

type AccionEstado = 'desactivar' | 'reactivar'

interface Pendiente {
  vehiculo: Vehiculo
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

function ContenidoVehiculos({ proyecto }: PropsContenido) {
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

  const { resultado, cargando, error, recargar } = useVehiculos(proyecto.id, {
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
      const { vehiculo, accion } = pendiente
      if (accion === 'desactivar') await desactivarVehiculo(proyecto.id, vehiculo.id)
      else await reactivarVehiculo(proyecto.id, vehiculo.id)
      setAviso(
        `Vehículo ${vehiculo.patente} ${accion === 'desactivar' ? 'desactivado' : 'reactivado'}.`,
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
  const rutaNuevo = `/proyectos/${proyecto.id}/vehiculos/nuevo`

  return (
    <div className="space-y-5">
      <div>
        <EnlaceVolver />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Vehículos</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Proyecto: <span className="font-medium break-words">{proyecto.nombre}</span>
            </p>
          </div>
          {puedeEditar && (
            <Link
              to={rutaNuevo}
              className="inline-flex min-h-10 items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Nuevo vehículo
            </Link>
          )}
        </div>
      </div>

      <NavegacionProyecto proyectoId={proyecto.id} />

      {!proyectoActivo && (
        <Alerta variante="info">
          El proyecto está inactivo: puede consultar sus vehículos, pero no crear, editar ni
          cambiar el estado de ninguno.
        </Alerta>
      )}

      <FiltrosVehiculos
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

      {!error && cargando && !resultado && <Cargando texto="Cargando vehículos…" />}

      {resultado && (
        <div className={cargando ? 'space-y-4 opacity-60' : 'space-y-4'} aria-busy={cargando}>
          {resultado.items.length === 0 ? (
            <MensajeEstado
              titulo={hayFiltros ? 'Sin resultados' : 'Aún no hay vehículos'}
              descripcion={
                hayFiltros
                  ? 'Ningún vehículo coincide con los filtros aplicados.'
                  : puedeEditar
                    ? 'Registre el primer vehículo de este proyecto.'
                    : 'Este proyecto todavía no tiene vehículos registrados.'
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
              <ListaVehiculos
                vehiculos={resultado.items}
                proyectoId={proyecto.id}
                puedeEditar={puedeEditar}
                puedeCambiarEstado={puedeCambiarEstado}
                onDesactivar={(vehiculo) => {
                  setAviso(null)
                  setPendiente({ vehiculo, accion: 'desactivar' })
                }}
                onReactivar={(vehiculo) => {
                  setAviso(null)
                  setPendiente({ vehiculo, accion: 'reactivar' })
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
        titulo={pendiente?.accion === 'desactivar' ? 'Desactivar vehículo' : 'Reactivar vehículo'}
        mensaje={
          pendiente
            ? pendiente.accion === 'desactivar'
              ? `¿Desea desactivar el vehículo ${pendiente.vehiculo.patente}? Podrá reactivarlo más adelante.`
              : `¿Desea reactivar el vehículo ${pendiente.vehiculo.patente}?`
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

export function PaginaVehiculos() {
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

  return <ContenidoVehiculos key={proyecto.id} proyecto={proyecto} />
}
