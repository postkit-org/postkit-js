/**
 * Complete synchronous local work before starting any timed registry I/O.
 * Await the entire plan before the caller publishes anything, so integrity
 * mismatches cannot produce a partially published release.
 */
export async function createPublicationPlan(
  packageNames,
  { readManifest, pack, registryIntegrity, inspect = () => {} },
) {
  const contents = packageNames.map((packageName) => {
    inspect(packageName);
    const manifest = readManifest(packageName);
    const tarball = pack(packageName);
    if (tarball.version !== manifest.version) {
      throw new Error(
        `${packageName} tarball version does not match ${manifest.version}.`,
      );
    }
    return {
      packageName,
      version: manifest.version,
      integrity: tarball.integrity,
    };
  });

  return Promise.all(
    contents.map(async (entry) => {
      let publishedIntegrity;
      try {
        publishedIntegrity = await registryIntegrity(
          entry.packageName,
          entry.version,
        );
      } catch (cause) {
        throw new Error(
          `Could not inspect ${entry.packageName}@${entry.version} on npm.`,
          { cause },
        );
      }
      if (publishedIntegrity && publishedIntegrity !== entry.integrity) {
        throw new Error(
          `${entry.packageName}@${entry.version} already exists with different contents. Bump every public package version before publishing.`,
        );
      }
      return {
        ...entry,
        alreadyPublished: publishedIntegrity === entry.integrity,
      };
    }),
  );
}
