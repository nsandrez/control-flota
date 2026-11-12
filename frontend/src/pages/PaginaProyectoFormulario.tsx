import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Alerta } from '../components/atoms/Alerta'
import { Cargando } from '../components/atoms/Cargando'
import { MensajeEstado } from '../components/molecules/MensajeEstado'
import { FormularioProyecto } from '../components/organisms/FormularioProyecto'
import { mensajeDeError } from '../interface/error.interface'
import type { Proyecto } from '../interface/proyecto.interface'
import {
  actualizarProyecto,
  crearProyecto,
  obtenerProyecto,
} from '../services/proyecto.service'
import { aValorFecha } from '../utils/fechas'
import type { ValoresFormularioProyecto } from '../utils/validacionProyecto'

const VALORES_VACIOS: ValoresFormularioProyecto = {
  nombre: '',
  descripcion: '',
  fechaInicio: '',
  fechaFin: '',
}

function aValores(proyecto: Proyecto): ValoresFormularioProyecto {
  return {
    nombre: proyecto.nombre,
    descripcion: proyecto.descripcion ?? '',
    fechaInicio: aValorFecha(proyecto.fechaInicio),
    fechaFin: aValorFecha(proyecto.fechaFin),
  }
}

export function PaginaProyectoFormulario() {
  const { id: idCrudo } = useParams()
  const navegar = useNavigate()
  const id = idCrudo === undefined ? null : Number(idCrudo)
  const edicion = id !== null
  const idValido = id === null || (Number.isInteger(id) && id >= 1)

  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [cargando, setCargando] = useState(edicion && idValido)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [errorServidor, setErrorServidor] = useState<string | null>(null)

  useEffect(() => {
    if (id === null || !idValido) return
    const controlador = new AbortController()
    obtenerProyecto(id, controlador.signal)
      .then((encontrado) => {
        setProyecto(encontrado)
        setCargando(false)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setErrorCarga(mensajeDeError(error))
        setCargando(false)
      })
    return () => controlador.abort()
  }, [id, idValido])

  async function guardar(valores: ValoresFormularioProyecto) {
    setEnviando(true)
    setErrorServidor(null)
    const datos = {
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim() || null,
      fechaInicio: valores.fechaInicio || null,
      fechaFin: valores.fechaFin || null,
    }
    try {
      if (id === null) await crearProyecto(datos)
      else await actualizarProyecto(id, datos)
      navegar('/proyectos')
    } catch (e) {
      setErrorServidor(mensajeDeError(e))
      setEnviando(false)
    }
  }

  const volver = () => navegar('/proyectos')

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link to="/proyectos" className="text-sm text-blue-700 underline dark:text-blue-300">
          ← Volver a proyectos
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{edicion ? 'Editar proyecto' : 'Nuevo proyecto'}</h1>
      </div>

      {!idValido && (
        <MensajeEstado titulo="Proyecto no encontrado" descripcion="El identificador no es válido." />
      )}
      {idValido && cargando && <Cargando texto="Cargando proyecto…" />}
      {idValido && errorCarga && <Alerta variante="error">{errorCarga}</Alerta>}

      {idValido && !cargando && !errorCarga && (!edicion || proyecto) && (
        <FormularioProyecto
          valoresIniciales={proyecto ? aValores(proyecto) : VALORES_VACIOS}
          textoEnvio={edicion ? 'Guardar cambios' : 'Crear proyecto'}
          enviando={enviando}
          errorServidor={errorServidor}
          onEnviar={guardar}
          onCancelar={volver}
        />
      )}
    </div>
  )
}
