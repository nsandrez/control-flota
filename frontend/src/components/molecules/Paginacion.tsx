import { Boton } from '../atoms/Boton'

interface PropsPaginacion {
  pagina: number
  limite: number
  total: number
  onCambiar: (pagina: number) => void
}

export function Paginacion({ pagina, limite, total, onCambiar }: PropsPaginacion) {
  const totalPaginas = Math.max(1, Math.ceil(total / limite))
  const desde = total === 0 ? 0 : (pagina - 1) * limite + 1
  const hasta = Math.min(pagina * limite, total)

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {desde}–{hasta} de {total}
      </p>
      <div className="flex items-center gap-2">
        <Boton variante="secundario" disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)}>
          Anterior
        </Boton>
        <span className="text-sm" aria-current="page">
          Página {pagina} de {totalPaginas}
        </span>
        <Boton
          variante="secundario"
          disabled={pagina >= totalPaginas}
          onClick={() => onCambiar(pagina + 1)}
        >
          Siguiente
        </Boton>
      </div>
    </nav>
  )
}
