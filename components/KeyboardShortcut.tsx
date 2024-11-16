export const KeyboardShortcut = ({ keys }: { keys: string[] }) => (
  <span className="inline-flex items-center gap-1">
    {keys.map((key, index) => (
      <span key={key} className="flex items-center">
        <kbd className="px-2 py-1 text-sm bg-gray-800/80 border border-gray-700 
                       rounded shadow-lg text-gray-300 font-sans">
          {key}
        </kbd>
        {index < keys.length - 1 && (
          <span className="mx-1 text-gray-500">+</span>
        )}
      </span>
    ))}
  </span>
);

