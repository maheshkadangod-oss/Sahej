import React from 'react';
import { Shield, Phone, ExternalLink, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/cn';
import { t } from '../strings';
import { helplineData } from '../data/helplines';
import { milestones, parentingTips, resourceLinks } from '../data/resources';
import { partnerSections } from '../data/partnerContent';
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
    </motion.div>
  );
});
