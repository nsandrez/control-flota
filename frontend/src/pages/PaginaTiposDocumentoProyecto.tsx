import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Alerta } from '../components/atoms/Alerta'
import { Boton } from '../components/atoms/Boton'
import { Cargando } from '../components/atoms/Cargando'
import { MensajeEstado } from '../components/molecules/MensajeEstado'
import { NavegacionProyecto } from '../components/molecules/NavegacionProyecto'
import { DialogoConfirmacion } from '../components/organisms/DialogoConfirmacion'
import { FormularioAsignarTipoDocumento } from '../components/organisms/FormularioAsignarTipoDocumento'
import { ListaTiposDocumentoProyecto } from '../components/organisms/ListaTiposDocumentoProyecto'
import { useAuth } from '../hooks/useAuth'
import { useProyecto } from '../hooks/useProyecto'
import { useTiposDocumento } from '../hooks/useTiposDocumento'
import { useTiposDocumentoProyecto } from '../hooks/useTiposDocumentoProyecto'
import { mensajeDeError } from '../interface/error.interface'
import type { Proyecto } from '../interface/proyecto.interface'
import type { ProyectoTipoDocumento } from '../interface/proyectoTipoDocumento.interface'
import type { AplicaA } from '../interface/tipoDocumento.interface'
import {
  actualizarObligatorioTipoDocumento,
  asignarTipoDocumento,
  desasignarTipoDocumento,
} from '../services/proyectoTipoDocumento.service'

// The backend caps a page at 100 items. If the catalog ever grows past that, the selector only
// offers the first 100 active types (a notice is shown); add server-side search before then.
const LIMITE_CATALOGO = 100

const GRUPOS: Array<{ aplicaA: AplicaA; titulo: string }> = [
  { aplicaA: 'VEHICULO', titulo: 'Documentos de vehículos' },
  { aplicaA: 'CONDUCTOR', titulo: 'Documentos de conductores' },
]

function EnlaceVolver() {
  return (
    <Link to="/proyectos" className="text-sm text-blue-700 underline dark:text-blue-300">
      ← Volver a proyectos
    </Link>
  )
}

interface PropsPanelAsignar {
  proyectoId: number
  asignaciones: ProyectoTipoDocumento[]
  onAsignado: (asignacion: ProyectoTipoDocumento) => void
}

// Only mounted for ADMIN on an active project, so other roles never load the catalog
function PanelAsignar({ proyectoId, asignaciones, onAsignado }: PropsPanelAsignar) {
  const { resultado, cargando, error, recargar } = useTiposDocumento({
    activo: true,
    pagina: 1,
    limite: LIMITE_CATALOGO,
  })
  const [enviando, setEnviando] = useState(false)
  const [errorServidor, setErrorServidor] = useState<string | null>(null)

  async function asignar(tipoDocumentoId: number, obligatorio: boolean): Promise<boolean> {
    setEnviando(true)
    setErrorServidor(null)
    try {
      const asignacion = await asignarTipoDocumento(proyectoId, { tipoDocumentoId, obligatorio })
      onAsignado(asignacion)
      return true
    } catch (e) {
      setErrorServidor(mensajeDeError(e))
      return false
    } finally {
      setEnviando(false)
    }
  }

  if (error) {
    return (
      <div className="space-y-3">
        <Alerta variante="error">{error}</Alerta>
        <Boton variante="secundario" onClick={recargar}>
          Reintentar
        </Boton>
      </div>
    )
  }
  if (!resultado) return cargando ? <Cargando texto="Cargando catálogo…" /> : null

  const asignados = new Set(asignaciones.map((a) => a.tipoDocumentoId))
  const disponibles = resultado.items.filter((tipo) => !asignados.has(tipo.id))

  return (
    <div className="space-y-3">
      <FormularioAsignarTipoDocumento
        disponibles={disponibles}
        enviando={enviando}
        errorServidor={errorServidor}
        onAsignar={asignar}
      />
      {resultado.total > resultado.items.length && (
        <Alerta variante="info">
          El catálogo tiene más de {LIMITE_CATALOGO} tipos activos: solo se ofrecen los primeros{' '}
          {LIMITE_CATALOGO}.
        </Alerta>
      )}
    </div>
  )
}

interface PropsContenido {
  proyecto: Proyecto
}

function ContenidoTiposDocumentoProyecto({ proyecto }: PropsContenido) {
  const { usuario } = useAuth()
  // Inactive projects can be read but not modified (the backend answers 409 to writes)
  const puedeEditar = usuario?.rol === 'ADMIN' && proyecto.estado === 'ACTIVO'

  const { asignaciones, cargando, error, recargar } = useTiposDocumentoProyecto(proyecto.id)

  const [aviso, setAviso] = useState<string | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [procesandoId, setProcesandoId] = useState<number | null>(null)
  const [aQuitar, setAQuitar] = useState<ProyectoTipoDocumento | null>(null)
  const [quitando, setQuitando] = useState(false)
  const [errorQuitar, setErrorQuitar] = useState<string | null>(null)

  async function cambiarObligatorio(asignacion: ProyectoTipoDocumento, obligatorio: boolean) {
    setProcesandoId(asignacion.tipoDocumentoId)
    setAviso(null)
    setErrorAccion(null)
    try {
      await actualizarObligatorioTipoDocumento(proyecto.id, asignacion.tipoDocumentoId, obligatorio)
      setAviso(
        `«${asignacion.tipoDocumento.nombre}» ahora es ${obligatorio ? 'obligatorio' : 'opcional'}.`,
      )
      recargar()
    } catch (e) {
      setErrorAccion(mensajeDeError(e))
    } finally {
      setProcesandoId(null)
    }
  }

  async function confirmarQuitar() {
    if (!aQuitar) return
    setQuitando(true)
    setErrorQuitar(null)
    try {
      await desasignarTipoDocumento(proyecto.id, aQuitar.tipoDocumentoId)
      setAviso(`Se quitó «${aQuitar.tipoDocumento.nombre}» de los documentos requeridos.`)
      setAQuitar(null)
      recargar()
    } catch (e) {
      // e.g. 409: documents of this type already exist in the project
      setErrorQuitar(mensajeDeError(e))
    } finally {
      setQuitando(false)
    }
  }

  function cerrarDialogo() {
    setAQuitar(null)
    setErrorQuitar(null)
  }

  return (
    <div className="space-y-5">
      <div>
        <EnlaceVolver />
        <div className="mt-2">
          <h1 className="text-2xl font-bold">Documentos requeridos</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Proyecto: <span className="font-medium break-words">{proyecto.nombre}</span>
          </p>
        </div>
      </div>

      <NavegacionProyecto proyectoId={proyecto.id} />

      {proyecto.estado !== 'ACTIVO' && (
        <Alerta variante="info">
          El proyecto está inactivo: puede consultar los documentos requeridos, pero no agregar,
          quitar ni modificar ninguno.
        </Alerta>
      )}

      {puedeEditar && asignaciones && (
        <PanelAsignar
          proyectoId={proyecto.id}
          asignaciones={asignaciones}
          onAsignado={(asignacion) => {
            setErrorAccion(null)
            setAviso(`Se agregó «${asignacion.tipoDocumento.nombre}» a los documentos requeridos.`)
            recargar()
          }}
        />
      )}

      {aviso && <Alerta variante="exito">{aviso}</Alerta>}
      {errorAccion && <Alerta variante="error">{errorAccion}</Alerta>}

      {error && (
        <div className="space-y-3">
          <Alerta variante="error">{error}</Alerta>
          <Boton variante="secundario" onClick={recargar}>
            Reintentar
          </Boton>
        </div>
      )}

      {!error && cargando && !asignaciones && (
        <Cargando texto="Cargando documentos requeridos…" />
      )}

      {asignaciones &&
        (asignaciones.length === 0 ? (
          <MensajeEstado
            titulo="Aún no hay documentos requeridos"
            descripcion={
              puedeEditar
                ? 'Agregue los tipos de documento que se exigirán en este proyecto.'
                : 'Este proyecto todavía no tiene tipos de documento asignados.'
            }
          />
        ) : (
          <div className={cargando ? 'space-y-6 opacity-60' : 'space-y-6'} aria-busy={cargando}>
            {GRUPOS.map(({ aplicaA, titulo }) => {
              const delGrupo = asignaciones.filter((a) => a.tipoDocumento.aplicaA === aplicaA)
              if (delGrupo.length === 0) return null
              return (
                <section key={aplicaA} aria-labelledby={`grupo-${aplicaA}`} className="space-y-3">
                  <h2 id={`grupo-${aplicaA}`} className="text-lg font-semibold">
                    {titulo}
                  </h2>
                  <ListaTiposDocumentoProyecto
                    asignaciones={delGrupo}
                    puedeEditar={puedeEditar}
                    procesandoId={procesandoId}
                    onCambiarObligatorio={cambiarObligatorio}
                    onQuitar={(asignacion) => {
                      setAviso(null)
                      setErrorAccion(null)
                      setAQuitar(asignacion)
                    }}
                  />
                </section>
              )
            })}
          </div>
        ))}

      <DialogoConfirmacion
        abierto={aQuitar !== null}
        titulo="Quitar tipo de documento"
        mensaje={
          aQuitar
            ? `¿Desea quitar «${aQuitar.tipoDocumento.nombre}» de los documentos requeridos del proyecto? Podrá volver a agregarlo más adelante.`
            : ''
        }
        textoConfirmar="Quitar"
        peligro
        procesando={quitando}
        error={errorQuitar}
        onConfirmar={confirmarQuitar}
        onCancelar={cerrarDialogo}
      />
    </div>
  )
}

export function PaginaTiposDocumentoProyecto() {
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

  return <ContenidoTiposDocumentoProyecto key={proyecto.id} proyecto={proyecto} />
}
