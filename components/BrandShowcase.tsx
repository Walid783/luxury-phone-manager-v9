'use client'

const brands = [
  { name: 'OPPO', slug: 'oppo', color: '#22c55e' },
  { name: 'Huawei', slug: 'huawei', color: '#ef233c' },
  { name: 'Honor', slug: 'honor', color: '#111827' },
  { name: 'Google Pixel', slug: 'google', color: '#4285f4' },
  { name: 'OnePlus', slug: 'oneplus', color: '#eb001b' },
  { name: 'Apple', slug: 'apple', color: '#111827' },
  { name: 'Samsung', slug: 'samsung', color: '#1428a0' },
  { name: 'Xiaomi', slug: 'xiaomi', color: '#ff6900' },
  { name: 'Vivo', slug: 'vivo', color: '#1769ff' },
  { name: 'Realme', slug: 'realme', color: '#f5c400' },
  { name: 'Motorola', slug: 'motorola', color: '#1e88e5' },
  { name: 'Nothing', slug: 'nothing', color: '#111827' },
]

export default function BrandShowcase(){
  return <section className="brand-showcase" aria-label="Grandes marques prises en charge">
    <style>{`
      .brand-showcase{margin:0 0 14px;padding:14px 16px 15px;border:1px solid #262a31;border-radius:18px;background:linear-gradient(180deg,#111318 0%,#090a0c 100%);box-shadow:0 16px 38px rgba(0,0,0,.16);overflow:hidden}
      .brand-showcase-title{text-align:center;margin:0 0 11px;font-size:11px;font-weight:950;letter-spacing:2px;text-transform:uppercase;color:#f2f4f7}
      .brand-showcase-title span{color:#d9a52f}
      .brand-showcase-track{display:flex;gap:10px;overflow-x:auto;padding:4px 2px 5px;scrollbar-width:thin}
      .brand-showcase-track::-webkit-scrollbar{height:5px}.brand-showcase-track::-webkit-scrollbar-thumb{background:#3b3f46;border-radius:99px}
      .brand-card{flex:0 0 132px;height:82px;border:1px solid #292d33;border-radius:14px;background:linear-gradient(145deg,#181a1e,#101114);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;box-shadow:inset 0 1px rgba(255,255,255,.035),0 7px 20px rgba(0,0,0,.18);transition:transform .18s,border-color .18s,box-shadow .18s}
      .brand-card:hover{transform:translateY(-2px);border-color:#555b65;box-shadow:inset 0 1px rgba(255,255,255,.06),0 12px 26px rgba(0,0,0,.26)}
      .brand-card img{width:31px;height:31px;object-fit:contain;display:block}
      .brand-card strong{font-size:10px;letter-spacing:.35px;color:#f4f5f7;white-space:nowrap}
      @media(max-width:700px){.brand-showcase{border-radius:14px;padding:12px}.brand-card{flex-basis:112px;height:74px}.brand-card img{width:27px;height:27px}}
    `}</style>
    <div className="brand-showcase-title">TOUTES LES <span>GRANDES MARQUES</span> PRISES EN CHARGE</div>
    <div className="brand-showcase-track">
      {brands.map(b=><div className="brand-card" key={b.name} title={b.name}>
        <img src={`https://cdn.simpleicons.org/${b.slug}/${b.color.replace('#','')}`} alt="" loading="lazy" />
        <strong>{b.name}</strong>
      </div>)}
    </div>
  </section>
}
