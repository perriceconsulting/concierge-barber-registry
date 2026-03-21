'use client';

import { useState, useEffect } from 'react';
import { secureFetch } from '@/lib/csrf-client';
import { useToast } from '@/components/ui/toast';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  keywords: string[];
  category: string;
  status: string;
  readingTime: number;
  author: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: 'for_clients', label: 'For Clients' },
  { value: 'for_barbers', label: 'For Barbers' },
  { value: 'industry', label: 'Industry' },
];

const CATEGORY_LABELS: Record<string, string> = {
  for_clients: 'For Clients',
  for_barbers: 'For Barbers',
  industry: 'Industry',
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

export default function AdminBlogPage() {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    keywords: '',
    category: 'for_clients',
    status: 'draft',
    readingTime: 5,
    author: 'Concierge Barber Registry',
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await secureFetch('/api/admin/blog');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.data?.posts || []);
      }
    } catch {
      showToast({ variant: 'error', title: 'Failed to load blog posts' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      slug: '',
      description: '',
      content: '',
      keywords: '',
      category: 'for_clients',
      status: 'draft',
      readingTime: 5,
      author: 'Concierge Barber Registry',
    });
  };

  const startCreate = () => {
    resetForm();
    setEditingPost(null);
    setIsCreating(true);
  };

  const startEdit = async (post: BlogPost) => {
    // Fetch full post content
    const res = await secureFetch(`/api/admin/blog/${post.id}`);
    if (res.ok) {
      const data = await res.json();
      const fullPost = data.data?.post;
      setForm({
        title: fullPost.title,
        slug: fullPost.slug,
        description: fullPost.description,
        content: fullPost.content,
        keywords: Array.isArray(fullPost.keywords) ? fullPost.keywords.join(', ') : '',
        category: fullPost.category,
        status: fullPost.status,
        readingTime: fullPost.readingTime,
        author: fullPost.author,
      });
      setEditingPost(fullPost);
      setIsCreating(true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
        readingTime: Number(form.readingTime),
      };

      const url = editingPost ? `/api/admin/blog/${editingPost.id}` : '/api/admin/blog';
      const method = editingPost ? 'PATCH' : 'POST';

      const res = await secureFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        showToast({
          variant: 'success',
          title: editingPost ? 'Post updated' : 'Post created',
        });
        setIsCreating(false);
        setEditingPost(null);
        resetForm();
        fetchPosts();
      } else {
        const msg = data.error?.message || 'Failed to save';
        showToast({ variant: 'error', title: msg });
      }
    } catch {
      showToast({ variant: 'error', title: 'Failed to save post' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog post permanently?')) return;
    try {
      const res = await secureFetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast({ variant: 'success', title: 'Post deleted' });
        fetchPosts();
      }
    } catch {
      showToast({ variant: 'error', title: 'Failed to delete' });
    }
  };

  const handleToggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      const res = await secureFetch(`/api/admin/blog/${post.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast({ variant: 'success', title: `Post ${newStatus}` });
        fetchPosts();
      }
    } catch {
      showToast({ variant: 'error', title: 'Failed to update status' });
    }
  };

  const filteredPosts = posts.filter(p => {
    if (filter === 'published') return p.status === 'published';
    if (filter === 'draft') return p.status === 'draft';
    return true;
  });

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Blog Management</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Editor view
  if (isCreating) {
    return (
      <div className="p-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {editingPost ? 'Edit Post' : 'New Blog Post'}
          </h1>
          <button
            onClick={() => { setIsCreating(false); setEditingPost(null); }}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Cancel
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => {
                setForm(f => ({
                  ...f,
                  title: e.target.value,
                  slug: editingPost ? f.slug : generateSlug(e.target.value),
                }));
              }}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="How to Find a Good Barber Near You"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <input
              type="text"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
              placeholder="how-to-find-a-good-barber-near-you"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description * (for SEO)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
              placeholder="A comprehensive guide to finding..."
            />
            <p className="text-xs text-muted-foreground mt-1">{form.description.length}/500 chars</p>
          </div>

          {/* Category + Status + Reading Time */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reading Time (min)</label>
              <input
                type="number"
                value={form.readingTime}
                onChange={e => setForm(f => ({ ...f, readingTime: parseInt(e.target.value) || 5 }))}
                className="w-full px-3 py-2 border rounded-lg"
                min={1}
                max={60}
              />
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium mb-1">SEO Keywords (comma-separated)</label>
            <input
              type="text"
              value={form.keywords}
              onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="find barber near me, good barber, barber search"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-1">Content * (HTML)</label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
              rows={20}
              placeholder="<p>Your article content here...</p>"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use HTML tags: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;em&gt;
            </p>
          </div>

          {/* Save */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving || !form.title || !form.slug || !form.content}
              className="px-6 py-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-primary/90"
            >
              {saving ? 'Saving...' : editingPost ? 'Update Post' : 'Create Post'}
            </button>
            <button
              onClick={() => { setIsCreating(false); setEditingPost(null); }}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Blog Management</h1>
          <p className="text-sm text-muted-foreground">{posts.length} total posts</p>
        </div>
        <button
          onClick={startCreate}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          New Post
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'published', 'draft'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span className="ml-1">
                ({posts.filter(p => f === 'published' ? p.status === 'published' : p.status === 'draft').length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Posts table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-sm">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredPosts.map(post => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-sm">{post.title}</div>
                  <div className="text-xs text-muted-foreground">/blog/{post.slug}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded bg-secondary/10 text-secondary">
                    {CATEGORY_LABELS[post.category] || post.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded ${
                    post.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {post.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString()
                    : new Date(post.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => startEdit(post)}
                      className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(post)}
                      className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                    >
                      {post.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPosts.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No posts found.</p>
        )}
      </div>
    </div>
  );
}
