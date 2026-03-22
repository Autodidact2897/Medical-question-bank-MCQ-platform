import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

export default function AdminEmails() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [briefs, setBriefs] = useState([])
  const [subscribers, setSubscribers] = useState({ subscribers: [], total: 0, active: 0 })
  const [loading, setLoading] = useState(true)

  // Editor state
  const [editing, setEditing] = useState(null) // null = list view, 'new' = new brief, or brief object
  const [form, setForm] = useState({ subject_line: '', preview_text: '', body_html: '', topic: '', msra_subject: '' })
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(null) // brief id being sent
  const [sendResult, setSendResult] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [briefsRes, subsRes] = await Promise.all([
        api.get('/admin/briefs'),
        api.get('/admin/subscribers'),
      ])
      setBriefs(briefsRes.data.data || [])
      setSubscribers(subsRes.data.data || { subscribers: [], total: 0, active: 0 })
      setLoading(false)
    } catch (err) {
      console.error('Load error:', err)
      setLoading(false)
    }
  }

  const startNew = () => {
    setForm({ subject_line: '', preview_text: '', body_html: '', topic: '', msra_subject: '' })
    setEditing('new')
    setSendResult(null)
  }

  const startEdit = (brief) => {
    setForm({
      subject_line: brief.subject_line || '',
      preview_text: brief.preview_text || '',
      body_html: brief.body_html || '',
      topic: brief.topic || '',
      msra_subject: brief.msra_subject || '',
    })
    setEditing(brief)
    setSendResult(null)
  }

  const handleSave = async () => {
    if (!form.subject_line || !form.body_html) return
    setSaving(true)
    try {
      if (editing === 'new') {
        await api.post('/admin/briefs', form)
      } else {
        await api.put(`/admin/briefs/${editing.id}`, form)
      }
      setEditing(null)
      await loadData()
    } catch (err) {
      console.error('Save error:', err)
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this brief?')) return
    try {
      await api.delete(`/admin/briefs/${id}`)
      await loadData()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleSendTest = async (id) => {
    setSending(id)
    setSendResult(null)
    try {
      const res = await api.post(`/admin/briefs/${id}/test`)
      setSendResult({ type: 'success', message: `Test sent to ${res.data.data.sent_to}` })
    } catch (err) {
      setSendResult({ type: 'error', message: err.response?.data?.error || 'Failed to send test' })
    }
    setSending(null)
  }

  const handleSendAll = async (id) => {
    if (!window.confirm(`Send this brief to all ${subscribers.active} active subscribers?`)) return
    setSending(id)
    setSendResult(null)
    try {
      const res = await api.post(`/admin/briefs/${id}/send`)
      const d = res.data.data
      setSendResult({ type: 'success', message: `Sent to ${d.sent}/${d.total} subscribers` })
      await loadData()
    } catch (err) {
      setSendResult({ type: 'error', message: err.response?.data?.error || 'Failed to send' })
    }
    setSending(null)
  }

  const handleLogout = async () => { await logout(); navigate('/') }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <p className="text-marine font-medium">Loading email manager...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-light">

      {/* Header */}
      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">&#x2695;</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
          <span className="text-xs bg-marine text-white px-2 py-0.5 rounded-full ml-2 font-medium">ADMIN</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="text-body-dark text-sm hover:text-marine">
            Metrics
          </button>
          <button onClick={() => navigate('/dashboard')} className="text-body-dark text-sm hover:text-marine">
            Dashboard
          </button>
          <button onClick={handleLogout} className="text-body-dark font-semibold text-sm hover:text-marine">
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-heading">Email Briefs Manager</h1>
            <p className="text-body-dark text-sm mt-1">
              {subscribers.active} active subscriber{subscribers.active !== 1 ? 's' : ''} out of {subscribers.total} total
            </p>
          </div>
          {!editing && (
            <button onClick={startNew} className="btn-primary text-sm">
              + New Brief
            </button>
          )}
        </div>

        {/* Send result banner */}
        {sendResult && (
          <div className={`mb-4 px-4 py-3 rounded-btn text-sm font-medium ${
            sendResult.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {sendResult.message}
          </div>
        )}

        {/* ── Editor ── */}
        {editing && (
          <div className="bg-white rounded-card border border-border-default p-6 mb-6">
            <h2 className="font-semibold text-heading text-base mb-4">
              {editing === 'new' ? 'Compose New Brief' : `Editing: ${editing.subject_line}`}
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-heading block mb-1">Subject Line *</label>
                <input
                  value={form.subject_line}
                  onChange={e => setForm({ ...form, subject_line: e.target.value })}
                  placeholder="e.g. Your daily MSRA brief: Heart Failure Management"
                  className="w-full border border-gray-200 rounded-btn px-3 py-2.5 text-sm text-heading focus:outline-none focus:border-marine"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-heading block mb-1">Preview Text</label>
                <input
                  value={form.preview_text}
                  onChange={e => setForm({ ...form, preview_text: e.target.value })}
                  placeholder="Short preview shown in inbox (optional)"
                  className="w-full border border-gray-200 rounded-btn px-3 py-2.5 text-sm text-heading focus:outline-none focus:border-marine"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-heading block mb-1">MSRA Subject</label>
                  <input
                    value={form.msra_subject}
                    onChange={e => setForm({ ...form, msra_subject: e.target.value })}
                    placeholder="e.g. Cardiovascular"
                    className="w-full border border-gray-200 rounded-btn px-3 py-2.5 text-sm text-heading focus:outline-none focus:border-marine"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-heading block mb-1">Topic</label>
                  <input
                    value={form.topic}
                    onChange={e => setForm({ ...form, topic: e.target.value })}
                    placeholder="e.g. Heart Failure"
                    className="w-full border border-gray-200 rounded-btn px-3 py-2.5 text-sm text-heading focus:outline-none focus:border-marine"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-heading block mb-1">Body (HTML) *</label>
                <textarea
                  value={form.body_html}
                  onChange={e => setForm({ ...form, body_html: e.target.value })}
                  rows={12}
                  placeholder={`Write your brief content here. You can use HTML tags:\n\n<h2>Key Points</h2>\n<ul>\n  <li>Point one</li>\n  <li>Point two</li>\n</ul>\n<p>Paragraph text here...</p>\n\n<h3>NICE Guideline Reference</h3>\n<p>NG106: Chronic heart failure</p>`}
                  className="w-full border border-gray-200 rounded-btn px-3 py-2.5 text-sm text-heading focus:outline-none focus:border-marine font-mono"
                />
              </div>

              {/* Preview */}
              {form.body_html && (
                <div>
                  <label className="text-xs font-semibold text-heading block mb-1">Preview</label>
                  <div
                    className="border border-gray-200 rounded-btn p-4 bg-grey-light text-sm text-heading leading-relaxed prose-sm"
                    dangerouslySetInnerHTML={{ __html: form.body_html }}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !form.subject_line || !form.body_html}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editing === 'new' ? 'Create Brief' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Briefs List ── */}
        {!editing && (
          <div className="mb-8">
            {briefs.length === 0 ? (
              <div className="bg-white rounded-card border-2 border-dashed border-border-default p-10 text-center">
                <div className="text-3xl mb-3">&#x2709;</div>
                <p className="text-heading font-semibold mb-1">No briefs yet</p>
                <p className="text-body-dark text-sm mb-4">Create your first clinical brief to send to subscribers.</p>
                <button onClick={startNew} className="btn-primary text-sm">
                  + Compose Brief
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {briefs.map(brief => (
                  <div key={brief.id} className="bg-white rounded-card border border-border-default p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-heading text-sm truncate">{brief.subject_line}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            brief.status === 'sent'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {brief.status === 'sent' ? 'Sent' : 'Draft'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-body-dark">
                          {brief.msra_subject && <span>{brief.msra_subject}</span>}
                          {brief.topic && <span>&middot; {brief.topic}</span>}
                          <span>&middot; {new Date(brief.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                          {brief.sent_at && (
                            <span>&middot; Sent to {brief.sent_count} on {new Date(brief.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                          )}
                        </div>
                        {brief.preview_text && (
                          <p className="text-xs text-body-dark mt-1 truncate">{brief.preview_text}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => startEdit(brief)}
                          className="text-xs text-marine font-medium hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleSendTest(brief.id)}
                          disabled={sending === brief.id}
                          className="text-xs text-marine font-medium hover:underline disabled:opacity-50"
                        >
                          {sending === brief.id ? '...' : 'Test'}
                        </button>
                        <button
                          onClick={() => handleSendAll(brief.id)}
                          disabled={sending === brief.id || subscribers.active === 0}
                          className="text-xs bg-marine text-white px-2.5 py-1 rounded-btn font-medium hover:opacity-90 disabled:opacity-50"
                        >
                          Send to {subscribers.active}
                        </button>
                        <button
                          onClick={() => handleDelete(brief.id)}
                          className="text-xs text-red-600 font-medium hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Subscribers List ── */}
        <div className="bg-white rounded-card border border-border-default p-5">
          <h2 className="font-semibold text-heading text-sm mb-3">
            Subscribers ({subscribers.active} active / {subscribers.total} total)
          </h2>
          {subscribers.subscribers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="text-left py-2 text-xs font-semibold text-heading">Email</th>
                    <th className="text-center py-2 text-xs font-semibold text-heading">Status</th>
                    <th className="text-right py-2 text-xs font-semibold text-heading">Subscribed</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.subscribers.map((sub, i) => (
                    <tr key={i} className="border-b border-border-default last:border-0">
                      <td className="py-2 text-xs text-heading">{sub.email}</td>
                      <td className="py-2 text-xs text-center">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          sub.subscribed
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {sub.subscribed ? 'Active' : 'Unsubscribed'}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-body-dark text-right">
                        {new Date(sub.subscribed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-body-dark">No subscribers yet. Users can subscribe from their dashboard.</p>
          )}
        </div>

      </div>
    </div>
  )
}
