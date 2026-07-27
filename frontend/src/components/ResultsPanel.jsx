function fmt(value, digits = 3) {
  return value === null || value === undefined ? "—" : Number(value).toFixed(digits);
}

export default function ResultsPanel({ fitResult, ecNumber, onEcNumberChange, onLookupReference, reference, lookingUpReference }) {
  return (
    <div className="card">
      <h2>Resultados</h2>

      <div className="stat-grid">
        <div className="stat">
          <div className="label">Km</div>
          <div className="value">{fmt(fitResult.km)}</div>
          <div className="muted">± {fmt(fitResult.km_stderr)}</div>
        </div>
        <div className="stat">
          <div className="label">Vmax</div>
          <div className="value">{fmt(fitResult.vmax)}</div>
          <div className="muted">± {fmt(fitResult.vmax_stderr)}</div>
        </div>
        <div className="stat">
          <div className="label">R²</div>
          <div className="value">{fmt(fitResult.r_squared, 4)}</div>
        </div>
      </div>

      <h2>Comparar con literatura (SABIO-RK)</h2>
      <div className="row">
        <input
          type="text"
          style={{ maxWidth: "180px" }}
          placeholder="Número EC, ej. 3.2.1.26"
          value={ecNumber}
          onChange={(e) => onEcNumberChange(e.target.value)}
        />
        <button className="secondary" onClick={onLookupReference} disabled={lookingUpReference || !ecNumber}>
          {lookingUpReference ? "Buscando..." : "Buscar referencia"}
        </button>
      </div>

      {reference && !reference.available && <p className="muted">{reference.message}</p>}

      {reference && reference.available && (
        <div className="ref-table">
          <p className="muted">
            {reference.entries_used} de {reference.total_entries} entradas de SABIO-RK para EC {reference.ec_number}
          </p>
          <table>
            <thead>
              <tr>
                <th>Parámetro</th>
                <th>Media</th>
                <th>Unidad</th>
                <th>Rango</th>
                <th>n</th>
              </tr>
            </thead>
            <tbody>
              {reference.km.map((row) => (
                <tr key={`km-${row.unit}`}>
                  <td>Km</td>
                  <td>{fmt(row.mean)}</td>
                  <td>{row.unit}</td>
                  <td>
                    {fmt(row.min)}–{fmt(row.max)}
                  </td>
                  <td>{row.n}</td>
                </tr>
              ))}
              {reference.vmax.map((row) => (
                <tr key={`vmax-${row.unit}`}>
                  <td>Vmax</td>
                  <td>{fmt(row.mean)}</td>
                  <td>{row.unit}</td>
                  <td>
                    {fmt(row.min)}–{fmt(row.max)}
                  </td>
                  <td>{row.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">
            Los valores se agrupan por unidad porque distintos experimentos reportan Km/Vmax en unidades distintas
            (mM vs µM, µmol/min/mg vs U/mg...); no se promedian entre unidades.
          </p>
        </div>
      )}
    </div>
  );
}
