import React from 'react'
import { CustomSectionTitle, FlexWrapper, MoreButton } from './components/shared'
import styled from 'styled-components'
import variables from './styles/variables'
import { useEbookForm } from './components/utils/ebook-form/use-ebook-form'
import { EbookDynamicForm } from './ebook-dynamic-form'
import { EbookThankYouPage } from './ebook-dynamic-thank-you-page'
import { ErrorMessage } from './components/shared/contact/styles'
import EbookArrow from '../src/assets/ebook_arrow.svg'
import { clampBuilder } from './helpers/clampBuilder';

const EbookSection = styled.section`
  margin: ${variables.pxToRem(48)} 0;
  padding: ${variables.pxToRem(32)} ${variables.pxToRem(56)};
  background: ${variables.color.lighterGrey};
  & form {
    padding: ${variables.pxToRem(16)} 0 0;
  }
  @media ${variables.device.tablet} {
    padding: ${variables.pxToRem(32)} ${variables.pxToRem(36)};
  }
`

const MoreButtonWrapper = styled.div`
  width: fit-content;
  margin: 0 auto;
  & button {
    @media ${variables.device.tabletXL} {
      margin-top: ${variables.pxToRem(16)};
    }
    @media ${variables.device.tablet} {
      margin-top: ${variables.pxToRem(48)};
    }
  }
  & a {
    border-bottom: 1px solid ${variables.color.text};
    padding: 0 ${variables.pxToRem(14)} ${variables.pxToRem(5)} ${variables.pxToRem(8)};
    color: inherit;
    font-size: ${variables.pxToRem(20)};
    line-height: ${variables.pxToRem(40)};

    & span {
      padding-left: ${variables.pxToRem(17)};
    }
  }
  @media ${variables.device.mobile} {
    & a {
      padding: 0 ${variables.pxToRem(14)} ${variables.pxToRem(5)} ${variables.pxToRem(8)};
      font-size: ${clampBuilder(320, 580, 17, 20)};
      line-height: ${variables.pxToRem(40)};
  
     
    }
  }
`

const EbookSectionTitle = styled(CustomSectionTitle)`
  font-size: ${variables.pxToRem(40)};
  line-height: ${variables.pxToRem(48.76)};
  font-weight: 800;
`

export interface EbookDynamicProps {
  section_title: string
  ebook_name: string
  imageSrc: string
  imageAlt: string
  description: string
}

export const EbookDynamic: React.FC<EbookDynamicProps> = ({
  section_title,
  ebook_name,
  imageSrc,
  imageAlt,
  description,
}) => {
  const { value, setPolicy, handleSubmit, setEmail, setName } = useEbookForm(ebook_name)
  const formRef = React.useRef<HTMLFormElement>(null)

  return (
    <EbookSection>
      <EbookSectionTitle
        margin='0 0 32px'
        laptopMargin='0 0 32px'
        tabletXLMargin='0 0 32px'
        tabletMargin='0 0 32px'
        mobileMargin='0 0 32px'
      >
        {section_title}
      </EbookSectionTitle>
      <FlexWrapper tabletDirection='column' tabletGap='32px' desktopItems='center'>
        <img alt={imageAlt} src={imageSrc} />
        {!value.ebookResponse.ebook.url ? (
          <EbookDynamicForm
            description={description}
            setEmail={setEmail}
            setName={setName}
            setPolicy={setPolicy}
            handleSubmit={handleSubmit}
            value={value}
            formRef={formRef}
          />
        ) : (
          <EbookThankYouPage />
        )}
      </FlexWrapper>
      <MoreButtonWrapper>
        <ErrorMessage> {value.errorMsg && value.errorMsg}</ErrorMessage>
        {!value.ebookResponse.ebook.url ? (
          <MoreButton
            isSubmit
            isPrimary
            onClick={() => {
              formRef.current?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
            }}
          >
            get free ebook
          </MoreButton>
        ) : (
          <a href={value.ebookResponse.ebook.url} target='_blank'>
              click to open the ebook<span>
                <EbookArrow />
              </span>
          </a>
        )}
      </MoreButtonWrapper>
    </EbookSection>
  )
}
