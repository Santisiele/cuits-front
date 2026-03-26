import Home from "./pages/Home";

function App() {
  return (
    <div>
      <nav style={{ padding: 16, borderBottom: "1px solid #ccc" }}>
        <h2>CUIT Explorer</h2>
      </nav>

      <main style={{ padding: 16 }}>
        <Home />
      </main>
    </div>
  );
}

export default App;