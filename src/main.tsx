import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ModelViewer } from "./viewer";
import type { Catalog } from "./domain/catalog";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Plus,
  Minus,
  Layers,
  Crosshair,
  X,
  ArrowUpRight,
} from "lucide-react";
import "./style.css";
/** Search normalization is domain/UI logic; it is not part of the 3D engine. */
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
const initial = [
  "skeleton",
  "muscles",
  "heart",
  "respiratory",
  "digestive",
  "urinary",
  "arteries",
  "veins",
  "nervous",
  "endocrine",
  "sensory",
  "connective",
  "lymphatic",
  "other",
];
/** Host application: search, anatomical metadata and panels stay outside the viewer. */
function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null),
    [error, setError] = useState("");
  const [visible, setVisible] = useState(initial),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [selected, setSelected] = useState<string | null>(null),
    [isolated, setIsolated] = useState(false),
    [explode, setExplode] = useState(0),
    [angle, setAngle] = useState(0),
    [zoom, setZoom] = useState(1),
    [resetKey, setResetKey] = useState(0),
    [searchOpen, setSearchOpen] = useState(false),
    [mobile, setMobile] = useState(false),
    [loading, setLoading] = useState(0),
    [retry, setRetry] = useState(0),
    [hovered, setHovered] = useState<string | null>(null);
  useEffect(() => {
    fetch("./anatomy/catalog.json")
      .then((r) => {
        if (!r.ok) throw Error("Không tải được danh mục");
        return r.json();
      })
      .then(setCatalog)
      .catch((e) => setError(String(e)));
  }, []);
  const concept = catalog?.concepts.find((c) => c.id === selected);
  // Meshes are renderable pieces; a medical concept may reference multiple pieces.
  const meshMap = useMemo(
    () => new Map(catalog?.meshes.map((m) => [m.id, m.conceptId])),
    [catalog],
  );
  const selectedMeshes = useMemo(
    () => new Set(concept?.meshIds ?? []),
    [concept],
  );
  const results = useMemo(
    () =>
      catalog?.concepts
        .filter(
          (c) =>
            (filter === "all" || c.systems.includes(filter)) &&
            (!query ||
              norm([c.en, c.vi, c.la, c.id].filter(Boolean).join(" ")).includes(
                norm(query),
              )),
        )
        .slice(0, 35) ?? [],
    [catalog, query, filter],
  );
  // Search can select hidden structures, so the host enables their owning groups.
  const pick = (id: string) => {
    setSelected(id);
    setIsolated(false);
    setSearchOpen(false);
    const c = catalog?.concepts.find((c) => c.id === id);
    if (c) setVisible((v) => [...new Set([...v, ...c.systems])]);
  };
  // resetKey also resets OrbitControls, whose drag state lives outside React.
  const reset = () => {
    setVisible(initial);
    setSelected(null);
    setIsolated(false);
    setExplode(0);
    setAngle(0);
    setZoom(1);
    setResetKey((k) => k + 1);
  };
  if (!catalog)
    return (
      <div className="boot">
        <Layers size={30} />
        <h1>Atlas giải phẫu</h1>
        <p>{error || "Đang mở danh mục cấu trúc…"}</p>
        {error && <button onClick={() => location.reload()}>Thử lại</button>}
      </div>
    );
  const hoverConcept = catalog.concepts.find(
    (c) => c.id === meshMap.get(hovered || ""),
  );
  const selectedSystem = catalog.systems.find(
    (s) => s.id === concept?.systems[0],
  );
  const clearSelection = () => {
    setSelected(null);
    setIsolated(false);
  };
  const visibleCount = isolated
    ? selectedMeshes.size
    : catalog.systems
        .filter((s) => visible.includes(s.id))
        .reduce((n, s) => n + s.count, 0);
  return (
    <main
      className={`workspace ${concept ? "has-selection" : ""}`}
      data-hovered={hovered || ""}
      data-selected={selected || ""}
    >
      <div className="search-wrap">
        <button
          className="mobile-toggle icon-btn"
          aria-label="Mở danh sách hệ"
          aria-expanded={mobile}
          onClick={() => setMobile(!mobile)}
        >
          <Layers size={18} />
        </button>
        <div className="search-box">
          <Search size={17} />
          <input
            aria-label="Tìm cấu trúc Việt Anh Latin"
            placeholder="Tìm cấu trúc · Việt / English / Latin"
            value={query}
            onFocus={() => setSearchOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearchOpen(false);
              if (e.key === "Enter" && results[0]) pick(results[0].id);
            }}
          />
          <select
            aria-label="Lọc hệ tìm kiếm"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setSearchOpen(true);
            }}
          >
            <option value="all">Tất cả hệ</option>
            {catalog.systems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {searchOpen && (
          <div className="results">
            <div className="results-label">
              CẤU TRÚC GIẢI PHẪU
              <button
                aria-label="Đóng tìm kiếm"
                onClick={() => setSearchOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            {results.length ? (
              results.map((c) => (
                <button key={c.id} onClick={() => pick(c.id)}>
                  <strong>{c.vi || c.en}</strong>
                  <span>
                    {c.en}
                    {c.la ? ` · ${c.la}` : ""}
                  </span>
                  <small>{c.id}</small>
                </button>
              ))
            ) : (
              <p>Không tìm thấy cấu trúc phù hợp.</p>
            )}
            <p className="search-foot">
              Tên Việt / Latin đang được biên tập; có thể tìm bằng tên Anh.
            </p>
          </div>
        )}
      </div>
      <section className="viewer" aria-label="Mô hình giải phẫu tương tác">
        <div className="ground-ring" aria-hidden="true" />
        <div className="canvas-wrap">
          <SceneBoundary>
            <ModelViewer
              assets={catalog.systems}
              bounds={catalog.bounds}
              visible={visible}
              selectedMeshes={selectedMeshes}
              isolated={isolated}
              explode={explode}
              angle={angle}
              zoom={zoom}
              resetKey={resetKey}
              retry={retry}
              hovered={hovered}
              onHover={setHovered}
              onPick={(id) => {
                // The viewer emits a mesh ID; only the host knows its medical concept.
                const conceptId = meshMap.get(id);
                if (conceptId) pick(conceptId);
              }}
              onMiss={clearSelection}
              onLoading={(delta) => setLoading((count) => count + delta)}
              onError={setError}
            />
          </SceneBoundary>
        </div>
        {hoverConcept && (
          <div className="hover-label" role="status">
            {hoverConcept.vi || hoverConcept.en}
          </div>
        )}
        {loading > 0 && (
          <div className="load-status" role="status">
            Đang tải {loading} hệ cơ quan…
          </div>
        )}
        {error && (
          <div className="load-status error" role="alert">
            {error}
            <button
              onClick={() => {
                setError("");
                setRetry((r) => r + 1);
              }}
            >
              Thử lại
            </button>
          </div>
        )}
      </section>
      <aside
        className={`systems panel ${mobile ? "open" : ""}`}
        aria-label="Hệ cơ quan"
      >
        <div className="section-title">
          <h2>Hệ cơ quan</h2>
          <span>{catalog.systems.length}</span>
        </div>
        <div className="presets">
          <button
            onClick={() => {
              setVisible(
                catalog.systems
                  .filter((s) => s.id !== "skin" && s.id !== "reproductive")
                  .map((s) => s.id),
              );
              setIsolated(false);
            }}
          >
            Tất cả
          </button>
          <button
            onClick={() => {
              setVisible(["skeleton"]);
              clearSelection();
            }}
          >
            Bộ xương
          </button>
          <button
            onClick={() => {
              setVisible(["heart", "respiratory", "digestive", "urinary"]);
              clearSelection();
            }}
          >
            Nội tạng
          </button>
        </div>
        <div className="system-list">
          {catalog.systems.map((s) => (
            <label className="system" key={s.id}>
              <span className="dot" style={{ background: s.color }} />
              <span className="system-name">{s.name}</span>
              <small>{s.count}</small>
              <input
                aria-label={s.name}
                role="switch"
                type="checkbox"
                checked={visible.includes(s.id)}
                onChange={() => {
                  setVisible((v) =>
                    v.includes(s.id)
                      ? v.filter((id) => id !== s.id)
                      : [...v, s.id],
                  );
                  setIsolated(false);
                  setHovered(null);
                }}
              />
              <span className="switch-track" aria-hidden="true" />
            </label>
          ))}
        </div>
        <div className="systems-bottom">
          <span>{visibleCount.toLocaleString("vi-VN")} mảnh đang hiển thị</span>
          <button
            onClick={() => {
              setVisible([]);
              clearSelection();
              setHovered(null);
            }}
          >
            Ẩn tất cả
          </button>
        </div>
      </aside>
      {concept && (
        <aside className="details panel" aria-label="Thông tin cấu trúc">
          <div className="detail-top">
            <div>
              <div
                className="system-stroke"
                style={{ background: selectedSystem?.color }}
              />
              <span className="eyebrow">{selectedSystem?.name}</span>
            </div>
            <button
              className="icon-btn"
              aria-label="Bỏ chọn"
              onClick={clearSelection}
            >
              <X size={18} />
            </button>
          </div>
          <h2 className="organ-name">{concept.vi || concept.en}</h2>
          {concept.vi && <p className="english">{concept.en}</p>}
          {concept.la && <p className="latin">{concept.la}</p>}
          {concept.translationStatus && (
            <p className="draft">Tên dịch minh họa · chưa duyệt chuyên môn</p>
          )}
          <p className="description">
            Khám phá hình thể và vị trí của cấu trúc trên mô hình. Cô lập để
            quan sát rõ hơn ở các góc nhìn.
          </p>
          <p className="content-status">
            Nội dung chức năng và liên quan lâm sàng đang được biên soạn.
          </p>
          <div className="anatomy-meta">
            <div>
              <span>Mã tham chiếu</span>
              <strong>{concept.id}</strong>
            </div>
            <div>
              <span>Thành phần đã chọn</span>
              <strong>{concept.meshIds.length}</strong>
            </div>
          </div>
          <a
            className="source-link"
            href={catalog.source}
            target="_blank"
            rel="noreferrer"
          >
            Tham khảo nguồn giải phẫu <ArrowUpRight size={13} />
          </a>
          <div className="organ-actions">
            <button className="primary" onClick={() => setIsolated((v) => !v)}>
              <Crosshair size={16} />
              {isolated ? "Hiện xung quanh" : "Cô lập cấu trúc"}
              <ChevronRight size={18} />
            </button>
            <button className="clear" onClick={clearSelection}>
              Bỏ chọn cấu trúc
            </button>
          </div>
        </aside>
      )}
      <div className="viewer-bottom">
        <div className="controls">
          <button
            aria-label="Xoay trái"
            onClick={() => setAngle((a) => a - Math.PI / 6)}
          >
            <ChevronLeft size={19} />
          </button>
          <button
            aria-label="Thu nhỏ"
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
          >
            <Minus size={16} />
          </button>
          <span>Kéo để xoay · Cuộn để thu phóng</span>
          <button
            aria-label="Phóng to"
            onClick={() => setZoom((z) => Math.min(4, z + 0.15))}
          >
            <Plus size={16} />
          </button>
          <button
            aria-label="Xoay phải"
            onClick={() => setAngle((a) => a + Math.PI / 6)}
          >
            <ChevronRight size={19} />
          </button>
        </div>
        <div className="explode-card">
          <div className="explode-main">
            <label htmlFor="explode">Tách cấu trúc</label>
            <output htmlFor="explode">
              {Math.round(explode * 100)} <small>%</small>
            </output>
            <input
              id="explode"
              type="range"
              aria-label="Mức tách cấu trúc"
              min="0"
              max="1"
              step=".01"
              value={explode}
              onChange={(e) => setExplode(+e.target.value)}
            />
            <div className="range-labels">
              <span>Nguyên thể</span>
              <span>Từng cấu trúc</span>
            </div>
          </div>
          <button className="reset" onClick={reset} aria-label="Đặt lại">
            <RotateCcw size={19} />
            <span>Đặt lại</span>
          </button>
        </div>
      </div>
      <footer className="site-footer">
        <span>BodyParts3D 4.0 / DBCLS</span>
        {/* <a href="./anatomy/NOTICE.txt" target="_blank" rel="noreferrer">
          Nguồn & giấy phép · CC BY 4.0
        </a> */}
      </footer>
    </main>
  );
}
class SceneBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="boot">
        Không thể mở mô hình WebGL trên thiết bị này. Bạn vẫn có thể tìm cấu
        trúc bằng danh sách.
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(<App />);
