import { ReactElement } from "react";

type Props = { children: ReactElement | [ReactElement, ReactElement?] };

export default function PageContent({ children }: Props) {
  const [main, sidebar] = Array.isArray(children) ? children : [children, undefined];
  return (
    <div className="mx-auto max-w-6xl px-3 py-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-3">{main}</div>
      {sidebar && <aside className="hidden lg:block space-y-3">{sidebar}</aside>}
    </div>
  );
}
