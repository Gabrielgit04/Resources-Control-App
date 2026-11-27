import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { RouteTransition } from '@/components/RouteTransition'
import { APP_NAME } from '@/config'

export interface LegalSection {
  id: string
  icon: string
  title: string
  paragraphs: string[]
  items?: string[]
  paragraphsAfter?: string[]
}

interface LegalPageProps {
  eyebrow: string
  title: string
  description: ReactNode
  effectiveDate: string
  summary: ReactNode
  sections: LegalSection[]
  contactEmail: string
  related?: { label: string; to: string }
}

function SectionBlock({ section, index }: { section: LegalSection; index: number }) {
  return (
    <section
      id={section.id}
      className="scroll-mt-24 bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-6 md:p-8 shadow-[0_4px_24px_rgba(11,28,48,0.03)]"
    >
      <div className="flex items-start gap-4">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary-container/20 text-primary shrink-0">
          <Icon name={section.icon} size={22} />
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-sm font-bold text-primary/60">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h2 className="font-headline text-xl font-semibold text-on-surface">{section.title}</h2>
          </div>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-on-surface-variant">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.items && (
              <ul className="space-y-2 pl-1">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <Icon name="check" size={18} className="text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
            {section.paragraphsAfter?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function LegalPage({
  eyebrow,
  title,
  description,
  effectiveDate,
  summary,
  sections,
  contactEmail,
  related,
}: LegalPageProps) {
  return (
    <div className="bg-surface text-on-surface min-h-screen antialiased selection:bg-primary-container selection:text-on-primary-container">
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-on-surface hover:text-primary transition-colors">
            <Icon name="arrow_back" size={20} />
            <img src="/g-amount.svg" alt={APP_NAME} className="w-8 h-8 object-contain" />
            <span className="font-headline font-bold text-lg tracking-tight">{APP_NAME}</span>
          </Link>
          <span className="font-label text-xs uppercase tracking-wide text-on-surface-variant">Legal</span>
        </div>
      </header>

      <RouteTransition>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="mb-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/20 text-on-primary-container text-xs font-semibold uppercase tracking-wide">
              <Icon name="gavel" fill size={14} />
              {eyebrow}
            </span>
            <h1 className="mt-5 font-headline font-bold text-3xl md:text-4xl tracking-tight text-on-surface">
              {title}
            </h1>
            <p className="mt-3 text-on-surface-variant leading-relaxed">{description}</p>
            <p className="mt-2 font-label text-xs text-on-surface-variant">Vigente desde el {effectiveDate}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 items-start">
            <aside className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-5 lg:sticky lg:top-24">
              <h2 className="font-headline text-sm font-semibold text-on-surface mb-3">Contenido</h2>
              <nav className="flex flex-col gap-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="text-xs text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest rounded-md px-2 py-1.5 transition-colors"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </aside>

            <div className="space-y-5 min-w-0">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 md:p-8">
                <p className="font-headline font-semibold text-on-surface">En resumen</p>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{summary}</p>
              </div>

              {sections.map((section, index) => (
                <SectionBlock key={section.id} section={section} index={index} />
              ))}

              <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-headline font-semibold text-on-surface">¿Tienes alguna pregunta?</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Escríbenos y te responderemos sobre este documento.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {related && (
                    <Link
                      to={related.to}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors"
                    >
                      <Icon name="description" size={18} />
                      {related.label}
                    </Link>
                  )}
                  <a
                    href={`mailto:${contactEmail}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-surface-tint transition-colors"
                  >
                    <Icon name="mail" size={18} />
                    Contactar
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </RouteTransition>
    </div>
  )
}
