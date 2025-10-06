import { useState } from "react";
import "./App.css";

import { Routes, Route } from "react-router-dom";
import { SymptomsList } from "./components/symptoms-list";
import { SymptomsDetail } from "./components/symptoms-detail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<SymptomsList />} />
      <Route path="/symptoms" element={<SymptomsList />} />
      <Route path="/symptoms/:id" element={<SymptomsDetail />} />
    </Routes>
  );
}

export default App;
