import type { ExpenseType } from '../types/api';

export type HierarchicalExpenseType = {
  id: number;
  name: string;
  parent_id?: number;
  parent_name?: string;
  created_at: string;
  created_by_username?: string;
  children: HierarchicalExpenseType[];
};

export function buildExpenseTypeHierarchy(types: ExpenseType[]): HierarchicalExpenseType[] {
  const typeMap = new Map<number, HierarchicalExpenseType>();

  types.forEach((type) => {
    typeMap.set(type.id, {
      id: type.id,
      name: type.name,
      parent_id: type.parent_id,
      parent_name: type.parent_name,
      created_at: type.created_at,
      created_by_username: type.created_by_username,
      children: [],
    });
  });

  const rootTypes: HierarchicalExpenseType[] = [];

  types.forEach((type) => {
    const node = typeMap.get(type.id)!;
    if (type.parent_id) {
      const parent = typeMap.get(type.parent_id);
      if (parent) parent.children.push(node);
      else rootTypes.push(node);
    } else {
      rootTypes.push(node);
    }
  });

  return rootTypes;
}

export function filterExpenseTypesBySearch(
  types: HierarchicalExpenseType[],
  query: string
): HierarchicalExpenseType[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return types;

  const walk = (nodes: HierarchicalExpenseType[]): HierarchicalExpenseType[] => {
    const out: HierarchicalExpenseType[] = [];
    for (const node of nodes) {
      const children = walk(node.children);
      const selfMatch = node.name.toLowerCase().includes(needle);
      if (selfMatch || children.length > 0) {
        out.push({ ...node, children });
      }
    }
    return out;
  };

  return walk(types);
}

export function flattenExpenseTypeOptions(
  types: HierarchicalExpenseType[],
  level = 0
): Array<{ id: number; label: string }> {
  return types.flatMap((type) => [
    { id: type.id, label: `${level > 0 ? '— '.repeat(level) : ''}${type.name}` },
    ...flattenExpenseTypeOptions(type.children, level + 1),
  ]);
}
