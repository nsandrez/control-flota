import { useState, type FormEvent } from 'react'
import { validarFechaVencimiento } from '../../utils/validacionDocumento'
import { Alerta } from '../atoms/Alerta'
import { Boton } from '../atoms/Boton'
import { Entrada } from '../atoms/Entrada'
import { CampoFormulario } from '../molecules/CampoFormulario'

interface PropsFormularioVencimientoDocumento {
  // "YYYY-MM-DD" or null
  fechaInicial: string | null
  enviando: boolean
  // Message coming from the backend
  errorServidor: string | null
  onGuardar: (fechaVencimiento: string) => void
  onCancelar: () => void
}

// Only offered for document types that require a due date, so the date is mandatory here
export function FormularioVencimientoDocumento({
  fechaInicial,
  enviando,
  errorServidor,
  onGuardar,
  onCancelar,
}: PropsFormularioVencimientoDocumento) {
  const [fecha, setFecha] = useState(fechaInicial ?? '')
  const [error, setError] = useState<string | undefined>()

  function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const errorFecha = validarFechaVencimiento(fecha, true)
    setError(errorFecha)
    if (!errorFecha) onGuardar(fecha.trim())
  }

  return (
    <form onSubmit={manejarEnvio} noValidate className="space-y-4">
      {errorServidor && <Alerta variante="error">{errorServidor}</Alerta>}
      <CampoFormulario
        etiqueta="Fecha de vencimiento"
        obligatorio
        error={error}
        control={(props) => (
          <Entrada
            {...props}
            type="date"
            value={fecha}
            disabled={enviando}
            autoFocus
            onChange={(e) => {
              setFecha(e.target.value)
              setError(undefined)
            }}
          />
        )}
      />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Boton variante="secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Boton>
        <Boton type="submit" cargando={enviando}>
          {enviando ? 'Guardando…' : 'Guardar'}
        </Boton>
      </div>
    </form>
  )
}
