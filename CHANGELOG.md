# Changelog
All notable changes to this project will be documented in this file.

The format of this document is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- ## [TODO] -->

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
--->