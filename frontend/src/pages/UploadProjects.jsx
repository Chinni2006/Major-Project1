import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import {
  Upload, FileCode, Trash2, CheckCircle,
  ArrowRight, CloudUpload, AlertCircle
} from 'lucide-react';
import { uploadFiles, getStudent } from '../api/api';
import Spinner from '../components/Spinner';

const ALLOWED = [
  // Code
  '.py','.js','.ts','.jsx','.tsx','.java','.cpp','.c','.cs',
  '.go','.rb','.php','.swift','.kt','.rs','.ipynb',
  // Documents
  '.pdf','.doc','.docx','.ppt','.pptx','.xls','.xlsx',
  // Text
  '.txt','.md','.csv','.json','.xml','.yaml',
  // Archives
  '.zip',
];

const TYPE_COLORS = {
  python:'#6366f1', javascript:'#f59e0b', typescript:'#3b82f6',
  java:'#ef4444', cpp:'#8b5cf6', c:'#06b6d4', csharp:'#9b59b6',
  go:'#00add8', ruby:'#cc342d', php:'#777bb4', swift:'#f05138',
  kotlin:'#7f52ff', rust:'#ce422b', jupyter:'#f97316',
  pdf:'#e74c3c', word:'#2b579a', powerpoint:'#d24726', excel:'#217346',
  text:'#6b7280', markdown:'#10b981', csv:'#22c55e',
  json:'#f59e0b', xml:'#8b5cf6', yaml:'#ec4899',
  archive:'#64748b', unknown:'#6b7280'
};

function detectType(name) {
  const ext = name.split('.').pop().toLowerCase();
  const map = {
    py:'python', ipynb:'jupyter',
    js:'javascript', jsx:'javascript',
    ts:'typescript', tsx:'typescript',
    java:'java', cpp:'cpp', c:'c', cs:'csharp',
    go:'go', rb:'ruby', php:'php', swift:'swift',
    kt:'kotlin', rs:'rust',
    pdf:'pdf', doc:'word', docx:'word',
    ppt:'powerpoint', pptx:'powerpoint',
    xls:'excel', xlsx:'excel',
    txt:'text', md:'markdown', csv:'csv',
    json:'json', xml:'xml', yaml:'yaml', yml:'yaml',
    zip:'archive', rar:'archive',
  };
  return map[ext] || 'unknown';
}

export default function UploadProjects() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [pending, setPending] = useState([]);   // files staged for upload
  const [uploaded, setUploaded] = useState([]); // already uploaded files
  const [uploading, setUploading] = useState(false);
  const [loadingStudent, setLoadingStudent] = useState(true);

  useEffect(() => {
    getStudent(id).then(({ data }) => {
      if (data.success) {
        setStudent(data.student);
        setUploaded(data.student.files || []);
      }
    }).catch(() => navigate('/register'))
      .finally(() => setLoadingStudent(false));
  }, [id]);

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      toast.error(`${rejected.length} file(s) rejected — unsupported type or too large`);
    }
    setPending((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      const newFiles = accepted.filter((f) => !existing.has(f.name));
      return [...prev, ...newFiles];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt','.md','.csv','.yaml','.yml'],
      'application/json': ['.json'],
      'text/html': ['.html'],
      'text/css': ['.css'],
      'text/x-python': ['.py'],
      'application/octet-stream': [
        '.js','.jsx','.ts','.tsx','.java','.cpp','.c','.cs',
        '.go','.rb','.php','.swift','.kt','.rs','.ipynb',
        '.xml','.zip','.rar','.7z',
      ],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 25 * 1024 * 1024,
    multiple: true
  });

  const removePending = (name) => setPending((p) => p.filter((f) => f.name !== name));

  const handleUpload = async () => {
    if (pending.length === 0) { toast.error('No files selected'); return; }
    try {
      setUploading(true);
      const { data } = await uploadFiles(id, pending);
      if (data.success) {
        toast.success(`${data.files.length} file(s) uploaded successfully!`);
        setPending([]);
        setUploaded((prev) => [...prev, ...data.files]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loadingStudent) return <Spinner text="Loading..." />;
  if (!student) return null;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Upload Projects</h1>
        <p className="text-muted">
          Upload your Python projects, coding solutions, and ML notebooks.
          The AI will analyze them to generate your Skill DNA.
        </p>
      </div>

      {/* Allowed types */}
      <div className="allowed-types">
        {ALLOWED.map((ext) => (
          <span key={ext} className="ext-badge">{ext}</span>
        ))}
        <span className="text-muted" style={{ fontSize: '0.8rem' }}>Max 10MB per file</span>
      </div>

      {/* Drop zone */}
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'dropzone--active' : ''}`}>
        <input {...getInputProps()} />
        <CloudUpload size={40} className="dropzone-icon" />
        {isDragActive
          ? <p>Drop your files here...</p>
          : <p>Drag &amp; drop files here, or <span className="link-text">click to browse</span></p>}
        <small className="text-muted">Code · PDF · Word · PowerPoint · Excel · JSON · Archives · Max 25MB per file</small>
      </div>

      {/* Pending files */}
      {pending.length > 0 && (
        <div className="file-section">
          <div className="file-section-header">
            <h3>Ready to Upload ({pending.length})</h3>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? <Spinner text="" /> : <><Upload size={16} /> Upload All</>}
            </button>
          </div>
          <div className="file-list">
            {pending.map((f) => {
              const type = detectType(f.name);
              return (
                <div key={f.name} className="file-item">
                  <FileCode size={18} style={{ color: TYPE_COLORS[type] }} />
                  <div className="file-info">
                    <span className="file-name">{f.name}</span>
                    <span className="file-meta">{type} · {(f.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button className="icon-btn" onClick={() => removePending(f.name)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Already uploaded */}
      {uploaded.length > 0 && (
        <div className="file-section">
          <div className="file-section-header">
            <h3>Uploaded Files ({uploaded.length})</h3>
            <CheckCircle size={18} className="text-green" />
          </div>
          <div className="file-list">
            {uploaded.map((f) => (
              <div key={f.fileId || f.originalName} className="file-item file-item--done">
                <FileCode size={18} style={{ color: TYPE_COLORS[f.type] || '#6b7280' }} />
                <div className="file-info">
                  <span className="file-name">{f.originalName}</span>
                  <span className="file-meta">{f.type} · {(f.size / 1024).toFixed(1)} KB</span>
                </div>
                <CheckCircle size={15} className="text-green" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {uploaded.length === 0 && pending.length === 0 && (
        <div className="empty-state">
          <AlertCircle size={32} className="text-muted" />
          <p>No files uploaded yet. Drop some code files above to get started.</p>
        </div>
      )}

      {/* Next step */}
      {uploaded.length > 0 && (
        <div className="next-step-bar">
          <span>✅ Files ready for analysis</span>
          <Link to={`/skill-dna/${id}`} className="btn btn-primary btn-sm">
            Run AI Analysis <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}
