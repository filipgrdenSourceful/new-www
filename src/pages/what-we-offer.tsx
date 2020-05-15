// ---
// layout: default
// title:
// description:
// ---
import React from "react"
import HelmetWrapper from "../components/subcomponents/HelmetWrapper"
import Layout from "../components/layout"

const WhatWeOfferPage: React.FocusEventHandler = () => {
  return (
    <Layout>
      <HelmetWrapper
        title="Mobile and Web Development Services"
        description="About our software development services"
      />
      <div className="container">
        <section className="section">
          <h1 className="title has-text-dark has-text-weight-bold">
            our services
          </h1>
          <div className="content">
            <p>
              Through mobile apps and complex backend systems to emerging
              technology solutions we are creating success stories for startups,
              consultancy agencies as well as mid-size organisations across
              multiple industries including FinTech, Blockchain, HealthTech,
              Retail, Logistics and more.
            </p>
            <div className="level content">
              <div className="level-left">
                <div className="level-item">
                  <figure className=" image is-150x150">
                    <img
                      src="/images/web_development3.svg"
                      alt="web development"
                    />
                  </figure>
                </div>
              </div>
              <div>
                <h3 className="subtitle">web development</h3>
                <p>
                  We deliver a wide range of custom full stack web solutions for
                  small and big businesses in different industries. We create
                  web apps, services, and sites that accurately meet
                  expectations and satisfy particular needs of your company. In
                  our projects we rely on a rich technology stack including
                  JavaScript, CSS. HTML, Java, Node.js, AWS, MySQL, PostgreSQL
                  and more.
                </p>
              </div>
            </div>
            <div className="level content">
              <div className="level-left">
                <div className="level-item">
                  <figure className=" image is-150x150">
                    <img
                      src="/images/Mobile_App_Development3.svg"
                      alt="mobile development"
                    />
                  </figure>
                </div>
              </div>
              <div>
                <h3 className="subtitle">mobile development</h3>
                <p>
                  Our app development team with a perfect command of Swift as
                  well as Java and Kotlin offers native mobile development for
                  iOS and Android. We can also help you estimate your project
                  against the market and choose a suitable solution to achieve
                  the best app performance and appearance on all devices.
                </p>
              </div>
            </div>
            <div className="level content">
              <div className="level-left">
                <div className="level-item">
                  <figure className=" image is-150x150">
                    <img src="/images/consulting3.svg" alt="IT Consulting" />
                  </figure>
                </div>
              </div>
              <div>
                <h3 className="subtitle">IT consulting</h3>
                <p>
                  With the right choice of business-supporting technologies, we
                  help companies go beyond traditional methods and processes and
                  explore new ways to boost their business. We are happy to
                  share our experience to support your business goals in
                  technology roadmapping and exploring most efficient ways to
                  use available resources and technology trends. We operate in
                  various domains including FinTech, HealthTech, Retail,
                  Ecommerce and more, and deliver reliable IT solutions with the
                  focus on industry specifics.
                </p>
              </div>
            </div>
            <div className="level content">
              <div className="level-left">
                <div className="level-item">
                  <figure className=" image is-150x150">
                    <img src="/images/design3.svg" alt="UX/UI design" />
                  </figure>
                </div>
              </div>
              <div>
                <h3 className="subtitle">UX/UI design</h3>
                <p>
                  From mobile apps to scalable enterprise software systems for
                  different major industries our design team can help your idea
                  come into being with the most impactful practices and tech
                  tools. You can count on our interface analysis, thorough root
                  cause analysis and animation design experience, and more. As a
                  result you get a polished final product that is both beautiful
                  and easy-to-use across all platforms.
                </p>
              </div>
            </div>
            <div className="level content">
              <div className="level-left">
                <div className="level-item">
                  <figure className=" image is-150x150">
                    <img
                      src="/images/Custom_Software_development5-01.svg"
                      alt="Custom software"
                    />
                  </figure>
                </div>
              </div>
              <div>
                <h3 className="subtitle">custom software development</h3>
                <p>
                  Custom software serves the unique processes of your business,
                  satisfies your exclusive needs, solves particular problems and
                  makes your workflows easier and more efficient. We enjoy
                  helping our customers throughout all of the software delivery
                  phases: from the ideation, through requirements elicitation,
                  graphic design, project management, software development,
                  quality assurance and maintenance. Many times projects that we
                  work on grow eventually into big, highly successful ventures
                  on both technical and business side.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}

export default WhatWeOfferPage
