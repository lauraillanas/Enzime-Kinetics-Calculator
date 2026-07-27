import { useState } from "react";
import DataInput from "./components/DataInput.jsx";
import KineticsChart from "./components/KineticsChart.jsx";
import ResultsPanel from "./components/ResultsPanel.jsx";
import { fitKinetics, fetchSampleData, fetchReference } from "./api.js";

const EMPTY_ROWS = Array.from({ length: 4 }, () => ({ substrate: "", velocity: "" }));

export default function App() {
  const [rows, setRows] = useState(EMPTY_ROWS);
  const [fitResult, setFitResult] = useState(null);
  const [fitting, setFitting] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [error, setError] = useState(null);
  const [chartView, setChartView] = useState("mm");

  const [ecNumber, setEcNumber] = useState("");
  const [reference, setReference] = useState(null);
  const [lookingUpReference, setLookingUpReference] = useState(false);

  const handleLoadSample = async (name) => {
    setLoadingSample(true);
    setError(null);
    try {
      const data = await fetchSampleData(name);
      setRows(data.substrate.map((s, i) => ({ substrate: String(s), velocity: String(data.velocity[i]) })));
      setFitResult(null);
      setReference(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSample(false);
    }
  };

  const handleFit = async () => {
    const numericRows = rows
      .map((r) => ({ substrate: Number(r.substrate), velocity: Number(r.velocity) }))
      .filter((r) => r.substrate !== "" && r.velocity !== "" && !Number.isNaN(r.substrate) && !Number.isNaN(r.velocity));

    setFitting(true);
    setError(null);
    try {
      const result = await fitKinetics(
        numericRows.map((r) => r.substrate),
        numericRows.map((r) => r.velocity)
      );
      setFitResult(result);
      setChartView("mm");
    } catch (err) {
      setError(err.message);
      setFitResult(null);
    } finally {
      setFitting(false);
    }
  };

  const handleLookupReference = async () => {
    setLookingUpReference(true);
    try {
      const result = await fetchReference(ecNumber.trim());
      setReference(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLookingUpReference(false);
    }
  };

  const experimentalPoints = rows
    .map((r) => ({ substrate: Number(r.substrate), velocity: Number(r.velocity) }))
    .filter((r) => !Number.isNaN(r.substrate) && !Number.isNaN(r.velocity));

  return (
    <div className="app">
      <h1>Enzyme Kinetics Calculator</h1>
      <p className="subtitle">Ajuste de cinética de Michaelis-Menten a partir de datos experimentales de (S, v).</p>

      {error && <div className="error-banner">{error}</div>}

      <DataInput
        rows={rows}
        onRowsChange={setRows}
        onFit={handleFit}
        fitting={fitting}
        onLoadSample={handleLoadSample}
        loadingSample={loadingSample}
      />

      {fitResult && (
        <>
          <KineticsChart
            experimentalPoints={experimentalPoints}
            fittedCurve={fitResult.fitted_curve}
            lineweaverBurk={fitResult.lineweaver_burk}
            view={chartView}
            onViewChange={setChartView}
          />
          <ResultsPanel
            fitResult={fitResult}
            ecNumber={ecNumber}
            onEcNumberChange={setEcNumber}
            onLookupReference={handleLookupReference}
            reference={reference}
            lookingUpReference={lookingUpReference}
          />
        </>
      )}
    </div>
  );
}
