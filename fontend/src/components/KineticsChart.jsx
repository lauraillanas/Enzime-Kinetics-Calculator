import {
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function buildLineweaverBurkFitLine(lineweaverBurk) {
  const { points, slope, intercept } = lineweaverBurk;
  const xs = points.map((p) => p.inv_s);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  return [0, minX, maxX]
    .filter((x, i, arr) => arr.indexOf(x) === i)
    .sort((a, b) => a - b)
    .map((x) => ({ inv_s: x, fit: slope * x + intercept }));
}

export default function KineticsChart({ experimentalPoints, fittedCurve, lineweaverBurk, view, onViewChange }) {
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2>Curva de ajuste</h2>
        <div className="chart-toggle">
          <button className={view === "mm" ? "" : "secondary"} onClick={() => onViewChange("mm")}>
            Michaelis-Menten
          </button>
          <button
            className={view === "lb" ? "" : "secondary"}
            onClick={() => onViewChange("lb")}
            disabled={!lineweaverBurk}
          >
            Lineweaver-Burk
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={360}>
        {view === "mm" ? (
          <ComposedChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="substrate" name="Sustrato [S]" domain={["auto", "auto"]} />
            <YAxis type="number" dataKey="velocity" name="Velocidad [v]" />
            <Tooltip formatter={(value) => Number(value).toFixed(3)} />
            <Legend />
            <Line
              data={fittedCurve}
              type="monotone"
              dataKey="velocity"
              name="Curva ajustada"
              stroke="#2f6feb"
              dot={false}
              isAnimationActive={false}
            />
            <Scatter data={experimentalPoints} name="Datos experimentales" fill="#e0762b" />
          </ComposedChart>
        ) : (
          <ComposedChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="inv_s" name="1/S" domain={["auto", "auto"]} />
            <YAxis type="number" dataKey="inv_v" name="1/v" domain={["auto", "auto"]} />
            <Tooltip formatter={(value) => Number(value).toFixed(4)} />
            <Legend />
            <Line
              data={buildLineweaverBurkFitLine(lineweaverBurk)}
              type="linear"
              dataKey="fit"
              name="Regresión lineal"
              stroke="#2f6feb"
              dot={false}
              isAnimationActive={false}
            />
            <Scatter data={lineweaverBurk.points} name="1/S vs 1/v" fill="#e0762b" />
          </ComposedChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
