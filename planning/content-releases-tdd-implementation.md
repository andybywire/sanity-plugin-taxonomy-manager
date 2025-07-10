# Content Releases TDD Implementation Plan

## Overview
Implement comprehensive Content Releases support for the Taxonomy Manager plugin using Test Driven Development principles. Focus on critical user paths: creating concepts in releases, editing existing concepts, and managing hierarchies across versions.

## Current Phase
**Phase 1: Foundation & Context Setup**

## Overall Progress
- [ ] Content Releases context and utilities created and tested
- [ ] Core hooks updated with TDD
- [ ] Tree View enhanced for version awareness
- [ ] Critical user paths working with releases

## Goals
- Enable users to create, edit, and delete concepts within releases
- Ensure Tree View displays published concepts while allowing release operations
- Implement proper version ID handling throughout the plugin
- Build comprehensive test coverage for critical user paths

## Architecture Decision: React Context for Release State

### Context Approach Benefits
- **Centralized Release Logic**: Calculate release state once at Tree View level
- **Avoid Prop Drilling**: Eliminate passing release info through multiple component layers
- **Consistent Behavior**: All components access same release information
- **Easier Testing**: Mock context for different test scenarios
- **Future-Proof**: Extensible for additional release features

### Context Structure
```typescript
type ReleaseContextType = {
  isInRelease: boolean
  releaseName?: string
  documentId: string
  versionId?: string
}
```

## Phase 1: Foundation & Context Setup (TDD)

### P1.1 Create Content Releases Context and Utilities
**Goal**: Build reusable context and utilities for version ID handling with comprehensive tests.

#### P1.1.1 Create Release Context
- [ ] Create `ReleaseContext` in `src/context.ts`
- [ ] Write tests for context creation and default values
- [ ] Test context with different document states (draft, published, versioned)
- [ ] Ensure context provides stable values across re-renders

#### P1.1.2 Create Version ID Utilities
- [ ] Create `src/utils/contentReleases.ts` with version ID helper functions
- [ ] Write tests for `isInRelease()`, `getVersionId()`, `getReleaseName()` functions
- [ ] Test edge cases: draft documents, published documents, versioned documents
- [ ] Ensure utilities handle all ID formats correctly

#### P1.1.3 Create Query Utilities
- [ ] Create `src/utils/queries.ts` with version-aware query builders
- [ ] Write tests for query builders that include published concepts
- [ ] Test query behavior with different document states
- [ ] Ensure queries work for both draft and release contexts

### P1.2 Update Tree View with Release Context (TDD)

#### P1.2.1 Enhance TreeView Component
- [ ] Write tests for TreeView with release context
- [ ] Update TreeView to calculate and provide release context
- [ ] Test context propagation to child components
- [ ] Ensure proper context updates when document changes

#### P1.2.2 Create Release Context Hook
- [ ] Create `useReleaseContext` hook for easy context consumption
- [ ] Write tests for hook behavior in different contexts
- [ ] Test hook error handling and edge cases
- [ ] Ensure hook provides stable return values

## Phase 2: Core Hooks Update (TDD)

### P2.1 Update Core Hooks with Context

#### P2.1.1 Refactor useCreateConcept
- [ ] Write tests for concept creation using release context
- [ ] Refactor hook to use `useReleaseContext` instead of manual calculations
- [ ] Test error handling and edge cases
- [ ] Ensure proper ID generation for all scenarios

#### P2.1.2 Update useRemoveConcept
- [ ] Write tests for concept removal using release context
- [ ] Update hook to use release context for version-aware operations
- [ ] Test removal from both topConcepts and concepts arrays
- [ ] Ensure proper cleanup of references

#### P2.1.3 Update useAddTitle
- [ ] Write tests for title addition using release context
- [ ] Update hook for version-aware operations
- [ ] Test validation and error handling

## Phase 3: Component Enhancement (TDD)

### P3.1 Update Tree View Components

#### P3.1.1 Update Hierarchy Component
- [ ] Write tests for hierarchy display with release context
- [ ] Update component to use release context
- [ ] Test concept selection and interaction in different contexts
- [ ] Ensure proper state management

#### P3.1.2 Update Concept Components
- [ ] Write tests for concept display and interaction with release context
- [ ] Update TopConcepts and Orphans components to use release context
- [ ] Test add/remove operations in different contexts
- [ ] Ensure proper event handling

### P3.2 Update Input Components

#### P3.2.1 Enhance ReferenceHierarchyInput
- [ ] Write tests for input behavior with release context
- [ ] Update component to handle versioned references
- [ ] Test selection and filtering behavior
- [ ] Ensure proper value handling

#### P3.2.2 Enhance ArrayHierarchyInput
- [ ] Write tests for array input behavior with release context
- [ ] Update component for version-aware operations
- [ ] Test array manipulation in different contexts
- [ ] Ensure proper validation

## Phase 4: Integration & Validation

### P4.1 End-to-End Testing

#### P4.1.1 Critical User Path Tests
- [ ] Test complete workflow: create concept scheme → add concepts → create release → edit in release
- [ ] Test hierarchy management across versions
- [ ] Test concept editing and deletion in releases
- [ ] Test error scenarios and recovery

#### P4.1.2 Performance Testing
- [ ] Test with large concept schemes
- [ ] Test query performance with versioned content
- [ ] Test UI responsiveness with complex hierarchies
- [ ] Validate memory usage patterns

### P4.2 Code Quality Improvements

#### P4.2.1 TypeScript Improvements
- [ ] Replace `any` types with proper interfaces
- [ ] Add comprehensive type definitions for release context
- [ ] Ensure strict TypeScript compliance
- [ ] Document complex type relationships

#### P4.2.2 Error Handling
- [ ] Implement consistent error handling patterns
- [ ] Add proper error boundaries
- [ ] Improve user feedback for errors
- [ ] Test error recovery scenarios

## Success Criteria
- [ ] Users can create concepts in releases successfully
- [ ] Users can edit existing concepts within releases
- [ ] Tree View displays published concepts while allowing release operations
- [ ] All critical user paths have test coverage
- [ ] No breaking changes to existing functionality
- [ ] Performance remains acceptable with versioned content
- [ ] Release context provides consistent behavior across all components

## TDD Process Guidelines

### Test-First Development
1. **Red**: Write a failing test that describes the desired behavior
2. **Green**: Write the minimum code to make the test pass
3. **Refactor**: Clean up the code while keeping tests green

### Test Structure for Context
```typescript
describe('ReleaseContext', () => {
  describe('when document is in draft', () => {
    it('should provide correct context values', () => {
      // Test implementation
    })
  })
  
  describe('when document is in release', () => {
    it('should provide correct context values', () => {
      // Test implementation
    })
  })
})
```

### Test Utilities
- Create reusable test utilities for common scenarios
- Mock Sanity client appropriately
- Use consistent test data patterns
- Document test patterns for team reference
- Create context providers for testing

## Dependencies
- Existing Content Releases work in `useCreateConcept.tsx`
- Current testing infrastructure (Vitest + React Testing Library)
- Sanity Studio v3.75.0+ for Content Releases support
- Existing React Context patterns in the plugin

## Notes
- Focus on critical user paths first, expand coverage later
- Maintain backward compatibility where possible
- Document all Content Releases patterns for future reference
- Use existing Sanity patterns and best practices
- Leverage existing context patterns in the plugin

---

## Completion Notes

### Files Modified/Created
*To be filled after completion*

### Key Features Implemented
*To be filled after completion*

### Technical Improvements Made
*To be filled after completion*

### User Experience Enhancements
*To be filled after completion*

### Issues Resolved
*To be filled after completion*

---

**Last Updated:** [Date will be set after completion] 