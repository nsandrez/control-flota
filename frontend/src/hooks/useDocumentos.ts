import { useCallback, useEffect, useState } from 'react'
import type {
  FiltrosDocumento,
  ResultadoListadoDocumento,
  TitularDocumento,
} from '../interface/documento.interface'
import { mensajeDeError } from '../interface/error.interface'
import { listarDocumentos } from '../services/documento.service'

interface EstadoListado {
  resultado: ResultadoListadoDocumento | null
  cargando: boolean
  error: string | null
}

export function useDocumentos(
  tipoTitular: TitularDocumento,
  proyectoId: number,
  titularId: number,
  filtros: FiltrosDocumento,
) {
  const { tipoDocumentoId, estado, pagina, limite } = filtros
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
    listarDocumentos(
      tipoTitular,
      proyectoId,
      titularId,
      { tipoDocumentoId, estado, pagina, limite },
      controlador.signal,
    )
      .then((resultado) => setListado({ resultado, cargando: false, error: null }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setListado((previo) => ({ ...previo, cargando: false, error: mensajeDeError(error) }))
      })
    return () => controlador.abort()
  }, [tipoTitular, proyectoId, titularId, tipoDocumentoId, estado, pagina, limite, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  return { ...listado, recargar }
}
