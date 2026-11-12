import { Entrada } from '../atoms/Entrada'
import { Selector } from '../atoms/Selector'
import { CampoFormulario } from '../molecules/CampoFormulario'

interface PropsFiltrosConductores {
  busqueda: string
  mostrarActivos: boolean
  onBusquedaChange: (valor: string) => void
  onMostrarActivosChange: (valor: boolean) => void
}

export function FiltrosConductores({
  busqueda,
  mostrarActivos,
  onBusquedaChange,
  onMostrarActivosChange,
}: PropsFiltrosConductores) {
  return (
    <form
      role="search"
      aria-label="Filtrar conductores"
      onSubmit={(e) => e.preventDefault()}
      className="grid gap-4 sm:grid-cols-[1fr_12rem]"
    >
      <CampoFormulario
        etiqueta="Buscar conductor"
        control={(props) => (
          <Entrada
            {...props}
            type="search"
            placeholder="Nombre o documento de identidad"
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
            value={mostrarActivos ? 'activos' : 'inactivos'}
            onChange={(e) => onMostrarActivosChange(e.target.value === 'activos')}
          >
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </Selector>
        )}
      />
    </form>
  )
}
