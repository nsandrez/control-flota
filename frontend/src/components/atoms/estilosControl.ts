export function estilosControl(invalido: boolean): string {
  const borde = invalido
    ? 'border-red-500 focus-visible:outline-red-500'
    : 'border-slate-300 focus-visible:outline-blue-600 dark:border-slate-600'
  return `block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-0 disabled:opacity-60 dark:bg-slate-900 dark:text-slate-100 ${borde}`
}
