# 📓 Changelog

All notable changes to this project will be documented in this file.

The format of this document is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- ## [TODO] -->

## [2.0.6] - 2023-05-04

### Added

- Add Tree View validation of 5 level hierarchy limit
- Add icons and messaging for schema concepts over 5 levels deep
- Add "getting started" messaging for new Concept Schemes
- Add "keeping going" messaging for Concept Schemes with no concepts yet assigned.

## [2.0.5] - 2023-05-01

### Fixed

- Bug in hierarchy tree that caused it to be rendered twice.
- Issue with style forced the use of inline styles (converted to Styled Components)

### Changed

- Modularized hierarchy tree components

## [2.0.4] - 2023-03-19

### Added

- Add detail for Preferred Label and Base IRI usage to README.

## [2.0.3] - 2023-02-04

### Added

- Revise Concept preview subtitle to show immediate broader term(s) only.

## [2.0.2] - 2023-01-29

### Added

- Support for single level concept schemes with no designated topConcept: Handle absence of topConcepts and omit 'orphan' label when no topConcept is present
- Data specific Types for components & schema definitions

## [2.0.1] - 2023-01-21

### Fixed

- Improved taxonomy tree effect to eliminate extra delay in fetching from the content lake.

## [2.0.0] - 2023-01-16

### ⚠ BREAKING CHANGES

- This version no longer works in Sanity Studio V2

### Added

- Initial Sanity Studio V3 release

## [2.0.0-beta.0] - 2023-01-16

### Added

- Beta Sanity Studio V3 release

## [1.0.5] - 2022-11-23

### Fixed

- README link that was not behaving as intended across applications.

## [1.0.4] - 2022-10-20

### Fixed

- Taxonomy Tree CSS was spilling over into description fields for the studio. Added unique classes to keep plugin styling from being too enterprising.

## [1.0.3] - 2022-09-29

### Fixed

- Concept Scheme Tree View bug that caused by missing parent document value on first render.

### Changed

- Improved taxonomy scheme field descriptions.

## [1.0.2] - 2022-09-28

### Fixed

- Fixed bug introduced by Sanity Studio update 2.33.0 that made `parent` unavailable to custom components directly.

### Changed

- Made concept scheme assignment `async` to improve consistency of Concept Scheme Tree View rendering.

## [1.0.1] - 2022-06-12

### Added

- Add "Concept Scheme Tree View" custom component to Taxonomy Schemes view. List shows hierarchy, Top Concepts, orphans, and polyhierarchial concepts.

## [1.0.0] - 2022-04-01

### Added

- Move "Settings" data into `config.json`, update initial value fields/functions, and remove "Taxonomy Settings" document scheme
- Validate [PrefLabel uniqueness](https://www.w3.org/TR/skos-primer/#secpref) across concept collection
- Validate [Related Concept and Transitive Broader disjunction](https://www.w3.org/TR/skos-reference/#L2422)

## [0.2.0] - 2022-03-22

### Added

- Move "Settings" data into `config.json`, update initial value fields/functions, and remove "Taxonomy Settings" document scheme

## [0.1.0] - 2022-03-17

### Added

- Tag initial development release
- Update README with installation, basic use instructions, and development warning
- Add changelog
- Migrate SKOS Taxonomy Management schemas from local development branch to (this) plugin repository

<!---
## Change Log Principles
- Changelogs are for humans, not machines.
- There should be an entry for every single version.
- The same types of changes should be grouped.
- Versions and sections should be linkable.
- The latest version comes first.
- The release date of each version is displayed.
- Mention whether you follow Semantic Versioning.

## Tags
### Added
- for new features.
### Changed
- for changes in existing functionality.
### Deprecated
- for soon-to-be removed features.
### Removed
- for now removed features.
### Fixed
- for any bug fixes.
### Security
- in case of vulnerabilities.

### Unreleased
- Keep at the top to track upcoming changes.
- People can see what changes they might expect in upcoming releases
- At release time, you can move the Unreleased section changes into a new release version section.

## Commit Message Prefixes
### feat: a new feature for the user
### fix: a bug fix for the user
### chore: changes that aren't a fix or feature and don't modify src or test files
### docs: changes to the documentation
### style: formatting changes that do not affect the meaning of the code
### test: adding or refactoring tests

### Release Process
1. Safety Checks:
  - git pull
  - git status
  - npm ci
  - npm test
2. Prepare the Release:
  - npm run build
3. Update the Changelog
4. Update the Version Number:
  - npm version patch | minor | major -m "message"
5. Publish to npm:
  - npm publish
6. Publish to Git:
  - git push
  - git push --tags
7. Create a GitHub Release (optional)
8. Update (reinstall) plugin in staging studio, run `sanity deploy`, and validate published package. 

source: https://cloudfour.com/thinks/how-to-publish-an-updated-version-of-an-npm-package/
