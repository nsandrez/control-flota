import { useEffect, useState } from 'react'
import { ErrorApi, mensajeDeError } from '../interface/error.interface'
import type { Proyecto } from '../interface/proyecto.interface'
import { obtenerProyecto } from '../services/proyecto.service'

interface EstadoProyecto {
  proyecto: Proyecto | null
  cargando: boolean
  error: string | null
  noEncontrado: boolean
}

// Loads one project. An invalid id or a 404 is reported as `noEncontrado`.
export function useProyecto(id: number) {
  const idValido = Number.isInteger(id) && id >= 1
  const [estado, setEstado] = useState<EstadoProyecto>({
    proyecto: null,
    cargando: idValido,
    error: null,
    noEncontrado: !idValido,
  })

  useEffect(() => {
    if (!idValido) return
    const controlador = new AbortController()
    obtenerProyecto(id, controlador.signal)
      .then((proyecto) => setEstado({ proyecto, cargando: false, error: null, noEncontrado: false }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setEstado({
          proyecto: null,
          cargando: false,
          error: mensajeDeError(error),
          noEncontrado: error instanceof ErrorApi && error.estado === 404,
        })
      })
    return () => controlador.abort()
  }, [id, idValido])

  return idValido ? estado : { proyecto: null, cargando: false, error: null, noEncontrado: true }
}
