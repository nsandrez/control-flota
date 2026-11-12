import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Alerta } from '../components/atoms/Alerta'
import { Cargando } from '../components/atoms/Cargando'
import { MensajeEstado } from '../components/molecules/MensajeEstado'
import { FormularioConductor } from '../components/organisms/FormularioConductor'
import { useProyecto } from '../hooks/useProyecto'
import type { Conductor } from '../interface/conductor.interface'
import { mensajeDeError } from '../interface/error.interface'
import {
  actualizarConductor,
  crearConductor,
  obtenerConductor,
} from '../services/conductor.service'
import {
  normalizarDocumento,
  type ValoresFormularioConductor,
} from '../utils/validacionConductor'

const VALORES_VACIOS: ValoresFormularioConductor = {
  nombre: '',
  documentoIdentidad: '',
  telefono: '',
}

function aValores(conductor: Conductor): ValoresFormularioConductor {
  return {
    nombre: conductor.nombre,
    documentoIdentidad: conductor.documentoIdentidad,
    telefono: conductor.telefono ?? '',
  }
}

export function PaginaConductorFormulario() {
  const { proyectoId: proyectoCrudo, id: idCrudo } = useParams()
  const navegar = useNavigate()
  const proyectoId = Number(proyectoCrudo)
  const id = idCrudo === undefined ? null : Number(idCrudo)
  const edicion = id !== null
  const idValido = id === null || (Number.isInteger(id) && id >= 1)

  const proyectoCargado = useProyecto(proyectoId)
  const { proyecto } = proyectoCargado

  const [conductor, setConductor] = useState<Conductor | null>(null)
  const [cargando, setCargando] = useState(edicion && idValido)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [errorServidor, setErrorServidor] = useState<string | null>(null)

  const proyectoListo = proyecto !== null
  useEffect(() => {
    if (id === null || !idValido || !proyectoListo) return
    const controlador = new AbortController()
    obtenerConductor(proyectoId, id, controlador.signal)
      .then((encontrado) => {
        setConductor(encontrado)
        setCargando(false)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setErrorCarga(mensajeDeError(error))
        setCargando(false)
      })
    return () => controlador.abort()
  }, [proyectoId, id, idValido, proyectoListo])

  const rutaLista = `/proyectos/${proyectoId}/conductores`

  async function guardar(valores: ValoresFormularioConductor) {
    setEnviando(true)
    setErrorServidor(null)
    // The backend normalizes the document too; telefono null clears it
    const datos = {
      nombre: valores.nombre.trim(),
      documentoIdentidad: normalizarDocumento(valores.documentoIdentidad),
      telefono: valores.telefono.trim() || null,
    }
    try {
      if (id === null) await crearConductor(proyectoId, datos)
      else await actualizarConductor(proyectoId, id, datos)
      navegar(rutaLista, {
        state: {
          aviso: `Conductor ${datos.nombre} ${edicion ? 'actualizado' : 'creado'}.`,
        },
      })
    } catch (e) {
      setErrorServidor(mensajeDeError(e))
      setEnviando(false)
    }
  }

  const volver = () => navegar(rutaLista)

  const enlaceVolver = (
    <Link
      to={proyectoCargado.noEncontrado ? '/proyectos' : rutaLista}
      className="text-sm text-blue-700 underline dark:text-blue-300"
    >
      {proyectoCargado.noEncontrado ? '← Volver a proyectos' : '← Volver a conductores'}
    </Link>
  )

  function contenido() {
    if (proyectoCargado.cargando) return <Cargando texto="Cargando proyecto…" />
    if (proyectoCargado.noEncontrado) {
      return (
        <MensajeEstado
          titulo="Proyecto no encontrado"
          descripcion="El proyecto solicitado no existe o ya no está disponible."
        />
      )
    }
    if (proyectoCargado.error || !proyecto) {
      return <Alerta variante="error">{proyectoCargado.error ?? 'No se pudo cargar el proyecto'}</Alerta>
    }
    if (proyecto.estado !== 'ACTIVO') {
      return (
        <Alerta variante="info">
          El proyecto «{proyecto.nombre}» está inactivo: no es posible crear ni editar conductores.
        </Alerta>
      )
    }
    if (!idValido) {
      return <MensajeEstado titulo="Conductor no encontrado" descripcion="El identificador no es válido." />
    }
    if (cargando) return <Cargando texto="Cargando conductor…" />
    if (errorCarga) return <Alerta variante="error">{errorCarga}</Alerta>
    if (edicion && conductor && !conductor.activo) {
      return (
        <Alerta variante="info">
          El conductor {conductor.nombre} está inactivo: reactívelo desde el listado para poder editarlo.
        </Alerta>
      )
    }
    if (edicion && !conductor) return null
    return (
      <FormularioConductor
        valoresIniciales={conductor ? aValores(conductor) : VALORES_VACIOS}
        textoEnvio={edicion ? 'Guardar cambios' : 'Crear conductor'}
        enviando={enviando}
        errorServidor={errorServidor}
        onEnviar={guardar}
        onCancelar={volver}
      />
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        {enlaceVolver}
        <h1 className="mt-2 text-2xl font-bold">{edicion ? 'Editar conductor' : 'Nuevo conductor'}</h1>
        {proyecto && (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Proyecto: <span className="font-medium break-words">{proyecto.nombre}</span>
          </p>
        )}
      </div>
      {contenido()}
    </div>
  )
}
