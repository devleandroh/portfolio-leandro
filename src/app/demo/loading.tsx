export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="animate-pulse">
      <div className="h-7 w-56 rounded bg-line" />
      <div className="mt-2 h-4 w-96 max-w-full rounded bg-wash" />
      <div className="mt-5 h-16 rounded-lg bg-wash" />
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-24 rounded-lg bg-wash" />
        ))}
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <div className="h-72 rounded-lg bg-wash lg:col-span-2" />
        <div className="h-72 rounded-lg bg-wash" />
      </div>
    </div>
  );
}
