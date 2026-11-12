import { useId, type ReactNode } from 'react'

interface PropsControl {
  id: string
  'aria-describedby'?: string
  invalido: boolean
}

interface PropsCampoFormulario {
  etiqueta: string
  error?: string
  ayuda?: string
  obligatorio?: boolean
  // Render prop: wires id / aria-describedby / invalid state into the control
  control: (props: PropsControl) => ReactNode
  id?: string
}

export function CampoFormulario({
  etiqueta,
  error,
  ayuda,
  obligatorio = false,
  control,
  id: idExterno,
}: PropsCampoFormulario) {
  const idGenerado = useId()
  const id = idExterno ?? idGenerado
  const idError = `${id}-error`
  const idAyuda = `${id}-ayuda`
  const descritoPor = [error ? idError : null, ayuda ? idAyuda : null].filter(Boolean).join(' ')

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {etiqueta}
        {obligatorio && (
          <span aria-hidden="true" className="ml-0.5 text-red-600">
            *
          </span>
        )}
      </label>
      {control({ id, 'aria-describedby': descritoPor || undefined, invalido: Boolean(error) })}
      {ayuda && (
        <p id={idAyuda} className="text-xs text-slate-500 dark:text-slate-400">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
