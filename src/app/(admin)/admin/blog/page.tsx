'use client';

import { useState, useEffect } from 'react';
import { secureFetch } from '@/lib/csrf-client';
import { useToast } from '@/components/ui/toast';
import { BLOG_TEMPLATES, type BlogTemplate, type GeneratedPost, type TemplateVariable } from '@/lib/blog-templates';

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

// Shared control styles — kept DRY so theme/contrast fixes live in one place
// (this page was originally styled light-on-light; these are dark-theme correct).
const BTN_PRIMARY =
  'px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50';
const BTN_OUTLINE = 'px-6 py-2 rounded-lg border hover:bg-white/5';
const BTN_ACTION = 'text-xs px-2 py-1 rounded border hover:bg-white/10';
const BTN_DANGER =
  'text-xs px-2 py-1 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10';
const FIELD =
  'w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground';

export default function AdminBlogPage() {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'posts' | 'generate'>('posts');
  const [selectedTemplate, setSelectedTemplate] = useState<BlogTemplate | null>(null);
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({});
  const [generatedPreview, setGeneratedPreview] = useState<GeneratedPost | null>(null);
  // Live service taxonomy from the managed Specialty table — drives any
  // `source: 'specialties'` dropdown. Empty until fetched; falls back to the
  // template's static `options` so the generator works even if this fails.
  const [serviceOptions, setServiceOptions] = useState<{ value: string; label: string }[]>([]);

  // Effective options for a variable: live specialties when sourced from them
  // (and loaded), otherwise the static fallback baked into the template.
  const optionsFor = (v: TemplateVariable): { value: string; label: string }[] =>
    v.source === 'specialties' && serviceOptions.length > 0 ? serviceOptions : v.options ?? [];

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

  // Load the managed specialty taxonomy once; used for service dropdowns.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/specialties');
        const data = await res.json();
        if (data.success) {
          setServiceOptions(
            (data.data.specialties as { name: string }[]).map((s) => ({
              value: s.name,
              label: s.name,
            }))
          );
        }
      } catch {
        // Keep the static fallback (template `options`) on failure.
      }
    })();
  }, []);

  // If specialties arrive after a template is already selected, re-default any
  // specialty-sourced var whose current value isn't in the live list.
  useEffect(() => {
    if (!selectedTemplate || serviceOptions.length === 0) return;
    setTemplateVars((prev) => {
      let changed = false;
      const next = { ...prev };
      selectedTemplate.variables.forEach((v) => {
        if (v.source === 'specialties' && !serviceOptions.some((o) => o.value === next[v.key])) {
          next[v.key] = serviceOptions[0]?.value || '';
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [serviceOptions, selectedTemplate]);

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

  const handleSelectTemplate = (template: BlogTemplate) => {
    setSelectedTemplate(template);
    const vars: Record<string, string> = {};
    template.variables.forEach(v => {
      vars[v.key] = optionsFor(v)[0]?.value || '';
    });
    setTemplateVars(vars);
    setGeneratedPreview(null);
  };

  const handleGeneratePreview = () => {
    if (!selectedTemplate) return;
    const generated = selectedTemplate.generate(templateVars);
    setGeneratedPreview(generated);
  };

  const handlePublishGenerated = async () => {
    if (!generatedPreview || !selectedTemplate) return;
    setSaving(true);
    try {
      const category = selectedTemplate.id === 'custom-article'
        ? templateVars.audience || 'industry'
        : selectedTemplate.audience;

      const res = await secureFetch('/api/admin/blog', {
        method: 'POST',
        body: JSON.stringify({
          title: generatedPreview.title,
          slug: generatedPreview.slug,
          description: generatedPreview.description,
          content: generatedPreview.content,
          keywords: generatedPreview.keywords,
          category,
          status: 'published',
          readingTime: generatedPreview.readingTime,
          author: 'Concierge Barber Registry',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast({ variant: 'success', title: 'Blog post published!' });
        setSelectedTemplate(null);
        setGeneratedPreview(null);
        setTab('posts');
        fetchPosts();
      } else {
        showToast({ variant: 'error', title: data.error?.message || 'Failed to publish' });
      }
    } catch {
      showToast({ variant: 'error', title: 'Failed to publish' });
    } finally {
      setSaving(false);
    }
  };

  const handleEditGenerated = () => {
    if (!generatedPreview || !selectedTemplate) return;
    const category = selectedTemplate.id === 'custom-article'
      ? templateVars.audience || 'industry'
      : selectedTemplate.audience;

    setForm({
      title: generatedPreview.title,
      slug: generatedPreview.slug,
      description: generatedPreview.description,
      content: generatedPreview.content,
      keywords: generatedPreview.keywords.join(', '),
      category,
      status: 'draft',
      readingTime: generatedPreview.readingTime,
      author: 'Concierge Barber Registry',
    });
    setEditingPost(null);
    setIsCreating(true);
    setSelectedTemplate(null);
    setGeneratedPreview(null);
    setTab('posts');
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
              className={FIELD}
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
              className={`${FIELD} font-mono text-sm`}
              placeholder="how-to-find-a-good-barber-near-you"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description * (for SEO)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={FIELD}
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
                className={FIELD}
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
                className={FIELD}
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
                className={FIELD}
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
              className={FIELD}
              placeholder="find barber near me, good barber, barber search"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-1">Content * (HTML)</label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              className={`${FIELD} font-mono text-sm`}
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
              className={BTN_PRIMARY}
            >
              {saving ? 'Saving...' : editingPost ? 'Update Post' : 'Create Post'}
            </button>
            <button
              onClick={() => { setIsCreating(false); setEditingPost(null); }}
              className={BTN_OUTLINE}
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
        <div className="flex gap-2">
          <button
            onClick={startCreate}
            className={BTN_OUTLINE}
          >
            New Post
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        <button
          onClick={() => setTab('posts')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'posts' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-primary'
          }`}
        >
          All Posts
        </button>
        <button
          onClick={() => setTab('generate')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'generate' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-primary'
          }`}
        >
          Generate Article
        </button>
      </div>

      {/* Generate tab */}
      {tab === 'generate' && (
        <div className="max-w-4xl">
          {!selectedTemplate ? (
            <>
              <p className="text-muted-foreground mb-6">Select a template to auto-generate an SEO-optimized blog article.</p>

              {['for_clients', 'for_barbers', 'industry'].map(audience => {
                const templates = BLOG_TEMPLATES.filter(t => t.audience === audience);
                const label = audience === 'for_clients' ? 'For Clients' : audience === 'for_barbers' ? 'For Barbers' : 'Industry';
                return (
                  <div key={audience} className="mb-8">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">{label}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {templates.map(t => (
                        <button
                          key={t.id}
                          onClick={() => handleSelectTemplate(t)}
                          className="text-left p-4 border rounded-lg hover:border-primary hover:shadow-sm transition-all"
                        >
                          <div className="font-medium text-sm mb-1">{t.name}</div>
                          <div className="text-xs text-muted-foreground">{t.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          ) : !generatedPreview ? (
            <>
              <button onClick={() => setSelectedTemplate(null)} className="text-sm text-muted-foreground hover:text-primary mb-4 block">
                &larr; Back to templates
              </button>
              <h3 className="text-lg font-bold mb-1">{selectedTemplate.name}</h3>
              <p className="text-sm text-muted-foreground mb-6">{selectedTemplate.description}</p>

              <div className="space-y-4 max-w-md">
                {selectedTemplate.variables.map(v => (
                  <div key={v.key}>
                    <label className="block text-sm font-medium mb-1">{v.label} {v.required && '*'}</label>
                    {v.type === 'select' ? (
                      <select
                        value={templateVars[v.key] || ''}
                        onChange={e => setTemplateVars(prev => ({ ...prev, [v.key]: e.target.value }))}
                        className={FIELD}
                      >
                        {optionsFor(v).map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={templateVars[v.key] || ''}
                        onChange={e => setTemplateVars(prev => ({ ...prev, [v.key]: e.target.value }))}
                        className={FIELD}
                        placeholder={v.placeholder}
                      />
                    )}
                  </div>
                ))}
                <button
                  onClick={handleGeneratePreview}
                  disabled={selectedTemplate.variables.some(v => v.required && !templateVars[v.key])}
                  className={BTN_PRIMARY}
                >
                  Generate Preview
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setGeneratedPreview(null)} className="text-sm text-muted-foreground hover:text-primary mb-4 block">
                &larr; Back to options
              </button>

              <div className="border rounded-lg p-6 mb-6">
                <span className="text-xs px-2 py-1 rounded bg-secondary/10 text-secondary">
                  {selectedTemplate.audienceLabel}
                </span>
                <h2 className="text-2xl font-bold text-primary mt-3 mb-2">{generatedPreview.title}</h2>
                <p className="text-muted-foreground mb-2">{generatedPreview.description}</p>
                <div className="flex gap-3 text-xs text-muted-foreground mb-4">
                  <span>/blog/{generatedPreview.slug}</span>
                  <span>{generatedPreview.readingTime} min read</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {generatedPreview.keywords.map(k => (
                    <span key={k} className="text-xs px-2 py-0.5 bg-muted text-foreground rounded">{k}</span>
                  ))}
                </div>
                <div
                  className="prose prose-sm max-w-none border-t pt-4 mt-4"
                  dangerouslySetInnerHTML={{ __html: generatedPreview.content }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handlePublishGenerated}
                  disabled={saving}
                  className={BTN_PRIMARY}
                >
                  {saving ? 'Publishing...' : 'Publish Now'}
                </button>
                <button
                  onClick={handleEditGenerated}
                  className={BTN_OUTLINE}
                >
                  Edit Before Publishing
                </button>
                <button
                  onClick={() => setGeneratedPreview(null)}
                  className={BTN_OUTLINE}
                >
                  Regenerate
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Posts list tab */}
      {tab === 'posts' && (<>


      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'published', 'draft'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
          <thead className="bg-muted text-sm">
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
              <tr key={post.id} className="hover:bg-white/5">
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
                      className={BTN_ACTION}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(post)}
                      className={BTN_ACTION}
                    >
                      {post.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className={BTN_DANGER}
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
      </>)}
    </div>
  );
}
