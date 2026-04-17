interface ChargesRecapProps {
  totalPrevu: number;
  totalReel: number;
  totalRestant: number;
}

export const ChargesRecap: React.FC<ChargesRecapProps> = ({
  totalPrevu,
  totalReel,
  totalRestant,
}) => {
  const percentUsed = totalPrevu > 0 ? (totalReel / totalPrevu) * 100 : 0;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-6 rounded-lg mb-6 border border-blue-200 dark:border-blue-800">
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">📊 Synthèse Charges</h2>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Prévu</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {totalPrevu.toFixed(2)}€
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Réel</p>
          <p
            className={`text-2xl font-bold ${
              totalReel > totalPrevu
                ? "text-red-600 dark:text-red-400"
                : "text-green-600 dark:text-green-400"
            }`}
          >
            {totalReel.toFixed(2)}€
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {percentUsed.toFixed(0)}% utilisé
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Restant</p>
          <p
            className={`text-2xl font-bold ${
              totalRestant >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {totalRestant.toFixed(2)}€
          </p>
        </div>
      </div>

      {totalReel > totalPrevu && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm">
          ⚠️ Budget dépassé de {Math.abs(totalRestant).toFixed(2)}€
        </div>
      )}
    </div>
  );
};
