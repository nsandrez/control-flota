import { useCallback, useEffect, useState } from 'react'
import { mensajeDeError } from '../interface/error.interface'
import type { ProyectoTipoDocumento } from '../interface/proyectoTipoDocumento.interface'
import { listarTiposDocumentoDeProyecto } from '../services/proyectoTipoDocumento.service'

interface EstadoAsignaciones {
  asignaciones: ProyectoTipoDocumento[] | null
  cargando: boolean
  error: string | null
}

// Document types assigned to one project (not paginated)
export function useTiposDocumentoProyecto(proyectoId: number) {
  const [estado, setEstado] = useState<EstadoAsignaciones>({
    asignaciones: null,
    cargando: true,
    error: null,
  })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const controlador = new AbortController()
    // oxlint-disable-next-line react/set-state-in-effect
    setEstado((previo) => ({ ...previo, cargando: true, error: null }))
    listarTiposDocumentoDeProyecto(proyectoId, controlador.signal)
      .then((asignaciones) => setEstado({ asignaciones, cargando: false, error: null }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setEstado((previo) => ({ ...previo, cargando: false, error: mensajeDeError(error) }))
      })
    return () => controlador.abort()
  }, [proyectoId, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  return { ...estado, recargar }
}
