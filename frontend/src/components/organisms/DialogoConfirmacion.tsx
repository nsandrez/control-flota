import { Alerta } from '../atoms/Alerta'
import { Boton } from '../atoms/Boton'
import { ModalDialogo } from '../molecules/ModalDialogo'

interface PropsDialogoConfirmacion {
  abierto: boolean
  titulo: string
  mensaje: string
  textoConfirmar: string
  peligro?: boolean
  procesando?: boolean
  error?: string | null
  onConfirmar: () => void
  onCancelar: () => void
}

export function DialogoConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar,
  peligro = false,
  procesando = false,
  error = null,
  onConfirmar,
  onCancelar,
}: PropsDialogoConfirmacion) {
  return (
    <ModalDialogo abierto={abierto} titulo={titulo} onCerrar={onCancelar} bloqueado={procesando}>
      <p className="text-sm text-slate-700 dark:text-slate-300">{mensaje}</p>
      {error && <Alerta variante="error">{error}</Alerta>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Boton variante="secundario" onClick={onCancelar} disabled={procesando}>
          Cancelar
        </Boton>
        <Boton
          variante={peligro ? 'peligro' : 'primario'}
          onClick={onConfirmar}
          cargando={procesando}
          autoFocus
        >
          {textoConfirmar}
        </Boton>
      </div>
    </ModalDialogo>
  )
}
