import { Search } from "lucide-react";

export default function UserSearchFilter({ search, setSearch, roleFilter, setRoleFilter }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
      {/* Search input */}
      <div className="relative flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        />
      </div>

      {/* Role filter buttons */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
        {["all", "user", "admin"].map(r => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize ${
              roleFilter === r
                ? r === "admin" ? "bg-purple-600 text-white" : "bg-blue-600 text-white"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {r === "all" ? "👥 All" : r === "admin" ? "🛡 Admin" : "👤 User"}
          </button>
        ))}
      </div>
    </div>
  );
}