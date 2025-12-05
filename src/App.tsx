import { Suspense, lazy } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";

// 懒加载页面组件
const Home = lazy(() => import("./pages/Home"));
const Christmas = lazy(() => import("./pages/Christmas"));
const BlackHole = lazy(() => import("./pages/BlackHole"));

// 加载状态组件
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <span className="loading-text">Loading...</span>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/christmas" element={<Christmas />} />
          <Route path="/blackhole" element={<BlackHole />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
