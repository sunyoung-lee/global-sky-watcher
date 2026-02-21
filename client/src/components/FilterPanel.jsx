import { useState } from 'react'
import './FilterPanel.css'

const REGIONS = [
  { id: 'all', label: 'All' },
  { id: 'asia', label: 'Asia', bounds: { lamin: 0, lamax: 60, lomin: 60, lomax: 150 } },
  { id: 'europe', label: 'Europe', bounds: { lamin: 35, lamax: 72, lomin: -12, lomax: 45 } },
  { id: 'namerica', label: 'N.America', bounds: { lamin: 15, lamax: 72, lomin: -170, lomax: -50 } },
]

const VERT_STATES = [
  { id: 'all', label: 'All' },
  { id: 'climbing', label: 'Climbing' },
  { id: 'descending', label: 'Descending' },
  { id: 'cruising', label: 'Cruising' },
]

export default function FilterPanel({ filters, onFilterChange }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="filter-panel">
      {open && (
        <div className="filter-body">
          <div className="filter-section">
            <div className="filter-label">Altitude Min</div>
            <div className="filter-range">
              <input
                type="range"
                min="0"
                max="12000"
                step="1000"
                value={filters.altMin}
                onChange={e => onFilterChange({ ...filters, altMin: +e.target.value })}
              />
              <span className="filter-range-value">{(filters.altMin / 1000).toFixed(0)}km</span>
            </div>
          </div>
          <div className="filter-section">
            <div className="filter-label">Region</div>
            <div className="filter-chips">
              {REGIONS.map(r => (
                <button
                  key={r.id}
                  className={`filter-chip ${filters.region === r.id ? 'selected' : ''}`}
                  onClick={() => onFilterChange({ ...filters, region: r.id })}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-section">
            <div className="filter-label">Vertical</div>
            <div className="filter-chips">
              {VERT_STATES.map(v => (
                <button
                  key={v.id}
                  className={`filter-chip ${filters.vertState === v.id ? 'selected' : ''}`}
                  onClick={() => onFilterChange({ ...filters, vertState: v.id })}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <button
        className={`filter-toggle ${open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
      >
        Filter
      </button>
    </div>
  )
}

export { REGIONS }
