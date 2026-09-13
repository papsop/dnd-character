import { artwork, cardPalette, type ForgeItem } from './catalog';

export function Artwork({ art, customSrc, eager = false }: { art: number; customSrc?: string | undefined; eager?: boolean }) {
  if (customSrc) return <img className="item-art" src={customSrc} alt="User uploaded artwork" loading={eager ? 'eager' : 'lazy'} />;
  const entry = artwork[art] ?? artwork[0];
  if (!entry) return null;
  return <img className="item-art" src={`${import.meta.env.BASE_URL}art/equipment/${entry.id}.png`} alt={entry.name} loading={eager ? 'eager' : 'lazy'} />;
}

export function ItemCard({ item, ink = false }: { item: ForgeItem; ink?: boolean }) {
  return (
    <article className={`item-card palette-${cardPalette(item)} ${ink ? 'ink-saving' : ''}`}>
      <div className="card-art-stage">
        <span className="card-rarity">{item.rarity}</span>
        <span className="card-star" aria-hidden="true">✦</span>
        <Artwork art={item.art} customSrc={item.customArt} eager />
        <span className="art-panel-rule" aria-hidden="true">◆</span>
      </div>
      <div className="card-copy">
        <p className="card-category">{item.type} · {item.rarity}</p>
        <h3>{item.name || 'Unnamed treasure'}</h3>
        <div className="card-divider" aria-hidden="true">◆</div>
        <p className="card-description">{item.text}</p>
        {item.attunement && <p className="card-attunement">Requires attunement</p>}
      </div>
      <div className={`card-foot ${item.source === 'srd' ? 'card-source' : ''}`}>
        {item.source === 'srd' ? <><span>Adapted from SRD 5.2.1 · Wizards of the Coast</span><span>CC BY 4.0 · creativecommons.org/licenses/by/4.0</span></> : 'HOMEBREW TREASURE'}
      </div>
    </article>
  );
}
