import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { Alerta } from '../components/atoms/Alerta'
import { Boton } from '../components/atoms/Boton'
import { Cargando } from '../components/atoms/Cargando'
import { MensajeEstado } from '../components/molecules/MensajeEstado'
import { Paginacion } from '../components/molecules/Paginacion'
import { DialogoConfirmacion } from '../components/organisms/DialogoConfirmacion'
import {
  FiltrosTiposDocumento,
  type FiltroAplicaA,
  type FiltroEstadoTipo,
} from '../components/organisms/FiltrosTiposDocumento'
import { ListaTiposDocumento } from '../components/organisms/ListaTiposDocumento'
import { useAuth } from '../hooks/useAuth'
import { useRetardo } from '../hooks/useRetardo'
import { useTiposDocumento } from '../hooks/useTiposDocumento'
import { mensajeDeError } from '../interface/error.interface'
import type { TipoDocumento } from '../interface/tipoDocumento.interface'
import {
  desactivarTipoDocumento,
  reactivarTipoDocumento,
} from '../services/tipoDocumento.service'

const LIMITE = 10

type AccionEstado = 'desactivar' | 'reactivar'

interface Pendiente {
  tipo: TipoDocumento
  accion: AccionEstado
}

function leerPagina(valor: string | null): number {
  const numero = Number(valor)
  return Number.isInteger(numero) && numero >= 1 ? numero : 1
}

function leerEstado(valor: string | null): FiltroEstadoTipo {
  return valor === 'inactivos' || valor === 'todos' ? valor : 'activos'
}

function leerAplicaA(valor: string | null): FiltroAplicaA {
  return valor === 'VEHICULO' || valor === 'CONDUCTOR' ? valor : ''
}

export function PaginaTiposDocumento() {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'ADMIN'

  // Success notice handed over by the form page after create/edit
  const ubicacion = useLocation()
  const avisoInicial = (ubicacion.state as { aviso?: string } | null)?.aviso ?? null

  // Filters live in the URL: shareable, and preserved when coming back from the form
  const [parametros, setParametros] = useSearchParams()
  const busquedaUrl = parametros.get('busqueda') ?? ''
  const estado = leerEstado(parametros.get('estado'))
  const aplicaA = leerAplicaA(parametros.get('aplicaA'))
  const pagina = leerPagina(parametros.get('pagina'))

  const [textoBusqueda, setTextoBusqueda] = useState(busquedaUrl)
  const busquedaRetardada = useRetardo(textoBusqueda.trim(), 400)

  const { resultado, cargando, error, recargar } = useTiposDocumento({
    aplicaA: aplicaA || undefined,
    activo: estado === 'todos' ? undefined : estado === 'activos',
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
      const { tipo, accion } = pendiente
      if (accion === 'desactivar') await desactivarTipoDocumento(tipo.id)
      else await reactivarTipoDocumento(tipo.id)
      setAviso(
        `Tipo de documento «${tipo.nombre}» ${accion === 'desactivar' ? 'desactivado' : 'reactivado'}.`,
      )
      setPendiente(null)
      recargar()
    } catch (e) {
      setErrorAccion(mensajeDeError(e))
    } finally {
      setProcesando(false)
    }
  }

  const hayFiltros = Boolean(busquedaUrl || aplicaA || estado !== 'activos')

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tipos de documento</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Catálogo de documentos que pueden exigirse a vehículos y conductores.
          </p>
        </div>
        {esAdmin && (
          <Link
            to="/tipos-documento/nuevo"
            className="inline-flex min-h-10 items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Nuevo tipo de documento
          </Link>
        )}
      </div>

      <FiltrosTiposDocumento
        busqueda={textoBusqueda}
        aplicaA={aplicaA}
        estado={estado}
        onBusquedaChange={setTextoBusqueda}
        onAplicaAChange={(valor) => actualizarParametros({ aplicaA: valor }, true)}
        onEstadoChange={(valor) =>
          actualizarParametros({ estado: valor === 'activos' ? '' : valor }, true)
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

      {!error && cargando && !resultado && <Cargando texto="Cargando tipos de documento…" />}

      {resultado && (
        <div className={cargando ? 'space-y-4 opacity-60' : 'space-y-4'} aria-busy={cargando}>
          {resultado.items.length === 0 ? (
            <MensajeEstado
              titulo={hayFiltros ? 'Sin resultados' : 'Aún no hay tipos de documento'}
              descripcion={
                hayFiltros
                  ? 'Ningún tipo de documento coincide con los filtros aplicados.'
                  : esAdmin
                    ? 'Cree el primer tipo de documento del catálogo.'
                    : 'Todavía no hay tipos de documento en el catálogo.'
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
              <ListaTiposDocumento
                tipos={resultado.items}
                puedeEditar={esAdmin}
                onDesactivar={(tipo) => {
                  setAviso(null)
                  setPendiente({ tipo, accion: 'desactivar' })
                }}
                onReactivar={(tipo) => {
                  setAviso(null)
                  setPendiente({ tipo, accion: 'reactivar' })
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
        titulo={
          pendiente?.accion === 'desactivar'
            ? 'Desactivar tipo de documento'
            : 'Reactivar tipo de documento'
        }
        mensaje={
          pendiente
            ? pendiente.accion === 'desactivar'
              ? `¿Desea desactivar el tipo de documento «${pendiente.tipo.nombre}»? Dejará de poder asignarse a proyectos, pero podrá reactivarlo más adelante.`
              : `¿Desea reactivar el tipo de documento «${pendiente.tipo.nombre}»?`
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
