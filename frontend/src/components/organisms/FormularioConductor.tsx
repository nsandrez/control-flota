import { useState, type FormEvent } from 'react'
import {
  LARGO_MAXIMO_NOMBRE,
  LARGO_MAXIMO_TELEFONO,
  formatearSiEsRut,
  normalizarDocumento,
  validarConductor,
  type ErroresConductor,
  type ValoresFormularioConductor,
} from '../../utils/validacionConductor'
import { Alerta } from '../atoms/Alerta'
import { Boton } from '../atoms/Boton'
import { Entrada } from '../atoms/Entrada'
import { CampoFormulario } from '../molecules/CampoFormulario'

interface PropsFormularioConductor {
  valoresIniciales: ValoresFormularioConductor
  textoEnvio: string
  enviando: boolean
  // Message coming from the backend (400 / 409 / ...)
  errorServidor: string | null
  onEnviar: (valores: ValoresFormularioConductor) => void
  onCancelar: () => void
}

const IDS: Record<keyof ValoresFormularioConductor, string> = {
  nombre: 'conductor-nombre',
  documentoIdentidad: 'conductor-documento',
  telefono: 'conductor-telefono',
}

// Leaves room for dots/spaces that the backend strips before checking the 20-char limit
const LARGO_MAXIMO_DOCUMENTO_ENTRADA = 30

export function FormularioConductor({
  valoresIniciales,
  textoEnvio,
  enviando,
  errorServidor,
  onEnviar,
  onCancelar,
}: PropsFormularioConductor) {
  const [valores, setValores] = useState(valoresIniciales)
  const [errores, setErrores] = useState<ErroresConductor>({})

  function cambiar(campo: keyof ValoresFormularioConductor, valor: string) {
    setValores((previos) => ({ ...previos, [campo]: valor }))
    if (errores[campo]) setErrores((previos) => ({ ...previos, [campo]: undefined }))
  }

  function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const normalizados = {
      ...valores,
      documentoIdentidad: normalizarDocumento(valores.documentoIdentidad),
    }
    const encontrados = validarConductor(normalizados)
    setErrores(encontrados)
    const primero = (Object.keys(IDS) as Array<keyof ValoresFormularioConductor>).find(
      (campo) => encontrados[campo],
    )
    if (primero) {
      document.getElementById(IDS[primero])?.focus()
      return
    }
    setValores(normalizados)
    onEnviar(normalizados)
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
            autoComplete="off"
            value={valores.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
          />
        )}
      />

      <CampoFormulario
        id={IDS.documentoIdentidad}
        etiqueta="RUT / Documento de identidad"
        obligatorio
        ayuda="Entre 5 y 20 caracteres: letras, dígitos y guion. Se guarda en mayúsculas y sin puntos."
        error={errores.documentoIdentidad}
        control={(props) => (
          <Entrada
            {...props}
            type="text"
            maxLength={LARGO_MAXIMO_DOCUMENTO_ENTRADA}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="font-mono uppercase"
            value={valores.documentoIdentidad}
            onChange={(e) => cambiar('documentoIdentidad', e.target.value)}
            onBlur={() =>
              setValores((previos) => ({
                ...previos,
                documentoIdentidad: formatearSiEsRut(previos.documentoIdentidad.trim()),
              }))
            }
          />
        )}
      />

      <CampoFormulario
        id={IDS.telefono}
        etiqueta="Teléfono"
        ayuda="Opcional. Solo dígitos, espacios, +, - y paréntesis."
        error={errores.telefono}
        control={(props) => (
          <Entrada
            {...props}
            type="tel"
            maxLength={LARGO_MAXIMO_TELEFONO + 10}
            autoComplete="off"
            className="sm:max-w-xs"
            value={valores.telefono}
            onChange={(e) => cambiar('telefono', e.target.value)}
          />
        )}
      />

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
