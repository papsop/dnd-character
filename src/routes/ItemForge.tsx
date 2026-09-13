import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent } from 'react';
import { Field, inputClass } from '../components/ui';
import { Artwork, ItemCard } from '../items/ItemCard';
import {
  artwork, BACKGROUNDS, classEquipment, defaultArtwork, equipmentTemplates,
  ITEM_TYPES, loadItems, RARITIES, samples, STORAGE_KEY, type ForgeItem, type ItemType,
} from '../items/catalog';
import './item-forge.css';

export function ItemForge() {
  const [items, setItems] = useState<ForgeItem[]>(loadItems);
  const [selected, setSelected] = useState((items[0] ?? samples[0]).id);
  const [mode, setMode] = useState<'edit' | 'print' | 'catalog'>('edit');
  const [ink, setInk] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [printArtReady, setPrintArtReady] = useState(false);
  const [artFilter, setArtFilter] = useState<ItemType | 'All' | 'User images'>('All');
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [customImageName, setCustomImageName] = useState('');
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [typeFilter, setTypeFilter] = useState<ItemType | 'All'>('All');
  const forgeRef = useRef<HTMLElement>(null);
  const item = items.find(i => i.id === selected) ?? items[0] ?? samples[0];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setSaveError(false);
    } catch { setSaveError(true); }
  }, [items]);

  useEffect(() => {
    const check = () => setOverflow(Array.from(forgeRef.current?.querySelectorAll('.card-copy') ?? [])
      .some(el => el.scrollHeight > el.clientHeight + 1));
    const observer = new ResizeObserver(check);
    forgeRef.current?.querySelectorAll('.card-copy').forEach(el => observer.observe(el));
    check();
    return () => observer.disconnect();
  }, [items, mode]);

  useEffect(() => {
    const images = Array.from(forgeRef.current?.querySelectorAll<HTMLImageElement>('.print-preview img') ?? []);
    const check = () => setPrintArtReady(images.length > 0 && images.every(image => image.complete && image.naturalWidth > 0));
    images.forEach(image => {
      image.addEventListener('load', check);
      image.addEventListener('error', check);
    });
    check();
    return () => images.forEach(image => {
      image.removeEventListener('load', check);
      image.removeEventListener('error', check);
    });
  }, [items, mode]);

  const update = (patch: Partial<ForgeItem>) => setItems(current => current.map(i => i.id === item.id ? { ...i, ...patch } : i));
  const cards = items.flatMap(i => Array.from({ length: i.quantity }, () => i));
  const pages = Array.from({ length: Math.ceil(cards.length / 4) }, (_, n) => cards.slice(n * 4, n * 4 + 4));
  const selectedClass = classEquipment.find(c => c.id === classFilter);
  const templates = equipmentTemplates.filter(t =>
    (!selectedClass || selectedClass.ids.has(t.id)) &&
    (typeFilter === 'All' || t.type === typeFilter) &&
    t.name.toLowerCase().includes(search.toLowerCase().trim()));
  const visibleArt = artwork.map((a, index) => ({ ...a, index })).filter(a => artFilter === 'All' || a.type === artFilter);
  const userImages = items.filter(i => i.customArt).map(i => ({ id: `user-${i.id}`, name: i.name || 'User image', src: i.customArt ?? '' }));
  const addImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : undefined;
      if (src) { setCustomImageName(file.name); update({ customArt: src }); }
    };
    reader.readAsDataURL(file);
  };
  const uploadImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) addImageFile(file);
    event.target.value = '';
  };
  const pasteImage = (event: ClipboardEvent<HTMLDivElement>) => {
    const file = Array.from(event.clipboardData.files).find(candidate => candidate.type.startsWith('image/'));
    if (file) { event.preventDefault(); addImageFile(file); }
  };

  function addItem(template?: ForgeItem) {
    if (items.length >= 100) return;
    const next: ForgeItem = template
      ? { ...template, id: crypto.randomUUID(), quantity: 1 }
      : { ...samples[0], id: crypto.randomUUID(), name: 'Untold treasure', text: '', quantity: 1 };
    setItems(current => [...current, next]);
    setSelected(next.id);
    setArtFilter(next.type);
    setMode('edit');
  }

  return (
    <section className="forge" ref={forgeRef}>
      <div className="forge-heading">
        <div>
          <p className="eyebrow">THE DUNGEON MASTER’S WORKBENCH</p>
          <h1>Item Forge<span className="prototype-badge">PROTOTYPE</span></h1>
          <p>A curious trinket. A legendary blade. Make it theirs.</p>
        </div>
        <div className="forge-actions">
          <button className="forge-button secondary" onClick={() => setMode('catalog')}>Browse starting gear</button>
          <button className="forge-button primary" onClick={() => addItem()} disabled={items.length >= 100}>+ Create item</button>
        </div>
      </div>
      <div className="forge-toolbar">
        <div className="forge-tabs">
          <button aria-pressed={mode === 'edit'} onClick={() => setMode('edit')}>01 · Create & collect</button>
          <button aria-pressed={mode === 'catalog'} onClick={() => setMode('catalog')}>02 · Equipment shelf</button>
          <button aria-pressed={mode === 'print'} onClick={() => setMode('print')}>03 · Prepare to print <span>{cards.length}</span></button>
        </div>
        <span className="save-status" role="status">{saveError ? 'Unable to save. Browser storage is full or unavailable.' : 'Saved in this browser'}</span>
      </div>

      {mode === 'catalog' && (
        <div className="equipment-shelf">
          <div className="shelf-heading">
            <div><p className="eyebrow">PACK FOR THE ADVENTURE</p><h2>Every story starts with a few essentials.</h2></div>
            <p>{artwork.length} illustrations · {equipmentTemplates.length} equipment templates</p>
          </div>
          <div className="shelf-filters">
            <Field label="Find equipment"><input className={inputClass} type="search" placeholder="Sword, armor, tools…" value={search} onChange={e => setSearch(e.target.value)} /></Field>
            <Field label="Starting gear for"><select className={inputClass} value={classFilter} onChange={e => setClassFilter(e.target.value)}><option value="all">All classes & equipment</option>{classEquipment.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Equipment category"><select className={inputClass} value={typeFilter} onChange={e => setTypeFilter(e.target.value as ItemType | 'All')}><option>All</option>{ITEM_TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
          </div>
          <p className="shelf-note">Templates use the existing SRD equipment data. Class filters show fixed items across that class’s starting options, not a complete kit. Gold, background gear, and open equipment choices are separate. Related items may share an illustration.</p>
          {selectedClass && selectedClass.choices.length > 0 && <p className="shelf-note">Additional choices: {selectedClass.choices.join(' · ')}</p>}
          <div className="equipment-grid">
            {templates.map(template => (
              <button className="equipment-tile" key={template.id} disabled={items.length >= 100} onClick={() => addItem(template)} aria-label={`Add ${template.name}`}>
                <div className="equipment-art"><Artwork art={template.art} /></div>
                <span className="eyebrow">{template.type}</span><h3>{template.name}</h3><span className="add-template">+ Add to collection</span>
              </button>
            ))}
          </div>
          {templates.length === 0 && <p className="shelf-empty">No equipment matches these filters. Try another class or category.</p>}
          {items.length >= 100 && <p role="status">Your prototype collection has reached its 100-item limit.</p>}
        </div>
      )}

      {mode === 'edit' && (
        <div className="forge-workbench">
          <aside className="item-library">
            <p className="eyebrow">YOUR COLLECTION <span>{items.length}</span></p>
            <div className="library-list">{items.map(i => (
              <button key={i.id} className={`library-item ${i.id === item.id ? 'active' : ''}`} onClick={() => setSelected(i.id)}>
                <div className="library-art"><Artwork art={i.art} customSrc={i.customArt} /></div>
                <span><strong>{i.name || 'Unnamed treasure'}</strong><small>{i.type} · {i.rarity}</small></span>
              </button>
            ))}</div>
            <button className="library-browse" onClick={() => setMode('catalog')}>+ Browse equipment shelf</button>
          </aside>
          <div className="item-editor">
            <p className="eyebrow">THE DETAILS</p>
            <Field label="Item name"><input className={inputClass} value={item.name} maxLength={70} onChange={e => update({ name: e.target.value })} /></Field>
            <div className="field-pair">
              <Field label="Type"><select className={inputClass} value={item.type} onChange={e => {
                const type = e.target.value as ItemType;
                update({ type, art: defaultArtwork(type) });
                setArtFilter(type);
              }}>{ITEM_TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Rarity"><select className={inputClass} value={item.rarity} onChange={e => update({ rarity: e.target.value as ForgeItem['rarity'] })}>{RARITIES.map(r => <option key={r}>{r}</option>)}</select></Field>
            </div>
            <Field label="Story & effects"><textarea className={inputClass} rows={6} maxLength={420} value={item.text} onChange={e => update({ text: e.target.value })} /></Field>
            <p className="field-help">{item.text.length}/420 characters · Short descriptions make better cards.</p>
            <label className="check-label"><input type="checkbox" checked={item.attunement} onChange={e => update({ attunement: e.target.checked })} /> Requires attunement</label>
            <Field label="Artwork background"><select className={inputClass} value={item.background} onChange={e => update({ background: e.target.value as ForgeItem['background'] })}>{BACKGROUNDS.map(b => <option key={b}>{b}</option>)}</select></Field>
            <p className="field-help">By rarity: parchment, forest green, arcane blue, amethyst, or legendary gold.</p>
            <div className="art-picker-heading"><p className="eyebrow">CHOOSE AN ILLUSTRATION</p><select aria-label="Filter illustrations" className={inputClass} value={artFilter} onChange={e => setArtFilter(e.target.value as ItemType | 'All' | 'User images')}><option>All</option><option value="User images">User images</option>{ITEM_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div className={`user-image-dropzone ${isDraggingImage ? 'dragging' : ''}`} tabIndex={0} onPaste={pasteImage} onDragOver={event => { event.preventDefault(); setIsDraggingImage(true); }} onDragLeave={() => setIsDraggingImage(false)} onDrop={event => { event.preventDefault(); setIsDraggingImage(false); const file = Array.from(event.dataTransfer.files).find(candidate => candidate.type.startsWith('image/')); if (file) addImageFile(file); }}>
              <span className="dropzone-icon" aria-hidden="true">✦</span>
              <strong>Drop in or paste an image</strong>
              <span>{customImageName || 'Drag an image here, press Ctrl/Cmd + V, or choose a file'}</span>
              <label className="upload-image-button">Choose image<input aria-label="Add your image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={uploadImage} /></label>
            </div>
            <div className="art-picker">{visibleArt.map(a => (
              <button key={a.id} aria-label={a.name} title={a.name} aria-pressed={!item.customArt && item.art === a.index} onClick={() => update({ art: a.index, customArt: undefined })}><Artwork art={a.index} /><span>{a.name}</span></button>
            ))}</div>
            {artFilter === 'User images' && <div className="art-picker user-art-picker">{userImages.map(a => <button key={a.id} aria-label={a.name} title={a.name} aria-pressed={item.customArt === a.src} onClick={() => update({ customArt: a.src })}><img className="item-art" src={a.src} alt={a.name} /><span>{a.name}</span></button>)}</div>}
            <p className="field-help">{artFilter === 'User images' ? `${userImages.length} user images` : `${visibleArt.length} illustrations`} · Your uploads stay in this browser.</p>
          </div>
          <div className="live-preview">
            <p className="eyebrow">AT YOUR TABLE</p><ItemCard item={item} />
            <p className="preview-caption">A treasure worth handing over.</p>
            {overflow && <p role="status" className="overflow-note">This preview is too full. Shorten the text or check the larger print layout.</p>}
          </div>
        </div>
      )}

      {mode === 'print' && (
        <div className="print-workbench">
          <aside className="print-settings">
            <p className="eyebrow">YOUR PRINT SHEET</p><h2>Ready for the table.</h2>
            <p>A4 · 4 large cards per page<br />90 × 128 mm · single-sided</p>
            {items.map(i => <label className="quantity-row" key={i.id}><span>{i.name || 'Unnamed treasure'}</span><input aria-label={`Copies of ${i.name}`} type="number" min={0} max={18} value={i.quantity} onChange={e => {
              const quantity = Math.max(0, Math.min(18, Math.floor(Number(e.target.value) || 0)));
              setItems(current => current.map(x => x.id === i.id ? { ...x, quantity } : x));
            }} /></label>)}
            <label className="check-label"><input type="checkbox" checked={ink} onChange={e => setInk(e.target.checked)} /> Ink-saving background</label>
            <button className="forge-button primary" disabled={!cards.length || overflow || !printArtReady} onClick={() => window.print()}>Print / save as PDF</button>
            {cards.length > 0 && !printArtReady && <p role="status" className="field-help">Waiting for card artwork. If an image does not load, refresh the page before printing.</p>}
            <p className="field-help">Choose A4, 100% scale, no margins, and turn off browser headers and footers. Enable background graphics for the decorative style. Cut along the dashed outlines.</p>
            <p role="status" className="field-help">{overflow ? 'A card is too full. Shorten its name or description before printing. ' : ''}{cards.length} cards · {pages.length} {pages.length === 1 ? 'page' : 'pages'}</p>
          </aside>
          <div className="print-preview">
            {pages.length === 0 && <p>Choose at least one copy to prepare your sheet.</p>}
            {pages.map((page, n) => <div className="a4-sheet" key={n}>
              {page.map((card, j) => <div className="cut-card" key={`${card.id}-${j}`}><ItemCard item={card} ink={ink} /></div>)}
              <span className="sheet-label">D&D TOOLKIT · {n + 1} / {pages.length} · TABLETOP ITEM CARDS</span>
            </div>)}
          </div>
        </div>
      )}
    </section>
  );
}
