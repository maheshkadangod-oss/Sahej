import React, { useRef } from 'react';
import {
  X, Key, Moon, Sun, Bell, BellOff, Download, Upload, RotateCcw, AlertCircle, Users, Plus, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/cn';
import { t } from '../strings';
import { isNotificationSupported } from '../services/notifications';
import type { TrustedContact } from '../types';

interface SettingsModalProps {
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  notificationsOn: boolean;
  handleToggleNotifications: () => void;
  apiKeyInput: string;
  setApiKeyInput: (v: string) => void;
  showApiKey: boolean;
  setShowApiKey: (v: boolean) => void;
  handleSaveApiKey: () => void;
  handleExportData: () => void;
  handleImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleResetApp: () => void;
  trustedContacts: TrustedContact[];
  addTrustedContact: (name: string, phone: string) => void;
  removeTrustedContact: (id: string) => void;
}

export default function SettingsModal({
  showSettings, setShowSettings,
  darkMode, setDarkMode,
  notificationsOn, handleToggleNotifications,
  apiKeyInput, setApiKeyInput,
  showApiKey, setShowApiKey,
  handleSaveApiKey,
  handleExportData,
  handleImportData,
  handleResetApp,
  trustedContacts, addTrustedContact, removeTrustedContact,
}: SettingsModalProps) {
  const importFileRef = useRef<HTMLInputElement>(null);
  const [showAddContact, setShowAddContact] = React.useState(false);
  const [contactName, setContactName] = React.useState('');
  const [contactPhone, setContactPhone] = React.useState('');

  return (
    <AnimatePresence>
      {showSettings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false); }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-brand-cream w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 pb-8 max-h-[85vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium">{t('settings')}</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2.5 rounded-full hover:bg-black/5 active:bg-black/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Dark mode toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="w-4 h-4 text-brand-lavender" /> : <Sun className="w-4 h-4 text-brand-gold" />}
                  <span className="text-sm font-medium">{t('darkMode')}</span>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={cn(
                    "w-12 h-7 rounded-full transition-colors relative",
                    darkMode ? "bg-brand-lavender" : "bg-brand-sage/20"
                  )}
                >
                  <motion.div
                    animate={{ x: darkMode ? 22 : 2 }}
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>

              {/* Notifications toggle */}
              {isNotificationSupported() && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    {notificationsOn ? <Bell className="w-4 h-4 text-brand-clay" /> : <BellOff className="w-4 h-4 text-brand-sage" />}
                    <div>
                      <span className="text-sm font-medium">{t('notifications')}</span>
                      <p className="text-[10px] text-brand-sage">{t('notificationsDesc')}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleNotifications}
                    className={cn(
                      "w-12 h-7 rounded-full transition-colors relative shrink-0",
                      notificationsOn ? "bg-brand-clay" : "bg-brand-sage/20"
                    )}
                  >
                    <motion.div
                      animate={{ x: notificationsOn ? 22 : 2 }}
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>
              )}

              <div className="border-t border-brand-clay/10" />

              {/* API Key */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Key className="w-4 h-4 text-brand-clay" />
                  {t('apiKeyLabel')}
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={t('apiKeyPlaceholder')}
                    className="w-full bg-white/60 border border-brand-clay/20 rounded-2xl py-3.5 px-4 pr-20 focus:outline-none focus:ring-2 focus:ring-brand-clay/30 text-sm"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-brand-sage hover:text-brand-ink py-1 px-2"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-[11px] text-brand-sage italic">{t('apiKeyHelp')}</p>
                <button
                  onClick={handleSaveApiKey}
                  className="w-full py-3.5 bg-brand-clay text-white rounded-2xl text-sm font-medium hover:bg-brand-clay/90 active:bg-brand-clay/80 transition-all press-effect min-h-[48px]"
                >
                  {t('save')}
                </button>
              </div>

              <div className="border-t border-brand-clay/10" />

              {/* Export Data */}
              <button
                onClick={handleExportData}
                className="w-full flex items-center gap-3 py-3 px-1 hover:bg-black/5 active:bg-black/10 rounded-xl transition-colors min-h-[48px]"
              >
                <Download className="w-4 h-4 text-brand-sage" />
                <div className="text-left">
                  <span className="text-sm font-medium">{t('exportData')}</span>
                  <p className="text-[10px] text-brand-sage">{t('exportDesc')}</p>
                </div>
              </button>

              {/* Import Data */}
              <button
                onClick={() => importFileRef.current?.click()}
                className="w-full flex items-center gap-3 py-3 px-1 hover:bg-black/5 active:bg-black/10 rounded-xl transition-colors min-h-[48px]"
              >
                <Upload className="w-4 h-4 text-brand-sage" />
                <div className="text-left">
                  <span className="text-sm font-medium">{t('importData')}</span>
                  <p className="text-[10px] text-brand-sage">{t('importDesc')}</p>
                </div>
              </button>
              <input ref={importFileRef} type="file" accept=".json" onChange={handleImportData} className="hidden" />

              <div className="border-t border-brand-clay/10" />

              {/* Trusted Contacts */}
              <div className="space-y-3 py-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-sage" />
                  <div>
                    <span className="text-sm font-medium">{t('trustedContacts')}</span>
                    <p className="text-[10px] text-brand-sage">{t('trustedContactsDesc')}</p>
                  </div>
                </div>

                {trustedContacts.map(c => (
                  <div key={c.id} className="flex items-center gap-2 bg-white/30 dark:bg-white/5 rounded-xl px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-brand-sage">{c.phone}</p>
                    </div>
                    <button
                      onClick={() => removeTrustedContact(c.id)}
                      className="p-1.5 rounded-full hover:bg-red-50 active:bg-red-100 transition-colors"
                      aria-label={t('removeContact')}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                ))}

                {trustedContacts.length < 3 && !showAddContact && (
                  <button
                    onClick={() => setShowAddContact(true)}
                    className="flex items-center gap-2 text-sm text-brand-clay font-medium py-2"
                  >
                    <Plus className="w-4 h-4" /> {t('addContact')}
                  </button>
                )}

                {trustedContacts.length >= 3 && (
                  <p className="text-[10px] text-brand-sage italic">{t('maxContacts')}</p>
                )}

                {showAddContact && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      placeholder={t('contactName')}
                      className="w-full px-3 py-2 rounded-xl bg-white/50 dark:bg-white/5 border border-brand-sage/20 text-sm focus:outline-none focus:ring-2 focus:ring-brand-clay/30 min-h-[40px]"
                    />
                    <input
                      type="tel"
                      inputMode="tel"
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                      placeholder={t('contactPhone')}
                      className="w-full px-3 py-2 rounded-xl bg-white/50 dark:bg-white/5 border border-brand-sage/20 text-sm focus:outline-none focus:ring-2 focus:ring-brand-clay/30 min-h-[40px]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (contactName.trim() && contactPhone.trim()) {
                            addTrustedContact(contactName, contactPhone);
                            setContactName('');
                            setContactPhone('');
                            setShowAddContact(false);
                          }
                        }}
                        className="flex-1 py-2 bg-brand-clay text-white rounded-xl text-sm font-medium min-h-[40px]"
                      >
                        {t('saveContact')}
                      </button>
                      <button
                        onClick={() => { setShowAddContact(false); setContactName(''); setContactPhone(''); }}
                        className="px-4 py-2 bg-brand-sage/10 rounded-xl text-sm text-brand-sage min-h-[40px]"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-brand-clay/10" />

              {/* Reset App */}
              <button
                onClick={() => { if (window.confirm(t('resetConfirm'))) handleResetApp(); }}
                className="w-full flex items-center gap-3 py-3 px-1 hover:bg-red-50 active:bg-red-100 rounded-xl transition-colors min-h-[48px]"
              >
                <RotateCcw className="w-4 h-4 text-red-400" />
                <div className="text-left">
                  <span className="text-sm font-medium text-red-500">{t('resetApp')}</span>
                  <p className="text-[10px] text-brand-sage">{t('resetDesc')}</p>
                </div>
              </button>

              <div className="border-t border-brand-clay/10" />

              {/* Disclaimer */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-brand-clay" />
                  {t('disclaimer')}
                </h3>
                <p className="text-[11px] text-brand-sage leading-relaxed">{t('disclaimerText')}</p>
              </div>

              <div className="border-t border-brand-clay/10" />

              {/* About */}
              <div className="text-center space-y-1 pb-2">
                <p className="text-sm font-serif font-medium text-brand-ink">{t('appName')}</p>
                <p className="text-[10px] text-brand-sage">v1.3.0 &middot; Made with love for every mama</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
