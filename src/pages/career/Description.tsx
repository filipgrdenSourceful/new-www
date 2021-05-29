import React from 'react'
import styled from 'styled-components'

import { PageDescription, Section } from '../../components/shared'

const SectionEx = styled(Section)`
  padding: 1rem 2rem;
`

const Description: React.FC = () => {
  return (
    <SectionEx>
      <PageDescription>
        Our team consists of talented, positive and committed people who work on international projects and enjoy what they do on daily basis.
      </PageDescription>
      <PageDescription>
        If you value team work, responsibility and you would like to create software solutions that really matter in the current world, get to know us better and apply!
      </PageDescription>
    </SectionEx>
  )
}

export default Description
