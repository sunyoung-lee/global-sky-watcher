import './Header.css'

export default function Header({ searchQuery, onSearchChange, onSearchSubmit }) {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">Global Sky Watcher</h1>
        <p className="header-sub">Real-time Flight Tracker</p>
      </div>
      <div className="header-search-wrap">
        <input
          className="header-search"
          type="text"
          placeholder="Search callsign…"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSearchSubmit() }}
          spellCheck={false}
        />
      </div>
    </header>
  )
}
