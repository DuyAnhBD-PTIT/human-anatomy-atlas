# Fork và nhúng viewer

`src/viewer/` là module độc lập với catalog giải phẫu, UI tìm kiếm và CSS của ứng dụng. API được export từ `src/viewer/index.ts`. Ví dụ host đầy đủ: `src/examples/EmbeddedModel.tsx`.

Viewer cần browser/WebGL. Với framework SSR, mount component phía client (ví dụ dynamic import tắt SSR); không tạo Canvas trên server.

## Nhúng vào React

1. Copy `src/viewer/` và ví dụ host vào dự án React/TypeScript.
2. Cài các dependency cùng major với dự án: React 19, Three.js 0.180, React Three Fiber 9, Drei 10, Anime.js 4; type Three.js tương ứng.
3. Cấp URL GLB, màu, ID nhóm và bounds toàn bộ model. URL tuyệt đối hoặc URL resolve theo host; CDN khác origin cần CORS. Viewer không import anatomy catalog.
4. Cho container chiều cao cụ thể. Host sở hữu state chọn, hover, tách, góc xoay và nội dung panel.

```tsx
import { EmbeddedModel } from './examples/EmbeddedModel';

<EmbeddedModel
  assets={[
    { id: 'housing', name: 'Housing', url: '/models/housing.glb', color: '#b7bec5' },
    { id: 'motor', name: 'Motor', url: '/models/motor.glb', color: '#d59276' },
  ]}
  bounds={{ min: [-1, -1, -1], max: [1, 1, 1] }}
/>
```

Bounds trên chỉ minh họa; phải thay bằng bounds thực của model. Thay dataset thì dùng `key={datasetVersion}` để remount viewer và xóa cache cũ. Giữ identity `assets`/`bounds` ổn định để tránh tính lại không cần thiết.

Nếu đã có R3F Canvas, dùng `ModelScene` thay `ModelViewer`; host chịu trách nhiệm camera trực giao, demand rendering và DPR. `ModelViewer` mặc định DPR tối đa 1.5, camera trực giao, antialias và nền trong suốt.

## Hợp đồng model

- Các GLB cùng hệ trục, đơn vị và điểm gốc; không center từng linh kiện riêng.
- `mesh.name` phải có ID ổn định, duy nhất trên toàn dataset. Callback trả mesh ID, host tự ánh xạ nội dung.
- Geometry tĩnh; hỗ trợ parent transforms tĩnh. Không dành cho rig/skeleton animation, morph animation hoặc parent chuyển động độc lập.
- Viewer thay material nguồn bằng MatCap: model cần position/normal đúng. Không giữ texture sản phẩm/PBR gốc.
- `bounds` bao phủ toàn bộ model khi lắp; giới hạn near/far hiện dành cho model được chuẩn hóa về chiều cao 2.7 đơn vị.
- `visible` là ID nhóm; `selectedMeshes` là tập mesh ID. `onLoading` là delta có dấu; `retry` tăng để thử lại request thất bại.

## Tùy chỉnh animation

`animation.ts` độc lập React:

- `animateRotation(rotation, angle, invalidate)` trả hàm dừng tween. Đơn vị góc radian; host dừng animation cũ khi đổi đích. Tôn trọng reduced-motion.
- `explosionOffset(...)` trả vector tách tại mức 100%. Vị trí luôn tính từ rest pose, không cộng dồn qua frame.
- `strength`: nhân khoảng cách tổng; `groupSpacing`: phân nhóm theo vòng tròn; `pieceSpacing`: độ lệch nhỏ, xác định từ ID để giảm trùng tâm. Mặc định 1 / 0.36 / 0.065.
- Slider hiện cập nhật trực tiếp theo tay người dùng; chưa tween tiến độ tách. Để chạy trình diễn, animate một object `{ progress: 0 }` rồi áp dụng progress trong scene và invalidate.
- Layout tách là minh họa, không bảo đảm không giao nhau và không phải trình tự tháo lắp vật lý. Với máy móc, thay `explosionOffset` bằng hướng/đường di chuyển được biên tập cho từng linh kiện.

## Ranh giới module

| File | Trách nhiệm |
| --- | --- |
| `types.ts` | API input/output, tùy chọn embedding |
| `useModelAssets.ts` | GLB/meshopt, cache, rest pose, tài nguyên GPU |
| `materials.ts` | Texture MatCap dùng chung |
| `animation.ts` | Rotation tween, toán học bóc tách |
| `ModelViewer.tsx` | Canvas/camera, selection, visibility và kết nối các module |
| `metrics.tsx` | Đo render theo opt-in `?profile`; không có vòng đo khi dùng bình thường |

Nhúng ngoài React: có thể dùng lại `animation.ts` và `materials.ts` với Three.js thuần; loader/camera/picking cần adapter riêng. Module hiện là source code tái sử dụng, chưa đóng gói npm hoặc iframe SDK.
