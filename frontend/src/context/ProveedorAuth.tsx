import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Usuario } from '../interface/usuario.interface'
import * as authService from '../services/auth.service'
import { registrarManejadorNoAutorizado } from '../services/cliente'
import { borrarToken, guardarToken, obtenerToken } from '../services/sesion'
import { ContextoAuth, type ValorContextoAuth } from './ContextoAuth'

export function ProveedorAuth({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState<boolean>(() => obtenerToken() !== null)

  const cerrarSesion = useCallback(() => {
    borrarToken()
    setUsuario(null)
  }, [])

  // Any 401 from the API drops the session; ProtectedRoute then redirects to /login
  useEffect(() => {
    registrarManejadorNoAutorizado(cerrarSesion)
    return () => registrarManejadorNoAutorizado(null)
  }, [cerrarSesion])

  // Restore the session after a reload
  useEffect(() => {
    if (obtenerToken() === null) return
    const controlador = new AbortController()
    authService
      .obtenerPerfil(controlador.signal)
      .then(setUsuario)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        cerrarSesion()
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })
    return () => controlador.abort()
  }, [cerrarSesion])

  const iniciarSesion = useCallback(async (rut: string, contrasena: string) => {
    const respuesta = await authService.iniciarSesion({ rut, contrasena })
    guardarToken(respuesta.token)
    setUsuario(respuesta.usuario)
  }, [])

  const valor = useMemo<ValorContextoAuth>(
    () => ({ usuario, cargando, iniciarSesion, cerrarSesion }),
    [usuario, cargando, iniciarSesion, cerrarSesion],
  )

  return <ContextoAuth value={valor}>{children}</ContextoAuth>
}
