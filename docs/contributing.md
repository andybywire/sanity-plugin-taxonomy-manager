<h1 class="title">Contributing</h1>

[filename](_includes/shields.md ':include')

<p class='large'>I welcome contributions, suggestions, and requests at all levels, from fixing a typo to improving the code to suggesting or proposing new functionality.<p>

## How to Contribute

However you'd like to contribute, check out the [project goals](/contributing?id=project-goals) and [design principles](/contributing?id=design-principles) below. These should give you a better sense of where help is most needed and of what kinds of features and improvements will make for a good fit.

Once you have a sense of the purpose and direction of this project, you might:

- **Contribute to the code**: Check out the [issues tab](https://github.com/andybywire/sanity-plugin-taxonomy-manager/issues) and pick up a feature or fix a bug, or propose an improvement to current functionality.
- **Contribute to the documentation**: This can be either by suggesting edits to the docs with a pull request, or by asking questions on the [repository discussions tab](https://github.com/andybywire/sanity-plugin-taxonomy-manager/discussions).
- **Ask questions or request features**: Not ready to fork a repo and make a PR? I'd love to hear your feedback and ideas all the same. head over to the [discussions tab](https://github.com/andybywire/sanity-plugin-taxonomy-manager/discussions) and ask a question, share an idea, or share an example of how you've used the plugin in your own Studio project.

<!-- Consider adding instructions for development: see for e.g. https://www.npmjs.com/package/sanity-plugin-order-documents/v/0.0.23 -->

## Project Goals

- Provide **tools** and **resources** for building, maintaining, and evolving standards compliant controlled vocabularies in Sanity Studio
- Provide **affordances** and **templates** for purposefully integrating and using those vocabularies with Sanity schemas in order to support connected, dynamic content
- Provide **workflows** and **utilities** for easily moving to more robust tooling when user needs outgrow what Sanity Studio can provide

## Design Principles

1. **Adhere to W3C SKOS Standards**  
   The Simple Knowledge Organization Systems (SKOS) is W3C specification and standard designed to support the creation and use of knowledge organization systems (KOS) such as thesauri, classification schemes, and taxonomies within the framework of the Semantic Web. These standards are stable and widely adopted in semantic web applications (such as knowledge graphs). By diligently adhering to the SKOS standard, the Taxonomy Manager plugin allows users to create KOSes that are interoperable with other semantic web standards and systems, and reusable across standards compliant applications.

1. **Actively Support Best Practices**  
   The SKOS model is powerful because it accommodates a wide variety of modeling and knowledge management needs. Many edge cases that are technically _correct_ in SKOS are in practice poor solutions for the most common needs. Where possible, Taxonomy Manager should provide guardrails and guidance to help users create the simplest, most effective structures for their needs.

1. **Easy to Adopt; Easy to Abandon**  
   Taxonomy Manager is intended to create a low barrier to entry for building interoperable, standards compliant taxonomies in Sanity Studio. It's goal is to help users start with a portable, semantically sound foundation. It does _not_ aspire to replace full featured standalone vocabulary management and integration tools. When a Sanity Studio user finds that their needs have outgrown what Taxonomy Manager can provide, the tool should make it as easy for them to migrate their work to another platform as it was to get started in the first place.

1. **Adhere to Industry Design Conventions**  
   Standalone taxonomy management and semantic web tools have several consistent design and navigation patterns, such as for navigating hierarchy trees, viewing concept details, and adding and deleting concepts. Where possible and in the best interest of users, Taxonomy Manager should endeavor to follow these conventions. This allows users familiar with these tools to orient themselves quickly, and introduces those new to taxonomy management tools conventions that will apply elsewhere. For examples, consider Graphite (Synaptica), Semaphore (MarkLogic), TopBraid Enterprise Data Governance (TopQuadrant), and PoolParty (Semantic Web Company)

1. **Adhere to Sanity Studio Design Conventions**  
   Taxonomy Manager is built from the ground up _for_ Sanity Studio. After the above considerations have been taken into account, all efforts should be made to use Sanity Studio's design system, tools, and components to make Taxonomy Manager feel like an integral part of the Studio experience. This applies to user interface, and to the substantial efforts Sanity has made to first class support of accessibility and usability.

## Values

Through many years and many roles, I have learned that I do my best work by focusing on three core values:

- Be kind
- Work hard
- Stay humble

As this is a collaborative project, I am of course open to &mdash; and will keep an open mind about &mdash; others' collaboration styles. These values give you a sense of where I'm coming from, however, and, if you're looking for a set of values to build on yourself, these aren't a bad place to start.

## Development Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- Git

### Quick Start

1. Clone and install dependencies
2. Run tests to verify setup
3. Start development server

### Code Quality

- TypeScript strict mode enabled
- ESLint with React and accessibility rules
- Pre-commit hooks (if configured)

### Testing

- Vitest for unit and component tests
- React Testing Library for component testing
- Sanity client mocking patterns established

## Development Guide

### Project Structure

- `src/components/` - React components
- `src/helpers/` - Utility functions
- `src/hooks/` - Custom React hooks
- `src/test/` - Test setup and utilities

### Testing

- Tests alongside source files (`.test.ts`/`.test.tsx`)
- Component tests with React Testing Library
- Utility tests with Vitest
- Sanity ecosystem mocking in `src/test/setup.ts`

### Development Workflow

- Feature branches from main
- Tests must pass before merge
- Follow TypeScript strict mode
- Use established component patterns
