import styled from 'styled-components'
import {hues} from '@sanity/color'

export const StyledDescription = styled.details`
  summary {
    cursor: pointer;
  }
  div {
    margin-top: 0.5rem;
    margin-left: 0.75rem;
    svg {
      padding-right: 0.25rem;
    }
  }
`
export const InlineHelp = styled.div`
  margin-top: 2rem;
`

export const StyledTree = styled.ul`
  list-style: none;
  padding-left: 0;
  margin-block-start: 0;
  li svg.info {
    height: 1.2rem;
    width: 1.2rem;
    color: ${hues.gray[800].hex};
    border-radius: 3px;
    transition: all 0.1s ease-in-out;
    &.warning:hover {
      color: ${hues.gray[100].hex};
      background-color: ${hues.yellow[500].hex};
    }
    &.error {
      color: ${hues.red[500].hex};
      &:hover {
        color: ${hues.gray[100].hex};
        background-color: ${hues.red[500].hex};
      }
    }
  }
  li svg.spacer {
    height: 1.5rem;
    width: 1.5rem;
    visibility: hidden;
  }
`
export const HierarchyButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  svg {
    padding-right: 0.25rem;
  }
  &:hover {
    background-color: ${hues.gray[50].hex};
  }
  &.add:hover {
    background-color: ${hues.green[500].hex};
    span,
    svg {
      color: white;
    }
  }
`
export const StyledTreeButton = styled.button`
  background: none;
  border: none;
  padding: 0.2rem 0 0;
  cursor: pointer;
  svg {
    border-radius: 3px;
    transition: all 0.1s ease-in-out;
  }
  &.toggle svg {
    height: 1.5rem;
    width: 1.5rem;
  }
  &.action svg {
    height: 1.2rem;
    height: 1.2rem;
    width: 1.2rem;
    &:hover {
      color: ${hues.gray[100].hex} !important;
    }
    &.info:hover {
      background-color: ${hues.blue[500].hex};
    }
    &.add:hover {
      background-color: ${hues.green[500].hex};
    }
    &.remove:hover {
      background-color: ${hues.red[500].hex};
    }
  }
`
export const StyledTreeToggle = styled.button`
  background: none;
  border: none;
  padding: 0.2rem 0 0;
  cursor: pointer;
  svg {
    height: 1.5rem;
    width: 1.5rem;
  }
`

export const StyledTopConcept = styled.li`
  font-weight: bold;
  margin-top: 1rem;
  .untitled {
    color: ${hues.gray[400].hex};
    font-weight: normal;
  }
  button[aria-expanded='true'] svg {
    rotate: 90deg;
  }
  &.closed ul {
    display: none;
  }
`
export const StyledOrphan = styled.li`
  padding-top: 0.5rem;
  font-weight: normal;
  margin-top: 1rem;
  .untitled {
    color: ${hues.gray[400].hex};
  }
  button[aria-expanded='true'] svg {
    rotate: 90deg;
  }
  &.closed ul {
    display: none;
  }
`
export const StyledChildConcepts = styled.ul`
  list-style: none;
`
export const StyledChildConcept = styled.li`
  font-weight: normal;
  margin-top: 1rem;
  button[aria-expanded='true'] svg {
    rotate: 90deg;
  }
  &.closed ul {
    display: none;
  }
`
export const StyledConceptLink = styled.a`
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`
export const StyledConceptTitle = styled.p``
