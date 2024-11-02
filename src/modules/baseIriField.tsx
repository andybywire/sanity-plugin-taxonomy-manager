import {defineField} from 'sanity'
import {StyledDescription} from '../styles'
import {RdfUri} from '../components/inputs'

/**
 * #### Base Universal Resource Identifier object for Sanity Taxonomy Manager
 * Used for Concept and Concept Scheme URI fields
 */
export default [
  defineField({
    name: 'baseIri',
    title: 'Base URI',
    type: 'url',
    validation: (Rule) =>
      Rule.required().error(`Please supply a base URI in the format 'http://example.com/'`),
    description: (
      <StyledDescription>
        <summary>
          The root URI (Uniform Resource Identifier) used to create unique concept identifiers.
        </summary>
        <div>
          Unique identifiers allow for the clear an unambiguous identification of concepts across
          namespaces, for example between <code>https://shipparts.com/vocab#Bow</code> and {}
          <code>https://wrappingsupplies.com/vocab#Bow</code>.
        </div>
        <div>
          In most cases, it makes sense for your base URI to be the root or a subdirectory of your
          website. In all cases, the URI you choose should be in a domain that you control.
        </div>
        <div>
          For new Concepts and Concept Schemes, the Base URI field is pre-populated based on the
          most recently used Base URI value.
        </div>
      </StyledDescription>
    ),
    components: {
      input: RdfUri as any,
    },
  }),
]
