export default function LoginPage({searchParams}: {searchParams?: Promise<{error?:string}>}) {
 return <div className="login"><form className="login-card" action="/api/auth/login" method="post" autoComplete="on">
  <div className="brand">LUXURY <span>PHONE</span></div>
  <h1>Connexion atelier</h1>
  <p className="muted">Accès privé à Luxury Phone Manager.</p>
  <div className="field"><label htmlFor="login-email">Email</label><input id="login-email" name="email" type="email" autoComplete="username" placeholder="Votre adresse e-mail" required /></div>
  <div className="field" style={{marginTop:12}}><label htmlFor="login-password">Mot de passe</label><input id="login-password" name="password" type="password" autoComplete="current-password" placeholder="Votre mot de passe" required /></div>
  <button className="btn" type="submit" style={{width:'100%',marginTop:18}}>Se connecter</button>
 </form></div>
}
