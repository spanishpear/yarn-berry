import {structUtils}        from '@yarnpkg/core';

import {NpmTarballResolver} from '../sources/NpmTarballResolver';

describe(`NpmTarballResolver`, () => {
  describe(`supportsDescriptor`, () => {
    it(`should support descriptors with __archiveUrl parameter`, () => {
      const resolver = new NpmTarballResolver();

      const ident = structUtils.makeIdent(null, `foo`);
      const descriptor = structUtils.makeDescriptor(ident, `npm:1.0.0::__archiveUrl=https://example.com/foo.tgz`);

      const supports = resolver.supportsDescriptor(descriptor, null as any);

      expect(supports).toEqual(true);
    });

    it(`should support descriptors with URL-encoded __archiveUrl parameter (JFROG format)`, () => {
      const resolver = new NpmTarballResolver();

      const ident = structUtils.makeIdent(`scope`, `package-name`);
      const descriptor = structUtils.makeDescriptor(ident, `npm:1.2.3::__archiveUrl=https%3A%2F%2Fpackages.company.com%2Fapi%2Fnpm%2Fregistry-name%2F%40scope%2Fpackage-name%2F-%2F%40scope%2Fpackage-name-1.2.3.tgz`);

      const supports = resolver.supportsDescriptor(descriptor, null as any);

      expect(supports).toEqual(true);
    });

    it(`should not support descriptors without __archiveUrl parameter`, () => {
      const resolver = new NpmTarballResolver();

      const ident = structUtils.makeIdent(null, `foo`);
      const descriptor = structUtils.makeDescriptor(ident, `npm:1.0.0`);

      const supports = resolver.supportsDescriptor(descriptor, null as any);

      expect(supports).toEqual(false);
    });

    it(`should not support non-npm descriptors`, () => {
      const resolver = new NpmTarballResolver();

      const ident = structUtils.makeIdent(null, `foo`);
      const descriptor = structUtils.makeDescriptor(ident, `https://example.com/foo.tgz`);

      const supports = resolver.supportsDescriptor(descriptor, null as any);

      expect(supports).toEqual(false);
    });
  });

  describe(`getCandidates`, () => {
    it(`should convert descriptor with __archiveUrl to locator`, async () => {
      const resolver = new NpmTarballResolver();

      const ident = structUtils.makeIdent(null, `foo`);
      const descriptor = structUtils.makeDescriptor(ident, `npm:1.0.0::__archiveUrl=https://example.com/foo.tgz`);

      const candidates = await resolver.getCandidates(descriptor, {}, null as any);

      expect(candidates.length).toEqual(1);
      expect(candidates[0].identHash).toEqual(descriptor.identHash);
      expect(candidates[0].reference).toEqual(`npm:1.0.0::__archiveUrl=https://example.com/foo.tgz`);
    });

    it(`should convert descriptor with URL-encoded __archiveUrl to locator (JFROG format)`, async () => {
      const resolver = new NpmTarballResolver();

      const ident = structUtils.makeIdent(`scope`, `package-name`);
      const descriptor = structUtils.makeDescriptor(ident, `npm:1.2.3::__archiveUrl=https%3A%2F%2Fpackages.company.com%2Fapi%2Fnpm%2Fregistry-name%2F%40scope%2Fpackage-name%2F-%2F%40scope%2Fpackage-name-1.2.3.tgz`);

      const candidates = await resolver.getCandidates(descriptor, {}, null as any);

      expect(candidates.length).toEqual(1);
      expect(candidates[0].identHash).toEqual(descriptor.identHash);
      expect(candidates[0].reference).toEqual(`npm:1.2.3::__archiveUrl=https%3A%2F%2Fpackages.company.com%2Fapi%2Fnpm%2Fregistry-name%2F%40scope%2Fpackage-name%2F-%2F%40scope%2Fpackage-name-1.2.3.tgz`);
    });
  });

  describe(`getSatisfying`, () => {
    it(`should filter locators that match the descriptor`, async () => {
      const resolver = new NpmTarballResolver();

      const ident = structUtils.makeIdent(null, `foo`);
      const descriptor = structUtils.makeDescriptor(ident, `npm:1.0.0::__archiveUrl=https://example.com/foo.tgz`);
      const matchingLocator = structUtils.makeLocator(ident, `npm:1.0.0::__archiveUrl=https://example.com/foo.tgz`);
      const nonMatchingLocator = structUtils.makeLocator(ident, `npm:1.0.0::__archiveUrl=https://example.com/bar.tgz`);

      const results = await resolver.getSatisfying(
        descriptor,
        {},
        [matchingLocator, nonMatchingLocator],
        null as any,
      );

      expect(results.locators.length).toEqual(1);
      expect(results.locators[0].locatorHash).toEqual(matchingLocator.locatorHash);
    });

    it(`should filter locators that match the descriptor with URL-encoded __archiveUrl (JFROG format)`, async () => {
      const resolver = new NpmTarballResolver();

      const ident = structUtils.makeIdent(`scope`, `package-name`);
      const descriptor = structUtils.makeDescriptor(ident, `npm:1.2.3::__archiveUrl=https%3A%2F%2Fpackages.company.com%2Fapi%2Fnpm%2Fregistry-name%2F%40scope%2Fpackage-name%2F-%2F%40scope%2Fpackage-name-1.2.3.tgz`);
      const matchingLocator = structUtils.makeLocator(ident, `npm:1.2.3::__archiveUrl=https%3A%2F%2Fpackages.company.com%2Fapi%2Fnpm%2Fregistry-name%2F%40scope%2Fpackage-name%2F-%2F%40scope%2Fpackage-name-1.2.3.tgz`);
      const nonMatchingLocator = structUtils.makeLocator(ident, `npm:1.2.3::__archiveUrl=https%3A%2F%2Fpackages.company.com%2Fapi%2Fnpm%2Fregistry-name%2F%40scope%2Fother-package%2F-%2F%40scope%2Fother-package-1.2.3.tgz`);

      const results = await resolver.getSatisfying(
        descriptor,
        {},
        [matchingLocator, nonMatchingLocator],
        null as any,
      );

      expect(results.locators.length).toEqual(1);
      expect(results.locators[0].locatorHash).toEqual(matchingLocator.locatorHash);
    });
  });
});
