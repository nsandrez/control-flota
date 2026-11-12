import { useEffect, useId, useRef, type ReactNode } from 'react'

interface PropsModalDialogo {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  // Prevents closing (Escape / backdrop) while an operation is in flight
  bloqueado?: boolean
  children: ReactNode
}

// Native <dialog>: the browser provides focus trapping, Escape to close and focus restore.
export function ModalDialogo({
  abierto,
  titulo,
  onCerrar,
  bloqueado = false,
  children,
}: PropsModalDialogo) {
  const referencia = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()

  useEffect(() => {
    const dialogo = referencia.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  return (
    <dialog
      ref={referencia}
      aria-labelledby={idTitulo}
      onClose={onCerrar}
      onCancel={(evento) => {
        // Escape key: keep the dialog open while an operation is in flight
        if (bloqueado) evento.preventDefault()
      }}
      onClick={(evento) => {
        // A click on the backdrop targets the <dialog> element itself
        if (evento.target === evento.currentTarget && !bloqueado) onCerrar()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg bg-white p-0 text-slate-900 shadow-xl backdrop:bg-black/50 dark:bg-slate-800 dark:text-slate-100"
    >
      {abierto && (
        <div className="space-y-4 p-6">
          <h2 id={idTitulo} className="text-lg font-semibold">
            {titulo}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  )
}
