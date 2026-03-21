// src/components/ClearSmsModal.jsx
export default function ClearSmsModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl">🗑️</div>
          <h3 className="text-base font-bold text-gray-800">Clear SMS History?</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            This will permanently delete all SMS notification history. This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 mt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}