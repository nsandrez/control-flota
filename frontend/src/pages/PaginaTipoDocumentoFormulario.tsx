import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Alerta } from '../components/atoms/Alerta'
import { Cargando } from '../components/atoms/Cargando'
import { MensajeEstado } from '../components/molecules/MensajeEstado'
import { FormularioTipoDocumento } from '../components/organisms/FormularioTipoDocumento'
import { mensajeDeError } from '../interface/error.interface'
import type { TipoDocumento } from '../interface/tipoDocumento.interface'
import {
  actualizarTipoDocumento,
  crearTipoDocumento,
  obtenerTipoDocumento,
} from '../services/tipoDocumento.service'
import type { ValoresFormularioTipoDocumento } from '../utils/validacionTipoDocumento'

const RUTA_LISTA = '/tipos-documento'

const VALORES_VACIOS: ValoresFormularioTipoDocumento = {
  nombre: '',
  descripcion: '',
  aplicaA: '',
  requiereVencimiento: false,
}

function aValores(tipo: TipoDocumento): ValoresFormularioTipoDocumento {
  return {
    nombre: tipo.nombre,
    descripcion: tipo.descripcion ?? '',
    aplicaA: tipo.aplicaA,
    requiereVencimiento: tipo.requiereVencimiento,
  }
}

export function PaginaTipoDocumentoFormulario() {
  const { id: idCrudo } = useParams()
  const navegar = useNavigate()
  const id = idCrudo === undefined ? null : Number(idCrudo)
  const edicion = id !== null
  const idValido = id === null || (Number.isInteger(id) && id >= 1)

  const [tipo, setTipo] = useState<TipoDocumento | null>(null)
  const [cargando, setCargando] = useState(edicion && idValido)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [errorServidor, setErrorServidor] = useState<string | null>(null)

  useEffect(() => {
    if (id === null || !idValido) return
    const controlador = new AbortController()
    obtenerTipoDocumento(id, controlador.signal)
      .then((encontrado) => {
        setTipo(encontrado)
        setCargando(false)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setErrorCarga(mensajeDeError(error))
        setCargando(false)
      })
    return () => controlador.abort()
  }, [id, idValido])

  async function guardar(valores: ValoresFormularioTipoDocumento) {
    if (valores.aplicaA === '') return
    setEnviando(true)
    setErrorServidor(null)
    const datos = {
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim() || null,
      aplicaA: valores.aplicaA,
      requiereVencimiento: valores.requiereVencimiento,
    }
    try {
      if (id === null) await crearTipoDocumento(datos)
      else await actualizarTipoDocumento(id, datos)
      navegar(RUTA_LISTA, {
        state: {
          aviso: `Tipo de documento «${datos.nombre}» ${edicion ? 'actualizado' : 'creado'}.`,
        },
      })
    } catch (e) {
      // Includes the 409 that says "aplicaA" can no longer change: shown as-is
      setErrorServidor(mensajeDeError(e))
      setEnviando(false)
    }
  }

  function contenido() {
    if (!idValido) {
      return (
        <MensajeEstado
          titulo="Tipo de documento no encontrado"
          descripcion="El identificador no es válido."
        />
      )
    }
    if (cargando) return <Cargando texto="Cargando tipo de documento…" />
    if (errorCarga) return <Alerta variante="error">{errorCarga}</Alerta>
    if (edicion && !tipo) return null
    return (
      <FormularioTipoDocumento
        valoresIniciales={tipo ? aValores(tipo) : VALORES_VACIOS}
        textoEnvio={edicion ? 'Guardar cambios' : 'Crear tipo de documento'}
        enviando={enviando}
        errorServidor={errorServidor}
        onEnviar={guardar}
        onCancelar={() => navegar(RUTA_LISTA)}
      />
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link to={RUTA_LISTA} className="text-sm text-blue-700 underline dark:text-blue-300">
          ← Volver a tipos de documento
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          {edicion ? 'Editar tipo de documento' : 'Nuevo tipo de documento'}
        </h1>
      </div>
      {contenido()}
    </div>
  )
}
