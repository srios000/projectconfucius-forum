type Props = { count: number };
export default function RepliesSummary({ count }: Props) {
  return (
    <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-[10.5px] font-semibold px-2 py-0.5 rounded-full ml-1.5">
      <span className="text-primary font-bold">+</span>
      {count} {count === 1 ? "reply" : "replies"}
    </span>
  );
}
