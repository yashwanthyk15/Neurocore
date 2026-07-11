import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import Button from './Button';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function FileUpload({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) {
      setFile(accepted[0]);
      setTitle(accepted[0].name.replace(/\.[^/.]+$/, ''));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    onDropRejected: (rejections) => {
      const msg = rejections[0]?.errors[0]?.message || 'File not accepted';
      toast.error(msg);
    },
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', title || file.name);
    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Document uploaded! AI is processing it...');
      onUploadComplete(res.data.document);
      setFile(null);
      setTitle('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {!file ? (
        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 16,
            padding: '48px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragActive ? 'var(--accent-light)' : 'var(--bg-primary)',
            transition: 'all 0.2s ease',
          }}
        >
          <input {...getInputProps()} />
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px',
            background: 'var(--accent-light)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Upload size={26} />
          </div>
          <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            {isDragActive ? 'Drop it here!' : 'Upload a document'}
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>
            Drag & drop or click to browse
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Supports PDF, DOCX, TXT · Max 20 MB
          </p>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-primary)', border: '1.5px solid var(--border)',
          borderRadius: 14, padding: '20px 20px',
        }}>
          {/* File info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'var(--accent-light)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <FileText size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button onClick={() => setFile(null)} style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', padding: 4, borderRadius: 6,
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <X size={18} />
            </button>
          </div>

          {/* Title input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 7 }}>
              Document title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Chapter 3 — Photosynthesis"
              style={{
                width: '100%', padding: '10px 14px',
                borderRadius: 9, border: '1.5px solid var(--border)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                fontSize: 14, fontFamily: 'var(--ui-font)', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <Button onClick={handleUpload} loading={uploading} fullWidth icon={<CheckCircle size={17} />}>
            {uploading ? 'Uploading & processing...' : 'Upload & start reading'}
          </Button>
        </div>
      )}
    </div>
  );
}
