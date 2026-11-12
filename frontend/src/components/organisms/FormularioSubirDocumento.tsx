import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { DatosSubidaDocumento } from '../../interface/documento.interface'
import type { TipoDocumento } from '../../interface/tipoDocumento.interface'
import {
  ACEPTAR_ARCHIVOS,
  TEXTO_FORMATOS,
  formatearTamano,
  validarDocumento,
  type ErroresDocumento,
} from '../../utils/validacionDocumento'
import { Alerta } from '../atoms/Alerta'
import { Boton } from '../atoms/Boton'
import { Entrada } from '../atoms/Entrada'
import { EntradaArchivo } from '../atoms/EntradaArchivo'
import { Selector } from '../atoms/Selector'
import { CampoFormulario } from '../molecules/CampoFormulario'

interface PropsFormularioSubirDocumento {
  // Active types assigned to the project that apply to the owner
  tipos: TipoDocumento[]
  // Type picked from the checklist, if any
  tipoInicial: number | null
  enviando: boolean
  // Message coming from the backend (400 / 409 / 413 / 415 ...)
  errorServidor: string | null
  // The parent closes the dialog when the upload succeeds
  onSubir: (datos: DatosSubidaDocumento) => void
  onCancelar: () => void
}

export function FormularioSubirDocumento({
  tipos,
  tipoInicial,
  enviando,
  errorServidor,
  onSubir,
  onCancelar,
}: PropsFormularioSubirDocumento) {
  const [tipoId, setTipoId] = useState(tipoInicial !== null ? String(tipoInicial) : '')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [errores, setErrores] = useState<ErroresDocumento>({})

  const tipo = tipos.find((t) => String(t.id) === tipoId)
  const requiereVencimiento = tipo?.requiereVencimiento ?? false

  function manejarArchivo(evento: ChangeEvent<HTMLInputElement>) {
    setArchivo(evento.target.files?.[0] ?? null)
    setErrores((previos) => ({ ...previos, archivo: undefined }))
  }

  function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const nuevos = validarDocumento({
      archivo,
      tipoDocumentoId: tipoId,
      fechaVencimiento,
      requiereVencimiento,
    })
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0 || !archivo) return
    onSubir({
      archivo,
      tipoDocumentoId: Number(tipoId),
      // Types without vencimiento must not send one (the backend rejects it)
      fechaVencimiento: requiereVencimiento ? fechaVencimiento.trim() : undefined,
    })
  }

  return (
    <form onSubmit={manejarEnvio} noValidate className="space-y-4">
      {errorServidor && <Alerta variante="error">{errorServidor}</Alerta>}

      <CampoFormulario
        etiqueta="Tipo de documento"
        obligatorio
        error={errores.tipoDocumentoId}
        control={(props) => (
          <Selector
            id={props.id}
            aria-describedby={props['aria-describedby']}
            aria-invalid={props.invalido || undefined}
            value={tipoId}
            disabled={enviando}
            onChange={(e) => {
              setTipoId(e.target.value)
              setErrores((previos) => ({
                ...previos,
                tipoDocumentoId: undefined,
                fechaVencimiento: undefined,
              }))
            }}
          >
            <option value="">Seleccione…</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </Selector>
        )}
      />

      <CampoFormulario
        etiqueta="Archivo"
        obligatorio
        ayuda={TEXTO_FORMATOS}
        error={errores.archivo}
        control={(props) => (
          <EntradaArchivo
            id={props.id}
            aria-describedby={props['aria-describedby']}
            invalido={props.invalido}
            accept={ACEPTAR_ARCHIVOS}
            disabled={enviando}
            onChange={manejarArchivo}
          />
        )}
      />
      {archivo && (
        <p className="text-sm text-slate-700 break-all dark:text-slate-300">
          Seleccionado: <span className="font-medium">{archivo.name}</span> (
          {formatearTamano(archivo.size)})
        </p>
      )}

      {requiereVencimiento && (
        <CampoFormulario
          etiqueta="Fecha de vencimiento"
          obligatorio
          error={errores.fechaVencimiento}
          control={(props) => (
            <Entrada
              {...props}
              type="date"
              value={fechaVencimiento}
              disabled={enviando}
              onChange={(e) => {
                setFechaVencimiento(e.target.value)
                setErrores((previos) => ({ ...previos, fechaVencimiento: undefined }))
              }}
            />
          )}
        />
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Boton variante="secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Boton>
        <Boton type="submit" cargando={enviando}>
          {enviando ? 'Subiendo…' : 'Subir documento'}
        </Boton>
      </div>
    </form>
  )
}
