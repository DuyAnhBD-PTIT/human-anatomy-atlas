# Kiểm kê BodyParts3D 4.0 — 2026-09-22

## Kết quả đã xác minh

| Archive chính thức | File OBJ | ID mesh riêng biệt |
|---|---:|---:|
| isa_BP3D_4.0_obj_99.zip | 2.234 | 2.234 |
| partof_BP3D_4.0_obj_99.zip | 1.258 | 1.258 |

- Toàn bộ 1.258 ID PART-OF nằm trong tập IS-A; hợp hai tập vẫn là 2.234 ID.
- Bảng isa_element_parts.txt chứa 29.549 dòng dữ liệu, tham chiếu 2.234 ID mesh riêng biệt.
- Số ID mesh tham chiếu nhưng thiếu trong archive IS-A: 0. Số ID archive ngoài tập tham chiếu: 0.
- Tất cả file OBJ trong mục lục hai archive có kích thước giải nén lớn hơn 0.
- Metadata nguồn ghi tên tiếng Anh; tên Việt/Latin cần bảng đối chiếu được biên tập riêng, không suy ra từ trường en.

## Phương pháp và giới hạn

Tải các bảng metadata chính thức. Dùng HTTP Range đọc 524.288 byte cuối mỗi ZIP, giải End Of Central Directory và duyệt đủ các central-directory entries, lọc đuôi .obj, đối chiếu ID từ tên file với metadata. Không suy số mesh từ dung lượng archive hoặc số concept.

Kết quả chi tiết, tên từng mesh, kích thước và CRC khai báo nằm ở data/source/bodyparts3d-4.0/zip-index-audit.json. Có thể tái lập bằng scripts/anatomy/check_zip_index.py.

Cập nhật 2026-09-23: IS-A đã tải đầy đủ, SHA-256 được pin trong data/source-manifest.json và CRC mọi entry đạt. fetch_source.py thay thế các script tải cũ; file tải dở đã xóa. Kiểm tra integrity không thay thế thẩm định chất lượng giải phẫu.

## Nguồn

- https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html
- https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip
- https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_BP3D_4.0_obj_99.zip
