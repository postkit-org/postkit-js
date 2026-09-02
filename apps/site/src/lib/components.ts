import {
  postkitComponentCatalog,
  type PostkitComponentCatalogEntry,
  type PostkitComponentCategory,
  type PostkitComponentName,
} from '@postkit/react';

export interface ComponentCategoryGroup {
  readonly category: PostkitComponentCategory;
  readonly components: readonly PostkitComponentCatalogEntry[];
}

export const componentEntries = Object.freeze(
  Object.values(postkitComponentCatalog.components),
);

export const componentCategoryGroups = Object.freeze(
  componentEntries.reduce<ComponentCategoryGroup[]>((groups, component) => {
    const existing = groups.find(
      (group) => group.category === component.category,
    );

    if (existing) {
      (existing.components as PostkitComponentCatalogEntry[]).push(component);
      return groups;
    }

    groups.push({
      category: component.category,
      components: [component],
    });
    return groups;
  }, []),
);

export function componentNameToSlug(name: PostkitComponentName): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function getComponentBySlug(
  slug: string,
): PostkitComponentCatalogEntry | undefined {
  return componentEntries.find(
    (component) => componentNameToSlug(component.name) === slug,
  );
}
