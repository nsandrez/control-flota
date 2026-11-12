import { useContext } from 'react'
import { ContextoAuth, type ValorContextoAuth } from '../context/ContextoAuth'

export function useAuth(): ValorContextoAuth {
  const contexto = useContext(ContextoAuth)
  if (!contexto) throw new Error('useAuth debe usarse dentro de ProveedorAuth')
  return contexto
}
