import React, { useEffect, useState } from 'react'
import classNames from 'classnames'

import { Footer } from './Footer'
import { TopNavigation } from './TopNavigation'

import * as styles from './Page.module.scss'
import '../styles/main.scss'
import { HelmetTitleDescription } from '../meta/HelmetTitleDescription'
import Helmet from 'react-helmet'
import { fbShareImage } from '../meta/bright-logo'
import { resolveUrl } from '../meta/resolve-url'
import { useLocation } from '@reach/router'

export const Page: React.FC<{ className?: string }> = ({
                                                         children,
                                                         className
                                                       }) => {
  const [mobileMenuOpened, setMobileMenuOpened] = useState(false)

  const { pathname } = useLocation()

  return (
    <div
      className={classNames('layout-container', className, {
        [styles.menuOpened]: mobileMenuOpened
      })}
    >
      <HelmetTitleDescription
        title='Software Development Company'
        description='Top custom software development company in Poland specialising in mobile & web apps, Blockchain and IoT. We create success stories for startups, digital agencies and mid-sized organisations from such industries as FinTech, Healthcare or Retail.'
      />
      <Helmet>
        <meta property='og:image' content={resolveUrl(fbShareImage)} />
        <meta property='og:url' content={resolveUrl(pathname)} />
      </Helmet>
      <TopNavigation path={pathname} toggled={setMobileMenuOpened} />
      {children}
      <Footer />
    </div>
  )
}
