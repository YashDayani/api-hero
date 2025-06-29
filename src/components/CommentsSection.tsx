import React, { useState, useEffect } from 'react';
import { useTeams, Comment } from '../hooks/useTeams';
import { MessageCircle, Send, User, Calendar, Check, Reply, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';

interface CommentsSectionProps {
  entityType: 'project' | 'api_endpoint' | 'schema' | 'template';
  entityId: string;
  projectId?: string;
  teamId?: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  entityType,
  entityId,
  projectId,
  teamId
}) => {
  const { getComments, addComment, resolveComment } = useTeams();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [entityType, entityId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await getComments(entityType, entityId);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const comment = await addComment(entityType, entityId, newComment, projectId, teamId);
      if (comment) {
        toast.success('Comment added successfully!');
        setNewComment('');
        loadComments();
      } else {
        toast.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      const reply = await addComment(entityType, entityId, replyText, projectId, teamId, parentId);
      if (reply) {
        toast.success('Reply added successfully!');
        setReplyText('');
        setReplyingTo(null);
        loadComments();
      } else {
        toast.error('Failed to add reply');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveComment = async (commentId: string, resolved: boolean) => {
    try {
      const success = await resolveComment(commentId, resolved);
      if (success) {
        toast.success(resolved ? 'Comment resolved!' : 'Comment reopened!');
        loadComments();
      } else {
        toast.error('Failed to update comment');
      }
    } catch (error) {
      console.error('Error resolving comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return time.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comments</h3>
        </div>
        
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comments</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({comments.length})
          </span>
        </div>
      </div>

      {/* Add Comment */}
      <div className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
        <div className="flex justify-end">
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim() || submitting}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Posting...' : 'Post Comment'}</span>
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              {/* Main Comment */}
              <div className={`p-4 rounded-lg border ${
                comment.is_resolved 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {comment.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {comment.user_name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getTimeAgo(comment.created_at)}
                        </span>
                        {comment.is_resolved && (
                          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs">
                            <Check className="w-3 h-3" />
                            <span>Resolved</span>
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-medium"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => handleResolveComment(comment.id, !comment.is_resolved)}
                      className={`text-xs font-medium ${
                        comment.is_resolved 
                          ? 'text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300'
                          : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'
                      }`}
                    >
                      {comment.is_resolved ? 'Reopen' : 'Resolve'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <div className="ml-11 space-y-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                      className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAddReply(comment.id)}
                      disabled={!replyText.trim() || submitting}
                      className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Reply className="w-3 h-3" />
                      <span>{submitting ? 'Posting...' : 'Reply'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-11 space-y-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {reply.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                              {reply.user_name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {getTimeAgo(reply.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Comments Yet</h3>
            <p className="text-sm">Be the first to add a comment or feedback!</p>
          </div>
        )}
      </div>
    </div>
  );
};