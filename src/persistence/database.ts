import Dexie, { type Table } from 'dexie'

export interface Account { id?: number; name: string; openingCents: number }
export interface Category { id?: number; name: string; color: string }
export interface Transaction { id?: number; type: 'income' | 'expense'; amountCents: number; description: string; category: string; accountId: number; date: string }
export interface Note { id?: number; title: string; body: string; updatedAt: string }
export interface CalendarEvent { id?: number; title: string; date: string }
export interface SafariTab { id: string; windowId: string; history: string[]; index: number; title: string; active?: boolean }
export interface Bookmark { id?: number; title: string; url: string }
export interface HistoryEntry { id?: number; title: string; url: string; visitedAt: string }
export interface Photo { id?: number; dataUrl: string; createdAt: string }

export class SimulatorDatabase extends Dexie {
  accounts!: Table<Account, number>
  categories!: Table<Category, number>
  transactions!: Table<Transaction, number>
  notes!: Table<Note, number>
  events!: Table<CalendarEvent, number>
  safariTabs!: Table<SafariTab, string>
  bookmarks!: Table<Bookmark, number>
  history!: Table<HistoryEntry, number>
  photos!: Table<Photo, number>
  constructor() {
    super('DuoSimulatorDB')
    this.version(1).stores({ accounts: '++id,name', categories: '++id,name', transactions: '++id,type,category,accountId,date', notes: '++id,updatedAt', events: '++id,date', safariTabs: 'id,windowId', bookmarks: '++id,url', history: '++id,visitedAt', photos: '++id,createdAt' })
    this.on('populate', transaction => {
      const now = new Date()
      const at = (days: number) => new Date(now.getTime() - days * 86400000).toISOString()
      void transaction.table('accounts').bulkAdd([{ id: 1, name: 'Everyday', openingCents: 0 }, { id: 2, name: 'Savings', openingCents: 0 }])
      void transaction.table('categories').bulkAdd([{ name: 'Salary', color: '#63bd97' }, { name: 'Food & Drink', color: '#f4a66e' }, { name: 'Shopping', color: '#ad91d5' }, { name: 'Transport', color: '#86a6ec' }, { name: 'Other', color: '#9fa7b3' }])
      void transaction.table('transactions').bulkAdd([
        { type: 'income', amountCents: 425000, description: 'Monthly salary', category: 'Salary', accountId: 1, date: at(2) },
        { type: 'expense', amountCents: 4850, description: 'Morning coffee', category: 'Food & Drink', accountId: 1, date: at(1) },
        { type: 'expense', amountCents: 12600, description: 'Weekend market', category: 'Shopping', accountId: 1, date: at(3) },
      ])
      void transaction.table('notes').bulkAdd([{ title: 'A little inspiration', body: 'Make space for the things that matter.\n\nThis is your space to think, plan, and create.', updatedAt: now.toISOString() }])
      void transaction.table('bookmarks').bulkAdd([{ title: 'Discover Duo', url: 'duo://discover' }, { title: 'The little guide', url: 'duo://guide' }, { title: 'Weather', url: 'duo://weather' }])
    })
  }
}
export const db = new SimulatorDatabase()

export async function resetSimulator() {
  await db.delete()
  localStorage.removeItem('duo-simulator-settings-v1')
  localStorage.removeItem('duo-messages-v1')
  window.location.reload()
}
