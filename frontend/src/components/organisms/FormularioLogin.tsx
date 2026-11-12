import { useState, type FormEvent } from 'react'
import { formatearRut, normalizarRut, validarRut } from '../../utils/rut'
import { Alerta } from '../atoms/Alerta'
import { Boton } from '../atoms/Boton'
import { Entrada } from '../atoms/Entrada'
import { CampoFormulario } from '../molecules/CampoFormulario'
import { EntradaContrasena } from '../molecules/EntradaContrasena'

interface PropsFormularioLogin {
  enviando: boolean
  error: string | null
  onEnviar: (rut: string, contrasena: string) => void
}

export function FormularioLogin({ enviando, error, onEnviar }: PropsFormularioLogin) {
  const [rut, setRut] = useState('')
  const [errorRut, setErrorRut] = useState<string | undefined>()
  const [contrasena, setContrasena] = useState('')

  function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!validarRut(rut)) {
      setErrorRut('RUT inválido')
      return
    }
    onEnviar(normalizarRut(rut), contrasena)
  }

  return (
    <form onSubmit={manejarEnvio} className="space-y-4">
      {error && <Alerta variante="error">{error}</Alerta>}
      <CampoFormulario
        etiqueta="RUT"
        obligatorio
        error={errorRut}
        control={(props) => (
          <Entrada
            {...props}
            type="text"
            inputMode="text"
            name="rut"
            placeholder="12.345.678-9"
            autoComplete="username"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={12}
            autoFocus
            required
            value={rut}
            onChange={(e) => {
              setRut(formatearRut(e.target.value))
              setErrorRut(undefined)
            }}
          />
        )}
      />
      <CampoFormulario
        etiqueta="Contraseña"
        obligatorio
        control={(props) => (
          <EntradaContrasena
            {...props}
            name="contrasena"
            autoComplete="current-password"
            required
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
          />
        )}
      />
      <Boton type="submit" cargando={enviando} className="w-full">
        {enviando ? 'Ingresando…' : 'Ingresar'}
      </Boton>
    </form>
  )
}
