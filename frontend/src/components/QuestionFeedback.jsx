import { useState } from 'react'
import api from '../lib/api'

const FEEDBACK_TYPES = [
  { value: 'wrong_answer', label: 'Wrong answer' },
  { value: 'unclear_question', label: 'Unclear question' },
  { value: 'incorrect_explanation', label: 'Incorrect explanation' },
  { value: 'other', label: 'Other' },
]

export default function QuestionFeedback({ questionId }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('')
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!type || submitting) return
    setSubmitting(true)
    try {
      await api.post(`/questions/${questionId}/feedback`, {
        feedback_type: type,
        feedback_text: text,
      })
      setSubmitted(true)
    } catch (err) {
      console.error('Feedback submit failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <p className="text-xs text-green-600 mt-2">
        Thank you — your feedback has been sent for review.
      </p>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-body-dark hover:text-marine underline mt-2 inline-block"
      >
        Report an issue
      </button>
    )
  }

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-card border border-border-default">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-heading">Report an issue</span>
        <button onClick={() => setOpen(false)} className="text-xs text-body-dark hover:text-heading">&times;</button>
      </div>
      <select
        value={type}
        onChange={e => setType(e.target.value)}
        className="w-full border border-gray-200 rounded-btn px-2.5 py-1.5 text-xs text-heading mb-2 focus:outline-none focus:border-marine"
      >
        <option value="">Select issue type...</option>
        {FEEDBACK_TYPES.map(ft => (
          <option key={ft.value} value={ft.value}>{ft.label}</option>
        ))}
      </select>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Additional details (optional)"
        rows={2}
        maxLength={1000}
        className="w-full border border-gray-200 rounded-btn px-2.5 py-1.5 text-xs text-heading mb-2 focus:outline-none focus:border-marine resize-none"
      />
      <button
        onClick={handleSubmit}
        disabled={!type || submitting}
        className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40"
      >
        {submitting ? 'Sending...' : 'Submit'}
      </button>
    </div>
  )
}
