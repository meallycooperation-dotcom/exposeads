const Topbar = () => {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Marketing Workspace
        </p>
        <h1 className="text-lg font-semibold text-gray-900">Agency HQ</h1>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Search..."
          className="w-48 rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
        />
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
          EA
        </div>
      </div>
    </header>
  )
}

export default Topbar
