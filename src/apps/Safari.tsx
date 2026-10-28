import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { BookOpen, ChevronLeft, ChevronRight, Clock3, Compass, Copy, ExternalLink, Globe2, LockKeyhole, MoreHorizontal, Plus, Search, Share, Star, X } from 'lucide-react'
import { db, type SafariTab } from '../persistence/database'
import { useSystemStore } from '../system/store'
import { useT } from '../utils/i18n'

const internalPages: Record<string, { title: string; description: string }> = {
  'duo://start': { title: 'Start Page', description: 'Your corner of the internet.' },
  'duo://discover': { title: 'Discover Duo', description: 'A little more room for the things you love.' },
  'duo://guide': { title: 'The little guide', description: 'Get to know your simulator.' },
  'duo://weather': { title: 'A brighter forecast', description: 'A sample weather page, available offline.' },
}
function titleFor(url: string) {
  if (internalPages[url]) return internalPages[url].title
  if (url.startsWith('duo://search')) return `Search: ${new URL(url).searchParams.get('q') ?? ''}`
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}
export function addressToUrl(value: string, engine: string): string {
  const input = value.trim()
  if (!input) return 'duo://start'
  if (input.startsWith('duo://')) return input
  if (/^https?:\/\//i.test(input)) {
    try { const url = new URL(input); return ['http:', 'https:'].includes(url.protocol) ? url.href : `duo://search?q=${encodeURIComponent(input)}&engine=${encodeURIComponent(engine)}` } catch { /* treat as search */ }
  }
  if (/^[\w-]+(\.[\w-]+)+(?:[/:?#].*)?$/.test(input)) return `https://${input}`
  return `duo://search?q=${encodeURIComponent(input)}&engine=${encodeURIComponent(engine)}`
}

export function SafariApp({ windowId, compact }: { windowId: string; compact: boolean }) {
  const { settings } = useSystemStore(); const t = useT()
  const initialId = `${windowId}-start`
  const [activeId, setActiveId] = useState('')
  const [address, setAddress] = useState('')
  const [panel, setPanel] = useState<'tabs' | 'bookmarks' | 'history' | 'menu' | null>(null)
  const [error, setError] = useState('')
  const tabs = useLiveQuery(() => db.safariTabs.where('windowId').equals(windowId).toArray(), [windowId], [])
  const bookmarks = useLiveQuery(() => db.bookmarks.toArray(), [], [])
  const history = useLiveQuery(() => db.history.orderBy('visitedAt').reverse().limit(30).toArray(), [], [])
  const active = tabs.find(tab => tab.id === activeId) ?? tabs[0]
  const url = active?.history[active.index] ?? 'duo://start'
  const bookmarked = bookmarks.some(item => item.url === url)
  useEffect(() => {
    void (async () => {
      const existing = await db.safariTabs.where('windowId').equals(windowId).toArray()
      if (existing.length) setActiveId((existing.find(tab => tab.active) ?? existing[0]).id)
      else { await db.safariTabs.put({ id: initialId, windowId, history: ['duo://start'], index: 0, title: 'Start Page', active: true }); setActiveId(initialId) }
    })().catch(() => setError('Browser data could not be opened.'))
  }, [initialId, windowId])
  useEffect(() => { setAddress(url === 'duo://start' ? '' : url.startsWith('duo://search') ? (new URL(url).searchParams.get('q') ?? '') : url) }, [url])
  const navigate = async (destination: string) => {
    if (!active) return
    setPanel(null)
    const next = addressToUrl(destination, settings.searchEngine)
    const nextHistory = [...active.history.slice(0, active.index + 1), next]
    try {
      await db.safariTabs.update(active.id, { history: nextHistory, index: nextHistory.length - 1, title: titleFor(next) })
      if (next !== 'duo://start') await db.history.add({ title: titleFor(next), url: next, visitedAt: new Date().toISOString() })
      setError('')
    } catch { setError('Could not save browsing data in this browser.') }
  }
  const move = async (direction: number) => {
    if (!active) return
    const index = active.index + direction
    if (index >= 0 && index < active.history.length) await db.safariTabs.update(active.id, { index, title: titleFor(active.history[index]) }).catch(() => setError('Could not update this tab.'))
  }
  const selectTab = async (id: string) => {
    setActiveId(id)
    try { await db.transaction('rw', db.safariTabs, async () => { await db.safariTabs.where('windowId').equals(windowId).modify({ active: false }); await db.safariTabs.update(id, { active: true }) }) } catch { setError('Could not save the active tab.') }
  }
  const newTab = async () => {
    setPanel(null)
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`
    try { await db.safariTabs.add({ id, windowId, history: ['duo://start'], index: 0, title: 'Start Page' }); await selectTab(id) } catch { setError('Could not create a tab.') }
  }
  const closeTab = async (tab: SafariTab) => {
    if (tabs.length === 1) { await db.safariTabs.update(tab.id, { history: ['duo://start'], index: 0, title: 'Start Page' }); setPanel(null); return }
    await db.safariTabs.delete(tab.id)
    if (tab.id === activeId) await selectTab(tabs.find(item => item.id !== tab.id)?.id ?? initialId)
  }
  const toggleBookmark = async () => {
    try {
      const existing = await db.bookmarks.where('url').equals(url).first()
      if (existing?.id) await db.bookmarks.delete(existing.id)
      else await db.bookmarks.add({ url, title: titleFor(url) })
    } catch { setError('Could not save this bookmark.') }
  }
  const search = useMemo(() => url.startsWith('duo://search') ? new URL(url).searchParams.get('q') ?? '' : null, [url])
  const isExternal = /^https?:\/\//.test(url)
  return <div className={`app-root safari-app ${compact ? 'compact-app' : ''}`}>
    <div className="safari-toolbar"><button aria-label="Back" disabled={!active || active.index === 0} onClick={() => void move(-1)}><ChevronLeft size={20}/></button><button aria-label="Forward" disabled={!active || active.index >= active.history.length - 1} onClick={() => void move(1)}><ChevronRight size={20}/></button><form className="safari-address" onSubmit={e => { e.preventDefault(); void navigate(address) }}><LockKeyhole size={12}/><input disabled={!active} aria-label="Search or enter website name" placeholder={t('Search or enter website name')} value={address} onChange={e => setAddress(e.target.value)}/><button type="submit" aria-label="Go"><Search size={15}/></button></form><button aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this page'} onClick={() => void toggleBookmark()}><Star size={19} fill={bookmarked ? 'currentColor' : 'none'}/></button><button aria-label="Show tabs" onClick={() => setPanel(panel === 'tabs' ? null : 'tabs')} className="tabs-button"><Copy size={18}/><small>{tabs.length}</small></button><button aria-label="Safari menu" onClick={() => setPanel(panel === 'menu' ? null : 'menu')}><MoreHorizontal size={20}/></button></div>
    {error && <div className="app-error" role="alert">{error}<button onClick={() => setError('')}>×</button></div>}
    <div className="safari-content app-scroll">
      {url === 'duo://start' ? <div className="safari-start"><div className="safari-start-header"><span className="safari-compass"><Compass size={29}/></span><div><span>GOOD TO SEE YOU</span><h1>{t('Start Page')}</h1></div></div><p>{t("Your corner of the internet, all in one place.")}</p><div className="safari-section-heading"><h2>{t('Favorites')}</h2><button onClick={() => setPanel('bookmarks')}>Edit</button></div><div className="favorite-grid">{bookmarks.length ? bookmarks.map(item => <button key={item.id} disabled={!active} onClick={() => void navigate(item.url)}><span className={`favorite-icon favorite-${item.title.toLowerCase().replace(/[^a-z]/g, '')}`}>{item.url.startsWith('duo://') ? <Compass size={22}/> : <Globe2 size={22}/>}</span><small>{item.title}</small></button>) : <span className="safari-empty">Bookmark a page to see it here.</span>}</div><div className="safari-section-heading"><h2>{t("Made for a little more")}</h2></div><button className="safari-feature" onClick={() => void navigate('duo://discover')}><span className="feature-copy"><small>THE DUO EXPERIENCE</small><strong>Good things<br/>unfold here.</strong><span>Explore the concept &nbsp; →</span></span><span className="feature-orb"/></button><div className="safari-privacy"><LockKeyhole size={15}/> Your browsing data stays in this simulator.</div></div>
      : search !== null ? <div className="safari-page"><span className="demo-pill">{t("OFFLINE DEMO SEARCH")}</span><h1>Results for “{search}”</h1><p>{t('These sample results work without an internet connection.')} {settings.searchEngine} {t('selected in Settings.')}</p>{Object.entries(internalPages).filter(([key]) => key !== 'duo://start').map(([link, item]) => <button className="search-result" key={link} onClick={() => void navigate(link)}><small>duo.local › {link.replace('duo://', '')}</small><strong>{item.title}</strong><span>{item.description}</span></button>)}</div>
      : internalPages[url] ? <InternalPage url={url} onNavigate={destination => void navigate(destination)}/>
      : isExternal ? <div className="external-page"><div className="external-notice"><div><strong>Website preview</strong><p>Some sites block embedding. Scripts are disabled in this preview for safety.</p></div><a href={url} target="_blank" rel="noreferrer noopener">Open in browser <ExternalLink size={13}/></a></div><iframe key={url} src={url} title={`Preview of ${titleFor(url)}`} sandbox="allow-forms allow-popups" referrerPolicy="no-referrer"/></div>
      : <div className="safari-page"><h1>Page not found</h1><p>This demo page isn't available.</p><button className="ios-link" onClick={() => void navigate('duo://start')}>Return to Start Page</button></div>}
    </div>
    <div className="safari-bottom"><button aria-label="Bookmarks" onClick={() => setPanel(panel === 'bookmarks' ? null : 'bookmarks')}><BookOpen size={19}/></button><button aria-label="History" onClick={() => setPanel(panel === 'history' ? null : 'history')}><Clock3 size={19}/></button><button aria-label="New tab" onClick={() => void newTab()}><Plus size={20}/></button><button aria-label="Share page" onClick={async () => { if (navigator.share && isExternal) { try { await navigator.share({ url }) } catch { /* cancelled */ } } else setPanel('menu') }}><Share size={18}/></button></div>
    {panel && <div className="safari-panel"><div className="panel-head"><strong>{panel === 'tabs' ? `${tabs.length} ${tabs.length === 1 ? 'Tab' : 'Tabs'}` : panel === 'bookmarks' ? t('Bookmarks') : panel === 'history' ? t('History') : 'Page controls'}</strong><button aria-label="Close Safari panel" onClick={() => setPanel(null)}><X size={18}/></button></div>{panel === 'tabs' && <><div className="safari-tab-list">{tabs.map(tab => <div key={tab.id} className={`safari-tab ${active?.id === tab.id ? 'active' : ''}`}><button onClick={() => { void selectTab(tab.id); setPanel(null) }}><Globe2 size={17}/><span>{tab.title}</span></button><button aria-label={`Close ${tab.title} tab`} onClick={() => void closeTab(tab)}><X size={15}/></button></div>)}</div><button className="panel-action" onClick={() => void newTab()}><Plus size={16}/> {t('New Tab')}</button></>}{panel === 'bookmarks' && <>{bookmarks.map(item => <div className="panel-list-row" key={item.id}><button onClick={() => void navigate(item.url)}><Star size={15}/><span>{item.title}</span></button><button aria-label={`Remove ${item.title} bookmark`} onClick={() => item.id && void db.bookmarks.delete(item.id)}>×</button></div>)}{!bookmarks.length && <p className="settings-note">No bookmarks yet.</p>}</>}{panel === 'history' && <>{history.map(item => <button className="panel-list-row single" key={item.id} onClick={() => void navigate(item.url)}><Clock3 size={15}/><span>{item.title}</span></button>)}{!history.length && <p className="settings-note">No browsing history yet.</p>}<button className="panel-action danger" onClick={() => { if (window.confirm('Clear browsing history?')) void db.history.clear() }}>{t('Clear History')}</button></>}{panel === 'menu' && <><button className="panel-action" onClick={() => { void toggleBookmark(); setPanel(null) }}><Star size={16}/>{bookmarked ? 'Remove Bookmark' : 'Add Bookmark'}</button><button className="panel-action" onClick={() => setPanel('bookmarks')}><BookOpen size={16}/>{t('Bookmarks')}</button><button className="panel-action" onClick={() => setPanel('history')}><Clock3 size={16}/>{t('History')}</button><button className="panel-action" onClick={() => void navigate('duo://start')}><Compass size={16}/>Start Page</button>{isExternal && <a className="panel-action" href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/>Open in browser</a>}</>}</div>}
  </div>
}
function InternalPage({ url, onNavigate }: { url: string; onNavigate: (url: string) => void }) {
  const page = internalPages[url]
  return <div className="safari-page internal-page"><span className="demo-pill">DUO JOURNAL · OFFLINE</span><div className="internal-hero"><span>THE LITTLE THINGS</span><h1>{page.title}</h1><p>{page.description}</p></div><h2>{url === 'duo://guide' ? 'A few things to try' : 'A little space to explore.'}</h2><p>{url === 'duo://guide' ? 'Open and close your Duo, explore the apps, or try two apps side by side. Your changes are saved right here in your browser.' : url === 'duo://weather' ? 'Today calls for a little sunshine. This forecast is a sample, not live weather data.' : 'A familiar experience, reimagined with more room for the things you love. This is an independent web concept, designed for exploring.'}</p><button className="ios-link" onClick={() => onNavigate(url === 'duo://guide' ? 'duo://discover' : 'duo://guide')}>Explore the little guide →</button></div>
}
