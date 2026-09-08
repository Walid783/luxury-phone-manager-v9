'use client'

import {useEffect,useRef,useState} from 'react'
import {Eraser,PenLine} from 'lucide-react'

export default function SignaturePad(){
 const canvasRef=useRef<HTMLCanvasElement>(null)
 const drawing=useRef(false)
 const [signature,setSignature]=useState('')

 useEffect(()=>{
  const canvas=canvasRef.current
  if(!canvas)return
  const ratio=Math.max(window.devicePixelRatio||1,1)
  const rect=canvas.getBoundingClientRect()
  canvas.width=Math.round(rect.width*ratio)
  canvas.height=Math.round(rect.height*ratio)
  const ctx=canvas.getContext('2d')
  if(!ctx)return
  ctx.scale(ratio,ratio)
  ctx.lineWidth=2.4
  ctx.lineCap='round'
  ctx.lineJoin='round'
  ctx.strokeStyle='#142033'
 },[])

 const point=(e:PointerEvent)=>{
  const canvas=canvasRef.current
  if(!canvas)return null
  const rect=canvas.getBoundingClientRect()
  return {x:e.clientX-rect.left,y:e.clientY-rect.top}
 }
 const start=(e:React.PointerEvent<HTMLCanvasElement>)=>{
  e.currentTarget.setPointerCapture(e.pointerId)
  const p=point(e.nativeEvent);if(!p)return
  const ctx=canvasRef.current?.getContext('2d');if(!ctx)return
  ctx.beginPath();ctx.moveTo(p.x,p.y);drawing.current=true
 }
 const move=(e:React.PointerEvent<HTMLCanvasElement>)=>{
  if(!drawing.current)return
  const p=point(e.nativeEvent);if(!p)return
  const ctx=canvasRef.current?.getContext('2d');if(!ctx)return
  ctx.lineTo(p.x,p.y);ctx.stroke()
 }
 const end=()=>{
  if(!drawing.current)return
  drawing.current=false
  const canvas=canvasRef.current
  if(canvas)setSignature(canvas.toDataURL('image/png'))
 }
 const clear=()=>{
  const canvas=canvasRef.current;const ctx=canvas?.getContext('2d')
  if(!canvas||!ctx)return
  ctx.clearRect(0,0,canvas.width,canvas.height)
  setSignature('')
 }

 return <div className="signature-pad">
  <div className="signature-pad-head"><span><PenLine size={16}/> Signature manuscrite</span><button type="button" className="text-link" onClick={clear} disabled={!signature}><Eraser size={14}/> Effacer</button></div>
  <div className="signature-canvas-wrap">
   <canvas ref={canvasRef} className="signature-canvas" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} aria-label="Zone de signature" />
   {!signature&&<div className="signature-placeholder">Signez ici avec votre doigt ou votre stylet</div>}
  </div>
  <input type="hidden" name="signature" value={signature} readOnly required />
 </div>
}
