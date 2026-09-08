'use client'
import {Printer} from 'lucide-react'

export default function PrintPageButton({label='Imprimer'}:{label?:string}){
 return <button className="btn secondary" type="button" onClick={()=>window.print()}><Printer size={16}/>{label}</button>
}
