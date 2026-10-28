# Giải thích logic `server.js`

Tài liệu này chia [server.js](./server.js) thành các khối để dễ đọc và tra cứu. Số dòng bên dưới tương ứng với phiên bản hiện tại của file; nếu file được sửa, vị trí có thể thay đổi.

## 1. Bản đồ nhanh

| Vị trí | Khối logic | Chịu trách nhiệm |
|---|---|---|
| 1–23 | Khởi tạo ứng dụng | Nạp thư viện, cấu hình kết nối và middleware chung |
| 26–184 | API công khai | Kiểm tra server, trang chủ, bộ lọc, danh sách và chi tiết sản phẩm |
| 186–228 | Dịch vụ mã email | Gửi mã xác minh/đặt lại mật khẩu, lưu mã đã băm, giới hạn gửi |
| 230–336 | Đăng ký | Tạo tài khoản và xác minh email bằng mã |
| 338–447 | Đăng nhập, phiên | Đăng nhập, cấp token, làm mới và thu hồi phiên |
| 448–474 | Middleware xác thực | Kiểm tra JWT và trạng thái phiên trong database |
| 476–527 | Quyền quản trị | Quy tắc role, quyền chức năng và middleware kiểm tra quyền |
| 529–595 | Tổng quan admin | Thống kê doanh thu, đơn hàng, tồn kho, khách hàng |
| 597–719 | Quản lý sản phẩm admin | Tìm, xem chi tiết và cập nhật sản phẩm |
| 721–954 | Quản lý đơn admin | Danh sách, chi tiết, tạo, sửa, xóa, đổi trạng thái đơn |
| 956–1037 | Quản lý tài khoản admin | Xem, tạo, sửa tài khoản và phân vai trò |
| 1039–1124 | Xác minh email, hồ sơ | Xác minh email sau đăng nhập và đọc/sửa hồ sơ |
| 1125–1200 | Đặt lại mật khẩu | Gửi mã quên mật khẩu và đổi mật khẩu |
| 1202–1278 | Giỏ hàng | Đọc, đồng bộ và cập nhật giỏ hàng database |
| 1280–1381 | Checkout | Tính tiền, tạo đơn, ghi chi tiết đơn và xóa giỏ |
| 1383–1386 | Khởi động | Mở HTTP server trên cổng đã cấu hình |

## 2. Khởi tạo ứng dụng và middleware chung (dòng 1–23)

- Nạp Express để tạo API; CORS để cho phép frontend ở `localhost:3000` và `127.0.0.1:3000` gọi backend.
- `express.json()` và `express.urlencoded()` giúp đọc dữ liệu gửi lên trong JSON/form.
- Nạp `.env`, lấy kết nối MySQL từ `./config/db`, và chọn cổng từ `PORT` (mặc định `5000`).
- Các thư viện `bcryptjs`, `jsonwebtoken`, `crypto`, `nodemailer` được dùng lần lượt cho băm mật khẩu/mã, JWT, tạo mã ngẫu nhiên và gửi email.

## 3. API công khai cho cửa hàng (dòng 26–184)

### Kiểm tra server — `GET /`

Trả về thông báo server đang chạy, phiên bản và tên database. Đây là endpoint kiểm tra nhanh, không truy vấn sản phẩm.

### Dữ liệu trang chủ — `GET /api/home`

1. Lấy các thương hiệu đang hoạt động (`nhan_Hieu.trang_thai = 1`).
2. Với mỗi thương hiệu, lấy tối đa 5 laptop đang kinh doanh và ảnh chính.
3. Ghép danh sách sản phẩm vào từng thương hiệu rồi trả về trong `data`.

### Các lựa chọn lọc — `GET /api/san-pham/filters`

Trả các thương hiệu, CPU, RAM, ổ cứng, màu sắc đang có và khoảng giá thấp nhất/cao nhất. Frontend có thể dùng kết quả này để dựng bộ lọc.

### Chi tiết sản phẩm — `GET /api/san-pham/:id`

- Kiểm tra mã sản phẩm là số nguyên dương; tìm sản phẩm đang kinh doanh.
- Nếu có, lấy toàn bộ ảnh theo thứ tự ảnh chính/thứ tự hiển thị, tăng `luot_xem`, rồi trả chi tiết.
- Mã sai trả `400`; không tồn tại hoặc đã ngừng kinh doanh trả `404`.

### Danh sách sản phẩm — `GET /api/san-pham`

- Nhận bộ lọc `brand`, `cpu`, `ram`, `o_cung`, `mau_sac`, `gia_min`, `gia_max`, cùng `page` và `limit`.
- Tạo điều kiện SQL chỉ từ các bộ lọc được gửi lên; giá trị lọc được truyền riêng qua tham số truy vấn.
- Chạy truy vấn đếm tổng số kết quả, sau đó lấy trang hiện tại, ghép thương hiệu/ảnh chính và sắp xếp mới nhất trước.
- Trả danh sách cùng `pagination` gồm tổng số kết quả, trang, giới hạn và tổng số trang.

## 4. Mã xác thực qua email (dòng 186–228)

- `smtpTransport` chỉ được tạo khi có đủ `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`; nếu thiếu thì các luồng cần gửi email báo chưa cấu hình.
- `sendAuthCode(email, code, purpose)` gửi nội dung khác nhau tùy mã dùng xác minh email hay đặt lại mật khẩu.
- `createAuthCode(userId, email, purpose)` là hàm dùng chung:
  1. Nếu cùng loại mã đã được tạo trong 60 giây gần nhất thì báo giới hạn gửi.
  2. Sinh mã 6 chữ số ngẫu nhiên và lưu **bản băm** của mã trong database.
  3. Đánh dấu mã cũ chưa dùng là đã dùng; mã mới hết hạn sau 10 phút.
  4. Gửi email; nếu gửi thất bại thì vô hiệu hóa mã vừa tạo rồi báo lỗi.

## 5. Đăng ký và xác minh ban đầu (dòng 230–336)

- `POST /api/auth/register`: kiểm tra họ tên, định dạng email, mật khẩu tối thiểu 8 ký tự và SMTP. Email đã xác minh bị từ chối; email chưa xác minh có thể tiếp tục luồng xác minh. Tài khoản mới lưu mật khẩu dạng bcrypt hash, sau đó yêu cầu gửi mã.
- `POST /api/auth/register/resend`: gửi lại mã cho tài khoản đang hoạt động nhưng chưa xác minh; phản hồi không tiết lộ rõ email có đăng ký hay không. Mã gửi lại bị giới hạn một lần mỗi 60 giây.
- `POST /api/auth/register/confirm`: kiểm tra email/mã 6 chữ số, mở transaction và khóa bản ghi liên quan (`FOR UPDATE`). Mã phải chưa dùng, chưa hết hạn, nhập sai tối đa 5 lần. Đúng mã thì đánh dấu email đã xác minh và vô hiệu hóa các mã xác minh còn mở.

## 6. Đăng nhập và quản lý phiên (dòng 338–474)

### Đăng nhập — `POST /api/auth/login`

1. Tìm tài khoản theo email; từ chối tài khoản có bản ghi blacklist.
2. So sánh mật khẩu nhập vào với hash đã lưu bằng bcrypt.
3. Với khách hàng được yêu cầu xác minh email, chặn đăng nhập nếu email chưa xác minh.
4. Tạo access token (1 giờ) và refresh token (7 ngày); database chỉ lưu hash của refresh token.
5. Thu hồi phiên cũ của tài khoản rồi lưu phiên/token mới trong `jsontoken`.

### Làm mới access token — `POST /api/auth/refresh`

Kiểm tra refresh token, tìm phiên còn hiệu lực trong database và so sánh token với hash đã lưu. Nếu hợp lệ thì tạo access token mới và cập nhật phiên; refresh token vẫn là token hiện tại.

### Đăng xuất — `POST /api/auth/logout`

Đánh dấu các phiên của `user_id` gửi lên là đã thu hồi (`revoke = 1`).

### Xác thực request — `authenticateToken`

Middleware đọc bearer token trong header `Authorization`, xác minh chữ ký/hạn JWT, rồi đối chiếu token với phiên trong database. Phiên phải chưa bị blacklist/revoke và tài khoản phải đang hoạt động. Khi qua kiểm tra, payload JWT được gắn vào `req.user` để route tiếp theo dùng.

## 7. Vai trò và quyền quản trị (dòng 476–527)

- Các role quản trị gồm `qtv`, `admin`, `nhan_su`, `nhan_vien_kho`, `nhan_vien`; `ROLE_RANK` dùng để hạn chế role nào có thể quản lý/gán role nào.
- `DEFAULT_PERMISSIONS` định nghĩa quyền mặc định theo role: `products`, `orders`, `accounts`.
- `parsePermissions` đọc quyền từ JSON/string, loại quyền không được hỗ trợ và bỏ trùng; nếu dữ liệu không phải danh sách thì dùng quyền mặc định của role.
- `loadAdminActor` tải role/quyền hiện tại từ database, chỉ cho các role quản trị đang hoạt động đi tiếp, rồi gắn thông tin vào `req.adminActor`.
- `canManageRole` xác định actor được sửa/quản lý tài khoản thuộc role nào; `canAssignRole` kiểm tra role có thể gán.
- `accountManagementAccess` là chuỗi middleware xác thực đăng nhập trước, kiểm tra role quản trị sau.
- `requireAdminPermission(permission)` kiểm tra actor có quyền cụ thể trước khi chạy endpoint.

**Lưu ý khi đọc route:** các route sản phẩm admin gọi thêm `requireAdminPermission('products')`; route đơn hàng gọi `requireAdminPermission('orders')`. Route dashboard và các route tài khoản chỉ gắn `accountManagementAccess`; route tài khoản còn kiểm soát bằng `canManageRole`/`canAssignRole`.

## 8. Dashboard và quản trị sản phẩm (dòng 529–719)

### Dashboard — `GET /api/admin/tong-quan`

Tổng hợp số liệu từ database: doanh thu tháng này/tháng trước (chỉ đơn đã thanh toán, không tính đơn hủy/trả), số đơn, sản phẩm đang hoạt động, sản phẩm tồn kho không quá 3, khách hàng hoạt động/mới và 5 đơn gần nhất.

### Sản phẩm admin

- `GET /api/admin/san-pham`: tìm theo tên laptop/thương hiệu, giới hạn số kết quả tối đa 200, trả các thông tin phục vụ danh sách quản trị.
- `GET /api/admin/san-pham/options`: trả danh sách thương hiệu đang hoạt động để dùng trong form.
- `GET /api/admin/san-pham/:id`: kiểm tra ID, tải thông tin và gallery ảnh của sản phẩm.
- `PUT /api/admin/san-pham/:id`: xác thực các trường chính (thương hiệu, tên, giá, tồn kho, bảo hành, trạng thái), kiểm tra thương hiệu tồn tại, rồi cập nhật thông số/mô tả/trạng thái. Phần này cập nhật sản phẩm có sẵn; không tạo sản phẩm mới.

## 9. Quản trị đơn hàng (dòng 721–954)

- `GET /api/admin/don-hang`: tìm theo mã đơn, người nhận hoặc điện thoại; có thể lọc trạng thái và giới hạn số kết quả.
- `GET /api/admin/don-hang/options`: trả khách hàng đang hoạt động và sản phẩm đang kinh doanh cho form đơn hàng.
- `GET /api/admin/don-hang/:id`: trả thông tin đơn cùng các dòng sản phẩm.
- `prepareOrderItems(connection, items)`: dùng chung khi admin tạo/sửa đơn. Chỉ nhận 1–50 mặt hàng, kiểm tra ID/số lượng, gộp các dòng trùng sản phẩm và lấy tên/giá hiện tại từ database để tính thành tiền.
- `POST /api/admin/don-hang`: kiểm tra khách nhận, phí và các giá trị trạng thái/phương thức thanh toán; transaction tạo đơn và các dòng chi tiết. Mã đơn được sinh ở server.
- `PUT /api/admin/don-hang/:id`: khóa đơn trong transaction, kiểm tra khách hàng và sản phẩm, tính lại tổng tiền từ giá database, cập nhật thông tin đơn và thay toàn bộ dòng chi tiết.
- `DELETE /api/admin/don-hang/:id`: chỉ xóa nếu đơn chưa thanh toán; đơn đã thanh toán trả lỗi xung đột để tránh xóa nhầm giao dịch.
- `PUT /api/admin/don-hang/:id/status`: chỉ cho phép các trạng thái đã định nghĩa rồi cập nhật trạng thái đơn.

## 10. Quản trị tài khoản (dòng 956–1037)

- `POST /api/admin/view`: tải tài khoản, lọc kết quả theo role mà actor được phép quản lý, chuẩn hóa quyền trước khi trả về.
- `POST /api/admin`: kiểm tra tên/email/mật khẩu, quyền gán role và email trùng; băm mật khẩu trước khi lưu. `qtv` có thể truyền quyền riêng; các role quản trị khác nhận quyền mặc định tương ứng.
- `POST /api/admin/:id/edit`: kiểm tra ID/tên/mật khẩu, tải role hiện tại, ngăn sửa chính tài khoản đang đăng nhập, kiểm tra quyền quản lý role cũ và gán role mới. Mật khẩu chỉ được thay khi request có gửi mật khẩu mới.

## 11. Hồ sơ và xác minh email sau đăng nhập (dòng 1039–1124)

- `POST /api/auth/email-verification/request`: cần access token hợp lệ; nếu email chưa xác minh thì gửi mã theo cơ chế giới hạn 60 giây.
- `POST /api/auth/email-verification/confirm`: cần đăng nhập; kiểm tra mã trong transaction, giới hạn 5 lần sai, xác minh email và vô hiệu hóa mã còn mở.
- `GET /api/auth/me`: trả hồ sơ của người dùng theo token, bao gồm role/quyền đã chuẩn hóa.
- `PUT /api/auth/me`: yêu cầu họ tên, số điện thoại và địa chỉ không rỗng; cập nhật rồi trả lại hồ sơ mới.

## 12. Đặt lại mật khẩu (dòng 1125–1200)

- `POST /api/auth/password-reset/request`: kiểm tra email trong bảng `users`. Nếu không tìm thấy, trả về 404 "Không tìm thấy email này trong hệ thống tài khoản.". Nếu tài khoản bị khóa, trả về 403. Nếu hợp lệ và SMTP sẵn sàng, tạo mã xác nhận 6 số và gửi vào email của người dùng.
- `POST /api/auth/password-reset/confirm`: kiểm tra email, mã 6 số và mật khẩu mới tối thiểu 8 ký tự. Trong transaction, khóa tài khoản/mã, kiểm tra hạn và số lần nhập; nếu đúng thì băm mật khẩu mới, thu hồi mọi phiên và đánh dấu mã đã dùng.

## 13. Giỏ hàng (dòng 1202–1278)

- `GET /api/cart`: cần đăng nhập; lấy giỏ database của người dùng và thông tin sản phẩm/ảnh. Nếu chưa có giỏ thì trả danh sách rỗng.
- `POST /api/cart/sync`: nhận giỏ từ frontend; tạo giỏ database nếu chưa có, sau đó cộng số lượng vào sản phẩm đã có hoặc thêm dòng mới.
- `POST /api/cart/update`: đặt số lượng cho một sản phẩm; số lượng không lớn hơn 0 sẽ xóa dòng, còn lại thì cập nhật hoặc thêm.

## 14. Checkout (dòng 1280–1381)

1. Thử đọc JWT nếu có để nhận diện khách đăng nhập và số dư. Token không hợp lệ được bỏ qua vì checkout cho phép khách chưa đăng nhập.
2. Kiểm tra thông tin giao hàng, danh sách hàng và phương thức thanh toán.
3. Với mỗi sản phẩm, lấy giá từ database rồi tính thành tiền; phí giao hàng hiện đặt cố định `30.000`.
4. Nếu thanh toán bằng `tai_khoan`, yêu cầu đăng nhập, kiểm tra số dư rồi trừ tiền.
5. Nếu là khách vãng lai, tìm/tạo tài khoản khách có email nội bộ dạng `guest_<số điện thoại>@guest.com`.
6. Tạo đơn hàng, tạo các dòng chi tiết, xóa giỏ database nếu người mua đã đăng nhập rồi trả mã đơn/tổng tiền.

Đây là luồng checkout của khách, khác với luồng admin: trong đoạn này không thấy transaction bao trọn việc trừ số dư, tạo đơn và ghi chi tiết. Các phương thức ngoài số dư chỉ ghi thông tin phương thức/trạng thái đơn; phần xử lý cổng thanh toán thực nằm ngoài luồng này.

## 15. Khởi động server (dòng 1383–1386)

`app.listen(PORT, ...)` bắt đầu nhận request HTTP và in địa chỉ server ra console.

## 16. Quản lý Danh mục & Thương hiệu (Admin)

- `GET /api/admin/danh-muc` (hoặc `/api/admin/nhan-hieu`): Lấy danh sách thương hiệu/danh mục kèm số lượng sản phẩm, thống kê nhu cầu sử dụng laptop, thống kê danh mục tin tức và số liệu tổng quan.
- `POST /api/admin/danh-muc`: Thêm danh mục/thương hiệu mới (kiểm tra trùng tên, lưu `ten_NH`, `logo`, `mo_ta`, `trang_thai`).
- `PUT /api/admin/danh-muc/:id`: Cập nhật thông tin danh mục/thương hiệu.
- `PUT /api/admin/danh-muc/:id/toggle-status`: Bật/tắt trạng thái kinh doanh của danh mục (hoạt động / tạm ẩn).
- `DELETE /api/admin/danh-muc/:id`: Xóa danh mục nếu chưa có sản phẩm liên kết; nếu có sản phẩm thì từ chối và khuyến nghị tạm ẩn để bảo toàn dữ liệu.
- `POST /api/admin/danh-muc/upload-logo`: Upload logo/hình ảnh danh mục vào thư mục `/uploads/`.

## Cách lần theo một request

Ví dụ một request sửa sản phẩm:

1. Tìm route `PUT /api/admin/san-pham/:id`.
2. Đọc middleware theo thứ tự: `authenticateToken` → `loadAdminActor` → `requireAdminPermission('products')`.
3. Đọc phần xử lý trong route: kiểm tra dữ liệu → kiểm tra thương hiệu → cập nhật MySQL → trả response.

Khi đọc các route khác, lần theo tương tự: **endpoint → middleware → kiểm tra đầu vào → truy vấn/transaction → response**.

