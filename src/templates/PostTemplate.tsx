import { graphql } from 'gatsby'
import React, { ComponentProps, ReactElement } from 'react'
import { useLocation } from '@reach/router'
import styled from 'styled-components'
import { Page } from '../layout/Page'
import BackButton from '../components/subcomponents/BackButton'
import DateFormatter from '../components/subcomponents/Date'
import DisqusComments from '../components/subcomponents/DisqusComments'
import { AuthorData, AuthorDataProps } from './post/AuthorData'
import { getFileNameOnly } from '../helpers/pathHelpers'
import { routeLinks } from '../config/routing'
import { BlogPostStructuredData } from '../BlogPostStructuredData'
import { getSrc } from 'gatsby-plugin-image'
import { FileNode } from 'gatsby-plugin-image/dist/src/components/hooks'
import Helmet from 'react-helmet'
import { descriptionOrDefault } from '../meta/meta-description'
import { resolveUrl } from '../meta/resolve-url'
import { siteMetadata } from '../../gatsby-config'
import { OutboundLink } from 'gatsby-plugin-google-analytics'
import { ConstrainedWidthContainer } from '../ConstrainedWidthContainer'
import { PostTags } from '../PostTags'

const Title = styled.h1`
  font-size: 3rem;
`

const Content = styled.div`
  font-family: 'Lato', sans-serif;
  font-style: normal;
  font-weight: normal;
  font-size: 1.125rem;
  letter-spacing: 1;
  line-height: 2;
`

export type PostTemplateProps = {
  path: string
  authorsView?: (props: AuthorDataProps) => JSX.Element
  structuredData?: (props: ComponentProps<typeof BlogPostStructuredData>) => JSX.Element
  contentView?: () => JSX.Element
  commentsView?: () => JSX.Element
  data: {
    markdownRemark: {
      html: string
      excerpt: string
      frontmatter: {
        slug: string
        title: string
        description: string
        author: string
        tags: string[]
        date: string
        excerpt: string
        image: FileNode
        canonicalUrl: string
      }
      timeToRead: number
      fileAbsolutePath: string
    }
  }
}

type TimeInMinutes = number

type PostAuthorsProps = { author: string; authorsView?: (props: AuthorDataProps) => JSX.Element }
type PostContentProps = { contentView: () => JSX.Element } | { html: string; contentView: undefined }

type PostArticleContentProps = PostAuthorsProps &
  PostContentProps & {
    title: string

    timeToRead: TimeInMinutes

    tags: string[]
    date?: string

    fileAbsolutePath: string
    canonicalUrl: string
  }

export const PostArticleContent = (props: PostArticleContentProps) => {
  const authors = props.authorsView?.({ authorId: props.author }) ?? <AuthorData authorId={props.author} />
  return (
    <article className='section'>
      <div className='columns is-vcentered'>
        <div className='column is-half'>{authors}</div>
        <div className='column has-text-right'>
          <div className='content has-text-grey-light'>
            <p className='has-text-primary'>{props.timeToRead} min</p>
            <PostTags tags={props.tags} />

            <p>
              {props.date && <DateFormatter date={props.date} />}
              &nbsp;
              <a
                className='has-text-grey-light'
                href={'/admin/#/collections/blog/entries/' + getFileNameOnly(props.fileAbsolutePath)}
              >
                Edit
              </a>
            </p>
          </div>
        </div>
      </div>

      <Title className='title'>{props.title}</Title>
      {props.contentView ? (
        <Content className='content is-family-secondary'>{props.contentView()}</Content>
      ) : (
        <Content className='content is-family-secondary' dangerouslySetInnerHTML={{ __html: props.html }} />
      )}

      <BackButton url={routeLinks.blog} label='Blog' />

      {props.canonicalUrl && (
        <section>
          <OutboundLink href={props.canonicalUrl} style={{ fontStyle: 'italic' }}>
            This article was originally published on author's blog
          </OutboundLink>
        </section>
      )}
    </article>
  )
}

// TODO: we should decouple Post* controls that deal with graphql from those that render actual posts
export const PostTemplate = function PostTemplate(props: PostTemplateProps) {
  const { markdownRemark } = props.data // data.markdownRemark holds your post data
  const { frontmatter: page, html } = markdownRemark
  const { pathname } = useLocation()
  const slug = props.path.replace(/^(\/blog\/)/, '')
  const title = markdownRemark.frontmatter.title
  const image = markdownRemark.frontmatter.image
  const canonicalUrl = markdownRemark.frontmatter.canonicalUrl

  const postStructuredData = props.structuredData?.({
    author_id: page.author,
    excerpt: page.excerpt,
    path: props.path,
    publishedOn: page.date,
    title: page.title,
    image: page.image,
  }) ?? (
    <BlogPostStructuredData
      author_id={page.author}
      excerpt={page.excerpt}
      path={props.path}
      publishedOn={page.date}
      title={page.title}
      image={page.image}
    />
  )

  const comments = props.commentsView?.() ?? <DisqusComments id={slug} title={page.title} />

  return (
    <Page>
      <Helmet>
        <title>{title} | Bright Inventions</title>
        {title && <meta property='og:title' content={title} />}
        <meta name='description' content={descriptionOrDefault(markdownRemark.excerpt)} />
        <meta property='og:description' content={descriptionOrDefault(markdownRemark.excerpt)} />
        <meta property='og:site_name' content={siteMetadata.title} />
        <meta property='og:url' content={resolveUrl(pathname)} />
        <meta property='og:type' content='article' />
        <meta property='article:published_time' content={markdownRemark.frontmatter.date} />
        {image && <meta property='og:image' content={resolveUrl(getSrc(image)!)} />}
        {canonicalUrl && <link rel='canonical' href={canonicalUrl} />}
      </Helmet>

      <ConstrainedWidthContainer className='container'>
        <PostArticleContent
          title={page.title}
          date={page.date}

          contentView={props.contentView}
          html={markdownRemark.html}

          authorsView={props.authorsView}
          author={page.author}

          canonicalUrl={page.canonicalUrl}

          fileAbsolutePath={markdownRemark.fileAbsolutePath}
          tags={page.tags}
          timeToRead={markdownRemark.timeToRead}
        />

        {comments}
      </ConstrainedWidthContainer>
      {postStructuredData}
    </Page>
  )
}
export default PostTemplate

export const pageQuery = graphql`
  query($fileAbsolutePath: String!) {
    markdownRemark(fileAbsolutePath: { eq: $fileAbsolutePath }) {
      html
      excerpt
      frontmatter {
        slug
        title
        description
        author
        tags
        date
        canonicalUrl
        image {
          childImageSharp {
            gatsbyImageData
          }
        }
      }
      timeToRead
      fileAbsolutePath
    }
  }
`
