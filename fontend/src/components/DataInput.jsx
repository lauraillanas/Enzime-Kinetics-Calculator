const SAMPLE_DATASETS = [
  { value: "invertase", label: "Invertasa (ejemplo)" },
  { value: "alkaline_phosphatase", label: "Fosfatasa alcalina (ejemplo)" },
];

function updateRow(rows, index, field, value) {
  return rows.map((row, i) => (i === index ? { ...row, [field]: value } : row));
}

export default function DataInput({ rows, onRowsChange, onFit, fitting, onLoadSample, loadingSample }) {
  const addRow = () => onRowsChange([...rows, { substrate: "", velocity: "" }]);
  const removeRow = (index) => onRowsChange(rows.filter((_, i) => i !== index));

  const validRowCount = rows.filter(
    (r) => r.substrate !== "" && r.velocity !== "" && !Number.isNaN(Number(r.substrate)) && !Number.isNaN(Number(r.velocity))
  ).length;

  return (
    <div className="card">
      <h2>Datos experimentales</h2>

      <div className="row" style={{ marginBottom: "1rem" }}>
        <select
          disabled={loadingSample}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) onLoadSample(e.target.value);
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            Cargar CSV de ejemplo...
          </option>
          {SAMPLE_DATASETS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Sustrato [S]</th>
            <th>Velocidad [v]</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>
                <input
                  type="number"
                  step="any"
                  value={row.substrate}
                  onChange={(e) => onRowsChange(updateRow(rows, i, "substrate", e.target.value))}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="any"
                  value={row.velocity}
                  onChange={(e) => onRowsChange(updateRow(rows, i, "velocity", e.target.value))}
                />
              </td>
              <td>
                <button className="icon" onClick={() => removeRow(i)} aria-label="Eliminar fila">
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="row" style={{ marginTop: "1rem" }}>
        <button className="secondary" onClick={addRow}>
          + Añadir fila
        </button>
        <button onClick={onFit} disabled={fitting || validRowCount < 3}>
          {fitting ? "Ajustando..." : "Ajustar"}
        </button>
        {validRowCount < 3 && <span className="muted">Se necesitan al menos 3 pares (S, v) válidos.</span>}
      </div>
    </div>
  );
}
