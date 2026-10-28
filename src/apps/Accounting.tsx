import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDownLeft, ArrowUpRight, BarChart3, ChevronRight, Pencil, Plus, Search, Trash2, Wallet, X } from 'lucide-react'
import { db, type Account, type Category, type Transaction } from '../persistence/database'
import { formatMoney, parseMoney } from '../utils/money'
import { localDateInput } from '../utils/time'
import { useSystemStore } from '../system/store'
import { useT } from '../utils/i18n'

type Section = 'Overview' | 'Transactions' | 'Accounts' | 'Categories'
export function AccountingApp({ compact }: { compact: boolean }) {
  const t = useT(); const language = useSystemStore(s => s.settings.language)
  const locale = language === 'fa' ? 'fa-IR' : 'en-US'
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), [], [])
  const accounts = useLiveQuery(() => db.accounts.toArray(), [], [])
  const categories = useLiveQuery(() => db.categories.toArray(), [], [])
  const [section, setSection] = useState<Section>('Overview')
  const [editing, setEditing] = useState<Transaction | 'new' | null>(null)
  const [search, setSearch] = useState(''); const [type, setType] = useState('all'); const [category, setCategory] = useState('all'); const [period, setPeriod] = useState('all'); const [from, setFrom] = useState(''); const [to, setTo] = useState('')
  const [nameInput, setNameInput] = useState(''); const [message, setMessage] = useState('')
  const totals = useMemo(() => transactions.reduce((total, item) => {
    const amount = BigInt(item.amountCents)
    if (item.type === 'income') total.income += amount; else total.expenses += amount
    return total
  }, { income: 0n, expenses: 0n }), [transactions])
  const opening = accounts.reduce((sum, account) => sum + BigInt(account.openingCents), 0n)
  const balance = opening + totals.income - totals.expenses
  const now = new Date()
  const filtered = transactions.filter(item => {
    const date = new Date(item.date)
    const matchPeriod = period === 'all' || (period === 'month' && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) || (period === 'year' && date.getFullYear() === now.getFullYear())
    const localDay = localDateInput(date).slice(0, 10)
    return matchPeriod && (!from || localDay >= from) && (!to || localDay <= to) && (type === 'all' || item.type === type) && (category === 'all' || item.category === category) && `${item.description} ${item.category}`.toLowerCase().includes(search.toLowerCase())
  })
  const money = (amount: number | bigint) => formatMoney(amount, locale)
  const percent = totals.income + totals.expenses === 0n ? 0 : Number(totals.income * 100n / (totals.income + totals.expenses))
  const addItem = async () => {
    const name = nameInput.trim()
    if (!name) { setMessage('Please enter a name.'); return }
    if (name.length > 80) { setMessage('Names must be 80 characters or fewer.'); return }
    const existing = section === 'Accounts' ? accounts : categories
    if (existing.some(item => item.name.toLowerCase() === name.toLowerCase())) { setMessage('An item with this name already exists.'); return }
    try {
      if (section === 'Accounts') await db.accounts.add({ name, openingCents: 0 })
      else if (section === 'Categories') await db.categories.add({ name, color: '#a18bd0' })
      setNameInput(''); setMessage('')
    } catch { setMessage('Could not save. Please check browser storage.') }
  }
  const renameItem = async (kind: 'account' | 'category', item: Account | Category) => {
    const name = window.prompt(`Rename ${kind}`, item.name)?.trim()
    if (!name || !item.id || name === item.name) return
    if (kind === 'category' && categories.some(c => c.name.toLowerCase() === name.toLowerCase())) { setMessage('A category with this name already exists.'); return }
    try {
      if (kind === 'account') await db.accounts.update(item.id, { name })
      else await db.transaction('rw', db.categories, db.transactions, async () => { await db.categories.update(item.id!, { name }); await db.transactions.where('category').equals(item.name).modify({ category: name }) })
      setMessage('')
    } catch { setMessage(`Could not rename ${kind}.`) }
  }
  const removeItem = async (kind: 'account' | 'category', item: Account | Category) => {
    if (!item.id) return
    const used = kind === 'account' ? transactions.some(tx => tx.accountId === item.id) : transactions.some(tx => tx.category === item.name)
    if (used) { setMessage(`This ${kind} is used by transactions. Move or delete those transactions first.`); return }
    if ((kind === 'account' ? accounts.length : categories.length) <= 1) { setMessage(`Keep at least one ${kind}.`); return }
    if (!window.confirm(`Delete ${item.name}?`)) return
    try { if (kind === 'account') await db.accounts.delete(item.id); else await db.categories.delete(item.id); setMessage('') } catch { setMessage(`Could not delete ${kind}.`) }
  }
  return <div className={`app-root accounting-app ${compact ? 'compact-app' : ''}`}>
    <div className="accounting-header"><div><span className="eyebrow">{t("YOUR MONEY, IN FOCUS")}</span><h1>{t('Accounting')}</h1></div><button className="accounting-add" aria-label="Add transaction" onClick={() => setEditing('new')}><Plus size={19}/><span>{t('Add transaction')}</span></button></div>
    <div className="accounting-tabs">{(['Overview', 'Transactions', 'Accounts', 'Categories'] as Section[]).map(item => <button key={item} className={section === item ? 'active' : ''} onClick={() => { setSection(item); setMessage('') }}>{t(item)}</button>)}</div>
    <div className="accounting-scroll app-scroll">
      {section === 'Overview' && <><div className="balance-card"><div><span>{t('Total balance')}</span><strong>{money(balance)}</strong><small>Across {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} · USD</small></div><div className="balance-mark"><Wallet size={23}/></div><div className="balance-card-footer"><span><i/> Looking good, you're in control</span><ChevronRight size={16}/></div></div><div className="accounting-summary"><div><span className="summary-icon income"><ArrowDownLeft size={16}/></span><span><small>{t('Income')}</small><strong>{money(totals.income)}</strong></span></div><div><span className="summary-icon expense"><ArrowUpRight size={16}/></span><span><small>{t('Expenses')}</small><strong>{money(totals.expenses)}</strong></span></div><div className="net-summary"><span><small>{t('Net balance')}</small><strong>{money(totals.income - totals.expenses)}</strong></span></div></div><div className="spending-card"><div className="section-heading"><div><span className="eyebrow">{t("THE BIG PICTURE")}</span><h2>{t("Income & expenses")}</h2></div><BarChart3 size={20}/></div><div className="bar-labels"><span><i className="income-dot"/> Income</span><span><i className="expense-dot"/> Expenses</span></div><div className="money-bar"><span style={{ width: `${percent}%` }}/></div></div><div className="section-heading recent-heading"><div><span className="eyebrow">{t("YOUR ACTIVITY")}</span><h2>{t('Recent activity')}</h2></div><button onClick={() => setSection('Transactions')}>{t("See all")}</button></div><TransactionList items={transactions.slice(0, 4)} categories={categories} accounts={accounts} onSelect={setEditing} money={money}/></>}
      {section === 'Transactions' && <><div className="accounting-filters"><div className="ios-search"><Search size={15}/><input aria-label="Search transactions" placeholder={t('Search transactions')} value={search} onChange={e => setSearch(e.target.value)}/></div><div className="filter-selects"><select aria-label="Filter transaction type" value={type} onChange={e => setType(e.target.value)}><option value="all">{t("All types")}</option><option value="income">Income</option><option value="expense">Expenses</option></select><select aria-label="Filter transaction category" value={category} onChange={e => setCategory(e.target.value)}><option value="all">{t("All categories")}</option>{categories.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select><select aria-label="Filter transaction date" value={period} onChange={e => setPeriod(e.target.value)}><option value="all">{t("All time")}</option><option value="month">{t("This month")}</option><option value="year">{t("This year")}</option></select></div><div className="date-filters"><label>From <input aria-label="From date" type="date" value={from} onChange={e => setFrom(e.target.value)}/></label><label>To <input aria-label="To date" type="date" value={to} onChange={e => setTo(e.target.value)}/></label></div></div><TransactionList items={filtered} categories={categories} accounts={accounts} onSelect={setEditing} money={money}/><button className="clear-demo" onClick={async () => { if (window.confirm('Delete all transactions? This cannot be undone.')) { try { await db.transactions.clear() } catch { setMessage('Could not delete transactions.') } } }}>{t("Clear all transactions")}</button>{message && <p className="form-error">{message}</p>}</>}
      {(section === 'Accounts' || section === 'Categories') && <><div className="management-heading"><h2>{t(section)}</h2><p>{section === 'Accounts' ? t('Your sample accounts and their balances.') : t('Keep your activity organized.')}</p></div><div className="management-list">{section === 'Accounts' ? accounts.map(account => {
        const total = transactions.filter(item => item.accountId === account.id).reduce((sum, item) => sum + (item.type === 'income' ? BigInt(item.amountCents) : -BigInt(item.amountCents)), BigInt(account.openingCents))
        return <div className="management-row" key={account.id}><span className="summary-icon income"><Wallet size={16}/></span><strong>{account.name}</strong><span>{money(total)}</span><button aria-label={`Rename account ${account.name}`} onClick={() => void renameItem('account', account)}><Pencil size={13}/></button><button aria-label={`Delete account ${account.name}`} onClick={() => void removeItem('account', account)}><Trash2 size={13}/></button></div>
      }) : categories.map(item => <div className="management-row" key={item.id}><span className="category-color" style={{ background: item.color }}/><strong>{item.name}</strong><span>{transactions.filter(tx => tx.category === item.name).length} transactions</span><button aria-label={`Rename category ${item.name}`} onClick={() => void renameItem('category', item)}><Pencil size={13}/></button><button aria-label={`Delete category ${item.name}`} onClick={() => void removeItem('category', item)}><Trash2 size={13}/></button></div>)}</div><div className="add-management"><input aria-label={section === 'Accounts' ? t('New account name') : t('New category name')} placeholder={section === 'Accounts' ? t('New account name') : t('New category name')} value={nameInput} onChange={e => setNameInput(e.target.value)}/><button onClick={() => void addItem()}><Plus size={16}/> Add</button></div>{message && <p className="form-error">{message}</p>}</>}
    </div>
    {editing && <TransactionForm transaction={editing === 'new' ? null : editing} accounts={accounts} categories={categories} onClose={() => setEditing(null)}/>}
  </div>
}
function TransactionList({ items, categories, accounts, onSelect, money }: { items: Transaction[]; categories: Category[]; accounts: Account[]; onSelect: (item: Transaction) => void; money: (amount: number | bigint) => string }) {
  const t = useT()
  if (!items.length) return <div className="transaction-empty"><span><BarChart3 size={22}/></span><strong>{t('No transactions yet')}</strong><p>{t("Add a transaction to get started.")}</p></div>
  return <div className="transaction-list">{items.map(item => <button className="transaction-row" key={item.id} onClick={() => onSelect(item)}><span className="transaction-symbol" style={{ background: `${categories.find(c => c.name === item.category)?.color ?? '#9fa7b3'}25`, color: categories.find(c => c.name === item.category)?.color ?? '#777' }}>{item.type === 'income' ? <ArrowDownLeft size={17}/> : <ArrowUpRight size={17}/>}</span><span className="transaction-name"><strong>{item.description}</strong><small>{item.category} · {accounts.find(a => a.id === item.accountId)?.name ?? 'Account'} · {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small></span><span className={`transaction-amount ${item.type}`}>{item.type === 'income' ? '+' : '−'}{money(item.amountCents)}</span><ChevronRight size={15} className="row-chevron"/></button>)}</div>
}
function TransactionForm({ transaction, accounts, categories, onClose }: { transaction: Transaction | null; accounts: Account[]; categories: Category[]; onClose: () => void }) {
  const t = useT(); const [type, setType] = useState<'income' | 'expense'>(transaction?.type ?? 'expense')
  const [amount, setAmount] = useState(transaction ? (transaction.amountCents / 100).toFixed(2) : '')
  const [description, setDescription] = useState(transaction?.description ?? '')
  const [category, setCategory] = useState(transaction?.category ?? categories[0]?.name ?? 'Other')
  const [account, setAccount] = useState(String(transaction?.accountId ?? accounts[0]?.id ?? ''))
  const [date, setDate] = useState(transaction ? localDateInput(new Date(transaction.date)) : localDateInput())
  const [error, setError] = useState('')
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); const cents = parseMoney(amount)
    if (cents === null) { setError(t('Enter an amount greater than zero, with up to two decimal places.')); return }
    if (!description.trim() || !account || !category || !date || Number.isNaN(new Date(date).getTime())) { setError(t('Complete all fields with a valid date.')); return }
    const record: Transaction = { type, amountCents: cents, description: description.trim().slice(0, 100), category, accountId: Number(account), date: new Date(date).toISOString() }
    try { if (transaction?.id) await db.transactions.update(transaction.id, record); else await db.transactions.add(record); onClose() } catch { setError('Could not save this transaction. Check browser storage.') }
  }
  return <div className="app-modal-scrim" onClick={onClose}><form className="transaction-form" onClick={e => e.stopPropagation()} onSubmit={e => void save(e)}><div className="form-head"><button type="button" onClick={onClose}>{t('Cancel')}</button><strong>{transaction ? t('Transaction details') : t('Add transaction')}</strong><button type="submit">{t('Save')}</button></div><div className="transaction-form-body"><div className="type-toggle"><button type="button" className={type === 'expense' ? 'selected' : ''} onClick={() => setType('expense')}>{t('Expenses')}</button><button type="button" className={type === 'income' ? 'selected' : ''} onClick={() => setType('income')}>{t('Income')}</button></div><label>{t('Amount')} <span>USD</span><input aria-label="Amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}/></label><label>{t('Description')}<input aria-label="Description" placeholder={t('What was it for?')} value={description} onChange={e => setDescription(e.target.value)} maxLength={100}/></label><label>{t('Category')}<select aria-label="Category" value={category} onChange={e => setCategory(e.target.value)}>{categories.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label><label>{t('Account')}<select aria-label="Account" value={account} onChange={e => setAccount(e.target.value)}>{accounts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>{t('Date')}<input aria-label="Date" type="datetime-local" value={date} onChange={e => setDate(e.target.value)}/></label>{error && <p className="form-error" role="alert">{error}</p>}{transaction?.id && <button type="button" className="delete-transaction" onClick={async () => { if (window.confirm('Delete this transaction?')) { try { await db.transactions.delete(transaction.id!); onClose() } catch { setError('Could not delete this transaction.') } } }}><Trash2 size={16}/>{t('Delete')}</button>}</div><button type="button" className="modal-close-mobile" aria-label="Close" onClick={onClose}><X size={16}/></button></form></div>
}
