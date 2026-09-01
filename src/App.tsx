import { Navigate, Route, Routes } from "react-router";
import { AppShell } from "./components/AppShell";
import { ItemPage } from "./pages/ItemPage";
import { MapPage } from "./pages/MapPage";
import { MePage } from "./pages/MePage";
import { RecognizePage } from "./pages/RecognizePage";
import { SearchPage } from "./pages/SearchPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<RecognizePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/items/:id" element={<ItemPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/me" element={<MePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
