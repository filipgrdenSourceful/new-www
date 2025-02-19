export const routeLinks = {
  aboutUs(params?: { authorId: string; slug: string | undefined } | { page: 'team' }) {
    if (!params) {
      return `/about-us`
    }
    if ('authorId' in params) {
      return `/about-us/${params.slug ?? params.authorId}/`
    }
    return `/about-us${params.page && `/${params.page}`}`
  },
  blogTags(params?: { tag: string | undefined }) {
    if (!params) {
      return `/blog/`
    }
    if (params.tag) {
      return `/blog/${params.tag}/`
    }
    return `/blog/`
  },
  ourAreas(params?: { service: string; faqSlug?: string | undefined }) {
    if (!params) {
      return `/our-areas/`
    }
    if (params.faqSlug && params.service) {
      return `/our-areas/${params.service}/${params.faqSlug}/`
    }
    return `/our-areas/${params.service ?? ''}`
  },
  whatWeOffer: '/what-we-offer',
  projects: '/projects',
  career: '/career',
  blog: '/blog',
  jobs: '/jobs',
  startProject: '/start-project',
  privacyPolicy: '/privacy-policy',
  webDevelopment: '/our-areas/web-development',
  mobileDevelopment: '/our-areas/mobile-app-development',
  blockchainDevelopment: '/our-areas/blockchain',
  bluetoothDevelopment: '/our-areas/bluetooth-development',
  mvpdDevelopment: '/our-areas/mvp-development',
}
