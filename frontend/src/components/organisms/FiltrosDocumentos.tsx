import type { EstadoDocumento } from '../../interface/documento.interface'
import { Selector } from '../atoms/Selector'
import { CampoFormulario } from '../molecules/CampoFormulario'

export interface OpcionTipo {
  id: number
  nombre: string
}

interface PropsFiltrosDocumentos {
  tipos: OpcionTipo[]
  // '' = every type
  tipoDocumentoId: string
  // '' = every state
  estado: '' | EstadoDocumento
  onTipoChange: (valor: string) => void
  onEstadoChange: (valor: '' | EstadoDocumento) => void
}

export function FiltrosDocumentos({
  tipos,
  tipoDocumentoId,
  estado,
  onTipoChange,
  onEstadoChange,
}: PropsFiltrosDocumentos) {
  return (
    <form
      role="search"
      aria-label="Filtrar documentos"
      onSubmit={(e) => e.preventDefault()}
      className="grid gap-4 sm:grid-cols-[1fr_12rem]"
    >
      <CampoFormulario
        etiqueta="Tipo de documento"
        control={({ id, 'aria-describedby': descritoPor }) => (
          <Selector
            id={id}
            aria-describedby={descritoPor}
            value={tipoDocumentoId}
            onChange={(e) => onTipoChange(e.target.value)}
          >
            <option value="">Todos</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
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
            onChange={(e) => onEstadoChange(e.target.value as '' | EstadoDocumento)}
          >
            <option value="">Todos</option>
            <option value="VIGENTE">Vigente</option>
            <option value="VENCIDO">Vencido</option>
          </Selector>
        )}
      />
    </form>
  )
}
