export default function TodoStats({
  done,
  total,
}: {
  done: number;
  total: number;
}) {
  return (
    <p className="text-xs font-medium text-zinc-500">
      완료 {done} / 전체 {total}
    </p>
  );
}
