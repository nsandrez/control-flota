import { useState, type FormEvent } from 'react'
import {
  ANIO_MINIMO,
  LARGO_MAXIMO_PATENTE,
  LARGO_MAXIMO_TEXTO,
  anioMaximo,
  normalizarPatente,
  validarVehiculo,
  type ErroresVehiculo,
  type ValoresFormularioVehiculo,
} from '../../utils/validacionVehiculo'
import { Alerta } from '../atoms/Alerta'
import { Boton } from '../atoms/Boton'
import { Entrada } from '../atoms/Entrada'
import { CampoFormulario } from '../molecules/CampoFormulario'

interface PropsFormularioVehiculo {
  valoresIniciales: ValoresFormularioVehiculo
  textoEnvio: string
  enviando: boolean
  // Message coming from the backend (400 / 409 / ...)
  errorServidor: string | null
  onEnviar: (valores: ValoresFormularioVehiculo) => void
  onCancelar: () => void
}

const IDS: Record<keyof ValoresFormularioVehiculo, string> = {
  patente: 'vehiculo-patente',
  marca: 'vehiculo-marca',
  modelo: 'vehiculo-modelo',
  anio: 'vehiculo-anio',
}

export function FormularioVehiculo({
  valoresIniciales,
  textoEnvio,
  enviando,
  errorServidor,
  onEnviar,
  onCancelar,
}: PropsFormularioVehiculo) {
  const [valores, setValores] = useState(valoresIniciales)
  const [errores, setErrores] = useState<ErroresVehiculo>({})

  function cambiar(campo: keyof ValoresFormularioVehiculo, valor: string) {
    setValores((previos) => ({ ...previos, [campo]: valor }))
    if (errores[campo]) setErrores((previos) => ({ ...previos, [campo]: undefined }))
  }

  function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const normalizados = { ...valores, patente: normalizarPatente(valores.patente) }
    setValores(normalizados)
    const encontrados = validarVehiculo(normalizados)
    setErrores(encontrados)
    const primero = (Object.keys(IDS) as Array<keyof ValoresFormularioVehiculo>).find(
      (campo) => encontrados[campo],
    )
    if (primero) {
      document.getElementById(IDS[primero])?.focus()
      return
    }
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
        id={IDS.patente}
        etiqueta="Patente"
        obligatorio
        ayuda="Entre 5 y 10 caracteres: letras, dígitos y guion. Se guarda en mayúsculas."
        error={errores.patente}
        control={(props) => (
          <Entrada
            {...props}
            type="text"
            maxLength={LARGO_MAXIMO_PATENTE + 5}
            autoFocus
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="font-mono uppercase"
            value={valores.patente}
            onChange={(e) => cambiar('patente', e.target.value)}
            onBlur={() => setValores((previos) => ({ ...previos, patente: normalizarPatente(previos.patente) }))}
          />
        )}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoFormulario
          id={IDS.marca}
          etiqueta="Marca"
          error={errores.marca}
          control={(props) => (
            <Entrada
              {...props}
              type="text"
              maxLength={LARGO_MAXIMO_TEXTO}
              value={valores.marca}
              onChange={(e) => cambiar('marca', e.target.value)}
            />
          )}
        />
        <CampoFormulario
          id={IDS.modelo}
          etiqueta="Modelo"
          error={errores.modelo}
          control={(props) => (
            <Entrada
              {...props}
              type="text"
              maxLength={LARGO_MAXIMO_TEXTO}
              value={valores.modelo}
              onChange={(e) => cambiar('modelo', e.target.value)}
            />
          )}
        />
      </div>

      <CampoFormulario
        id={IDS.anio}
        etiqueta="Año"
        ayuda={`Entre ${ANIO_MINIMO} y ${anioMaximo()}.`}
        error={errores.anio}
        control={(props) => (
          <Entrada
            {...props}
            type="text"
            inputMode="numeric"
            maxLength={4}
            className="sm:max-w-40"
            value={valores.anio}
            onChange={(e) => cambiar('anio', e.target.value)}
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
