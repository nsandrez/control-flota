import { Entrada } from '../atoms/Entrada'
import { Selector } from '../atoms/Selector'
import type { EstadoProyecto } from '../../interface/proyecto.interface'
import { CampoFormulario } from '../molecules/CampoFormulario'

interface PropsFiltrosProyectos {
  busqueda: string
  estado: EstadoProyecto | ''
  onBusquedaChange: (valor: string) => void
  onEstadoChange: (valor: EstadoProyecto | '') => void
}

export function FiltrosProyectos({
  busqueda,
  estado,
  onBusquedaChange,
  onEstadoChange,
}: PropsFiltrosProyectos) {
  return (
    <form
      role="search"
      aria-label="Filtrar proyectos"
      onSubmit={(e) => e.preventDefault()}
      className="grid gap-4 sm:grid-cols-[1fr_12rem]"
    >
      <CampoFormulario
        etiqueta="Buscar por nombre"
        control={(props) => (
          <Entrada
            {...props}
            type="search"
            placeholder="Nombre del proyecto"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
          />
        )}
      />
      <CampoFormulario
        etiqueta="Estado"
        control={({ id, 'aria-describedby': descritoPor }) => (
          <Selector
            id={id}
            aria-describedby={descritoPor}
            value={estado}
            onChange={(e) => onEstadoChange(e.target.value as EstadoProyecto | '')}
          >
            <option value="">Todos</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </Selector>
        )}
      />
    </form>
  )
}
