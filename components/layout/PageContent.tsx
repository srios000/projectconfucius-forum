import { ReactElement } from "react";
type Props = { children: ReactElement | [ReactElement, ReactElement?]; };
export default function PageContent({ children }: Props) {
  const arr = Array.isArray(children) ? children : [children];
  return <div className="space-y-3">{arr[0]}</div>;
}
