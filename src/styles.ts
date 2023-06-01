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
  }
`

export const StyledTree = styled.ul`
  list-style: none;
  padding-left: 0;
  margin-block-start: 0;
  li svg {
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
`
export const StyledTopConcept = styled.li`
  padding-top: 0.5rem;
  font-weight: bold;
  margin-top: 1.2rem;
  .untitled {
    color: ${hues.gray[400].hex};
    font-weight: normal;
  }
`
export const StyledOrphan = styled.li`
  padding-top: 0.5rem;
  font-weight: normal;
  margin-top: 1.2rem;
  .untitled {
    color: ${hues.gray[400].hex};
  }
`
export const StyledChildConcepts = styled.ul`
  list-style: none;
`
export const StyledChildConcept = styled.li`
  font-weight: normal;
  margin-top: 1.5rem;
  div {
    // padding-top: 0;
  }
`
export const StyledConceptLink = styled.span`
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`
