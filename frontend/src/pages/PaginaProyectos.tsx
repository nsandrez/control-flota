import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Alerta } from '../components/atoms/Alerta'
import { Boton } from '../components/atoms/Boton'
import { Cargando } from '../components/atoms/Cargando'
import { MensajeEstado } from '../components/molecules/MensajeEstado'
import { Paginacion } from '../components/molecules/Paginacion'
import { DialogoConfirmacion } from '../components/organisms/DialogoConfirmacion'
import { FiltrosProyectos } from '../components/organisms/FiltrosProyectos'
import { ListaProyectos } from '../components/organisms/ListaProyectos'
import { useAuth } from '../hooks/useAuth'
import { useProyectos } from '../hooks/useProyectos'
import { useRetardo } from '../hooks/useRetardo'
import { mensajeDeError } from '../interface/error.interface'
import type { EstadoProyecto, Proyecto } from '../interface/proyecto.interface'
import { desactivarProyecto, reactivarProyecto } from '../services/proyecto.service'

const LIMITE = 10

type AccionEstado = 'desactivar' | 'reactivar'

interface Pendiente {
  proyecto: Proyecto
  accion: AccionEstado
}

function leerEstado(valor: string | null): EstadoProyecto | '' {
  return valor === 'ACTIVO' || valor === 'INACTIVO' ? valor : ''
}

function leerPagina(valor: string | null): number {
  const numero = Number(valor)
  return Number.isInteger(numero) && numero >= 1 ? numero : 1
}

export function PaginaProyectos() {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'ADMIN'

  // Filters live in the URL: shareable, and preserved when coming back from the form
  const [parametros, setParametros] = useSearchParams()
  const busquedaUrl = parametros.get('busqueda') ?? ''
  const estado = leerEstado(parametros.get('estado'))
  const pagina = leerPagina(parametros.get('pagina'))

  const [textoBusqueda, setTextoBusqueda] = useState(busquedaUrl)
  const busquedaRetardada = useRetardo(textoBusqueda.trim(), 400)

  const { resultado, cargando, error, recargar } = useProyectos({
    estado: estado || undefined,
    busqueda: busquedaUrl || undefined,
    pagina,
    limite: LIMITE,
  })

  const [pendiente, setPendiente] = useState<Pendiente | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

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
      setParametros(
        (previos) => {
          const siguientes = new URLSearchParams(previos)
          if (busquedaRetardada) siguientes.set('busqueda', busquedaRetardada)
          else siguientes.delete('busqueda')
          siguientes.delete('pagina')
          return siguientes
        },
        { replace: true },
      )
    }
    // Only react to the debounced value, not to URL changes made elsewhere
  }, [busquedaRetardada])

  // If the current page no longer exists (e.g. last item removed from a filtered list), go back
  useEffect(() => {
    if (resultado && resultado.items.length === 0 && pagina > 1) {
      const ultima = Math.max(1, Math.ceil(resultado.total / LIMITE))
      actualizarParametros({ pagina: ultima > 1 ? String(ultima) : '' }, false)
    }
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
      const { proyecto, accion } = pendiente
      if (accion === 'desactivar') await desactivarProyecto(proyecto.id)
      else await reactivarProyecto(proyecto.id)
      setAviso(`Proyecto «${proyecto.nombre}» ${accion === 'desactivar' ? 'desactivado' : 'reactivado'}.`)
      setPendiente(null)
      recargar()
    } catch (e) {
      setErrorAccion(mensajeDeError(e))
    } finally {
      setProcesando(false)
    }
  }

  const hayFiltros = Boolean(busquedaUrl || estado)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Proyectos</h1>
        {esAdmin && (
          <Link
            to="/proyectos/nuevo"
            className="inline-flex min-h-10 items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Nuevo proyecto
          </Link>
        )}
      </div>

      <FiltrosProyectos
        busqueda={textoBusqueda}
        estado={estado}
        onBusquedaChange={setTextoBusqueda}
        onEstadoChange={(valor) => actualizarParametros({ estado: valor }, true)}
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

      {!error && cargando && !resultado && <Cargando texto="Cargando proyectos…" />}

      {resultado && (
        <div className={cargando ? 'space-y-4 opacity-60' : 'space-y-4'} aria-busy={cargando}>
          {resultado.items.length === 0 ? (
            <MensajeEstado
              titulo={hayFiltros ? 'Sin resultados' : 'Aún no hay proyectos'}
              descripcion={
                hayFiltros
                  ? 'Ningún proyecto coincide con los filtros aplicados.'
                  : esAdmin
                    ? 'Cree el primer proyecto para comenzar.'
                    : 'Todavía no se ha registrado ningún proyecto.'
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
              <ListaProyectos
                proyectos={resultado.items}
                puedeEditar={esAdmin}
                onDesactivar={(proyecto) => {
                  setAviso(null)
                  setPendiente({ proyecto, accion: 'desactivar' })
                }}
                onReactivar={(proyecto) => {
                  setAviso(null)
                  setPendiente({ proyecto, accion: 'reactivar' })
                }}
              />
              <Paginacion
                pagina={resultado.pagina}
                limite={resultado.limite}
                total={resultado.total}
                onCambiar={(nueva) => actualizarParametros({ pagina: nueva > 1 ? String(nueva) : '' }, false)}
              />
            </>
          )}
        </div>
      )}

      <DialogoConfirmacion
        abierto={pendiente !== null}
        titulo={pendiente?.accion === 'desactivar' ? 'Desactivar proyecto' : 'Reactivar proyecto'}
        mensaje={
          pendiente
            ? pendiente.accion === 'desactivar'
              ? `¿Desea desactivar el proyecto «${pendiente.proyecto.nombre}»? Podrá reactivarlo más adelante.`
              : `¿Desea reactivar el proyecto «${pendiente.proyecto.nombre}»?`
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
