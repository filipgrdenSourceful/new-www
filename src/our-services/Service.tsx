import React, { useState, useEffect, useRef, PropsWithChildren } from 'react'
import { graphql } from 'gatsby'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import loadable from '@loadable/component'
import { Contact } from '../components/shared/Contact'
// import TechnologyTags from '../components/shared/TechnologyTags'
import { Page } from '../layout/Page'
import { HelmetMetaData } from '../meta/HelmetMetaData'
import RatingClutch from '../assets/rating.svg'
import { useWindowSize } from '../components/utils/use-windowsize'
import { CustomSectionInner, CustomSection, TextRegular, CustomSectionTitle } from '../components/shared/index.styled'
// import TeamMembers  from '../components/subcomponents/TeamMembers'
import { Projects } from '../components/home/Projects'
import { routeLinks } from '../config/routing'
import {
  CustomSectionOurService,
  ImageWrapper,
  Content,
  FaqWrapper,
  Question,
  FaqsTextRegural,
  OurServicePageTitle,
  OurServiceSection,
  BulletList,
  BulletsList,
  CloutchWrapper,
  OurServiceFlexWraper,
  MoreButtonOurServiceWrapper,
  CustomSectionOurServiceImage,
  MobileOurServiceFlexWrapper,
} from './Service.styled'
import { FaqStructuredData } from '../FaqStructuredData'
import { ProjectModel } from '../models/gql'
import { FlexWrapper } from '../components/shared'
import TeamMemebersSwiper from '../components/subcomponents/TeamMembersSwiper'

import { MoreButton } from '../components/shared'

const TechnologyTags = loadable(() => import('../components/shared/TechnologyTags'), {
  fallback: <div>Loading...</div>,
})
const TeamMembers = loadable(() => import('../components/subcomponents/TeamMembers'))
// const TeamMemebersSwiper = loadable(() => import('../components/subcomponents/TeamMembersSwiper'))

export default function Template({
  data,
  pageContext,
  children,
}: PropsWithChildren<{ data: { mdx: any }; pageContext: { faqTitle: string; faqSlug: string; } }>) {
  const { mdx } = data // data.mdx holds your post data
  const { frontmatter: page } = mdx
  const { width } = useWindowSize()
  const breakpointTablet = 992
  const mobileImage = getImage(page.image_our_service_mobile)
  const desktopImage = getImage(page.image_our_service_desktop)
  const myRef = useRef<HTMLDivElement>(null)
  const { faqSlug } = pageContext

  useEffect(() => {
    if (faqSlug) {
      const index = faqs.map(({ frontmatter: faq }: { frontmatter: { slug: string }}) => faq.slug).indexOf(faqSlug)

      if (index >= 0 && myRef.current) {
        handleShow(index)
        const yOffset = 400
        const y = myRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset

        setTimeout(() => {
          window.scrollTo({
            top: y,
          })
        }, 100)
      }
    }
  }, [])

  const [show, setShow] = useState<any>({})

  const {
    faqs,
    image_alt_our_service,
    meta_title,
    meta_description,
    title,
    highlighted_word,
    button,
    title_team,
    team_members,
    button2,
    show_technology_stack,
    show_case_study,
    title_case_study,
    title_faqs,
    title_contact,
    description_contact,
    bar_stack,
    bullet_points,
    project: projects,
    slug,
  } = page

  const handleShow = (i: number) => {
    if (!show[i]) {
      const ourAreasFaqLink = routeLinks.ourAreas({
        service: slug,
        faqSlug: faqs[i].frontmatter.slug,
      })
      window.history.pushState({ path: ourAreasFaqLink }, '', ourAreasFaqLink)
    } else {
      const showArray = Object.keys(show).map(function (k) {
        return { value: show[k], index: k }
      })
      const nearestOpenedFaq = showArray.find(item => item.value && item.index != i.toString())

      const openedFaqSlug = nearestOpenedFaq ? faqs[nearestOpenedFaq.index].frontmatter.faqSlug : undefined

      const ourAreasFaqLink = routeLinks.ourAreas({
        service: slug,
        faqSlug: openedFaqSlug,
      })
      window.history.pushState({ path: ourAreasFaqLink }, '', ourAreasFaqLink)
    }

    setShow((prevshow: any) => ({
      ...prevshow,
      [i]: !prevshow[i],
    }))
  }

  const titleArr = title.split(' ')
  const newTitle = titleArr.map((ta: string) => {
    const highlightedWordArr = highlighted_word?.split(' ')
    return (
      <span key={ta} className={highlightedWordArr?.includes(ta) ? 'highlighted-word' : ''}>
        {ta}
      </span>
    )
  })

  return (
    <Page>
      <HelmetMetaData title={meta_title} description={meta_description} />

      <OurServiceFlexWraper desktopItems='center' tabletDirection='column'>
        <CustomSectionOurService
          paddingProps='1rem 0 0 15rem '
          paddingLaptop='6.4375rem 0 0 6rem'
          paddingTabletXL='7.5rem 0 0 8.5625rem '
          paddingTablet='1.5625rem  2.25rem 0'
          paddingMobileProps='3rem 1.125rem 0'
        >
          <MobileOurServiceFlexWrapper desktopDirection='column' mobileContent='space-between'>
            <FlexWrapper desktopDirection='column'>
              <CustomSection
                paddingProps='0 0 16px'
                paddingLaptop='0 0 16px'
                paddingTabletXL='0 0 4px'
                paddingTablet='0 0 16px'
                paddingMobileProps='0 0 32px'
              >
                <OurServicePageTitle>{newTitle}</OurServicePageTitle>
              </CustomSection>
              <BulletsList>
                {bullet_points && bullet_points.map((point: string) => <BulletList key={point}>{point}</BulletList>)}
              </BulletsList>
            </FlexWrapper>
            <FlexWrapper desktopDirection='column'>
              <MoreButtonOurServiceWrapper
                marginTop='64px'
                margin='0'
                marginTopTablet='64px'
                tabletWidth='100%'
                marginTopMobile='0'
              >
                <MoreButton href={'#contactForm'} isBlack marginTop='0' isPositionLeft className='more-button'>
                  {button}
                </MoreButton>
              </MoreButtonOurServiceWrapper>

              <CloutchWrapper>
                <FlexWrapper desktopItems='center' desktopGap='18px' tabletContent='center' mobileContent='flex-start'>
                  <TextRegular>Clutch 4.9/5</TextRegular>
                  <RatingClutch />
                </FlexWrapper>
              </CloutchWrapper>
            </FlexWrapper>
          </MobileOurServiceFlexWrapper>
        </CustomSectionOurService>
        <CustomSectionOurServiceImage
          paddingProps='3.5rem 15rem 0 0 '
          paddingLaptop='0 6rem 0 0'
          paddingTabletXL='7.5rem 8.5625rem 0 0 '
          paddingTablet='2rem 0 0 0'
          paddingMobileProps='2rem 0 0 0'
        >
          <div>
            {width >= breakpointTablet && typeof window !== 'undefined' && (
              <ImageWrapper>
                {desktopImage && <GatsbyImage image={desktopImage} alt={image_alt_our_service} className='about-img' />}
              </ImageWrapper>
            )}
          </div>
          <div>
            {width < breakpointTablet && typeof window !== 'undefined' && (
              <ImageWrapper>
                {mobileImage && <GatsbyImage image={mobileImage} alt={image_alt_our_service} className='about-img' />}
              </ImageWrapper>
            )}
          </div>
        </CustomSectionOurServiceImage>
      </OurServiceFlexWraper>

      {/* <Section>
        <CustomSection paddingProps='2rem 15rem 0rem 15rem'>
          <CustomSectionInner>
            <TextRegular className='content'>
              {description && <Content dangerouslySetInnerHTML={{ __html: description.html }} />}
            </TextRegular>
          </CustomSectionInner>
        </CustomSection>
      </Section> */}
      <CustomSection
        paddingProps='6.5625rem 15rem 6.5rem 15rem'
        paddingTabletXL='6rem 0  6rem'
        paddingMobileProps='0 1.125rem 4rem'
        paddingTablet='5rem 2.25rem 0 '
        paddingLaptop='6.5625rem 6rem 6.5rem'
      >
        <OurServiceSection>
          <CustomSectionInner>
            <Content className='content'>{children}</Content>

            <MoreButtonOurServiceWrapper>
              <MoreButton href={'#contactForm'} isBlack marginTop='0'>
                {button2}
              </MoreButton>
            </MoreButtonOurServiceWrapper>
          </CustomSectionInner>
        </OurServiceSection>
      </CustomSection>
      <CustomSection paddingProps='0 0 2rem' paddingMobileProps='0 1.125rem 1rem'>
        <CustomSectionTitle mobileMargin='3rem 0 2.25rem' margin='0rem 0 6.5625rem ' laptopMargin='0 0 5.1875rem'>
          {title_team}
        </CustomSectionTitle>
        <div>{width < breakpointTablet && <TeamMemebersSwiper authorIdsArray={team_members} />}</div>
        <div>
          {width >= breakpointTablet && <TeamMembers authorIdsArray={team_members} isOurServiceTemplate={true} />}
        </div>
      </CustomSection>

      {show_technology_stack && <TechnologyTags tags={bar_stack} />}

      {show_case_study && (
        <div>
          <CustomSectionTitle mobileMargin='5.125rem 0 2.75rem'>{title_case_study}</CustomSectionTitle>
          <Projects
            isFetchProject={false}
            projectsArray={projects.map((el: { frontmatter: ProjectModel }) => el.frontmatter)}
            isSelectedTag={false}
          />
        </div>
      )}

      <CustomSection paddingProps='0rem 15rem 2rem 15rem' paddingMobileProps='0 1.125rem 0'>
        <CustomSectionInner>
          {show_case_study ? (
            <CustomSectionTitle
              margin='0rem 0 6.5625rem '
              mobileMargin='5.125rem 0 2.75rem '
              laptopMargin='0 0 5.185rem'
            >
              {title_faqs}
            </CustomSectionTitle>
          ) : (
            <CustomSectionTitle margin='11.625rem 0 6.5625rem ' mobileMargin='5.125rem 0 2.75rem '>
              {title_faqs}
            </CustomSectionTitle>
          )}

          {faqs &&
            faqs.map(({ frontmatter: faq }: { frontmatter: Pick<Queries.FaqsFrontmatter, 'question' | 'answer' | 'slug'> }, i: number) => {
              const { question, answer, slug } = faq
              const answerAsHtml = (answer as unknown as Queries.SimpleMdx).html!
              return (
                <FaqWrapper ref={slug == faqSlug ? myRef : null} key={slug}>
                  {answer ? (
                    <Question onClick={() => handleShow(i)} shown={show[i]}>
                      {question}

                      <span></span>
                    </Question>
                  ) : null}

                  {show[i] && answer ? (
                    <FaqsTextRegural className='content' dangerouslySetInnerHTML={{ __html: answerAsHtml }} />
                  ) : null}
                </FaqWrapper>
              )
            })}
        </CustomSectionInner>
      </CustomSection>
      <Contact
        title={title_contact}
        subtitle={description_contact}
        isOurServiceTemplate={true}
        formButton='Business Contact Form Button'
        actionFormButton='Click Submit Business Form'
      />

      <FaqStructuredData faqs={faqs} />
    </Page>
  )
}

export const pageQuery = graphql`
  query($id: String!) {
    mdx(id: { eq: $id }) {
      frontmatter {
        team_members
        faqs {
          frontmatter {
            answer {
              html
            }
            question
            slug
          }
        }
        project {
          frontmatter {
            description
            title
            image {
              childImageSharp {
                gatsbyImageData
              }
            }
            slug
          }
        }
        meta_title
        meta_description
        title
        highlighted_word
        slug
        bullet_points
        bar_stack
        button
        button2
        show_case_study
        show_technology_stack
        title_faqs
        title_case_study
        title_team
        title_contact
        description_contact
        name
        image_our_service_mobile {
          childImageSharp {
            gatsbyImageData(quality: 100, backgroundColor: "white", placeholder: NONE, webpOptions: { quality: 100 })
          }
        }
        image_our_service_desktop {
          childImageSharp {
            gatsbyImageData(quality: 100, backgroundColor: "white", placeholder: NONE, webpOptions: { quality: 100 })
          }
        }
      }
    }
  }
`
