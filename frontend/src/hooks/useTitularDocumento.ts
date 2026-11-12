import { useEffect, useState } from 'react'
import type { TitularDocumento } from '../interface/documento.interface'
import { ErrorApi, mensajeDeError } from '../interface/error.interface'
import { obtenerConductor } from '../services/conductor.service'
import { obtenerVehiculo } from '../services/vehiculo.service'

// What the documents page needs to know about the owner (vehicle or driver)
export interface ResumenTitular {
  titulo: string
  detalle: string
  activo: boolean
}

interface EstadoTitular {
  titular: ResumenTitular | null
  cargando: boolean
  error: string | null
  noEncontrado: boolean
}

async function cargarResumen(
  tipoTitular: TitularDocumento,
  proyectoId: number,
  titularId: number,
  senal: AbortSignal,
): Promise<ResumenTitular> {
  if (tipoTitular === 'VEHICULO') {
    const vehiculo = await obtenerVehiculo(proyectoId, titularId, senal)
    const descripcion = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ')
    return {
      titulo: vehiculo.patente,
      detalle: [descripcion, vehiculo.anio].filter(Boolean).join(' · '),
      activo: vehiculo.activo,
    }
  }
  const conductor = await obtenerConductor(proyectoId, titularId, senal)
  return {
    titulo: conductor.nombre,
    detalle: `Documento de identidad: ${conductor.documentoIdentidad}`,
    activo: conductor.activo,
  }
}

// Loads the owner of the documents. An invalid id or a 404 is reported as `noEncontrado`.
export function useTitularDocumento(
  tipoTitular: TitularDocumento,
  proyectoId: number,
  titularId: number,
) {
  const idValido = Number.isInteger(titularId) && titularId >= 1
  const [estado, setEstado] = useState<EstadoTitular>({
    titular: null,
    cargando: idValido,
    error: null,
    noEncontrado: !idValido,
  })

  useEffect(() => {
    if (!idValido) return
    const controlador = new AbortController()
    cargarResumen(tipoTitular, proyectoId, titularId, controlador.signal)
      .then((titular) => setEstado({ titular, cargando: false, error: null, noEncontrado: false }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setEstado({
          titular: null,
          cargando: false,
          error: mensajeDeError(error),
          noEncontrado: error instanceof ErrorApi && error.estado === 404,
        })
      })
    return () => controlador.abort()
  }, [tipoTitular, proyectoId, titularId, idValido])

  return idValido ? estado : { titular: null, cargando: false, error: null, noEncontrado: true }
}
