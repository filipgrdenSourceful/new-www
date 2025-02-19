/**
 * Implement Gatsby's Browser APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/browser-apis/
 */

// You can delete this file if you're not using it
import React from 'react'
import type { GatsbyBrowser } from 'gatsby'
import { GlobalStyle } from './src/styles/global'
import { registerGlobalMailtoClickHandler } from './src/report-mailto-click-to-google-analytics'
import { setupTrackingConsentInPixel } from './plugins/facebook-pixel/tracking-consent'
import { loadConsentDecision } from './src/analytics/local-storage-constants'
import { setupGtagTrackingConsent } from './plugins/google-gtag/tracking-consent'
import { setupTrackingConsentInHotjar } from './plugins/hotjar/tracking-consent'
import { CookieConsentContextWrapper } from './src/analytics/contextual-cookie-consent'

let nextRoute = ''

export const onPreRouteUpdate: GatsbyBrowser['onPreRouteUpdate'] = ({ location }) => {
  nextRoute = location.pathname
}

window.addEventListener('unhandledrejection', event => {
  if (/loading chunk \d* failed./i.test(event.reason)) {
    if (nextRoute) {
      window.location.pathname = nextRoute
    }
  }
})

export const wrapPageElement: GatsbyBrowser['wrapPageElement'] = ({ element }) => (
  <>
    <GlobalStyle />
    {element}
  </>
)

export const wrapRootElement: GatsbyBrowser['wrapRootElement'] = ({ element }) => (
  <CookieConsentContextWrapper>
    {element}
  </CookieConsentContextWrapper>
)

export const onInitialClientRender: GatsbyBrowser['onInitialClientRender'] = () => {
  registerGlobalMailtoClickHandler()
}

export const onClientEntry: GatsbyBrowser['onClientEntry'] = () => {
  setupGtagTrackingConsent({
    consentDecisionLoader: loadConsentDecision,
  }).catch(console.error)

  setupTrackingConsentInPixel({
    consentDecisionLoader: loadConsentDecision,
  }).catch(console.error)

  setupTrackingConsentInHotjar({
    consentDecisionLoader: loadConsentDecision,
  }).catch(console.error)
}
