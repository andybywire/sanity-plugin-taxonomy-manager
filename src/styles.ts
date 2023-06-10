import styled from 'styled-components'
import {hues} from '@sanity/color'

export const DescriptionDetail = styled.p`
  margin-top: 0.5rem;
  margin-left: 0.75rem;
`
export const InlineHelp = styled.div`
  margin-top: 2rem;
`

export const InfoDialog = styled.div`
  svg {
    height: 1.2rem;
    width: 1.2rem;
    color: ${hues.gray[800].hex};
    border-radius: 3px;
    transition: all 0.1s ease-in-out;
    &.brand:hover {
      color: ${hues.gray[100].hex};
      background-color: ${hues.blue[400].hex};
    }
    &.default {
      color: ${hues.gray[300].hex};
      &:hover {
        color: ${hues.gray[100].hex};
        background-color: ${hues.gray[600].hex};
      }
    }
  }
`

export const StyledTree = styled.ul`
  list-style: none;
  padding-left: 0;
  margin-block-start: 0;
  li svg.info,
  li svg.action {
    height: 1.2rem;
    width: 1.2rem;
    color: ${hues.gray[800].hex};
    border-radius: 3px;
    transition: all 0.1s ease-in-out;
    &.normal:hover {
      color: ${hues.gray[100].hex};
      background-color: ${hues.green[500].hex};
    }
    &.warning:hover {
      color: ${hues.gray[100].hex};
      background-color: ${hues.yellow[500].hex};
    }
    &.error {
      color: ${hues.red[500].hex};
    }
    &.error:hover,
    &.critical:hover {
      color: ${hues.gray[100].hex};
      background-color: ${hues.red[500].hex};
    }
  }
  li svg.spacer {
    height: 1.5rem;
    width: 1.5rem;
    visibility: hidden;
  }
  button {
    background: none;
    border: none;
    padding: 0.2rem 0 0;
    cursor: pointer;
    svg {
      height: 1.5rem;
      width: 1.5rem;
    }
  }
`
export const StyledChildConcepts = styled.ul`
  list-style: none;
`

export const StyledTopConcept = styled.li`
  padding-top: 0.5rem;
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
  color: ${hues.gray[800].hex};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`
