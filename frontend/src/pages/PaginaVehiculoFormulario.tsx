import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Alerta } from '../components/atoms/Alerta'
import { Cargando } from '../components/atoms/Cargando'
import { MensajeEstado } from '../components/molecules/MensajeEstado'
import { FormularioVehiculo } from '../components/organisms/FormularioVehiculo'
import { useProyecto } from '../hooks/useProyecto'
import { mensajeDeError } from '../interface/error.interface'
import type { Vehiculo } from '../interface/vehiculo.interface'
import { actualizarVehiculo, crearVehiculo, obtenerVehiculo } from '../services/vehiculo.service'
import { normalizarPatente, type ValoresFormularioVehiculo } from '../utils/validacionVehiculo'

const VALORES_VACIOS: ValoresFormularioVehiculo = { patente: '', marca: '', modelo: '', anio: '' }

function aValores(vehiculo: Vehiculo): ValoresFormularioVehiculo {
  return {
    patente: vehiculo.patente,
    marca: vehiculo.marca ?? '',
    modelo: vehiculo.modelo ?? '',
    anio: vehiculo.anio === null ? '' : String(vehiculo.anio),
  }
}

export function PaginaVehiculoFormulario() {
  const { proyectoId: proyectoCrudo, id: idCrudo } = useParams()
  const navegar = useNavigate()
  const proyectoId = Number(proyectoCrudo)
  const id = idCrudo === undefined ? null : Number(idCrudo)
  const edicion = id !== null
  const idValido = id === null || (Number.isInteger(id) && id >= 1)

  const proyectoCargado = useProyecto(proyectoId)
  const { proyecto } = proyectoCargado

  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null)
  const [cargando, setCargando] = useState(edicion && idValido)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [errorServidor, setErrorServidor] = useState<string | null>(null)

  const proyectoListo = proyecto !== null
  useEffect(() => {
    if (id === null || !idValido || !proyectoListo) return
    const controlador = new AbortController()
    obtenerVehiculo(proyectoId, id, controlador.signal)
      .then((encontrado) => {
        setVehiculo(encontrado)
        setCargando(false)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setErrorCarga(mensajeDeError(error))
        setCargando(false)
      })
    return () => controlador.abort()
  }, [proyectoId, id, idValido, proyectoListo])

  const rutaLista = `/proyectos/${proyectoId}/vehiculos`

  async function guardar(valores: ValoresFormularioVehiculo) {
    setEnviando(true)
    setErrorServidor(null)
    const anio = valores.anio.trim()
    const datos = {
      patente: normalizarPatente(valores.patente),
      marca: valores.marca.trim() || null,
      modelo: valores.modelo.trim() || null,
      anio: anio ? Number(anio) : null,
    }
    try {
      if (id === null) await crearVehiculo(proyectoId, datos)
      else await actualizarVehiculo(proyectoId, id, datos)
      navegar(rutaLista, {
        state: {
          aviso: `Vehículo ${datos.patente} ${edicion ? 'actualizado' : 'creado'}.`,
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
      {proyectoCargado.noEncontrado ? '← Volver a proyectos' : '← Volver a vehículos'}
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
          El proyecto «{proyecto.nombre}» está inactivo: no es posible crear ni editar vehículos.
        </Alerta>
      )
    }
    if (!idValido) {
      return <MensajeEstado titulo="Vehículo no encontrado" descripcion="El identificador no es válido." />
    }
    if (cargando) return <Cargando texto="Cargando vehículo…" />
    if (errorCarga) return <Alerta variante="error">{errorCarga}</Alerta>
    if (edicion && vehiculo && !vehiculo.activo) {
      return (
        <Alerta variante="info">
          El vehículo {vehiculo.patente} está inactivo: reactívelo desde el listado para poder editarlo.
        </Alerta>
      )
    }
    if (edicion && !vehiculo) return null
    return (
      <FormularioVehiculo
        valoresIniciales={vehiculo ? aValores(vehiculo) : VALORES_VACIOS}
        textoEnvio={edicion ? 'Guardar cambios' : 'Crear vehículo'}
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
        <h1 className="mt-2 text-2xl font-bold">{edicion ? 'Editar vehículo' : 'Nuevo vehículo'}</h1>
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
