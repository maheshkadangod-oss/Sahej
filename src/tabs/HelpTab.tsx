import React, { useState } from 'react';
import { Shield, Phone, ExternalLink, ChevronDown, ChevronUp, Heart, AlertTriangle, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/cn';
import { t } from '../strings';
import { helplineData } from '../data/helplines';
import { milestones, parentingTips, resourceLinks } from '../data/resources';
import { partnerSections } from '../data/partnerContent';
import { redFlags, redFlagsIntro, emergencyRefLines } from '../data/redFlags';
import { doctorSays, doctorSaysIntro, doctorSaysCategories } from '../data/doctorSays';
import type { ResourceSubTab } from '../types';

interface HelpTabProps {
  resourceSubTab: ResourceSubTab;
  setResourceSubTab: (v: ResourceSubTab) => void;
  expandedCountry: string | null;
  setExpandedCountry: (v: string | null) => void;
  expandedMilestone: number | null;
  setExpandedMilestone: (v: number | null) => void;
  expandedPartnerSection: string | null;
  setExpandedPartnerSection: (v: string | null) => void;
}

export default React.memo(function HelpTab({
  resourceSubTab, setResourceSubTab,
  expandedCountry, setExpandedCountry,
  expandedMilestone, setExpandedMilestone,
  expandedPartnerSection, setExpandedPartnerSection,
}: HelpTabProps) {
  return (
    <motion.div key="help" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <h2 className="text-2xl font-medium">{t('help')}</h2>

      {/* Sub-tab pills */}
      <div className="pill-nav">
        {([
          { id: 'helplines' as ResourceSubTab, label: t('helplines') },
          { id: 'redflags' as ResourceSubTab, label: 'Red Flags' },
          { id: 'doctorsays' as ResourceSubTab, label: 'Doctor Says' },
          { id: 'growth' as ResourceSubTab, label: t('babyGrowth') },
          { id: 'tips' as ResourceSubTab, label: t('tips') },
          { id: 'resources' as ResourceSubTab, label: t('resources') },
          { id: 'partner' as ResourceSubTab, label: t('partnerSupport') },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setResourceSubTab(tab.id)}
            className={cn("pill-btn", resourceSubTab === tab.id ? "pill-btn-active" : "pill-btn-inactive")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Helplines */}
      {resourceSubTab === 'helplines' && (
        <div className="space-y-4">
          <div className="bg-brand-rose/10 border border-brand-rose/20 rounded-2xl p-4 text-center">
            <Shield className="w-6 h-6 text-brand-rose mx-auto mb-2" />
            <p className="text-sm font-medium">{t('emergencyHelp')}</p>
            <p className="text-xs text-brand-sage italic mt-1">{t('emergencyDesc')}</p>
          </div>
          {helplineData.map((country) => (
            <div key={country.code} className="glass-card rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedCountry(expandedCountry === country.code ? null : country.code)}
                className="w-full flex items-center justify-between p-4 min-h-[52px]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{country.flag}</span>
                  <span className="text-sm font-medium">{country.country}</span>
                  <span className="text-[10px] text-brand-sage bg-brand-sage/10 px-2 py-0.5 rounded-full">
                    {country.helplines.length}
                  </span>
                </div>
                {expandedCountry === country.code
                  ? <ChevronUp className="w-4 h-4 text-brand-sage" />
                  : <ChevronDown className="w-4 h-4 text-brand-sage" />}
              </button>
              <AnimatePresence>
                {expandedCountry === country.code && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {country.helplines.map((h, idx) => (
                        <div key={idx} className="bg-white/40 rounded-xl p-3">
                          <div className="font-medium text-sm">{h.name}</div>
                          <p className="text-[11px] text-brand-sage mt-0.5">{h.description}</p>
                          <p className="text-[10px] text-brand-sage/70 mt-0.5">{h.available}</p>
                          <div className="flex gap-2 mt-2">
                            {h.type !== 'text' && (
                              <a
                                href={`tel:${h.number.replace(/\s/g, '')}`}
                                className="flex items-center gap-1.5 px-3 py-2 bg-brand-sage/10 text-brand-sage rounded-full text-xs font-medium min-h-[36px] press-effect"
                              >
                                <Phone className="w-3 h-3" />
                                {t('callNow')}
                              </a>
                            )}
                            <span className="text-xs text-brand-ink/60 self-center">{h.number}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Baby Growth Milestones */}
      {resourceSubTab === 'growth' && (
        <div className="space-y-3">
          <p className="text-sm text-brand-sage italic px-1">{t('milestones')}</p>
          {milestones.map((ms) => (
            <div key={ms.month} className="glass-card rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedMilestone(expandedMilestone === ms.month ? null : ms.month)}
                className="w-full flex items-center justify-between p-4 min-h-[52px]"
              >
                <span className="text-sm font-medium">{ms.title}</span>
                {expandedMilestone === ms.month
                  ? <ChevronUp className="w-4 h-4 text-brand-sage" />
                  : <ChevronDown className="w-4 h-4 text-brand-sage" />}
              </button>
              <AnimatePresence>
                {expandedMilestone === ms.month && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {([
                        { label: 'Physical', items: ms.physical, color: 'text-brand-clay' },
                        { label: 'Cognitive', items: ms.cognitive, color: 'text-brand-sage' },
                        { label: 'Social', items: ms.social, color: 'text-brand-rose' },
                      ] as const).map(cat => (
                        <div key={cat.label}>
                          <h4 className={cn("text-xs font-semibold uppercase tracking-wider mb-1.5", cat.color)}>{cat.label}</h4>
                          <ul className="space-y-1">
                            {cat.items.map((item, i) => (
                              <li key={i} className="text-xs text-brand-ink/80 flex items-start gap-2">
                                <span className="text-brand-sage mt-0.5">&#8226;</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      <div className="bg-brand-gold/10 border border-brand-gold/20 rounded-xl p-3 mt-2">
                        <p className="text-xs text-brand-ink/80 italic">{ms.parentTip}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Parenting Tips */}
      {resourceSubTab === 'tips' && (
        <div className="space-y-3">
          <p className="text-sm text-brand-sage italic px-1">{t('parentingTips')}</p>
          {parentingTips.map((tip) => (
            <div key={tip.id} className="glass-card rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{tip.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium mb-1">{tip.title}</h4>
                  <p className="text-xs text-brand-ink/70 leading-relaxed">{tip.content}</p>
                  <span className="inline-block mt-2 text-[10px] text-brand-sage bg-brand-sage/10 px-2 py-0.5 rounded-full">
                    {tip.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resource Links */}
      {resourceSubTab === 'resources' && (
        <div className="space-y-3">
          <p className="text-sm text-brand-sage italic px-1">{t('usefulLinks')}</p>
          {resourceLinks.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:bg-white/80 active:bg-white/90 transition-all press-effect min-h-[60px] block"
            >
              <span className="text-xl shrink-0">{link.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{link.title}</div>
                <div className="text-[10px] text-brand-sage">{link.source}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-brand-sage/40 shrink-0" />
            </a>
          ))}
        </div>
      )}

      {/* Partner & Family Support */}
      {resourceSubTab === 'partner' && (
        <div className="space-y-4">
          <div className="bg-brand-gold/10 border border-brand-gold/20 rounded-2xl p-4 text-center">
            <Heart className="w-6 h-6 text-brand-clay mx-auto mb-2" />
            <p className="text-sm font-medium">{t('partnerSupport')}</p>
            <p className="text-xs text-brand-sage italic mt-1">{t('partnerIntro')}</p>
          </div>
          {partnerSections.map((section) => (
            <div key={section.id} className="glass-card rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedPartnerSection(expandedPartnerSection === section.id ? null : section.id)}
                className="w-full flex items-center justify-between p-4 min-h-[52px]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{section.emoji}</span>
                  <span className="text-sm font-medium">{section.title}</span>
                </div>
                {expandedPartnerSection === section.id
                  ? <ChevronUp className="w-4 h-4 text-brand-sage" />
                  : <ChevronDown className="w-4 h-4 text-brand-sage" />}
              </button>
              <AnimatePresence>
                {expandedPartnerSection === section.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2">
                      <p className="text-xs text-brand-sage italic mb-3">{section.intro}</p>
                      {section.items.map((item, idx) => (
                        <div key={idx} className="bg-white/40 rounded-xl p-3">
                          <div className="flex items-start gap-2">
                            <span className="text-brand-clay mt-0.5 text-xs">●</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.text}</p>
                              {item.detail && (
                                <p className="text-[11px] text-brand-sage mt-1">{item.detail}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Red Flags — "When to call your doctor" */}
      {resourceSubTab === 'redflags' && (
        <RedFlagsSection />
      )}

      {/* Doctor Says — curated postpartum anxieties */}
      {resourceSubTab === 'doctorsays' && (
        <DoctorSaysSection />
      )}
    </motion.div>
  );
});

// ---- Red Flags ----
function RedFlagsSection() {
  const urgent = redFlags.filter(f => f.severity === 'now');
  const today = redFlags.filter(f => f.severity === 'today');
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="bg-brand-rose/10 border border-brand-rose/30 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-brand-rose shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-medium mb-1">When to call your doctor</h3>
            <p className="text-xs text-brand-ink/70 leading-relaxed italic">{redFlagsIntro}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-brand-rose font-medium mb-2 px-1">Call now / go to ER</p>
        <div className="space-y-2">
          {urgent.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * i }}
              className="bg-brand-rose/5 border border-brand-rose/20 rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">{f.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-brand-ink/70 leading-relaxed mt-1">{f.detail}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-brand-gold font-medium mb-2 px-1">Contact your doctor today</p>
        <div className="space-y-2">
          {today.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * i }}
              className="bg-brand-gold/10 border border-brand-gold/20 rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">{f.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-brand-ink/70 leading-relaxed mt-1">{f.detail}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-white/40 dark:bg-white/5 rounded-2xl p-4 border border-brand-clay/15">
        <p className="text-xs font-medium text-brand-sage mb-2">Quick numbers</p>
        <div className="space-y-1.5">
          {emergencyRefLines.map((line, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-brand-ink/80"><b>{line.country}</b> · {line.label}</span>
              <a href={`tel:${line.number}`} className="text-brand-clay font-medium underline">{line.number}</a>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-brand-sage italic text-center pb-2">
        When in doubt — call. A doctor would rather hear from you unnecessarily than not at all.
      </p>
    </motion.div>
  );
}

// ---- Doctor Says ----
function DoctorSaysSection() {
  const [category, setCategory] = useState<typeof doctorSaysCategories[number]['key']>('baby-sleep');
  const [expanded, setExpanded] = useState<string | null>(null);
  const items = doctorSays.filter(q => q.category === category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="bg-brand-sage/10 border border-brand-sage/20 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Stethoscope className="w-5 h-5 text-brand-sage shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-medium mb-1">Doctor Says</h3>
            <p className="text-xs text-brand-ink/70 leading-relaxed italic">{doctorSaysIntro}</p>
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar">
        {doctorSaysCategories.map(cat => (
          <button
            key={cat.key}
            onClick={() => { setCategory(cat.key); setExpanded(null); }}
            className={cn(
              "shrink-0 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[40px] flex items-center gap-1.5",
              category === cat.key
                ? "bg-brand-sage text-white"
                : "bg-white/60 dark:bg-white/5 text-brand-ink/70 dark:text-brand-cream/70 border border-brand-sage/20"
            )}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Q&A cards */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {items.map((q, i) => {
            const isOpen = expanded === q.id;
            return (
              <motion.div
                key={q.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
                className="bg-white/50 dark:bg-white/5 border border-brand-clay/15 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : q.id)}
                  className="w-full p-4 text-left flex items-start justify-between gap-3 min-h-[56px]"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-brand-ink dark:text-brand-cream leading-snug">{q.question}</p>
                    {!isOpen && (
                      <p className="text-[11px] text-brand-sage italic mt-1 leading-snug">{q.summary}</p>
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-brand-sage shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-brand-sage shrink-0 mt-1" />}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 space-y-2 overflow-hidden"
                    >
                      <p className="text-sm text-brand-ink/80 dark:text-brand-cream/80 leading-relaxed">{q.body}</p>
                      {q.whenToWorry && (
                        <div className="bg-brand-rose/10 border border-brand-rose/20 rounded-xl p-3 mt-2">
                          <p className="text-[11px] text-brand-rose font-medium mb-1">When to worry</p>
                          <p className="text-xs text-brand-ink/80 dark:text-brand-cream/80 leading-relaxed">{q.whenToWorry}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <p className="text-[11px] text-brand-sage italic text-center pb-2">
        Every baby, every body is different. When in doubt, your doctor is the answer — not Google.
      </p>
    </motion.div>
  );
}
