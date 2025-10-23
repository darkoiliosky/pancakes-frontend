export default function SummaryCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="p-4 rounded-xl bg-white shadow border border-amber-100">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold text-amber-700 mt-1">{value}</div>
    </div>
  );
}

