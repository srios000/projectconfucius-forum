type Props = { height: string };

export default function PostLoaderItem({ height }: Props) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
      <div className="skel-jade h-3 w-2/5 mt-3 rounded" />
      <div className="skel-jade h-3 w-full mt-3 rounded" />
      <div className="skel-jade h-3 w-full mt-1.5 rounded" />
      <div className="skel-jade h-3 w-3/5 mt-1.5 rounded" />
      <div className="skel-jade mt-3 rounded" style={{ height }} />
    </div>
  );
}

