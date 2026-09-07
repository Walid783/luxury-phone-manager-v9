export const eur=(n:number)=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n)
export const dateFr=(d:Date|string)=>new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(d))
export const dateOnlyFr=(d:Date|string)=>new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium'}).format(new Date(d))
export const statusLabel:Record<string,string>={DIAGNOSTIC:'Diagnostic',WAITING_APPROVAL:'Attente accord',WAITING_PART:'En attente pièce',REPAIRING:'En réparation',READY:'Prêt',DELIVERED:'Livré',CANCELLED:'Annulé'}
export const statusClass:Record<string,string>={DIAGNOSTIC:'blue',WAITING_APPROVAL:'amber',WAITING_PART:'amber',REPAIRING:'purple',READY:'green',DELIVERED:'slate',CANCELLED:'red'}
export const quoteLabel:Record<string,string>={DRAFT:'Brouillon',SENT:'Envoyé',ACCEPTED:'Accepté',REFUSED:'Refusé'}
export const quoteClass:Record<string,string>={DRAFT:'slate',SENT:'blue',ACCEPTED:'green',REFUSED:'red'}
export const paymentLabel:Record<string,string>={CASH:'Espèces',CARD:'Carte',TRANSFER:'Virement',OTHER:'Autre'}
