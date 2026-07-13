import { Navigate, useNavigate } from 'react-router-dom'

import { HelpTopicCard } from '../../components/HelpTopicCard'
import { brand } from '../../config/brand'
import { mockHelpTopics } from '../../mocks/support'

import backIcon from '../../../export_for_build/icons-pack/back.svg'
import rightChevronIcon from '../../../export_for_build/icons-pack/right-chevron.svg'
import mailIcon from '../../../export_for_build/icons-pack/mail.svg'
import candyIcon from '../../../export_for_build/assets/liltreat-icon-large.png'
import styles from './HelpSupportScreen.module.css'

const vendorTopicId = 'vendor-app'
const howItWorksTopicId = 'how-it-works'
const technicalIssueTopicId = 'technical-issue'

export function HelpSupportScreen() {
  const navigate = useNavigate()

  const vendorTopic = mockHelpTopics.find((topic) => topic.id === vendorTopicId)
  const howItWorksTopic = mockHelpTopics.find((topic) => topic.id === howItWorksTopicId)
  const technicalIssueTopic = mockHelpTopics.find((topic) => topic.id === technicalIssueTopicId)

  if (
    !vendorTopic ||
    !vendorTopic.actionLabel ||
    !howItWorksTopic ||
    !howItWorksTopic.steps?.length ||
    !technicalIssueTopic ||
    !technicalIssueTopic.email
  ) {
    return <Navigate to="/" replace />
  }

  const goHome = () => {
    navigate('/', { replace: true })
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <button
          className={styles.headerButton}
          type="button"
          aria-label="Back to home"
          onClick={goHome}
        >
          <img className={styles.backIcon} src={backIcon} alt="" aria-hidden="true" />
        </button>

        <h1 className={styles.headerTitle}>HELP &amp; SUPPORT</h1>

        <button
          className={styles.headerButton}
          type="button"
          aria-label={`Go to ${brand.appName} home`}
          onClick={goHome}
        >
          <img className={styles.homeIcon} src={candyIcon} alt="" aria-hidden="true" />
        </button>
      </header>

      <section className={styles.contentSection} aria-labelledby="common-help-topics-title">
        <div className={styles.contentInner}>
          <div className={styles.sectionHeading}>
            <h2 className={styles.commonHeading} id="common-help-topics-title">
              Common Help Topics
            </h2>
            <span className={styles.sectionDivider} aria-hidden="true" />
          </div>

          <div className={styles.topicStack}>
            <HelpTopicCard
              title={vendorTopic.title}
              description={vendorTopic.description}
              action={
                <button
                  className={styles.actionPill}
                  type="button"
                  disabled
                  aria-label={`${vendorTopic.actionLabel} unavailable in this build`}
                >
                  <span>{vendorTopic.actionLabel}</span>
                  <img className={styles.actionChevron} src={rightChevronIcon} alt="" aria-hidden="true" />
                </button>
              }
            />

            <span className={styles.topicDivider} aria-hidden="true" />

            <HelpTopicCard
              title={howItWorksTopic.title}
              description={howItWorksTopic.description}
            >
              <ol className={styles.stepsList}>
                {howItWorksTopic.steps.map((step, index) => (
                  <li className={styles.stepItem} key={step.id}>
                    <span className={styles.stepNumber}>{index + 1}.</span>
                    <p className={styles.stepText}>
                      <strong>{step.emphasis}</strong> {step.remainder}
                    </p>
                  </li>
                ))}
              </ol>
            </HelpTopicCard>

            <span className={styles.topicDivider} aria-hidden="true" />

            <HelpTopicCard
              title={technicalIssueTopic.title}
              description={technicalIssueTopic.description}
              action={
                <a
                  className={styles.actionPill}
                  href={`mailto:${technicalIssueTopic.email}`}
                  aria-label={`Email support at ${technicalIssueTopic.email}`}
                >
                  <span>{technicalIssueTopic.email}</span>
                  <img className={styles.mailIcon} src={mailIcon} alt="" aria-hidden="true" />
                </a>
              }
            />
          </div>
        </div>
      </section>
    </main>
  )
}
