import {defineField} from 'sanity'
import {DescriptionDetail} from '../styles'
import {RdfUri} from '../components/RdfUri'

export default [
  defineField({
    name: 'baseIri',
    title: 'Base URI',
    type: 'url',
    validation: (Rule) =>
      Rule.required().error('Please supply a base URI in the format http://example.com/'),
    description: (
      <details>
        <summary>
          The root URI (Uniform Resource Identifier) used to create unique concept identifiers.
        </summary>
        <DescriptionDetail>
          Unique identifiers allow for the clear an unambiguous identification of concepts across
          namespaces, for example between https://shipparts.com/vocab#Bow and
          https://wrappingsupplies.com/vocab#Bow.
        </DescriptionDetail>
        <DescriptionDetail>
          In most cases, it makes sense for your base URI to be the root or a subdirectory of your
          website. In all cases, the URI you choose should be in a domain that you control.
        </DescriptionDetail>
        <DescriptionDetail>
          For new Concepts and Concept Schemes, the Base URI field is pre-populated based on the
          most recently used Base URI value.
        </DescriptionDetail>
      </details>
    ),
    options: {
      collapsible: true,
    },
    components: {
      input: RdfUri as any,
    },
  }),
]
