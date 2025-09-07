import {Descriptor, Locator, MinimalResolveOptions, ResolveOptions, Resolver, Package} from '@yarnpkg/core';
import {structUtils}                                                                   from '@yarnpkg/core';

import {PROTOCOL}                                                                      from './constants';

/**
 * The NpmTarballResolver handles npm packages that have unconventional tarball URLs.
 *
 * For example:
 * - Standard: https://registry.npmjs.org/@scope/package/-/package-1.0.0.tgz
 * - Artifactory/JFrog: https://registry.com/@scope/package/-/@scope/package-1.0.0.tgz
 *
 * When Yarn encounters these unconventional URLs, it adds an __archiveUrl parameter
 * to the descriptor/locator. This resolver specifically handles those cases.
 *
 * The PatchResolver assumes every source locator can work as a descriptor too,
 * so we also add full locator support to enable patching of packages with unconventional tarballs.
 */
export class NpmTarballResolver implements Resolver {
  /**
   * Determines if this resolver can handle the given descriptor.
   * Only supports npm: descriptors that have an __archiveUrl parameter.
   */
  supportsDescriptor(descriptor: Descriptor, opts: MinimalResolveOptions) {
    if (!descriptor.range.startsWith(PROTOCOL))
      return false;

    const {params} = structUtils.parseRange(descriptor.range);
    if (params === null || typeof params.__archiveUrl !== `string`)
      return false;

    return true;
  }

  /**
   * Determines if this resolver can handle the given locator.
   * Only supports npm: locators that have an __archiveUrl parameter.
   */
  supportsLocator(locator: Locator, opts: MinimalResolveOptions) {
    if (!locator.reference.startsWith(PROTOCOL))
      return false;

    const {params} = structUtils.parseRange(locator.reference);
    if (params === null || typeof params.__archiveUrl !== `string`)
      return false;

    return true;
  }

  /**
   * Once transformed into locators, the descriptors are resolved by the NpmSemverResolver
   */
  shouldPersistResolution(locator: Locator, opts: MinimalResolveOptions): never {
    throw new Error(`Unreachable`);
  }

  /**
   * Returns descriptor unchanged because __archiveUrl is self-contained
   * and doesn't need to be bound to a parent locator context.
   */
  bindDescriptor(descriptor: Descriptor, fromLocator: Locator, opts: MinimalResolveOptions) {
    return descriptor;
  }

  /**
   * Returns empty object because __archiveUrl packages don't introduce
   * additional resolution dependencies beyond the base npm package.
   */
  getResolutionDependencies(descriptor: Descriptor, opts: MinimalResolveOptions) {
    return {};
  }

  /**
   * Returns a single candidate by converting descriptor to locator because
   * __archiveUrl descriptors map 1:1 to their corresponding locators.
   */
  async getCandidates(descriptor: Descriptor, dependencies: Record<string, Package>, opts: ResolveOptions) {
    return [structUtils.convertDescriptorToLocator(descriptor)];
  }

  /**
   * Filters locators by exact equality because __archiveUrl locators
   * must match exactly (including the archiveUrl parameter).
   */
  async getSatisfying(descriptor: Descriptor, dependencies: Record<string, Package>, locators: Array<Locator>, opts: ResolveOptions) {
    const baseLocator = structUtils.convertDescriptorToLocator(descriptor);
    return {locators: locators.filter(locator => structUtils.areLocatorsEqual(locator, baseLocator)), sorted: false};
  }

  /**
   * Resolves a locator with __archiveUrl to a package.
   *
   * Since __archiveUrl is only needed for fetching, we create a clean version
   * of the locator without it, delegate to NpmSemverResolver for package metadata,
   * then return the resolved package with the original __archiveUrl preserved.
   */
  resolve(locator: Locator, opts: ResolveOptions): never {
    throw new Error(`Unreachable`);
  }
}
