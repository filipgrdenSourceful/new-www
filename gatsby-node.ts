import type { GatsbyNode } from 'gatsby'
import { allMdxData, GQLData } from './src/models/gql'
import { loadTagGroups, TagGroup } from './src/tags/tag-groups'
import { blogListForTagGroupsBasePath, blogPostUrlPath } from './src/blog-post-paths'
import { IgnorePlugin } from 'webpack'
import { PartialWebpackConfig } from './src/partial-webpack-config'
import readingTime from 'reading-time'
import { toDate } from './src/to-date'
import { kebabCase } from 'lodash'

const path = require('path')

const { queryPostsSlug } = require('./src/query-posts')

export const createPages: GatsbyNode['createPages'] = async ({ actions, graphql, reporter }) => {
  const { createPage, createRedirect } = actions

  const result = await queryPostsSlug({ graphql })

  if (result.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`, result.errors)
    return
  }

  const posts = result.data.allMdx.edges
  const postsPerPage = 10
  const numPages = Math.ceil(posts.length / postsPerPage)

  Array.from({ length: numPages }).forEach((_, i) => {
    createPage({
      path: i === 0 ? `/blog` : `/blog/${i + 1}`,
      component: path.resolve('./src/blog/BlogPage.tsx'),
      context: {
        limit: postsPerPage,
        skip: i * postsPerPage,
        numPages,
        currentPage: i + 1,
      },
    })
  })

  const ymlDocTags = await loadTagGroups()
  // const tags = result.data.tagsGroup.group;
  await Promise.all(
    ymlDocTags.groups.map(async (group: TagGroup) => {
      const searchTags = JSON.stringify(group.tags)
      const result = await queryPostsSlug({ graphql, tags: searchTags })
      const posts = result.data.allMdx.edges
      const postsPerPage = 10
      const numPages = Math.ceil(posts.length / postsPerPage)

      Array.from({ length: numPages }).forEach((item, i) => {
        createPage({
          path: `${blogListForTagGroupsBasePath(group)}/${i + 1}`,
          component: path.resolve('./src/blog/BlogTagsPage.tsx'),
          context: {
            groupTags: group.tags,
            tag: group.name,
            limit: postsPerPage,
            skip: i * postsPerPage,
            numPages,
            currentPage: i + 1,
          },
        })
      })

      if (group.groups) {
        await Promise.all(
          group.groups.map(async subTag => {
            const searchTags = JSON.stringify(subTag.tags)
            const result = await queryPostsSlug({ graphql, tags: searchTags })
            const posts = result.data.allMdx.edges
            const postsPerPage = 10
            const numPages = Math.ceil(posts.length / postsPerPage)
            Array.from({ length: numPages }).forEach((item, i) => {
              createPage({
                path: `${blogListForTagGroupsBasePath(group, subTag)}/${i + 1}`,
                component: path.resolve('./src/blog/BlogTagsPage.tsx'),
                context: {
                  groupTags: subTag.tags,
                  tag: group.name,
                  subTag: subTag.name,
                  limit: postsPerPage,
                  skip: i * postsPerPage,
                  numPages,
                  currentPage: i + 1,
                },
              })
            })
          })
        )
      }
    })
  )

  const memberResult = await graphql<Queries.AboutUsMembersListingQuery>(`
    query AboutUsMembersListing {
      allMembers {
        nodes {
          id
          internal {
            contentFilePath
          }
          slug
          author_id
        }
      }
    }
  `)
  if (result.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`, result.errors)
    return
  }
  const members = memberResult.data!.allMembers.nodes

  await Promise.all(
    members.map(async (member) => {
      const result = await graphql<{
        author: allMdxData
        secondAuthor?: allMdxData
        thirdAuthor?: allMdxData
      }>(`
  {
    author: allMdx(
      filter: {frontmatter: {layout: {eq: "post"}, published: {ne: false}, hidden: {ne: true}, author: {eq: "${member.author_id}"}}}
      sort: { fields: [frontmatter___meaningfullyUpdatedAt, frontmatter___date], order: [ASC, DESC] }
    ) {
      edges {
        node {
          id
          internal {  contentFilePath  }
          frontmatter {
            image {
              childImageSharp {
                gatsbyImageData
              }
            }
            title
            tags
            date
            meaningfullyUpdatedAt
            author_id
          }
          fields {
            slug
          }
        }
      }
    }
    secondAuthor: allMdx(
      filter: {frontmatter: {layout: {eq: "post"}, published: {ne: false}, hidden: {ne: true}, secondAuthor: {eq: "${member.author_id}"}}}
      sort: { fields: [frontmatter___meaningfullyUpdatedAt, frontmatter___date], order: [ASC, DESC] }
    ) {
      edges {
        node {
          id
          internal {  contentFilePath  }
          frontmatter {
            image {
              childImageSharp {
                gatsbyImageData
              }
            }
            title
            tags
            date
            meaningfullyUpdatedAt
          }
          fields {
            slug
          }
        }
      }
    }
    thirdAuthor: allMdx(
      filter: {frontmatter: {layout: {eq: "post"}, published: {ne: false}, hidden: {ne: true}, thirdAuthor: {eq: "${member.author_id}"}}}
      sort: { fields: [frontmatter___meaningfullyUpdatedAt, frontmatter___date], order: [ASC, DESC] }
    ) {
      edges {
        node {
          id
          internal {  contentFilePath  }
          frontmatter {
            image {
              childImageSharp {
                gatsbyImageData
              }
            }
            title
            tags
            date
            meaningfullyUpdatedAt
          }
          fields {
            slug
          }
        }
      }
    }
  }
  `)

      const { author, secondAuthor, thirdAuthor } = result.data!
      const allAuthors = [...author?.edges, ...(secondAuthor?.edges ?? []), ...(thirdAuthor?.edges ?? [])]

      const uniqueAuthors = allAuthors
        .filter((v, i, a) => a.findIndex(t => t.node.fields.slug === v.node.fields.slug) === i)
        .sort(function (a, b) {
          return (
            new Date(b.node.meaningfullyUpdatedAt).getTime() - new Date(a.node.meaningfullyUpdatedAt).getTime() ||
            new Date(b.node.frontmatter.date).getTime() - new Date(a.node.frontmatter.date).getTime()
          )
        })

      const posts = uniqueAuthors
      const postsPerPage = 10
      const numPages = Math.ceil(uniqueAuthors.length / postsPerPage)

      if (posts.length === 0) {
        createPage({
          path: `/about-us/${kebabCase(member.slug)}`,
          component: `${__dirname}/src/about-us/AboutUs.tsx?__contentFilePath=${
            member.internal.contentFilePath
          }`,
          context: {
            id: member.id,
          },
        })
      } else {
        Array.from({ length: numPages }).forEach((item, i) => {
          createPage({
            path: i == 0 ? `/about-us/${kebabCase(member.slug)}` : `/about-us/${kebabCase(member.slug)}/${i + 1}`,
            component: `${__dirname}/src/about-us/AboutUs.tsx?__contentFilePath=${
              member.internal.contentFilePath
            }`,
            context: {
              id: member.id,
              limit: postsPerPage,
              skip: i * postsPerPage,
              numPages,
              posts: i == 0 ? posts.slice(i, postsPerPage) : posts.slice(i * postsPerPage, (i + 1) * postsPerPage),
              currentPage: i + 1,
            },
          })
        })
      }
    })
  )

  const serviceResult = await graphql<GQLData>(`
    {
      allMdx(filter: { frontmatter: { layout: { eq: "our-service" } } }, limit: 1000) {
        edges {
          node {
            id
            frontmatter {
              slug
              faqs {
                frontmatter {
                  question
                  slug
                }
              }
            }
            internal {
              contentFilePath
            }
          }
        }
      }
    }
  `)
  const services = serviceResult.data!.allMdx.edges

  services.forEach(service => {
    createPage({
      path: 'our-areas/' + service.node.frontmatter.slug,
      component: `${__dirname}/src/our-services/Service.tsx?__contentFilePath=${
        service.node.internal.contentFilePath
      }`,
      context: {
        id: service.node.id,
        slug: service.node.frontmatter.slug,
      },
    })

    const faqs = service.node.frontmatter.faqs
    faqs.forEach((faq: { frontmatter: { question: string; slug: string } }) => {
      createPage({
        path: 'our-areas/' + service.node.frontmatter.slug + '/' + faq.frontmatter.slug,
        component: `${__dirname}/src/our-services/Service.tsx?__contentFilePath=${
          service.node.internal.contentFilePath
        }`,
        context: {
          id: service.node.id,
          slug: service.node.frontmatter.slug,
          faqTitle: faq.frontmatter.question,
          faqSlug: faq.frontmatter.slug,
        },
      })
    })
  })

  const postResult = await graphql<GQLData>(
    `
      {
        allMdx(
          filter: { frontmatter: { layout: { eq: "post" } } }
          sort: { fields: [frontmatter___meaningfullyUpdatedAt, frontmatter___date], order: [ASC, DESC] }
          limit: 1000
        ) {
          edges {
            node {
              id
              fields {
                slug
              }
              frontmatter {
                tags
                slug
              }
              internal {
                contentFilePath
              }
            }
          }
        }
      }
    `
  )
  if (postResult.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`, result.errors)
    return
  }

  const postsResult = postResult.data!.allMdx.edges

  postsResult.forEach(post => {
    const postNode = post.node
    const nodeFileAbsolutePath: string = postNode.internal.contentFilePath
    const currentPostTags: string[] = postNode.frontmatter.tags

    const flatteredYmlTags = ymlDocTags.groups.reduce((previousValue: string[], currentValue: TagGroup) => {
      if (currentValue.groups) {
        const flatteredGroup = currentValue.groups.reduce((previousValue, currentValue) => {
          if (currentPostTags.includes(currentValue.name)) {
            return [...previousValue, ...currentValue.tags]
          } else {
            return [...previousValue]
          }
        }, [] as string[])

        if (currentPostTags.includes(currentValue.name)) {
          return [...previousValue, ...flatteredGroup, ...currentValue.tags]
        } else {
          return [...previousValue, ...flatteredGroup]
        }
      } else {
        if (currentPostTags.includes(currentValue.name)) {
          return [...previousValue, ...currentValue.tags]
        } else {
          return [...previousValue]
        }
      }
      // else {
      //   return [...previousValue]
      // }
    }, [])

    const relatedTags = [...flatteredYmlTags, ...currentPostTags]
    if (!postNode.id) {
      console.log('node', postNode)
    }
    createPage({
      path: blogPostUrlPath(postNode),
      component: `${__dirname}/src/blog/Post.tsx?__contentFilePath=${nodeFileAbsolutePath}`,
      context: {
        id: postNode.id,
        slug: postNode.fields.slug,
        relatedTags: relatedTags,
      },
    })
  })

  const preparePage = async (layout: string, path: string, template: string) => {
    const result = await graphql<GQLData>(`
      {
        allMdx(
          filter: {
            frontmatter: { layout: { eq: "${layout}" } }
          }
          limit: 1000
        ) {
          edges {
            node {
              id
              frontmatter {
                slug
              }
              internal {
                contentFilePath
              }
            }
          }
        }
      }
    `)

    // Handle errors
    if (result.errors) {
      reporter.panicOnBuild(`Error while running GraphQL query.`, result.errors)
      return
    }
    // console.log(result.data.allMdx.edges)
    result.data!.allMdx.edges.forEach(({ node }) => {
      if (!node.internal.contentFilePath) {
        console.log('no contentFilePath in', node)
      }
      const name = node.internal.contentFilePath
        .split('/')
        .pop()
        .replace('.md', '')
        .replace(/([0-9]{4})-([0-9]{2})-([0-9]{2})-/, '')
      // console.log({
      //   path: path + "/" + (node.frontmatter.slug || name),
      //   component: template,
      //   context: {
      //     // additional data can be passed via context
      //     fileAbsolutePath: node.fileAbsolutePath,
      //   },
      // })

      createPage({
        path: path + '/' + (node.frontmatter.slug || name),
        component: `${template}?__contentFilePath=${node.internal.contentFilePath}`,
        context: {
          id: node.id,
          // additional data can be passed via context
          slug: node.frontmatter.slug,
        },
      })
    })
  }

  const projectTemplate = `${__dirname}/src/projects/Project.tsx`
  await preparePage('project', 'projects', projectTemplate)

  const jobTemplate = `${__dirname}/src/career/Job.tsx`
  await preparePage('job', 'jobs', jobTemplate)

  createRedirect({ fromPath: '/jobs/senior-NET-developer', toPath: '/career' })
  createRedirect({ fromPath: '/about-us/values', toPath: '/about-us' })
  createRedirect({ fromPath: '/about-us/story', toPath: '/about-us' })
  createRedirect({ fromPath: '/jobs/rust-developer-1', toPath: '/jobs/rust-developer' })
}

export const onCreateNode: GatsbyNode['onCreateNode'] = async ({ node, actions: { createNodeField } }) => {
  if (node.internal.type === `Mdx`) {
    const nodeFilePath = node.internal.contentFilePath!
    if (!node.internal.contentFilePath) {
      console.log('no contentFilePath in', node)
    }

    const nodeSlug = '/' + nodeFilePath.split('/').splice(-2).join('/').replace('.md', '')

    createNodeField({
      node,
      name: `slug`,
      // TODO: figure out correct type instead of as any
      value: nodeSlug,
    })

    createNodeField({
      node,
      name: 'timeToRead',
      value: readingTime(node.body as string),
    })

    const date = toDate((node.frontmatter as any)?.date)

    if (date) {
      const meaningfullyUpdatedAt = toDate((node.frontmatter as any)?.meaningfullyUpdatedAt)
      const modifiedAt = meaningfullyUpdatedAt ?? date
      createNodeField({
        node,
        name: 'modifiedAt', // used for sorting of blog posts
        value: modifiedAt,
      })
    } else {
      if (nodeSlug.includes('blog')) {
        console.warn('No date found for blog', { node, nodeSlug })
      }
    }
  }
}

export const onCreateWebpackConfig: GatsbyNode['onCreateWebpackConfig'] = ({ stage, actions, getConfig }) => {
  actions.setWebpackConfig({
    devtool: false,
    plugins: [
      //https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-plugin-netlify-cms#disable-widget-on-site
      new IgnorePlugin({
        resourceRegExp: /^netlify-identity-widget$/,
      }),
    ],
  } as PartialWebpackConfig)
}

export const createSchemaCustomization: GatsbyNode['createSchemaCustomization'] = async ({ actions, schema }) => {
  actions.createTypes(
    `type Members implements Node {
      posts: [Blog] @link(by: "author.author_id", from: "author_id") 
    }`
  )
}
