import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Camera, Check, ChevronLeft, Image, RotateCcw } from 'lucide-react'
import { db } from '../persistence/database'
import { useT } from '../utils/i18n'

export function PhotosApp() {
  const t = useT(); const photos = useLiveQuery(() => db.photos.orderBy('createdAt').reverse().toArray(), [], [])
  const [selected, setSelected] = useState<{ src: string; label: string } | null>(null)
  const gallery = [{ src: `${import.meta.env.BASE_URL}images/coast.png`, label: 'The coast · Sample photo' }, { src: `${import.meta.env.BASE_URL}wallpapers/aurora.png`, label: 'Aurora · Original artwork' }, ...photos.map(photo => ({ src: photo.dataUrl, label: `Camera · ${new Date(photo.createdAt).toLocaleDateString()}` }))]
  return <div className="app-root photos-app"><div className="photo-header"><div><span className="eyebrow">YOUR LITTLE MOMENTS</span><h1>{t('Photos')}</h1></div><span>{gallery.length} photos</span></div><div className="photos-content app-scroll"><h2>Library</h2><p>Sample photos and your captures, all in one place.</p><div className="photo-grid">{gallery.map((photo, index) => <button key={`${photo.label}-${index}`} onClick={() => setSelected(photo)}><img src={photo.src} alt={photo.label}/></button>)}</div></div>{selected && <div className="photo-lightbox"><div><button aria-label="Close photo" onClick={() => setSelected(null)}><ChevronLeft size={20}/></button><strong>{selected.label}</strong><span/></div><img src={selected.src} alt={selected.label}/><small>Stored locally in your browser</small></div>}</div>
}
export function CameraApp() {
  const video = useRef<HTMLVideoElement>(null); const [stream, setStream] = useState<MediaStream | null>(null); const [error, setError] = useState(''); const [saved, setSaved] = useState(false)
  useEffect(() => { if (video.current && stream) video.current.srcObject = stream; return () => { stream?.getTracks().forEach(track => track.stop()) } }, [stream])
  const enable = async () => { if (!navigator.mediaDevices?.getUserMedia) { setError('Camera access is not available in this browser or context.'); return }; try { const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); setStream(media); setError('') } catch { setError('Camera access was denied or no camera was found.') } }
  const capture = async () => { if (!video.current || !video.current.videoWidth) { setError('Camera is still starting. Please try again.'); return }; const canvas = document.createElement('canvas'); canvas.width = video.current.videoWidth; canvas.height = video.current.videoHeight; const context = canvas.getContext('2d'); if (!context) { setError('Could not capture this photo.'); return }; context.drawImage(video.current, 0, 0); try { await db.photos.add({ dataUrl: canvas.toDataURL('image/jpeg', .85), createdAt: new Date().toISOString() }); setSaved(true); window.setTimeout(() => setSaved(false), 2000) } catch { setError('Could not save this photo to browser storage.') } }
  return <div className="app-root camera-app"><div className="camera-top"><span>◌</span><span>CAMERA</span><span>4:3</span></div><div className="camera-viewfinder">{stream ? <video ref={video} autoPlay playsInline muted/> : <div className="camera-placeholder"><Camera size={38}/><h2>See what unfolds.</h2><p>Camera access is optional and requires your permission.</p><button onClick={() => void enable()}>Enable Camera</button></div>}{error && <div className="camera-error" role="alert">{error}</div>}{saved && <div className="camera-saved"><Check size={15}/> Saved to Photos</div>}</div><div className="camera-mode">PHOTO</div><div className="camera-controls"><button aria-label="Open Photos" onClick={() => openPhotos()}><Image size={20}/></button><button className="shutter" aria-label="Take photo" onClick={() => void capture()} disabled={!stream}><span/></button><button aria-label="Stop camera" onClick={() => { setStream(null); setError('Camera stopped.') }}><RotateCcw size={20}/></button></div></div>
}
// Delayed access keeps camera and photos decoupled.
import { useSystemStore } from '../system/store'
function openPhotos() { useSystemStore.getState().openApp('photos') }
