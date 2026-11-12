import { useState, type FormEvent } from 'react'
import {
  LARGO_MAXIMO_NOMBRE,
  validarProyecto,
  type ErroresProyecto,
  type ValoresFormularioProyecto,
} from '../../utils/validacionProyecto'
import { Alerta } from '../atoms/Alerta'
import { AreaTexto } from '../atoms/AreaTexto'
import { Boton } from '../atoms/Boton'
import { Entrada } from '../atoms/Entrada'
import { CampoFormulario } from '../molecules/CampoFormulario'

interface PropsFormularioProyecto {
  valoresIniciales: ValoresFormularioProyecto
  textoEnvio: string
  enviando: boolean
  // Message coming from the backend (400 / 409 / ...)
  errorServidor: string | null
  onEnviar: (valores: ValoresFormularioProyecto) => void
  onCancelar: () => void
}

const IDS: Record<keyof ValoresFormularioProyecto, string> = {
  nombre: 'proyecto-nombre',
  descripcion: 'proyecto-descripcion',
  fechaInicio: 'proyecto-fecha-inicio',
  fechaFin: 'proyecto-fecha-fin',
}

export function FormularioProyecto({
  valoresIniciales,
  textoEnvio,
  enviando,
  errorServidor,
  onEnviar,
  onCancelar,
}: PropsFormularioProyecto) {
  const [valores, setValores] = useState(valoresIniciales)
  const [errores, setErrores] = useState<ErroresProyecto>({})

  function cambiar(campo: keyof ValoresFormularioProyecto, valor: string) {
    setValores((previos) => ({ ...previos, [campo]: valor }))
    if (errores[campo]) setErrores((previos) => ({ ...previos, [campo]: undefined }))
  }

  function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const encontrados = validarProyecto(valores)
    setErrores(encontrados)
    const primero = (Object.keys(IDS) as Array<keyof ValoresFormularioProyecto>).find(
      (campo) => encontrados[campo],
    )
    if (primero) {
      document.getElementById(IDS[primero])?.focus()
      return
    }
    onEnviar(valores)
  }

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
      className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      {errorServidor && <Alerta variante="error">{errorServidor}</Alerta>}

      <CampoFormulario
        id={IDS.nombre}
        etiqueta="Nombre"
        obligatorio
        error={errores.nombre}
        control={(props) => (
          <Entrada
            {...props}
            type="text"
            maxLength={LARGO_MAXIMO_NOMBRE}
            autoFocus
            value={valores.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
          />
        )}
      />

      <CampoFormulario
        id={IDS.descripcion}
        etiqueta="Descripción"
        error={errores.descripcion}
        control={(props) => (
          <AreaTexto
            {...props}
            rows={4}
            value={valores.descripcion}
            onChange={(e) => cambiar('descripcion', e.target.value)}
          />
        )}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoFormulario
          id={IDS.fechaInicio}
          etiqueta="Fecha de inicio"
          error={errores.fechaInicio}
          control={(props) => (
            <Entrada
              {...props}
              type="date"
              value={valores.fechaInicio}
              onChange={(e) => cambiar('fechaInicio', e.target.value)}
            />
          )}
        />
        <CampoFormulario
          id={IDS.fechaFin}
          etiqueta="Fecha de fin"
          error={errores.fechaFin}
          control={(props) => (
            <Entrada
              {...props}
              type="date"
              min={valores.fechaInicio || undefined}
              value={valores.fechaFin}
              onChange={(e) => cambiar('fechaFin', e.target.value)}
            />
          )}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Boton variante="secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Boton>
        <Boton type="submit" cargando={enviando}>
          {enviando ? 'Guardando…' : textoEnvio}
        </Boton>
      </div>
    </form>
  )
}
