import { useCallback, useEffect, useState } from 'react'
import type { FiltrosProyecto, ResultadoListadoProyecto } from '../interface/proyecto.interface'
import { mensajeDeError } from '../interface/error.interface'
import { listarProyectos } from '../services/proyecto.service'

interface EstadoListado {
  resultado: ResultadoListadoProyecto | null
  cargando: boolean
  error: string | null
}

export function useProyectos(filtros: FiltrosProyecto) {
  const { estado, busqueda, pagina, limite } = filtros
  const [listado, setListado] = useState<EstadoListado>({
    resultado: null,
    cargando: true,
    error: null,
  })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const controlador = new AbortController()
    setListado((previo) => ({ ...previo, cargando: true, error: null }))
    listarProyectos({ estado, busqueda, pagina, limite }, controlador.signal)
      .then((resultado) => setListado({ resultado, cargando: false, error: null }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setListado((previo) => ({ ...previo, cargando: false, error: mensajeDeError(error) }))
      })
    return () => controlador.abort()
  }, [estado, busqueda, pagina, limite, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  return { ...listado, recargar }
}
