import { Link } from 'react-router'
import { MensajeEstado } from '../components/molecules/MensajeEstado'

export function PaginaNoEncontrada() {
  return (
    <MensajeEstado
      titulo="Página no encontrada"
      descripcion="La dirección que busca no existe."
      accion={
        <Link to="/proyectos" className="text-sm font-medium text-blue-700 underline dark:text-blue-300">
          Ir a proyectos
        </Link>
      }
    />
  )
}
