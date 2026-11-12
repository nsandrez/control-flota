import { useCallback, useEffect, useState } from 'react'
import type { FiltrosConductor, ResultadoListadoConductor } from '../interface/conductor.interface'
import { mensajeDeError } from '../interface/error.interface'
import { listarConductores } from '../services/conductor.service'

interface EstadoListado {
  resultado: ResultadoListadoConductor | null
  cargando: boolean
  error: string | null
}

export function useConductores(proyectoId: number, filtros: FiltrosConductor) {
  const { activo, busqueda, pagina, limite } = filtros
  const [listado, setListado] = useState<EstadoListado>({
    resultado: null,
    cargando: true,
    error: null,
  })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const controlador = new AbortController()
    // Flags the refetch (filters/page changed) while keeping the previous results on screen
    // oxlint-disable-next-line react/set-state-in-effect
    setListado((previo) => ({ ...previo, cargando: true, error: null }))
    listarConductores(proyectoId, { activo, busqueda, pagina, limite }, controlador.signal)
      .then((resultado) => setListado({ resultado, cargando: false, error: null }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setListado((previo) => ({ ...previo, cargando: false, error: mensajeDeError(error) }))
      })
    return () => controlador.abort()
  }, [proyectoId, activo, busqueda, pagina, limite, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  return { ...listado, recargar }
}
