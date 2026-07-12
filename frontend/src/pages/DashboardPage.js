import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import FileUpload from '../components/FileUpload';
import api from '../utils/api';
import { BookOpen, Trash2, PlayCircle, Clock, FileText, Plus, X, ChevronRight, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function StatusBadge({ status, processedChunks, totalChunks }) {
  const map = {
    ready: { color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.15)', label: 'Ready' },
    processing: { color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.15)', label: `Processing ${processedChunks}/${totalChunks}` },
    uploading: { color: 'var(--info)', bg: 'rgba(59, 130, 246, 0.15)', label: 'Uploading' },
    error: { color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.15)', label: 'Error' },
  };
  const s = map[status] || map.ready;
  return (
    <span style={{
      padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
      color: s.color, background: s.bg, display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>
      {status === 'processing' && <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />}
      {s.label}
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const documentsRef = useRef(documents);
  documentsRef.current = documents;

  const fetchDocs = useCallback(async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data.documents || []);
    } catch (err) {
      toast.error('Could not load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
    const interval = setInterval(() => {
      if (documentsRef.current.some(d => d.status === 'processing' || d.status === 'uploading')) {
        fetchDocs();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchDocs]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(docs => docs.filter(d => d._id !== id));
      toast.success('Document deleted');
    } catch {
      toast.error('Could not delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploadComplete = (doc) => {
    setDocuments(prev => [doc, ...prev]);
    setShowUpload(false);
    const poll = setInterval(async () => {
      try {
        const res = await api.get(`/documents/${doc._id}`);
        if (res.data.document.status === 'ready') {
          setDocuments(prev => prev.map(d => d._id === doc._id ? res.data.document : d));
          clearInterval(poll);
        }
      } catch { clearInterval(poll); }
    }, 2500);
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <Navbar />
      
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px', position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}
        >
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.5px' }}>
              Hello, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
              {documents.length === 0 ? 'Upload your first document to get started.' : `You have ${documents.length} document${documents.length !== 1 ? 's' : ''}.`}
            </p>
          </div>
          <button onClick={() => setShowUpload(true)} className="btn-primary" style={{ padding: '10px 16px' }}>
            <Plus size={18} /> Upload document
          </button>
        </motion.div>

        {/* Upload panel */}
        <AnimatePresence>
          {showUpload && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="glass-panel" style={{ padding: '24px 32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Upload a document</h2>
                  <button onClick={() => setShowUpload(false)} style={{
                    background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer',
                    color: 'var(--text-muted)', borderRadius: 'var(--radius)', width: 32, height: 32,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                    <X size={18} />
                  </button>
                </div>
                <FileUpload onUploadComplete={handleUploadComplete} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Documents list */}
        {loading ? (
          <div style={{ display: 'grid', gap: 16 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-panel skeleton" style={{ height: 88, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <motion.div 
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel"
            style={{ textAlign: 'center', padding: '64px 24px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 'var(--radius-lg)', margin: '0 auto 24px',
              background: 'var(--accent-light)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BookOpen size={32} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>No documents yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 15, maxWidth: 400, margin: '0 auto 24px' }}>
              Upload a PDF, Word doc, or text file to start your personalised reading session.
            </p>
            <button onClick={() => setShowUpload(true)} className="btn-primary" style={{ padding: '12px 24px', fontSize: 15 }}>
              <Plus size={18} /> Upload your first document
            </button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'grid', gap: 12 }}>
            {documents.map((doc, i) => (
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                key={doc._id}
                onClick={() => doc.status !== 'error' && navigate(`/read/${doc._id}`)}
                className="glass-panel"
                style={{
                  padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
                  cursor: doc.status === 'error' ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius)', flexShrink: 0,
                  background: 'var(--bg-primary)', color: 'var(--accent)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileText size={24} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
                      {doc.title}
                    </span>
                    <StatusBadge status={doc.status} processedChunks={doc.processedChunks} totalChunks={doc.totalChunks} />
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BookOpen size={14} /> {doc.totalChunks} chunks
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={14} /> {timeAgo(doc.createdAt)}
                    </span>
                    {doc.lastReadAt && (
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <PlayCircle size={14} /> Last read {timeAgo(doc.lastReadAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                  <button
                    onClick={e => handleDelete(doc._id, e)}
                    disabled={deletingId === doc._id}
                    style={{
                      width: 36, height: 36, borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-muted)', transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.background = 'var(--bg-hover)'}}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-secondary)'}}
                  >
                    {deletingId === doc._id
                      ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      : <Trash2 size={16} />
                    }
                  </button>
                  {doc.status === 'ready' && (
                    <div style={{
                      width: 36, height: 36, borderRadius: 'var(--radius)',
                      background: 'var(--accent)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <ChevronRight size={18} />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
