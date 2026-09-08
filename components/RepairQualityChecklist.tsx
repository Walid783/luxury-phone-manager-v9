import { ClipboardCheck, Save } from 'lucide-react'

const checks=[
 ['power','Allumage / extinction'],
 ['screen','Écran / affichage'],
 ['touch','Tactile'],
 ['charge','Charge / connecteur'],
 ['cameras','Caméras'],
 ['audio','Audio / microphone'],
 ['network','Réseau / Wi‑Fi'],
 ['biometrics','Biométrie / Face ID']
] as const

type Section={items?:Record<string,string>;note?:string}

export default function RepairQualityChecklist({repairId,quality,restitution}:{repairId:string;quality:Section;restitution:Section}){
 const q=quality.items||{}, r=restitution.items||{}
 const passed=(section:Section)=>checks.filter(([k])=>section.items?.[k]==='PASS').length
 return <div className="card">
  <div className="section-title"><div><h2><ClipboardCheck size={19}/> Contrôle qualité & restitution</h2><p>Le dossier ne peut passer à « Prêt » puis « Restitué » sans validation des contrôles.</p></div><strong>{passed(quality)}/{checks.length} qualité · {passed(restitution)}/{checks.length} restitution</strong></div>
  <form className="form" action={`/api/repairs/${repairId}/checklist`} method="post">
   <div className="section-title"><div><h3>🔍 Contrôle qualité après réparation</h3><p>Chaque test doit être marqué « Conforme ».</p></div></div>
   <div className="info-grid">
    {checks.map(([key,label])=><div className="field" key={`q-${key}`}><label>{label}</label><select name={`quality_${key}`} defaultValue={q[key]||'NA'}><option value="NA">Non contrôlé</option><option value="PASS">Conforme</option><option value="FAIL">Non conforme</option></select></div>)}
   </div>
   <div className="field full"><label>Note contrôle qualité</label><textarea name="qualityNote" rows={2} defaultValue={quality.note||''} placeholder="Anomalie constatée, réserve, contrôle complémentaire…"/></div>
   <div className="section-title"><div><h3>🏁 Tests avant restitution</h3><p>Contrôle final de l'appareil avant remise au client.</p></div></div>
   <div className="info-grid">
    {checks.map(([key,label])=><div className="field" key={`r-${key}`}><label>{label}</label><select name={`restitution_${key}`} defaultValue={r[key]||'NA'}><option value="NA">Non contrôlé</option><option value="PASS">Conforme</option><option value="FAIL">Non conforme</option></select></div>)}
   </div>
   <div className="field full"><label>Note restitution</label><textarea name="restitutionNote" rows={2} defaultValue={restitution.note||''} placeholder="Dernières vérifications, accessoires rendus, réserve client…"/></div>
   <div><button className="btn"><Save size={16}/> Enregistrer les contrôles</button></div>
  </form>
 </div>
}
