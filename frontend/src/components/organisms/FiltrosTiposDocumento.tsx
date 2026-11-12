import type { AplicaA } from '../../interface/tipoDocumento.interface'
import { Entrada } from '../atoms/Entrada'
import { Selector } from '../atoms/Selector'
import { CampoFormulario } from '../molecules/CampoFormulario'

export type FiltroEstadoTipo = 'activos' | 'inactivos' | 'todos'
export type FiltroAplicaA = AplicaA | ''

interface PropsFiltrosTiposDocumento {
  busqueda: string
  aplicaA: FiltroAplicaA
  estado: FiltroEstadoTipo
  onBusquedaChange: (valor: string) => void
  onAplicaAChange: (valor: FiltroAplicaA) => void
  onEstadoChange: (valor: FiltroEstadoTipo) => void
}

export function FiltrosTiposDocumento({
  busqueda,
  aplicaA,
  estado,
  onBusquedaChange,
  onAplicaAChange,
  onEstadoChange,
}: PropsFiltrosTiposDocumento) {
  return (
    <form
      role="search"
      aria-label="Filtrar tipos de documento"
      onSubmit={(e) => e.preventDefault()}
      className="grid gap-4 sm:grid-cols-[1fr_12rem_12rem]"
    >
      <CampoFormulario
        etiqueta="Buscar tipo de documento"
        control={(props) => (
          <Entrada
            {...props}
            type="search"
            placeholder="Nombre o descripción"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
          />
        )}
      />
      <CampoFormulario
        etiqueta="Aplica a"
        control={({ id, 'aria-describedby': descritoPor }) => (
          <Selector
            id={id}
            aria-describedby={descritoPor}
            value={aplicaA}
            onChange={(e) => onAplicaAChange(e.target.value as FiltroAplicaA)}
          >
            <option value="">Todos</option>
            <option value="VEHICULO">Vehículo</option>
            <option value="CONDUCTOR">Conductor</option>
          </Selector>
        )}
      />
      <CampoFormulario
        etiqueta="Estado"
        control={({ id, 'aria-describedby': descritoPor }) => (
          <Selector
            id={id}
            aria-describedby={descritoPor}
            value={estado}
            onChange={(e) => onEstadoChange(e.target.value as FiltroEstadoTipo)}
          >
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
            <option value="todos">Todos</option>
          </Selector>
        )}
      />
    </form>
  )
}
