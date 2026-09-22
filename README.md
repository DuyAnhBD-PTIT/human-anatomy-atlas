# Anatomy Atlas _(anatomy-atlas)_

SPA học giải phẫu cơ thể với mô hình 3D tương tác và viewer có thể nhúng vào dự án React.

Ứng dụng tĩnh dành cho người học giải phẫu, không cần backend hoặc tài khoản. Viewer và animation được tách thành module để tái sử dụng trong các dự án React khác.

**Trạng thái: bản thử nghiệm kỹ thuật.** Bản dịch và nội dung chức năng/bệnh lý chưa được duyệt chuyên môn; chưa phải atlas học thuật hoàn chỉnh hoặc được xác nhận bám sát giáo trình của các trường đại học Y.

Tên package là `anatomy-atlas`; `PPP` chỉ là tên thư mục workspace phát triển hiện tại. Tên repository GitHub và mô tả About chưa được cấu hình trong workspace này. Khi xuất bản, dùng mô tả ngắn ở trên cho GitHub About để đồng bộ với `package.json`.

## Mục lục

- [Bối cảnh](#bối-cảnh)
- [Cài đặt](#cài-đặt)
- [Sử dụng](#sử-dụng)
- [Dữ liệu và cách thực hiện](#dữ-liệu-và-cách-thực-hiện)
- [Cấu trúc repository](#cấu-trúc-repository)
- [Kiểm tra](#kiểm-tra)
- [Cấu hình khuyến nghị](#cấu-hình-khuyến-nghị)
- [Fork toàn bộ dự án — từng bước](#fork-toàn-bộ-dự-án--từng-bước)
- [Embed vào React/TypeScript — từng bước](#embed-vào-reacttypescript--từng-bước)
- [Embed vào Canvas có sẵn](#embed-vào-canvas-có-sẵn)
- [Đo lại hiệu năng sau khi fork/embed](#đo-lại-hiệu-năng-sau-khi-forkembed)
- [Xử lý lỗi khi nhúng](#xử-lý-lỗi-khi-nhúng)
- [Tiến độ](#tiến-độ)
- [API](#api)
- [Đóng góp](#đóng-góp)
- [Giấy phép](#giấy-phép)

## Bối cảnh

Dự án giúp khám phá vị trí và quan hệ giữa các cấu trúc trên một mô hình cơ thể. Geometry từ BodyParts3D 4.0 được chuyển sang GLB; React quản lý UI, Three.js hiển thị mô hình và Anime.js làm mượt chuyển động xoay.

### Tính năng

- Hover/active; tìm theo tên Tiếng Anh, FMA ID, tên Tiếng Việt, Tiếng Latin đã có và lọc theo hệ.
- Bật/tắt hệ, preset, cô lập, xoay, zoom, tách mô hình và đặt lại.
- MatCap tạo sắc độ, không đèn/bóng thời gian thực. Vẫn dùng geometry 3D/WebGL để xoay và chọn mesh.

### Tech stack

| Thành phần | Công nghệ đang dùng                                               |
| ---------- | ----------------------------------------------------------------- |
| UI         | React 19.2, TypeScript 5.7, CSS thuần, Lucide React               |
| Build      | Vite 6, npm lockfile                                              |
| Viewer     | Three.js 0.180, React Three Fiber 9, Drei 10                      |
| Rendering  | Camera trực giao, MeshMatcapMaterial tự tạo, render theo nhu cầu  |
| Animation  | Anime.js 4 cho xoay; slider cập nhật vị trí tách                  |
| Pipeline   | Python chuẩn, Node.js, OBJLoader, glTF Transform 4, meshoptimizer |
| Kiểm tra   | ESLint, TypeScript, Node assertions, Playwright/Edge cho profiling              |

State dùng React hooks. Phiên bản chính xác nằm trong `package-lock.json`.

## Cài đặt

### Phụ thuộc

- Node.js 22.22+ và npm 11 để cài/chạy/build; dùng lockfile đi kèm.
- Trình duyệt có WebGL2 và tăng tốc phần cứng để xem mô hình.
- Python 3.11+ chỉ cần khi tái tạo dữ liệu nguồn.
- Edge/Chrome executable chỉ cần khi chạy công cụ profiling; xem phần đo hiệu năng.

### Cài đặt cục bộ

Trong thư mục dự án đã clone hoặc tải về:

```bash
npm ci
```

GLB/catalog có sẵn trong `public/anatomy`, không cần tải nguồn để chạy ứng dụng. Nếu chưa có bản sao repository, xem [hướng dẫn fork](#fork-toàn-bộ-dự-án--từng-bước).

Riêng workspace khởi tạo thiếu npm trên PATH có thể dùng `node .tools/npm11/package/bin/npm-cli.js` thay `npm`. `.tools` không thuộc repository; máy đã cài npm không cần thư mục này.

## Sử dụng

### Chạy ứng dụng

```bash
npm run dev
```

Mở URL Vite in ra, mặc định `http://127.0.0.1:5173`.

1. Bật/tắt hệ bên trái. Trên mobile, dùng nút biểu tượng lớp để mở bảng hệ.
2. Di chuột để highlight; click/chạm để mở thông tin. Có thể chọn qua tìm kiếm khi mesh khó chạm.
3. Dùng **Cô lập cấu trúc** để xem riêng, **Bỏ chọn** để đóng thông tin.
4. Kéo hoặc dùng mũi tên để xoay; cuộn hoặc dùng nút cộng/trừ để zoom.
5. Kéo **Tách cấu trúc** để minh họa các mảnh; **Đặt lại** phục hồi góc nhìn, độ tách và các hệ mặc định.

Chọn kết quả tìm kiếm hiện bật toàn bộ hệ liên quan. Catalog có tên Anh; mới có sáu cặp Việt/Latin minh họa gắn nhãn nháp. Tách mô hình không mô phỏng thao tác phẫu thuật.

### Dùng module trong React

Sau khi copy các module theo [hướng dẫn embed](#embed-vào-reacttypescript--từng-bước), ví dụ host có thể được import như sau. `assets` và `bounds` phải lấy từ dataset thực:

```tsx
import { EmbeddedModel } from "./examples/EmbeddedModel";
import type { ModelAsset, ModelBounds } from "./viewer";

export function Preview(props: { assets: ModelAsset[]; bounds: ModelBounds }) {
  return <EmbeddedModel assets={props.assets} bounds={props.bounds} />;
}
```

### Lệnh npm

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev` | Chạy Vite development server |
| `npm run build` | Typecheck và tạo bản production |
| `npm run preview` | Phục vụ bản build để kiểm tra cục bộ |
| `npm run lint` | Kiểm tra code theo ESLint hiện tại |
| `npm run data:build` | Chuyển nguồn đã giải nén thành catalog/GLB |
| `npm run data:validate` | Kiểm tra integrity dataset BodyParts3D |
| `npm run profile:render` | Đo CPU/GPU khi server ứng dụng đang chạy |

Dự án chưa cung cấp executable CLI riêng; các lệnh trên là npm scripts trong repository.

### Build và preview

```bash
npm run build
npm run preview -- --port 4173
```

Phục vụ toàn bộ `dist/` bằng static hosting; không mở HTML qua `file://`. Chưa deploy công khai. Với GitHub Pages ở subpath, cấu hình `base` của Vite theo repository trước khi build.

## Dữ liệu và cách thực hiện

| Chỉ số             |                     Giá trị |
| ------------------ | --------------------------: |
| Mesh nguồn         |                       2.234 |
| Concept có mesh    |                       3.432 |
| Nhóm hiển thị      |                          15 |
| Tam giác           |                   6.681.030 |
| Tổng GLB           | 94.840.800 byte (~94,84 MB) |
| Mesh hiện mặc định |                       2.222 |

Pipeline đọc metadata IS-A/PART-OF để tạo quan hệ concept–mesh, đổi trục OBJ thống nhất sang GLB, giữ ID/normals, weld đỉnh trùng và nén meshopt. Không giảm tam giác, không dựng lại bằng Blender. Runtime tải theo hệ, cache trong phiên và dùng ID để chọn, ẩn hoặc tách. Phân nhóm được suy từ nhãn loại cấu trúc và quan hệ gốc DBCLS; 57 mesh chưa xác định nằm ở nhóm “Chưa phân nhóm”. Đây là phân loại hiển thị nháp, cần rà soát chuyên môn. Chi tiết từng mesh: `docs/classification.json`.

### Tái tạo dữ liệu

Chỉ cần khi thay pipeline hoặc kiểm chứng build. Cần Python 3.11+, mạng khi chưa có nguồn và khoảng vài GB trống cho archive, OBJ, dependency và đầu ra.

```bash
python scripts/anatomy/fetch_source.py
npm run data:build
npm run data:validate
```

`data/source-manifest.json` pin URL, dung lượng và SHA-256 cho archive, sáu bảng metadata, README nguồn và license. Script kiểm tra checksum/CRC rồi giải nén 2.234 OBJ bằng tên file phẳng. Upstream thay đổi checksum sẽ làm lệnh thất bại; cần rà soát trước khi repin. File tải dở không dùng làm nguồn.

```bash
# Kiểm tra nguồn có sẵn và giải nén, không dùng mạng
python scripts/anatomy/fetch_source.py --offline
```

Sau khi build có thể xóa `data/work/`; fetch sẽ tạo lại. `check_zip_index.py` là công cụ kiểm kê tùy chọn cho hai archive, không phải bước build bắt buộc.

## Cấu trúc repository

```text
src/main.tsx               UI và state ứng dụng
src/viewer/                Viewer/loader/material/animation độc lập
src/domain/                Kiểu dữ liệu giải phẫu
src/examples/              Ví dụ nhúng viewer vào host khác
public/anatomy/             GLB, catalog, attribution ở runtime
data/source-manifest.json  Nguồn và checksum đã pin
data/source/               Cache nguồn (gitignored)
data/work/                 OBJ trung gian (gitignored)
scripts/anatomy/           Fetch, build, validate, kiểm kê ZIP tùy chọn
scripts/profile-render.mjs Đo render CPU/GPU
docs/                      Báo cáo, tiến độ, ảnh giao diện
EXECUTION_PLAN.md           Kế hoạch và tiêu chí đích
```

Giữ `public/anatomy` khi đưa lên GitHub để clone chạy ngay. Nguồn thô, cache, `node_modules`, `.tools`, `dist` không đưa vào Git. Bộ asset khá lớn; chuyển sang nơi lưu trữ riêng là một phương án tối ưu sau này, cần cập nhật URL/pipeline tương ứng.

## Kiểm tra

```bash
npm run lint
npm run build
npm run data:validate
```

## Cấu hình khuyến nghị

Các cấu hình dưới đây là **ước tính cho bộ anatomy hiện tại**, không phải yêu cầu tối thiểu đã nghiệm thu. Khi thay model cho domain khác, phải đo lại; tổng tam giác, số mesh/draw calls, shader và độ phân giải quan trọng hơn dung lượng GLB nén.

| Trường hợp | Máy đích / cấu hình gợi ý | Thiết lập viewer |
| --- | --- | --- |
| Phát triển UI, thử một vài hệ | CPU hiện đại ≥4 nhân, RAM 8 GB, WebGL2 có tăng tốc phần cứng | `maxDpr={1}`, chỉ bật các nhóm cần thiết |
| Xem toàn thân trên desktop | RAM 16 GB, CPU hiệu năng đơn nhân tốt; GPU rời ≥2 GB VRAM, ưu tiên 4 GB để có dư địa | `maxDpr={1.5}`, viewport khoảng 1080p; giữ render theo nhu cầu |
| GPU tích hợp / máy yếu | Chưa xác lập cấu hình tối thiểu; bắt đầu với ít nhóm | `maxDpr={1}`; cần giảm geometry/draw calls nếu vẫn chậm |
| Mobile | Chưa nghiệm thu full model hoặc chốt RAM/GPU tối thiểu | DPR 1, tải ít nhóm, chuẩn bị asset/LOD nhẹ hơn; giảm DPR không giải quyết chi phí hàng triệu tam giác |
| Dự án mới có model nhẹ | Không áp dụng máy móc cấu hình anatomy | Bắt đầu DPR 1, đo rồi mới tăng chất lượng |
| Build lại dữ liệu nguồn | Node.js 22.22+, npm 11, Python 3.11+, vài GB dung lượng trống; RAM 16 GB là mức khởi đầu đề xuất | Python chỉ cần cho pipeline nguồn; chưa đo peak RAM của pipeline |

Máy đã đo: **Core i5-11400H, RAM khoảng 32 GB, RTX 3050 Laptop**. Ở mức tách 100%, GPU render median khoảng **6,95–6,98 ms/frame**, với 2.222 draw calls và khoảng 6,44 triệu tam giác hiển thị. Đây là phép đo headless ở góc nhìn cố định, không phải cam kết 60 FPS khi kéo chuột hoặc trên GPU khác có cùng VRAM.

Ước tính buffer geometry + framebuffer khoảng **184 MiB** tại viewport đã đo, chưa gồm toàn bộ driver/compositor/loader. Không dùng con số này làm yêu cầu RAM/VRAM tối thiểu. Xem [phương pháp, số đo và giới hạn](docs/PERFORMANCE.md).

## Fork toàn bộ dự án — từng bước

Chọn hướng này khi muốn giữ UI anatomy, pipeline dữ liệu và các công cụ vận hành làm nền tảng cho sản phẩm riêng. Nếu chỉ cần khung xem 3D trong một app hiện có, xem phần embed bên dưới.

### Bước 1 — Tạo bản sao repository

Trên GitHub, dùng **Fork** vào tài khoản của bạn, rồi clone fork. Các chuỗi `YOUR_ACCOUNT`, `YOUR_REPO`, `SOURCE_ACCOUNT`, `SOURCE_REPO` là placeholder, cần thay bằng URL thật; dự án không giả định sẵn một repository công khai.

```bash
git clone https://github.com/YOUR_ACCOUNT/YOUR_REPO.git
cd YOUR_REPO
git remote add upstream https://github.com/SOURCE_ACCOUNT/SOURCE_REPO.git
git switch -c feature/my-viewer
```

`origin` trỏ về fork của bạn; `upstream` dùng để lấy các cập nhật từ nguồn sau này. Nếu copy thư mục thay vì GitHub Fork, bạn tự quản lý repository mới và không có sẵn quan hệ lịch sử upstream.

### Bước 2 — Cài và chạy bản gốc trước khi sửa

```bash
npm ci
npm run dev
```

Kiểm tra mô hình tải được, chọn/ẩn hệ, xoay và tách/lắp hoạt động. Không cần Python hoặc tải lại archive khi đã có `public/anatomy/`.

### Bước 3 — Xác định phần giữ và phần thay

| Phần | Giữ khi làm atlas | Khi chuyển sang sản phẩm/domain khác |
| --- | --- | --- |
| `src/viewer/` | Giữ renderer/animation | Có thể giữ và cấu hình lại |
| `src/main.tsx`, `src/style.css` | Tùy chỉnh UI | Viết host UI/state mới; không copy CSS toàn trang vào app hiện có |
| `src/domain/` | Giữ kiểu catalog | Thay bằng metadata sản phẩm/linh kiện của bạn |
| `public/anatomy/` | Giữ GLB/catalog/NOTICE | Thay asset và attribution tương ứng |
| `scripts/anatomy/`, `data/source-manifest.json` | Giữ để tái tạo nguồn | Chỉ bỏ sau khi có pipeline và validator cho dataset mới |
| `scripts/profile-render.mjs` | Dùng với UI anatomy hiện tại | Đổi selector/URL đo theo UI mới |

Đổi tên package trong `package.json` và tiêu đề trong `index.html` nếu cần. Sau khi thay dependency hoặc metadata package, chạy `npm install` để đồng bộ lockfile; các lần cài tiếp theo dùng `npm ci`.

### Bước 4 — Thay dữ liệu và nội dung

- Nếu vẫn dùng anatomy: giữ mesh ID/FMA ID và gắn nội dung theo concept; không đổi ID chỉ để đổi tên hiển thị.
- Nếu dùng model khác: chuẩn bị GLB và manifest theo phần embed; callback chọn mesh phải ánh xạ sang metadata của domain mới.
- Nếu vẫn phân phối BodyParts3D: giữ NOTICE, nguồn và giấy phép. Nếu bỏ dataset, kiểm tra giấy phép của asset thay thế. Repository hiện chưa có giấy phép mã ứng dụng riêng; quyền với dataset không tự cấp quyền đối với mọi phần mã.

### Bước 5 — Kiểm tra và build

```bash
npm run lint
npm run build
npm run data:validate
npm run preview -- --port 4173
```

`data:validate` hiện dành riêng cho BodyParts3D và kiểm tra 2.234 mesh. Với dataset mới, phải thay tiêu chí validator trước khi dùng lệnh này; không sửa số đếm chỉ để bỏ qua dữ liệu thiếu. Đo lại hiệu năng theo hướng dẫn cuối README.

### Bước 6 — Lưu thay đổi và nhận cập nhật sau này

Review `git diff`, stage các file của bạn rồi commit/push lên fork. Không đưa `node_modules/`, `.tools/`, `data/source/`, `data/work/` hoặc `dist/` vào Git. Giữ runtime assets nếu muốn clone có thể chạy ngay.

Khi cần cập nhật từ nguồn: `git fetch upstream`, tạo branch tích hợp và merge nhánh nguồn đã chọn. Không giả định nhánh nguồn luôn có tên `main`; kiểm tra bằng `git remote show upstream`. Xử lý xung đột rồi chạy lại build/kiểm tra trước khi hợp nhất vào nhánh sản phẩm.

## Embed vào React/TypeScript — từng bước

Module hiện được chia sẻ bằng **source code**, chưa phải npm package hoặc iframe SDK. `ModelViewer` tự tạo Canvas; host sở hữu state và panel. Không cần backend để nhúng.

### Bước 1 — Chuẩn bị host và dependency

Với app React 19 có sẵn, kiểm tra phiên bản trong `package.json` trước. Đừng cài thêm bản React thứ hai vào cùng app. Dự án này dùng các dòng phiên bản sau:

```bash
npm install three@~0.180.0 @react-three/fiber@^9 @react-three/drei@^10 animejs@^4
npm install -D @types/three@~0.180.0
```

Host cần `react`, `react-dom`, TypeScript và type React tương thích. Với host React khác major, phải kiểm tra tương thích R3F/Drei trước khi nâng cấp hoặc chọn bộ phiên bản khác. Muốn tái lập đúng toàn bộ dependency đã kiểm tra thì fork dự án và dùng `npm ci` với lockfile hiện có; lệnh trên chỉ giới hạn dòng phiên bản.

### Bước 2 — Copy các module cần thiết

Giữ cấu trúc tương đối sau trong host:

```text
src/
  viewer/                  copy TOÀN BỘ thư mục, gồm cả metrics.tsx
  examples/
    EmbeddedModel.tsx      copy ví dụ host
```

Không cần copy `main.tsx`, `style.css`, `src/domain/`, Lucide hoặc pipeline Python để chỉ dùng viewer. Ví dụ dùng style container riêng và import `../viewer`.

### Bước 3 — Thử với anatomy có sẵn

Copy `public/anatomy/` sang `public/anatomy/` của host, bao gồm `catalog.json`, GLB và `NOTICE.txt`. Ví dụ dưới dành cho **Vite React/TypeScript**, dùng đúng bounds trong catalog và resolve URL theo base của host:

```tsx
import { useEffect, useState } from "react";
import { EmbeddedModel } from "./examples/EmbeddedModel";
import type { ModelAsset, ModelBounds } from "./viewer";

type Dataset = { systems: ModelAsset[]; bounds: ModelBounds };

export default function AnatomyEmbed() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const base = new URL(import.meta.env.BASE_URL, document.baseURI);

    fetch(new URL("anatomy/catalog.json", base), {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Catalog HTTP ${response.status}`);
        return response.json() as Promise<Dataset>;
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        setDataset({
          bounds: data.bounds,
          systems: data.systems
            .filter((asset) => asset.id !== "skin" && asset.id !== "reproductive")
            .map((asset) => ({
              ...asset,
              url: new URL(asset.url, base).href,
            })),
        });
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(String(cause));
      });

    return () => controller.abort();
  }, []);

  if (error) return <p role="alert">{error}</p>;
  if (!dataset) return <p role="status">Đang tải danh mục…</p>;

  return (
    <EmbeddedModel
      key="bodyparts3d-4.0"
      assets={dataset.systems}
      bounds={dataset.bounds}
    />
  );
}
```

Ví dụ loại da/sinh dục khỏi danh sách asset truyền vào để có ngay preset dễ quan sát. Muốn người dùng bật lại các nhóm này, truyền đầy đủ assets và tự quản lý `visible` qua API `ModelViewer`. `EmbeddedModel` là ví dụ tối thiểu, chưa có bộ chọn hệ hoặc panel nội dung.

### Bước 4 — Thay bằng GLB của dự án mới

1. Xuất các nhóm GLB về **cùng hệ trục, đơn vị và gốc tọa độ**; không center từng nhóm riêng.
2. Mỗi mesh có `name` ổn định, duy nhất trên toàn dataset. Giữ normals để MatCap đọc đúng hình khối.
3. Tính bounding box hợp của tất cả nhóm khi lắp: `bounds.min`/`bounds.max` gồm ba tọa độ X/Y/Z. Lấy từ pipeline xuất model hoặc `Box3` sau khi cập nhật world matrices; không dùng bounds minh họa cho dữ liệu thật.
4. Tạo `ModelAsset[]` với `id`, `name`, `url`, `color`; `count` tùy chọn, nhưng `count: 0` sẽ bỏ qua tải nhóm đó.
5. Thay assets/bounds của ví dụ, đổi `key` theo phiên bản dataset để remount và xóa cache model cũ.

```ts
import type { ModelAsset } from "./viewer";

export const productAssets: ModelAsset[] = [
  { id: "housing", name: "Vỏ", url: "/models/housing.glb", color: "#b7bec5" },
  { id: "motor", name: "Động cơ", url: "/models/motor.glb", color: "#d59276" },
];
```

Hai URL trên là ví dụ, cần có file thật. Khi host chạy dưới subpath, resolve URL theo base như ở bước 3; URL bắt đầu bằng `/` luôn trỏ về gốc domain. CDN khác origin cần CORS. Module thay material nguồn bằng MatCap, nên không giữ PBR/texture sản phẩm. Model rig, morph hoặc parent chuyển động độc lập cần adapter riêng.

### Bước 5 — Kết nối UI và state của host

Bắt đầu từ [EmbeddedModel.tsx](src/examples/EmbeddedModel.tsx), rồi thay các nút bằng UI của bạn. Các props bắt buộc được thể hiện đầy đủ trong ví dụ.

| Props | Ý nghĩa và cách dùng |
| --- | --- |
| `assets`, `bounds` | Dataset; giữ reference ổn định bằng state, constant hoặc memo |
| `visible` | Danh sách **ID nhóm** cần hiện/tải; ẩn nhóm không giải phóng cache ngay |
| `selectedMeshes` | `Set<string>` chứa **ID mesh**, không phải ID concept hay ID nhóm |
| `hovered`, `onHover` | Mesh đang hover và callback cập nhật state |
| `onPick` | Trả mesh ID; host tra metadata để mở panel hoặc chọn cả cụm |
| `isolated` | Khi bật, chỉ hiện mesh thuộc selection trong các nhóm đang visible |
| `explode` | Tiến độ từ 0 đến 1; clamp trong viewer |
| `angle`, `zoom` | Góc xoay đích theo radian; zoom dương, ví dụ mặc định 1 |
| `resetKey` | Tăng giá trị để reset controls; host đồng thời đặt lại angle/zoom/explode/selection |
| `retry` | Tăng giá trị để thử tải lại nhóm đang visible bị lỗi |
| `onLoading` | Nhận delta có dấu: `setLoading(n => n + delta)` |
| `onError`, `onMiss` | Hiện lỗi tải; xử lý click vùng trống (`onMiss` tùy chọn) |
| `maxDpr` | Tùy chọn, mặc định 1.5; dùng 1 cho profile tiết kiệm pixel |
| `explodeOptions` | Tùy chỉnh khoảng cách bóc tách, xem bên dưới |

Khi tìm kiếm chọn một mesh trong nhóm ẩn, host cần bật nhóm đó. Viewer không tự biết quan hệ concept/linh kiện. Khi cần thay selection, tạo `Set` mới để React nhận thay đổi.

### Bước 6 — Chọn profile hiển thị và độ tách

Trong thẻ `<ModelViewer ...>` của ví dụ, thêm hoặc sửa:

```tsx
maxDpr={1}
explodeOptions={{
  strength: 1,
  groupSpacing: 0.36,
  pieceSpacing: 0.065,
}}
```

- `strength`: hệ số tổng khoảng cách; tăng từng bước, ví dụ 1 → 1.25, rồi kiểm tra framing.
- `groupSpacing`: khoảng cách nhóm theo tỷ lệ chiều cao model.
- `pieceSpacing`: độ lệch nhỏ theo ID mesh để giảm trùng tâm; đặt 0 nếu muốn bỏ độ lệch này.
- DPR 1 giảm chi phí pixel so với 1.5, nhưng không giảm số tam giác hoặc draw calls.

Độ tách luôn tính từ rest pose và camera tự lùi. Layout không bảo đảm hết giao nhau. Với hướng dẫn tháo lắp máy móc, sửa `explosionOffset` trong `animation.ts` thành hướng/đường di chuyển riêng của từng linh kiện. Anime.js hiện dùng cho tween xoay; slider tách cập nhật trực tiếp theo input.

### Bước 7 — Kiểm tra trong host thật

Chạy host, kiểm tra tải GLB, click đúng ID, đổi dataset, ẩn/hiện, tách về 0, reset sau kéo xoay và unmount/remount. Kiểm tra cả URL production/subpath, mobile layout và lỗi mạng. Container Canvas phải có chiều cao cụ thể; ví dụ đặt 640 px.

Với SSR, chỉ mount viewer ở browser/client; dùng cơ chế client-only của framework và tránh tạo Canvas trên server. Chưa có adapter SSR/iframe hoặc package xuất bản sẵn.

## Embed vào Canvas có sẵn

Không lồng `ModelViewer` bên trong một Canvas. Dùng `ModelScene` và để host quản lý Canvas, camera, DPR, boundary lỗi và click vùng trống:

```tsx
import { Canvas } from "@react-three/fiber";
import { ModelScene, type ModelViewerProps } from "./viewer";

export function ExistingCanvasHost(props: ModelViewerProps) {
  return (
    <div style={{ height: 640 }}>
      <Canvas
        orthographic
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 8], zoom: 230, near: 0.01, far: 100 }}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={props.onMiss}
      >
        <ModelScene {...props} />
      </Canvas>
    </div>
  );
}
```

`ModelScene` có OrbitControls và tự cập nhật camera zoom. Nếu Canvas của host đã có controls hoặc điều khiển camera riêng, cần hợp nhất logic để chỉ có một chủ sở hữu camera. `maxDpr` chỉ có tác dụng với `ModelViewer`; trong ví dụ này dùng prop `dpr` của Canvas. Component scene không tự cài instrumentation profiling.

## Đo lại hiệu năng sau khi fork/embed

### Với fork còn giữ UI anatomy

Terminal thứ nhất:

```bash
npm run build
npm run preview -- --port 4173
```

Terminal thứ hai, PowerShell:

```powershell
$env:PROFILE_URL="http://127.0.0.1:4173"
# Chỉ đặt nếu executable không nằm tại đường dẫn Edge mặc định:
# $env:PLAYWRIGHT_EXECUTABLE_PATH="C:\path\to\chrome.exe"
npm run profile:render
```

Trên shell POSIX:

```bash
PROFILE_URL=http://127.0.0.1:4173 PLAYWRIGHT_EXECUTABLE_PATH=/path/to/chrome npm run profile:render
```

Thay executable bằng đường dẫn thực. Báo cáo ghi vào `docs/render-profile.json`; ảnh ghi vào `docs/screenshots/`. Lệnh ghi đè báo cáo trước đó, nên lưu bản riêng nếu cần so sánh lịch sử. Kết quả null ở GPU timer nghĩa là không có số đo hợp lệ, không phải GPU mất 0 ms.

### Với host UI khác

`profile-render.mjs` đang tìm heading “Hệ cơ quan” và input `#explode`; phải đổi selector, trạng thái chờ tải và các mức tách theo host mới. Chỉ đổi `PROFILE_URL` là chưa đủ.

Nếu dùng `ModelViewer`, mở trang host với `?profile`, đợi model tải xong rồi gọi trong DevTools:

```js
await window.viewerProfile.capture(15); // Làm nóng
const result = await window.viewerProfile.capture(90);
console.log(result);
```

API developer này chỉ có khi bật `?profile`, hiện dành cho một viewer được đo trên trang. Nếu dùng `ModelScene`, host cần mount `RenderMetrics` từ `viewer/metrics` trong Canvas khi muốn đo. Tắt instrumentation sau khi đo; ở chế độ bình thường không có vòng đo liên tục.

Đo ít nhất trạng thái nguyên thể, tách 50%, tách 100%; tiếp tục thử kéo xoay, hover, tải mới và chuyển dataset trên thiết bị đích. GPU render time chỉ là một phần của chi phí; chi tiết cách đọc CPU/GPU, bộ nhớ và độ lệch phép đo ở [PERFORMANCE.md](docs/PERFORMANCE.md).

## Xử lý lỗi khi nhúng

| Hiện tượng | Kiểm tra |
| --- | --- |
| Canvas trống | Container có chiều cao; có WebGL2; console không báo lỗi; assets có count >0 hoặc không khai báo count |
| GLB 404 / lỗi parse HTML | URL/base path; server có đang trả index.html thay cho GLB không |
| CDN không tải | CORS và quyền truy cập URL; thử URL trực tiếp |
| Mô hình lệch / tách sai | Bounds, đơn vị, gốc tọa độ và parent transform; không center từng nhóm riêng |
| Click mở sai nội dung | Mesh name trùng; host đang nhầm mesh ID với group/concept ID |
| Đổi dataset vẫn thấy model cũ | Đổi React `key`; cache theo asset ID sống đến khi unmount |
| Controls giật hoặc zoom bị ghi đè | Hai controls/camera controller cùng hoạt động trong một Canvas |
| Máy yếu vẫn chậm ở DPR 1 | Chi phí geometry/draw calls/picking; giảm asset đang tải/hiện và tối ưu model, không chỉ giảm pixel |

Tài liệu bổ sung: [API/module boundaries](docs/EMBEDDING.md), [ví dụ host](src/examples/EmbeddedModel.tsx), [viewer exports](src/viewer/index.ts).

![Bóc tách ở mức 100%](docs/screenshots/explode-1-1.png)

## Tiến độ

Xem [đánh giá P0–P8](docs/PROJECT_STATUS.md) và [execution plan](EXECUTION_PLAN.md). Ưu tiên tiếp theo:

1. Mở rộng benchmark sang GPU tích hợp/mobile, tối ưu draw calls/picking và tải đầu; chưa đạt ngân sách tải đầu ≤8 MB.
2. Hoàn thiện chọn một phần hệ, focus cấu trúc, tìm kiếm bàn phím, lỗi/context loss.
3. Biên soạn pilot 20–30 cấu trúc có nguồn và duyệt chuyên môn.
4. Nghiệm thu accessibility, hiệu năng và deployment static.

## API

Các export công khai nằm trong [src/viewer/index.ts](src/viewer/index.ts):

| Export | Trách nhiệm |
| --- | --- |
| `ModelViewer(props: ModelViewerProps)` | Component có Canvas, loader, camera, controls và lựa chọn mesh |
| `ModelScene(props: ModelViewerProps)` | Nội dung scene để đặt trong Canvas do host sở hữu |
| `animateRotation(rotation, angle, invalidate)` | Tween góc xoay, trả hàm dừng animation |
| `explosionOffset(midpoint, center, height, meshId, groupIndex, groupCount, options?)` | Tính vector tách từ rest pose |
| `ModelViewerProps`, `ModelAsset`, `ModelBounds`, `ExplodeOptions` | TypeScript types cho host và dữ liệu |

Chi tiết props/callback nằm trong phần embed và [tài liệu API/module](docs/EMBEDDING.md). Viewer yêu cầu browser/WebGL; chưa có npm package, iframe SDK hoặc adapter SSR sẵn.

## Đóng góp

Có thể gửi PR đề xuất sửa lỗi, cải thiện tài liệu hoặc hiệu năng. PR cần được người quản lý repository rà soát trước khi hợp nhất.

- Khi repository được đưa lên GitHub, dùng mục **Issues** của repository đó để đặt câu hỏi, báo lỗi hoặc thảo luận thay đổi lớn. Hiện workspace chưa khai báo URL repository/liên hệ maintainer nên README không gắn đường dẫn giả.
- Mô tả cách tái hiện, hành vi mong đợi và phạm vi thay đổi. Thay đổi viewer nên kèm ảnh hoặc số đo liên quan.
- Chạy `npm run lint` và `npm run build`; nếu thay pipeline/dataset, chạy thêm `npm run data:validate` với đúng tiêu chí dataset.
- Nội dung giải phẫu và bản dịch cần nguồn và trạng thái duyệt rõ ràng; không trình bày nội dung chưa duyệt như dữ kiện đã xác nhận.
- Giữ attribution của dữ liệu; không đưa cache, nguồn tải dở hoặc dependency cục bộ vào PR.

README sử dụng cấu trúc của [Standard Readme](https://github.com/RichardLitt/standard-readme/blob/main/spec.md). Chưa có quy trình Contributor License Agreement hoặc yêu cầu ký commit được công bố trong repository.

## Giấy phép

**Mã ứng dụng: UNLICENSED.** Chưa công bố giấy phép mã nguồn hoặc danh tính chủ sở hữu quyền tác giả. Quyền đối với từng phần mã thuộc chủ thể nắm quyền tương ứng; cần chủ dự án xác nhận thông tin này trước khi công bố giấy phép. README không tự cấp quyền sử dụng lại mã.

**Dữ liệu BodyParts3D: CC-BY-4.0 — Creative Commons Attribution 4.0 International.** Chủ thể ghi công: © The Database Center for Life Science (DBCLS). Giữ attribution trong [NOTICE](public/anatomy/NOTICE.txt); xem [giấy phép nguồn](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) và [nội dung CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

OBJ cũ có comment giấy phép lịch sử; snapshot license hiện hành được pin cùng nguồn. Các thay đổi dữ liệu gồm đổi trục, OBJ → GLB, phân nhóm, nén meshopt và thêm tên dịch nháp. Giấy phép dataset không tự áp dụng cho mã ứng dụng hoặc asset thay thế trong dự án fork.
