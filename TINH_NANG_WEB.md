# Tổng quan tính năng KTSHOP

Cập nhật: 01/10/2026

KTSHOP là website bán laptop gồm frontend Next.js, backend Express và cơ sở dữ liệu MySQL. Tài liệu này mô tả các luồng đã có trong mã nguồn hiện tại và ghi riêng những phần chưa hoàn chỉnh.

## Chạy dự án

Cần Node.js, npm và MySQL. Cấu hình kết nối database trong `backend/.env` bằng các biến `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` và cấu hình `JWT_SECRET`.

Khởi tạo hoặc cập nhật schema hiện có:

```powershell
cd backend
node migrate.js
```

Chạy backend:

```powershell
cd backend
npm run dev
```

Chạy frontend trong terminal khác:

```powershell
cd frontend
npm run dev
```

Mặc định frontend chạy tại `http://localhost:3000`, backend tại `http://localhost:5000`.

### Tài khoản 

- Đăng nhập: "atv@shoplaptop.vn" / "password" - qtv (có thể quản lý tất cả)
- Đăng nhập: "nhanvien@shoplaptop.vn" / "12345678" - nhân_viên (chỉ xem sản phẩm & đơn hàng, không chỉnh sửa)
- Đăng nhập: "an.nguyen@gmail.com" / "12345678" - khách_hàng (chỉ xem, không mua hàng)

### Gửi email

Đăng ký, xác minh email và quên mật khẩu cần SMTP. Cấu hình `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` và tùy chọn `SMTP_FROM` trong `backend/.env`, sau đó khởi động lại backend. Xem [hướng dẫn SMTP](backend/SMTP_SETUP.md). Với Gmail, dùng App Password; không dùng mật khẩu Google thông thường.

## Chức năng khách hàng

### Trang chủ và danh mục

- Trang chủ hiển thị banner, thương hiệu và nhóm sản phẩm.
- Danh sách sản phẩm hỗ trợ lọc theo thương hiệu, CPU, RAM, ổ cứng, màu sắc và khoảng giá; có phân trang.
- Trang chi tiết sản phẩm hiển thị hình ảnh, giá/giảm giá, tình trạng tồn kho, thông số và mô tả.
- Sản phẩm ngừng kinh doanh không xuất hiện trên trang chi tiết công khai.

### Build PC & Cấu hình máy (`/build-pc`)

- Công cụ tự chọn cấu hình linh kiện PC/Laptop trực quan (CPU, Mainboard, RAM, VGA, SSD, Nguồn, Case, Tản nhiệt, Màn hình).
- Tự động cộng tổng chi phí và ước tính công suất tiêu thụ điện (Wattage) kèm đề xuất công suất nguồn PSU.
- Hỗ trợ đổi/xóa linh kiện, làm mới cấu hình, sao chép cấu hình dạng text, in báo giá / xuất PDF chuyên nghiệp và nút thêm toàn bộ vào giỏ hàng.

### Flash Sale Săn Deal Giờ Vàng (`/flash-sale`)

- Đồng hồ đếm ngược (Countdown timer) thời gian thực theo từng khung giờ vàng.
- Các tab khung giờ (Đang diễn ra, 12:00, 18:00, Ngày mai) và bộ lọc theo hãng (Apple, Asus, Dell, HP, Lenovo...).
- Thẻ sản phẩm hiển thị huy hiệu giảm sốc (-15%, -20%, -35%), giá gạch ngang và thanh tiến độ số lượng máy đã bán.

### Bảo hành & Tra cứu Serial/IMEI (`/bao-hanh`)

- Tra cứu thời hạn bảo hành trực tuyến theo Mã đơn hàng, Số điện thoại hoặc Số Serial/IMEI.
- Hiển thị huy hiệu còn hạn/hết hạn, ngày kích hoạt, ngày hết hạn và số ngày bảo hành còn lại.
- Bảng chính sách bảo hành 1 đổi 1 30 ngày, vệ sinh máy trọn đời và danh sách hệ thống trung tâm bảo hành KTSHOP toàn quốc.

### Tra cứu tiến độ đơn hàng (`/tra-cuu-don`)

- Tra cứu công khai lộ trình vận chuyển theo Mã đơn hàng hoặc Số điện thoại (không yêu cầu đăng nhập).
- Visual Timeline 4 bước trực quan: Đã nhận đơn -> Đang đóng gói -> Đang vận chuyển -> Giao thành công.
- Hiển thị danh sách sản phẩm, số lượng, địa chỉ giao hàng và tổng tiền thanh toán.

### Liên hệ & Showroom (`/lien-he`)

- Form gửi yêu cầu tư vấn/góp ý trực tuyến kèm thông báo gửi thành công.
- Thông tin địa chỉ showroom, hotline bán hàng, giờ mở cửa và bản đồ Google Maps tương tác.


### Giỏ hàng và đặt hàng

- Khách chưa đăng nhập lưu giỏ hàng trên trình duyệt; khách đã đăng nhập lưu giỏ hàng trong database.
- Có thể tăng/giảm số lượng và xóa sản phẩm trong giỏ.
- Checkout nhập thông tin nhận hàng, phí vận chuyển và phương thức thanh toán; tài khoản đã đăng nhập được tự điền thông tin hồ sơ.
- Máy chủ tính lại giá từ database, tạo mã đơn và lưu đơn cùng các dòng sản phẩm.
- Thanh toán bằng số dư KTSHOP có kiểm tra số dư và trừ tiền. Các phương thức MoMo/thẻ hiện chỉ lưu lựa chọn thanh toán, chưa chuyển sang cổng thanh toán thực.

### Tài khoản

- Đăng ký gồm nhập thông tin, nhận mã xác minh email 6 chữ số và xác nhận mã trước khi đăng nhập.
- Mã xác minh hết hạn sau 10 phút, giới hạn 5 lần nhập sai và chỉ dùng một lần; có giới hạn gửi lại.
- Đăng nhập, làm mới phiên và đăng xuất; mật khẩu được lưu dạng bcrypt hash.
- Quên mật khẩu gửi mã tới email, cho phép đặt mật khẩu mới và thu hồi phiên cũ.
- Trang cá nhân sửa họ tên, số điện thoại, địa chỉ; hiển thị nhắc xác minh email cho khách chưa xác minh và cho nhập mã ngay trên trang.
- Lưu tùy chọn phương thức thanh toán và giao diện sáng/tối.

## Chức năng quản trị

### Tổng quan hệ thống

Dashboard lấy dữ liệu từ database, không dùng số mẫu:

- Doanh thu tháng tính từ đơn đã thanh toán, không tính đơn hủy/trả.
- Số đơn trong tháng, so sánh với tháng trước.
- Số sản phẩm đang kinh doanh và số sản phẩm có tồn kho không quá 3.
- Tổng khách hàng hoạt động và khách mới trong tháng.
- Năm đơn hàng gần nhất, trạng thái và sản phẩm trong đơn.

### Sản phẩm và kho

- Xem/tìm kiếm danh sách sản phẩm, thương hiệu, giá, tồn kho và trạng thái.
- Trang chi tiết admin hiển thị gallery và thông số sản phẩm.
- Có thể sửa tên, thương hiệu, giá bán/giá gốc, cấu hình, mô tả, số lượng tồn và trạng thái kinh doanh.
- API quản trị yêu cầu đăng nhập và quyền `products`.

### Đơn hàng

- Tìm kiếm theo mã đơn, người nhận, số điện thoại; lọc theo trạng thái.
- Tạo đơn, xem/sửa thông tin khách nhận, sản phẩm, số lượng, phí vận chuyển, thanh toán và trạng thái.
- Giá từng sản phẩm và tổng đơn được máy chủ tính lại từ database; thao tác tạo/sửa dùng transaction.
- Cập nhật trạng thái giao nhận trực tiếp trên danh sách.
- Xóa đơn chưa thanh toán; không cho xóa đơn đã thanh toán.
- API quản trị yêu cầu quyền `orders`.

### Tài khoản và phân quyền

- Xem danh sách trong phạm vi được quản lý; tạo tài khoản và sửa tên, mật khẩu, vai trò, quyền.
- `qtv`: quản lý tất cả vai trò, gán role `admin`/`qtv` và cấp quyền riêng.
- `admin`: quản lý tài khoản thuộc các role thấp hơn; không thể nâng lên `admin` hoặc `qtv`, không cấp quyền riêng.
- `nhan_su`: quản lý tài khoản dưới `admin`; không thể nâng role lên `admin`/`qtv`.
- `nhan_vien_kho`: quyền mặc định sản phẩm và đơn hàng.
- Role và quyền được kiểm tra ở backend theo dữ liệu hiện hành trong database, không chỉ dựa vào menu frontend.

## API chính

| Nhóm | Endpoint | Mục đích |
|---|---|---|
| Trang chủ | `GET /api/home` | Thương hiệu và sản phẩm trang chủ |
| Sản phẩm công khai | `GET /api/san-pham`, `GET /api/san-pham/filters`, `GET /api/san-pham/:id` | Danh sách, bộ lọc, chi tiết |
| Đăng ký | `POST /api/auth/register`, `/api/auth/register/resend`, `/api/auth/register/confirm` | Tạo tài khoản và xác minh email |
| Phiên đăng nhập | `POST /api/auth/login`, `/api/auth/refresh`, `/api/auth/logout` | Đăng nhập, gia hạn, đăng xuất |
| Quên mật khẩu | `POST /api/auth/password-reset/request`, `/api/auth/password-reset/confirm` | Gửi mã và đặt lại mật khẩu |
| Hồ sơ/xác minh | `GET /api/auth/me`, `PUT /api/auth/me`, `POST /api/auth/email-verification/request`, `/api/auth/email-verification/confirm` | Hồ sơ và xác minh email |
| Giỏ hàng/checkout | `GET /api/cart`, `POST /api/cart/sync`, `POST /api/cart/update`, `POST /api/order/checkout` | Đồng bộ giỏ và đặt hàng |
| Đơn hàng cá nhân | `GET /api/orders/my-orders`, `GET /api/orders/my-orders/:id`, `PUT /api/orders/my-orders/:id/cancel` | Lịch sử mua hàng, chi tiết đơn và tự hủy đơn |
| Admin tổng quan | `GET /api/admin/tong-quan` | Thống kê và đơn gần đây |
| Admin sản phẩm | `GET /api/admin/san-pham`, `GET /api/admin/san-pham/:id`, `PUT /api/admin/san-pham/:id` | Danh sách, chi tiết, cập nhật sản phẩm |
| Admin đơn hàng | `GET/POST /api/admin/don-hang`, `GET/PUT/DELETE /api/admin/don-hang/:id`, `PUT /api/admin/don-hang/:id/status` | CRUD và đổi trạng thái đơn |
| Admin tài khoản | `POST /api/admin/view`, `POST /api/admin`, `POST /api/admin/:id/edit` | Danh sách, tạo, sửa tài khoản |

Các API quản trị cần Bearer access token và quyền tương ứng.

## Phần chưa hoàn chỉnh

- Chưa có chức năng tạo hoặc xóa sản phẩm; admin hiện sửa được sản phẩm đã có.
- MoMo, VNPay/thẻ và nạp số dư chưa tích hợp xử lý giao dịch trực tuyến; checkout hiện chỉ ghi nhận phương thức, ngoại trừ thanh toán bằng số dư.
- Nút đăng nhập Google/Facebook hiện là giao diện, chưa kết nối OAuth.
- Đã hoàn thiện hệ thống upload file ảnh cho sản phẩm và ảnh đại diện (lưu vật lý tại backend/uploads và phục vụ tĩnh).
- Đã hoàn thành mục Lịch sử mua hàng trong trang cá nhân: lọc trạng thái, tìm kiếm, xem chi tiết và hủy đơn (kèm hoàn tiền ví tự động).
- Đã hoàn thành hệ thống giao diện xử lý lỗi toàn diện: trang `not-found.jsx` (404), `error.jsx` (500), `global-error.jsx`, trang chuyên biệt `/loi` hỗ trợ xem và tương tác với toàn bộ các mã lỗi (400, 401, 403, 404, 409, 422, 429, 500, 502, 503, NET), cùng toast thông báo lỗi có nút thao tác nhanh.
