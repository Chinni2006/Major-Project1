import { useEffect, useRef, useState, useCallback } from 'react';
import { logViolation } from '../../api/api';

/**
 * ProctoringSystem
 * Handles: camera feed, eyeball tracking, sound detection,
 *          tab-switch detection, fullscreen enforcement.
 *
 * Props:
 *   attemptId     – current attempt ID (used to log violations)
 *   onViolation   – callback(type, detail) called on every violation
 *   active        – boolean: start/stop proctoring
 */
export default function ProctoringSystem({ attemptId, onViolation, active }) {
  const videoRef        = useRef(null);
  const canvasRef       = useRef(null);
  const audioCtxRef     = useRef(null);
  const analyserRef     = useRef(null);
  const streamRef       = useRef(null);
  const intervalRef     = useRef(null);
  const soundIntervalRef= useRef(null);
  const [camStatus, setCamStatus] = useState('pending'); // pending|ok|denied

  // ── Log violation helper ──────────────────────────────────────────────────
  const report = useCallback((type, detail = '') => {
    onViolation?.(type, detail);
    if (attemptId) {
      logViolation(attemptId, { type, detail, timestamp: new Date().toISOString() })
        .catch(() => {}); // fire-and-forget
    }
  }, [attemptId, onViolation]);

  // ── Camera + eye tracking ─────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCamStatus('ok');
        startEyeTracking();
        startSoundDetection(stream);
      })
      .catch(() => {
        setCamStatus('denied');
        report('camera_denied', 'Camera/microphone permission denied');
      });

    return () => stopAll();
  }, [active]);

  const startEyeTracking = () => {
    // Lightweight eye tracking using face bounding box heuristics via canvas
    intervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      const ctx    = canvas.getContext('2d');
      canvas.width  = video.videoWidth  || 320;
      canvas.height = video.videoHeight || 240;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Sample center region brightness — if face area is dark → no face
      const imageData = ctx.getImageData(canvas.width*0.25, canvas.height*0.1, canvas.width*0.5, canvas.height*0.6);
      const data = imageData.data;
      let brightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        brightness += (data[i] + data[i+1] + data[i+2]) / 3;
      }
      brightness /= (data.length / 4);

      // Heuristic: very dark frame = face not visible
      if (brightness < 15) {
        report('face_not_detected', `Frame brightness: ${Math.round(brightness)}`);
        return;
      }

      // Eye gaze heuristic: sample top-left and top-right brightness ratio
      const leftEye  = ctx.getImageData(canvas.width*0.15, canvas.height*0.15, canvas.width*0.2, canvas.height*0.15);
      const rightEye = ctx.getImageData(canvas.width*0.65, canvas.height*0.15, canvas.width*0.2, canvas.height*0.15);
      const leftBr   = avgBrightness(leftEye.data);
      const rightBr  = avgBrightness(rightEye.data);

      // If asymmetry is large, student may be looking away
      const diff = Math.abs(leftBr - rightBr);
      if (diff > 60) {
        report('look_away', `Eye asymmetry: ${Math.round(diff)}`);
      }
    }, 3000); // check every 3s
  };

  const startSoundDetection = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const source   = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      soundIntervalRef.current = setInterval(() => {
        const buf = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(buf);
        const avg = buf.reduce((a,b) => a+b, 0) / buf.length;
        // Threshold: sustained sound above 25 → flag
        if (avg > 25) {
          report('sound_detected', `Audio level: ${Math.round(avg)}`);
        }
      }, 4000); // check every 4s
    } catch {}
  };

  const stopAll = () => {
    clearInterval(intervalRef.current);
    clearInterval(soundIntervalRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
  };

  // ── Tab switch / visibility ────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    const onHide = () => {
      if (document.hidden) report('tab_switch', 'Student switched tab or minimised window');
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [active, report]);

  // ── Fullscreen enforcement ────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        report('fullscreen_exit', 'Student exited fullscreen');
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [active, report]);

  // ── Copy/paste prevention ─────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    const block = (e) => { e.preventDefault(); report('copy_paste', `${e.type} detected`); };
    document.addEventListener('copy',  block);
    document.addEventListener('paste', block);
    document.addEventListener('cut',   block);
    return () => {
      document.removeEventListener('copy',  block);
      document.removeEventListener('paste', block);
      document.removeEventListener('cut',   block);
    };
  }, [active, report]);

  if (!active) return null;

  return (
    <div style={{ position:'fixed', bottom:16, right:16, zIndex:9999, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px' }}>
      {/* Live cam feed */}
      <div style={{ position:'relative', width:160, borderRadius:12, overflow:'hidden', border:`2px solid ${camStatus==='ok'?'var(--green2)':'var(--red)'}`, boxShadow:`0 0 16px ${camStatus==='ok'?'rgba(16,185,129,0.4)':'rgba(239,68,68,0.4)'}` }}>
        <video ref={videoRef} muted autoPlay playsInline style={{ width:'100%', display:'block' }}/>
        <canvas ref={canvasRef} style={{ display:'none' }}/>
        <div style={{ position:'absolute', top:6, left:6, display:'flex', alignItems:'center', gap:4, background:'rgba(0,0,0,0.6)', borderRadius:6, padding:'2px 6px', fontSize:'0.65rem', fontWeight:700 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:camStatus==='ok'?'var(--green2)':'var(--red)', display:'inline-block', boxShadow:`0 0 6px ${camStatus==='ok'?'var(--green2)':'var(--red)'}` }}/>
          {camStatus==='ok' ? 'PROCTORED' : 'CAM ERROR'}
        </div>
      </div>

      {/* Status label */}
      <div style={{ background:'rgba(0,0,0,0.7)', borderRadius:8, padding:'4px 10px', fontSize:'0.65rem', color:'var(--muted)', backdropFilter:'blur(8px)' }}>
        🔴 Recording · 👁 Eye tracking · 🎤 Audio
      </div>
    </div>
  );
}

function avgBrightness(data) {
  let s = 0;
  for (let i = 0; i < data.length; i += 4) s += (data[i]+data[i+1]+data[i+2])/3;
  return s / (data.length / 4);
}
