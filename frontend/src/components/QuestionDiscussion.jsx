import { useState, useEffect } from 'react'
import api from '../lib/api'

function timeAgo(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export default function QuestionDiscussion({ questionId }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (!questionId) return
    api.get(`/questions/${questionId}/comments`)
      .then(res => {
        setComments(res.data.data?.comments || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [questionId])

  const handlePost = async () => {
    if (!newComment.trim() || posting) return
    setPosting(true)
    try {
      const res = await api.post(`/questions/${questionId}/comments`, {
        comment_text: newComment.trim()
      })
      const comment = res.data.data?.comment
      if (comment) {
        setComments(prev => [...prev, comment])
      }
      setNewComment('')
    } catch (err) {
      console.error('Failed to post comment:', err)
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-border-default">
      <h4 className="text-xs font-semibold text-heading mb-2">Clinical Discussion</h4>

      {loading ? (
        <p className="text-xs text-body-dark">Loading discussion...</p>
      ) : (
        <>
          {comments.length > 0 ? (
            <div className="flex flex-col gap-2 mb-3 max-h-48 overflow-y-auto">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2 text-xs">
                  <div className="w-5 h-5 rounded-full bg-marine flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {(c.username || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-heading">{c.username}</span>
                      <span className="text-body-dark">{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-body-dark mt-0.5 break-words">{c.comment_text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-body-dark mb-2">No comments yet — be the first to discuss this question.</p>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePost()}
              placeholder="Share your thoughts..."
              maxLength={2000}
              className="flex-1 border border-gray-200 rounded-btn px-2.5 py-1.5 text-xs text-heading focus:outline-none focus:border-marine"
            />
            <button
              onClick={handlePost}
              disabled={!newComment.trim() || posting}
              className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              {posting ? '...' : 'Post'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
