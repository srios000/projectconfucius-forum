export const MAX_INLINE_DEPTH = 5;

export function countDescendants(node: { children?: any[]; [key: string]: any }): number {
  if (!node.children?.length) return 0;
  return node.children.reduce(
    (sum, c) => sum + 1 + countDescendants(c),
    0,
  );
}

export function shouldCutoff(depth: number): boolean {
  return depth >= MAX_INLINE_DEPTH;
}

export type FlatComment = { id: string; parentId?: string | null };

export function buildCommentTree<T extends FlatComment>(flat: T[]): (T & { children: any[] })[] {
  const byId = new Map<string, any>();
  for (const c of flat) {
    byId.set(c.id, { ...c, children: [] });
  }
  const roots: any[] = [];
  for (const c of flat) {
    const node = byId.get(c.id);
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

