import { useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { FormularioLogin } from '../components/organisms/FormularioLogin'
import { PlantillaAutenticacion } from '../components/templates/PlantillaAutenticacion'
import { useAuth } from '../hooks/useAuth'
import { mensajeDeError } from '../interface/error.interface'

interface EstadoUbicacion {
  desde?: { pathname: string; search?: string }
}

export function PaginaLogin() {
  const { usuario, cargando, iniciarSesion } = useAuth()
  const ubicacion = useLocation()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!cargando && usuario) {
    const desde = (ubicacion.state as EstadoUbicacion | null)?.desde
    return <Navigate to={desde ? `${desde.pathname}${desde.search ?? ''}` : '/proyectos'} replace />
  }

  async function manejarEnvio(rut: string, contrasena: string) {
    setEnviando(true)
    setError(null)
    try {
      await iniciarSesion(rut, contrasena)
    } catch (e) {
      setError(mensajeDeError(e))
      setEnviando(false)
    }
  }

  return (
    <PlantillaAutenticacion titulo="Control de Flota" subtitulo="Ingrese con su cuenta para continuar">
      <FormularioLogin enviando={enviando} error={error} onEnviar={manejarEnvio} />
    </PlantillaAutenticacion>
  )
}
