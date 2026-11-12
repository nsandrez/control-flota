export function InsigniaObligatorio({ obligatorio }: { obligatorio: boolean }) {
  return (
    <span
      className={
        obligatorio
          ? 'inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-100'
          : 'inline-block rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200'
      }
    >
      {obligatorio ? 'Obligatorio' : 'Opcional'}
    </span>
  )
}
