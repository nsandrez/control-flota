import { useEffect, useState } from 'react'

// Returns `valor` only after it has stayed unchanged for `milisegundos`
export function useRetardo<T>(valor: T, milisegundos: number): T {
  const [retardado, setRetardado] = useState(valor)
  useEffect(() => {
    const temporizador = setTimeout(() => setRetardado(valor), milisegundos)
    return () => clearTimeout(temporizador)
  }, [valor, milisegundos])
  return retardado
}
