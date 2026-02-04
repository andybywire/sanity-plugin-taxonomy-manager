# 📓 Changelog <!-- {docsify-ignore} -->

All notable changes to this project will be documented in this file.

<!--
## Tags which generate a release
Be sure to prepend these to commits as I work!
- fix: which represents bug fixes, and correlates to a SemVer patch.
- feat: which represents a new feature, and correlates to a SemVer minor.
- feat!:, or fix!:, refactor!:, etc., which represent a breaking change (indicated by the !) and will result in a SemVer major.

## Non-releasable units (should not generate a release)
- chore: changes that aren't a fix or feature and don't modify src or test files
- docs: changes to the documentation
- style: formatting changes that do not affect the meaning of the code
- test: adding or refactoring tests

## Pushing releases to NPM
- `release-please` will generate PR that creates a GitHub release, bumps the version number, and updates the CHANGELOG
- merge the PR, then, to release on NPM, run:
  - git pull origin main --tags
  - npm whoami || npm login      # verify login, log in if not authenticated
  - npm test
  - npm publish
-->

## [4.4.3](https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v4.4.2...v4.4.3) (2025-12-16)

### Bug Fixes

- update react, react-dom, and Sanity peer deps ([891919a](https://github.com/andybywire/sanity-plugin-taxonomy-manager/commit/891919a4f4314dd70f4c9e4e8b14fceac11bba98))

## [4.4.2](https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v4.4.1...v4.4.2) (2025-12-07)

### Bug Fixes

- align repo and npm release versions ([b89db1a](https://github.com/andybywire/sanity-plugin-taxonomy-manager/commit/b89db1a098df805969eb2ca810a605e100d80578))

## [4.4.1](https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v4.4.1...v4.4.1) (2025-12-07)

### Miscellaneous Chores

- adjust first release-please baseline ([9577f82](https://github.com/andybywire/sanity-plugin-taxonomy-manager/commit/9577f8261f68a7c646455ac323bdf483d3cd6c95))

## [4.4.1](https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v4.4.0...v4.4.1) (2025-12-07)

### Chore

- correct baseline release to 4.4.1

## [4.4.0](https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/sanity-plugin-taxonomy-manager-v4.3.1...sanity-plugin-taxonomy-manager-v4.4.0) (2025-12-06)

### Docs

- update docs to include details on configuring hierarchy view options and importing terms from a spreadsheet
- update docs to include recent demo and tutorial videos

## [4.3.1] - 2025-11-17

### Chore

- Simplify CSS to mollify manifest extraction

## [4.3.0] - 2025-11-17

### Feature

- Set hierarchy trees in input components to closed by default
- Add an option to input components to set hierarchy trees to "open" on a per-field basis
- No longer display the top-level "branch filter" term in input component hierarchies

### Chore

- Improve scheme and branch filter inline documentation

## [4.2.2] - 2025-11-16

### Fix

- Correct overzealous orphan tagging

## [4.2.1] - 2025-11-16

### Fix

- Catch missing children on deleted concepts to prevent crash

### Chore

- Remove no-longer used helpers and imports

## [4.2.0] - 2025-11-15

### Feature

- Improve usability with clearer select interactions, tooltips, and information dialogues
- Align styling more closely with Sanity UI patterns using more Sanity native components

### Chores

- Modularize repeated components for better maintainability and iteration
- Remove all instances of styled components (library still in to support the build - there appear to be a dependency that needs it)

## [4.1.0] - 2025-11-08

### Feature

- Add Concept Use view to SKOS Concept document to show the number of resources tagged with a particular concept and list links to tagged documents

## [4.0.4] - 2025-11-01

### Feature

- Add truncation and native tooltip to conceptScheme treeView for very long prefLabels to prevent wrapping and misalignment

## [4.0.3] - 2025-10-21

### Feature

- Add truncation and native tooltip for very long prefLabels to prevent wrapping and misalignment

### Chore

- Improve child concept types

## [4.0.2] - 2025-09-26

### Chore

- Improve React 19 peer dependency declarations

## [4.0.1] - 2025-09-25

### Fix

- Correct React 19 peer dependency typo

## [4.0.0] - 2025-09-16

### Chore

- Require Node.js 20 instead of Node.js 18, in keeping with Sanity Studio requirements (hence the major version step)
- Upgrade to React 19, with 18 still allowed as a peer dependency

## [3.4.0] - 2025-08-01

### Feature

- Add full support for Content Releases for taxonomies and hierarchy input components
- Improve child concept tooltips
- Improve No Concepts messaging and display logic
- Correct ARIA labels

### Chore

- Update listening query to be more efficient & responsive
- Add usePerspective() hook to streamline TreeView & Hierarchy
- Remove deprecated "edit" controls
- Update lint settings
- Tidy and restructure repo
- Improve typing

### Fix

- Remove "New Scheme" guide from hierarchy input component

## [3.3.3] - 2025-06-10

### Fix

- update `prefLabel` query to use raw perspective

## [3.3.2] - 2025-06-10

### Fix

- update `prefLabel` validation to support Releases for taxonomy schemes

## [3.3.1] - 2025-05-29

### Fix

- fix slow branch query by grouping broader lookups (thanks @smundro!)

## [3.3.0] - 2025-04-08

### Fix

- fix a bug in filter resolution that was preventing the execution of field-level copy and paste actions

### Feature

- simplify filter helper configurations
- improve Studio configuration messaging

### Chore

- improve error checking

### Docs

- update filter helper and input component documentation
- add input component structure documentation (Mermaid)
- improve inline (ts.doc) documentation
- add ts.doc configuration examples

## [3.2.9] - 2025-03-13

### Fix

- Add dark mode support for hierarchy input component

## [3.2.8] - 2025-03-11

### Fix

- Fix concept link and button usability in dark mode.
- Correct History Note description type (skosConcept)

## [3.2.7] - 2025-02-12

### Fix

- Fix `.length` detection bug that was causing the ArrayHierarachicalInput component to crash with flat schemes

## [3.2.6] - 2024-12-07

### Fix

- Typo in Concept Scheme description

## [3.2.5] - 2024-11-02

### Fix

- Fix term double-entry in tree view when there are unsaved edits

## [3.2.4] - 2024-09-30

### Added

- Hierarchical input component for array fields
- Array input component documentation

### Fix

- Documentation formatting bug

## [3.2.3] - 2024-09-27

### Added

- Add "done" control to close scheme concept editing controls

### Fix

- Debug new scheme creation guides
- Fix concept editing controls icon hover color

### Chore

- Update packages

## [3.2.2] - 2024-09-18

### Chore

- Remove concept management controls boolean (not needed since v.2)
- Add custom input component to prevent current users from encountering a schema error

## [3.2.1] - 2024-09-15

### Chore

- Modularize & deduplicate hierarchy input components
- Improve inline comments & TSDoc
- Modularize, organize & tighten code

## [3.2.0] - 2024-08-29

### Added

- Support for custom fields for SKOS Concepts
- Support for custom fields for SKOS Concept Schemes
- Documentation for adding custom fields

## [3.1.5] - 2024-08-24

### Chore

- Update deskTool to structureTool

## [3.1.4] - 2024-08-24

### Chore

- Update packages & dependencies

## [3.1.3] - 2024-03-15

### Chore

- Upgrade `styled-components`

## [3.1.2] - 2024-03-15

### Fixed

- Add missing peer dependencies, remove unused packages

## [3.1.1] - 2023-12-03

### Added

- Add hierarchy input component use instructions to documentation

### Changed

- Optimized tree view query for speed

## [3.1.0] - 2023-11-05

### Added

- Add Hierarchy Input Component support for reference fields using schemeInput() and branchInput() filter helpers

### Changed

- Tree View edit controls are no longer activated via the Concept Management Controls boolean; these now rely on state. (Boolean to be removed in a future iteration)

### Fixed

- Removed "live edit" behavior: changes made to concept schemes from the Tree View now create draft documents
- Remove unnecessary circular dependencies

## [3.1.0-beta.2] - 2023-10-03

### Added

- Add informational Top Concept element to Hierarchy Input component

## [3.1.0-beta.0] - 2023-10-02

### Added

- Beta release of hierarchical reference input component picker

## [3.0.2] - 2023-09-13

### Changed

- Improve TS Doc descriptions for branch & scheme filters

## [3.0.1] - 2023-06-29

### Fixed

- Update homepage URL for NPM README

## [3.0.0] - 2023-06-28

### Added

- Standalone tool pane in Sanity Studio
- Additional taxonomy building instructions to Docs
- Contributing section to Docs
- Documentation for upgrade paths for schemas still using v1.0 configurations

### Removed

- Support for some `baseUri` and `skosConceptScheme` fields created with v1.0 schema

## [2.3.1] - 2023-06-25

### Added

- Document upgrade notice for schemas still using v1.0 configuration

## [2.3.0] - 2023-06-12

### Added

- Collapse / expand functionality to tree view
- Keyboard and screen reader support for collapse/expand, editing actions, and detail links
- Clarify types and parameters for plugin and helpers
- Add standalone documentation site
- Add progressive disclosure to description fields and improve SKOS Concept field descriptions

## [2.2.2] - 2023-06-06

### Added

- Specification of Base URI in plugin configuration in sanity.config
- Concept ID generator (for concepts and schemes using previous versions)
- Reference filter helpers

## [2.2.1] - 2023-06-01

### Added

- Add informational dialogues to taxonomy terms when definition, example, or scope note content
  is available.

## [2.2.0] - 2023-05-29

### Added

- Concept links to hierarchy view
- "Add top concept" and "add concept" functionality to hierarchy view
- Description to Tree View pane
- "Add Child Concept" functionality to concepts in hierarchy view
- "Remove Concept" functionality to concepts in hierarchy view
- Title and description guidance and functionality in hierarchy view

## [2.1.0][] - 2023-05-10

### Added

- Base URI field to skosConceptScheme
- Add History, Editorial, and Change Notes
- Add detailed descriptions and examples for Note fields

### Changed

- Improved Base URI field description content and formatting

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

[unreleased]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v4.3.1...HEAD
[4.3.1]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v4.3.0...v4.3.1
[4.3.0]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v4.2.2...v4.3.0
[4.2.2]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v4.2.1...v4.2.2
[4.2.1]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v4.2.0...v4.2.1
[4.2.0]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v4.1.4...v4.2.0
[4.1.0]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v4.0.4...v4.1.0
[4.0.4]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v4.0.3...v4.0.4
[4.0.3]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v4.0.2...v4.0.3
[4.0.2]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v4.0.1...v4.0.2
[4.0.1]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v4.0.0...v4.0.1
[4.0.0]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.4.3...v4.0.0
[3.4.0]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.3.3...v3.4.0
[3.3.2]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.3.2...v3.3.3
[3.3.2]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.3.1...v3.3.2
[3.3.1]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.3.0...v3.3.1
[3.3.0]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.2.9...v3.3.0
[3.2.9]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.2.8...v3.2.9
[3.2.8]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.2.7...v3.2.8
[3.2.7]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.2.6...v3.2.7
[3.2.6]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.2.5...v3.2.6
[3.2.5]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.2.4...v3.2.5
[3.2.4]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.2.3...v3.2.4
[3.2.3]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.2.2...v3.2.3
[3.2.2]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.2.1...v3.2.2
[3.2.1]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.2.0...v3.2.1
[3.2.0]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.1.5...v3.2.0
[3.1.5]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.1.4...v3.1.5
[3.1.4]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.1.3...v3.1.4
[3.1.3]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.1.2...v3.1.3
[3.1.2]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.1.1...v3.1.2
[3.1.1]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.1.0...v3.1.1
[3.1.0]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.1.0-beta.2...v3.1.0
[3.1.0-beta.1]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.1.0-beta.0...v3.1.0-beta.2
[3.1.0-beta.0]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.0.2...v3.1.0-beta.0
[3.0.2]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.0.1...v3.0.2
[3.0.1]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v2.3.1...v3.0.0
[2.3.1]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v2.2.2...v2.3.0
[2.2.2]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v2.2.1...v2.2.2
[2.2.1]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v2.0.6...v2.1.0
[2.0.6]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v2.0.5...v2.0.6
[2.0.5]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v2.0.4...v2.0.5
[2.0.4]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v2.0.3...v2.0.4
[2.0.3]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/2.0.0-beta.0...v2.0.0
[2.0.0-beta.0]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v1.0.5...v2.0.0-beta.0
[1.0.5]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v0.2.0...v1.0.0
[0.2.0]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/andybywire/sanity-plugin-taxonomy-manager/releases/tag/v0.1.0

<!---
# Previous release process notes
- prior to adopting an automated `release-please` workflow

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
    (this is to verify there won't be errors on build)
3. Update the Changelog
4. Update the Version Number:
  - npm version patch | minor | major -m "message"
5. Publish to npm:
  - npm publish
    (this runs the build steps again)
  - publish as beta: npm publish --tag beta
    - format version to: "version": "0.1.12-beta.1"
6. Publish to Git:
  - git push
  - git push --tags
7. Create a GitHub Release (optional)
8. Update (reinstall) plugin in staging studio, deploy updated studio, and validate published package.
  - npm i sanity-plugin-taxonomy-manager
  - sanity deploy
  - https://taxonomy-manager.sanity.studio/

source: https://cloudfour.com/thinks/how-to-publish-an-updated-version-of-an-npm-package/
-->
