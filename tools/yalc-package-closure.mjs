export function createPostkitPackageGraph(packageEntries) {
  return new Map(
    packageEntries.map((entry) => [entry.packageName, entry.manifest]),
  );
}

function internalDependencies(manifest, packageGraph) {
  const declared = {
    ...manifest.dependencies,
    ...manifest.optionalDependencies,
    ...manifest.peerDependencies,
  };
  return Object.keys(declared).filter((name) => packageGraph.has(name));
}

export function resolvePostkitPackageClosure(
  packageName,
  packageGraph,
  packageOrder = [...packageGraph.keys()],
) {
  if (!packageGraph.has(packageName)) {
    throw new Error(`Unknown Postkit package: ${packageName}.`);
  }

  const closure = new Set();
  const visiting = new Set();

  function visit(name) {
    if (closure.has(name)) return;
    if (visiting.has(name)) {
      throw new Error(`Circular Postkit package dependency involving ${name}.`);
    }
    visiting.add(name);
    const manifest = packageGraph.get(name);
    for (const dependency of internalDependencies(manifest, packageGraph)) {
      visit(dependency);
    }
    visiting.delete(name);
    closure.add(name);
  }

  visit(packageName);
  closure.delete(packageName);
  return packageOrder.filter((name) => closure.has(name));
}

export function missingPostkitPackageClosure({
  consumerPath,
  installations,
  packageName,
  packageGraph,
  packageOrder,
}) {
  return resolvePostkitPackageClosure(
    packageName,
    packageGraph,
    packageOrder,
  ).filter(
    (dependency) => !(installations[dependency] ?? []).includes(consumerPath),
  );
}
