import { useState, type FormEvent } from 'react'
import type { AplicaA } from '../../interface/tipoDocumento.interface'
import {
  LARGO_MAXIMO_NOMBRE,
  validarTipoDocumento,
  type ErroresTipoDocumento,
  type ValoresFormularioTipoDocumento,
} from '../../utils/validacionTipoDocumento'
import { Alerta } from '../atoms/Alerta'
import { AreaTexto } from '../atoms/AreaTexto'
import { Boton } from '../atoms/Boton'
import { CasillaVerificacion } from '../atoms/CasillaVerificacion'
import { Entrada } from '../atoms/Entrada'
import { Selector } from '../atoms/Selector'
import { CampoFormulario } from '../molecules/CampoFormulario'

interface PropsFormularioTipoDocumento {
  valoresIniciales: ValoresFormularioTipoDocumento
  textoEnvio: string
  enviando: boolean
  // Message coming from the backend (400 / 409 / ...). A 409 about "aplicaA" means it is locked.
  errorServidor: string | null
  onEnviar: (valores: ValoresFormularioTipoDocumento) => void
  onCancelar: () => void
}

const IDS = {
  nombre: 'tipo-documento-nombre',
  descripcion: 'tipo-documento-descripcion',
  aplicaA: 'tipo-documento-aplica-a',
} as const

export function FormularioTipoDocumento({
  valoresIniciales,
  textoEnvio,
  enviando,
  errorServidor,
  onEnviar,
  onCancelar,
}: PropsFormularioTipoDocumento) {
  const [valores, setValores] = useState(valoresIniciales)
  const [errores, setErrores] = useState<ErroresTipoDocumento>({})

  function cambiar<K extends keyof ValoresFormularioTipoDocumento>(
    campo: K,
    valor: ValoresFormularioTipoDocumento[K],
  ) {
    setValores((previos) => ({ ...previos, [campo]: valor }))
    if (campo in errores) setErrores((previos) => ({ ...previos, [campo]: undefined }))
  }

  function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const encontrados = validarTipoDocumento(valores)
    setErrores(encontrados)
    const primero = (['nombre', 'aplicaA'] as const).find((campo) => encontrados[campo])
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
            maxLength={LARGO_MAXIMO_NOMBRE + 10}
            autoFocus
            value={valores.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
          />
        )}
      />

      <CampoFormulario
        id={IDS.aplicaA}
        etiqueta="Aplica a"
        obligatorio
        ayuda="No se puede cambiar una vez que el tipo está asignado a proyectos o tiene documentos."
        error={errores.aplicaA}
        control={(props) => (
          <Selector
            id={props.id}
            aria-describedby={props['aria-describedby']}
            aria-invalid={props.invalido || undefined}
            className="sm:max-w-60"
            value={valores.aplicaA}
            onChange={(e) => cambiar('aplicaA', e.target.value as AplicaA | '')}
          >
            <option value="">Seleccione…</option>
            <option value="VEHICULO">Vehículo</option>
            <option value="CONDUCTOR">Conductor</option>
          </Selector>
        )}
      />

      <CampoFormulario
        id={IDS.descripcion}
        etiqueta="Descripción"
        error={errores.descripcion}
        control={(props) => (
          <AreaTexto
            {...props}
            rows={3}
            value={valores.descripcion}
            onChange={(e) => cambiar('descripcion', e.target.value)}
          />
        )}
      />

      <CasillaVerificacion
        etiqueta="Requiere fecha de vencimiento"
        checked={valores.requiereVencimiento}
        onChange={(e) => cambiar('requiereVencimiento', e.target.checked)}
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
