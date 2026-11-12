import { useState, type FormEvent } from 'react'
import type { TipoDocumento } from '../../interface/tipoDocumento.interface'
import { Alerta } from '../atoms/Alerta'
import { Boton } from '../atoms/Boton'
import { CasillaVerificacion } from '../atoms/CasillaVerificacion'
import { Selector } from '../atoms/Selector'
import { CampoFormulario } from '../molecules/CampoFormulario'

interface PropsFormularioAsignarTipoDocumento {
  // Active catalog types not yet assigned to the project
  disponibles: TipoDocumento[]
  enviando: boolean
  // Message coming from the backend (409 / ...)
  errorServidor: string | null
  // Resolves to true when the assignment succeeded
  onAsignar: (tipoDocumentoId: number, obligatorio: boolean) => Promise<boolean>
}

export function FormularioAsignarTipoDocumento({
  disponibles,
  enviando,
  errorServidor,
  onAsignar,
}: PropsFormularioAsignarTipoDocumento) {
  const [seleccion, setSeleccion] = useState('')
  const [obligatorio, setObligatorio] = useState(true)
  const [errorSeleccion, setErrorSeleccion] = useState<string | undefined>()

  const vehiculos = disponibles.filter((tipo) => tipo.aplicaA === 'VEHICULO')
  const conductores = disponibles.filter((tipo) => tipo.aplicaA === 'CONDUCTOR')

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!seleccion) {
      setErrorSeleccion('Seleccione un tipo de documento')
      return
    }
    // Keep the selection when the backend rejects it, so the user can retry or change it
    if (await onAsignar(Number(seleccion), obligatorio)) setSeleccion('')
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
      aria-label="Agregar tipo de documento"
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 className="text-base font-semibold">Agregar tipo de documento</h2>

      {errorServidor && <Alerta variante="error">{errorServidor}</Alerta>}

      {disponibles.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          No hay más tipos de documento activos para agregar. Los tipos nuevos se crean en el
          catálogo de tipos de documento.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-start">
          <CampoFormulario
            etiqueta="Tipo de documento"
            error={errorSeleccion}
            control={(props) => (
              <Selector
                id={props.id}
                aria-describedby={props['aria-describedby']}
                aria-invalid={props.invalido || undefined}
                value={seleccion}
                disabled={enviando}
                onChange={(e) => {
                  setSeleccion(e.target.value)
                  setErrorSeleccion(undefined)
                }}
              >
                <option value="">Seleccione…</option>
                {vehiculos.length > 0 && (
                  <optgroup label="Vehículo">
                    {vehiculos.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </optgroup>
                )}
                {conductores.length > 0 && (
                  <optgroup label="Conductor">
                    {conductores.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </optgroup>
                )}
              </Selector>
            )}
          />
          <div className="sm:pt-7">
            <CasillaVerificacion
              etiqueta="Obligatorio"
              checked={obligatorio}
              disabled={enviando}
              onChange={(e) => setObligatorio(e.target.checked)}
            />
          </div>
          <div className="sm:pt-7">
            <Boton type="submit" cargando={enviando} className="w-full sm:w-auto">
              {enviando ? 'Agregando…' : 'Agregar'}
            </Boton>
          </div>
        </div>
      )}
    </form>
  )
}
