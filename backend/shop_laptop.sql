-- ============================================================
--  DATABASE: shop_laptop
--  Mô tả: Cơ sở dữ liệu quản lý cửa hàng laptop
--  Cập nhật: Dữ liệu sản phẩm thực tế, phong phú và đa dạng
-- ============================================================

CREATE DATABASE IF NOT EXISTS shop_laptop
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE shop_laptop;

-- ============================================================
-- 1. BẢNG: nhan_Hieu (Nhãn hiệu / Thương hiệu laptop)
-- ============================================================
CREATE TABLE IF NOT EXISTS nhan_Hieu (
    id          INT             NOT NULL AUTO_INCREMENT,
    ten_NH      VARCHAR(100)    NOT NULL COMMENT 'Tên nhãn hiệu (VD: Dell, HP, Asus...)',
    logo        VARCHAR(255)    NULL     COMMENT 'Đường dẫn logo nhãn hiệu',
    mo_ta       TEXT            NULL     COMMENT 'Mô tả nhãn hiệu',
    trang_thai  TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '1: Hoạt động | 0: Ẩn',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bảng lưu thông tin các nhãn hiệu laptop';

-- ============================================================
-- 2. BẢNG: laptop_Detail (Thông tin chi tiết Laptop)
-- ============================================================
CREATE TABLE IF NOT EXISTS laptop_Detail (
    id              INT             NOT NULL AUTO_INCREMENT,
    nhan_hieu_id    INT             NOT NULL COMMENT 'Khóa ngoại liên kết bảng nhan_Hieu',
    ten_laptop      VARCHAR(255)    NOT NULL COMMENT 'Tên đầy đủ của laptop',
    gia_ban         DECIMAL(15,2)   NOT NULL DEFAULT 0.00 COMMENT 'Giá bán hiện tại',
    gia_goc         DECIMAL(15,2)   NULL     COMMENT 'Giá gốc (dùng để hiển thị gạch ngang khi có khuyến mãi)',
    
    -- Cấu hình cơ bản
    cpu             VARCHAR(150)    NULL     COMMENT 'Thông số CPU',
    ram             VARCHAR(50)     NULL     COMMENT 'Dung lượng và loại RAM',
    o_cung          VARCHAR(100)    NULL     COMMENT 'Dung lượng và loại Ổ cứng',
    man_hinh        VARCHAR(150)    NULL     COMMENT 'Kích thước, độ phân giải màn hình',
    card_do_hoa     VARCHAR(150)    NULL     COMMENT 'Card đồ họa (VGA)',
    he_dieu_hanh    VARCHAR(100)    NULL     COMMENT 'Hệ điều hành cài sẵn',
    pin             VARCHAR(100)    NULL     COMMENT 'Dung lượng pin',
    trong_luong     DECIMAL(5,2)    NULL     COMMENT 'Trọng lượng (kg)',
    ket_noi         TEXT            NULL     COMMENT 'Các cổng kết nối',
    mau_sac         VARCHAR(100)    NULL     COMMENT 'Màu sắc sản phẩm',
    bao_hanh        INT             NOT NULL DEFAULT 12 COMMENT 'Thời gian bảo hành (tháng)',
    mo_ta           TEXT            NULL     COMMENT 'Bài viết mô tả chi tiết sản phẩm',
    
    -- Quản lý bán hàng
    so_luong_ton    INT             NOT NULL DEFAULT 0 COMMENT 'Số lượng sản phẩm còn trong kho',
    luot_xem        INT             NOT NULL DEFAULT 0 COMMENT 'Số lượt khách hàng xem sản phẩm',
    nhu_cau         ENUM('gaming', 'do_hoa', 'mong_nhe', 'sinh_vien', 'van_phong') NOT NULL DEFAULT 'van_phong' COMMENT 'Nhu cầu sử dụng',
    trang_thai      TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '1: Đang bán | 0: Ngừng kinh doanh',
    
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_laptop_nhanHieu
        FOREIGN KEY (nhan_hieu_id) REFERENCES nhan_Hieu(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bảng lưu thông tin cấu hình và giá bán chi tiết của laptop';

-- ============================================================
-- 3. BẢNG: laptop_images (Hình ảnh phụ của laptop)
-- ============================================================
CREATE TABLE IF NOT EXISTS laptop_images (
    id              INT             NOT NULL AUTO_INCREMENT,
    laptop_id       INT             NOT NULL COMMENT 'Khóa ngoại liên kết bảng laptop_Detail',
    url_anh         VARCHAR(500)    NOT NULL COMMENT 'Đường dẫn lưu file ảnh',
    alt_text        VARCHAR(255)    NULL     COMMENT 'Văn bản thay thế cho ảnh (SEO)',
    la_anh_chinh    TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '1: Ảnh hiển thị chính | 0: Ảnh phụ/slider',
    thu_tu          INT             NOT NULL DEFAULT 0 COMMENT 'Thứ tự sắp xếp hiển thị ảnh',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_images_laptop
        FOREIGN KEY (laptop_id) REFERENCES laptop_Detail(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bảng lưu hình ảnh sản phẩm laptop';

-- ============================================================
-- 3.5 BẢNG: laptop_variant (Biến thể laptop)
-- ============================================================
CREATE TABLE IF NOT EXISTS laptop_variant (
    id              INT             NOT NULL AUTO_INCREMENT,
    laptop_id       INT             NOT NULL COMMENT 'Khóa ngoại - laptop_Detail.id',
    ten_variant     VARCHAR(255)    NOT NULL COMMENT 'Tên biến thể (VD: Bản 8GB, Bản 16GB)',
    gia_ban         DECIMAL(15,2)   NOT NULL COMMENT 'Giá bán của biến thể',
    so_luong_ton    INT             NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_variant_laptop
        FOREIGN KEY (laptop_id) REFERENCES laptop_Detail(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. BẢNG: users (Tài khoản người dùng)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              INT             NOT NULL AUTO_INCREMENT,
    ho_ten          VARCHAR(150)    NOT NULL COMMENT 'Họ và tên người dùng',
    email           VARCHAR(200)    NOT NULL UNIQUE COMMENT 'Email đăng nhập',
    email_da_xac_minh TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '1: email đã xác minh',
    email_xac_minh_bat_buoc TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1: phải xác minh email trước khi đăng nhập',
    mat_khau        VARCHAR(255)    NOT NULL COMMENT 'Mật khẩu đã được mã hóa (Hash)',
    so_dien_thoai   VARCHAR(15)     NULL     COMMENT 'Số điện thoại liên hệ',
    dia_chi         TEXT            NULL     COMMENT 'Địa chỉ nhận hàng mặc định',
    avatar          VARCHAR(255)    NULL     COMMENT 'Đường dẫn ảnh đại diện',
    vai_tro         ENUM('qtv', 'admin', 'nhan_su', 'nhan_vien_kho', 'nhan_vien', 'khach_hang') NOT NULL DEFAULT 'khach_hang' COMMENT 'Vai trò của user',
    quyen           JSON            NULL COMMENT 'Quyền quản trị được cấp riêng cho tài khoản',
    balance         DECIMAL(15,2)   DEFAULT 0.00 COMMENT 'Số dư ví người dùng',
    trang_thai      TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '1: Hoạt động | 0: Bị khóa',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bảng lưu thông tin tài khoản người dùng và quản trị viên';

CREATE TABLE IF NOT EXISTS email_auth_codes (
    id          INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    purpose     ENUM('password_reset', 'email_verification') NOT NULL,
    code_hash   VARCHAR(255) NOT NULL,
    attempts    TINYINT UNSIGNED NOT NULL DEFAULT 0,
    expires_at  DATETIME NOT NULL,
    used_at     DATETIME NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_auth_codes_user_purpose (user_id, purpose, created_at),
    CONSTRAINT fk_email_auth_codes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jsontoken (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    blacklist TINYINT(1) DEFAULT 0 COMMENT '1: tài khoản bị cấm đăng nhập',
    `revoke` TINYINT(1) DEFAULT 0 COMMENT '1: đã đăng xuất, token bị thu hồi',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    laptop_id INT NOT NULL,
    so_luong INT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
    FOREIGN KEY (laptop_id) REFERENCES laptop_Detail(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. BẢNG: coupon (Mã giảm giá)
-- ============================================================
CREATE TABLE IF NOT EXISTS coupon (
    id              INT             NOT NULL AUTO_INCREMENT,
    ma_coupon       VARCHAR(50)     NOT NULL UNIQUE COMMENT 'Mã code (VD: SALE10, TET2024)',
    mo_ta           VARCHAR(255)    NULL     COMMENT 'Mô tả chương trình khuyến mãi',
    loai_giam       ENUM('phan_tram', 'so_tien') NOT NULL DEFAULT 'phan_tram' COMMENT 'Loại giảm giá',
    gia_tri_giam    DECIMAL(15,2)   NOT NULL DEFAULT 0.00 COMMENT 'Giá trị (% hoặc VNĐ)',
    giam_toi_da     DECIMAL(15,2)   NULL     COMMENT 'Số tiền giảm tối đa (Áp dụng nếu loại giảm là phan_tram)',
    don_hang_toi_thieu DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Giá trị đơn hàng tối thiểu để áp dụng mã',
    so_luong        INT             NOT NULL DEFAULT 1 COMMENT 'Tổng số lượt sử dụng mã',
    da_su_dung      INT             NOT NULL DEFAULT 0 COMMENT 'Số lượt đã được sử dụng',
    ngay_bat_dau    DATE            NOT NULL COMMENT 'Ngày bắt đầu có hiệu lực',
    ngay_ket_thuc   DATE            NOT NULL COMMENT 'Ngày hết hạn',
    trang_thai      TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '1: Kích hoạt | 0: Vô hiệu hóa',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bảng lưu trữ thông tin các mã giảm giá, khuyến mãi';

-- ============================================================
-- 6. BẢNG: order (Đơn hàng)
-- ============================================================
CREATE TABLE IF NOT EXISTS `order` (
    id                  INT             NOT NULL AUTO_INCREMENT,
    user_id             INT             NOT NULL COMMENT 'ID của khách hàng mua',
    coupon_id           INT             NULL     COMMENT 'ID của mã giảm giá đã áp dụng (nếu có)',
    ma_don_hang         VARCHAR(50)     NOT NULL UNIQUE COMMENT 'Mã đơn hàng ngẫu nhiên (VD: DH123456)',
    ho_ten_nguoi_nhan   VARCHAR(150)    NOT NULL COMMENT 'Tên người nhận (có thể khác tên user)',
    so_dien_thoai       VARCHAR(15)     NOT NULL COMMENT 'SĐT người nhận',
    dia_chi_giao        TEXT            NOT NULL COMMENT 'Địa chỉ giao hàng',
    
    -- Chi tiết giá trị đơn
    tong_tien           DECIMAL(15,2)   NOT NULL DEFAULT 0.00 COMMENT 'Tổng tiền hàng',
    tien_giam           DECIMAL(15,2)   NOT NULL DEFAULT 0.00 COMMENT 'Số tiền được giảm từ coupon',
    phi_van_chuyen      DECIMAL(15,2)   NOT NULL DEFAULT 0.00 COMMENT 'Phí giao hàng',
    thanh_tien          DECIMAL(15,2)   NOT NULL DEFAULT 0.00 COMMENT 'Tổng tiền khách phải trả',
    
    phuong_thuc_tt      ENUM('tien_mat', 'chuyen_khoan', 'vnpay', 'momo', 'zalopay') NOT NULL DEFAULT 'tien_mat' COMMENT 'Phương thức thanh toán',
    trang_thai_tt       ENUM('chua_thanh_toan', 'da_thanh_toan', 'hoan_tien') NOT NULL DEFAULT 'chua_thanh_toan' COMMENT 'Trạng thái thanh toán',
    trang_thai_dh       ENUM('cho_xac_nhan', 'da_xac_nhan', 'dang_giao', 'da_giao', 'da_huy', 'tra_hang') NOT NULL DEFAULT 'cho_xac_nhan' COMMENT 'Trạng thái giao nhận đơn',
    ghi_chu             TEXT            NULL     COMMENT 'Ghi chú của khách hàng hoặc shop',
    
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_order_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_order_coupon
        FOREIGN KEY (coupon_id) REFERENCES coupon(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bảng lưu thông tin tổng quan của các đơn hàng';

-- ============================================================
-- 7. BẢNG: order_detail (Chi tiết Đơn hàng)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_detail (
    id              INT             NOT NULL AUTO_INCREMENT,
    order_id        INT             NOT NULL COMMENT 'Khóa ngoại liên kết bảng order',
    laptop_id       INT             NOT NULL COMMENT 'Khóa ngoại liên kết bảng laptop_Detail',
    ten_laptop      VARCHAR(255)    NOT NULL COMMENT 'Lưu lại tên lúc mua phòng khi SP đổi tên',
    gia_ban         DECIMAL(15,2)   NOT NULL COMMENT 'Lưu lại giá bán lúc mua',
    so_luong        INT             NOT NULL DEFAULT 1 COMMENT 'Số lượng máy khách mua',
    thanh_tien      DECIMAL(15,2)   NOT NULL COMMENT 'Tổng tiền cho sản phẩm này = gia_ban * so_luong',
    serial_number   VARCHAR(100)    NULL COMMENT 'Mã Serial/IMEI máy phục vụ tra cứu bảo hành',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_orderDetail_order
        FOREIGN KEY (order_id) REFERENCES `order`(id) ON DELETE CASCADE,
    CONSTRAINT fk_orderDetail_laptop
        FOREIGN KEY (laptop_id) REFERENCES laptop_Detail(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bảng lưu chi tiết từng sản phẩm được mua trong đơn hàng';


-- ============================================================
-- 8. BẢNG: tin_tuc (Tin tức & Bài viết công nghệ)
-- ============================================================
CREATE TABLE IF NOT EXISTS tin_tuc (
    id              INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tieu_de         VARCHAR(255)    NOT NULL COMMENT 'Tiêu đề bài viết',
    slug            VARCHAR(255)    NOT NULL UNIQUE COMMENT 'Đường dẫn tĩnh SEO',
    tom_tat         TEXT            NULL     COMMENT 'Tóm tắt bài viết',
    noi_dung        LONGTEXT        NOT NULL COMMENT 'Nội dung chi tiết bài viết',
    hinh_anh        VARCHAR(500)    NULL     COMMENT 'Đường dẫn ảnh đại diện bài viết',
    danh_muc        VARCHAR(100)    NOT NULL DEFAULT 'Công nghệ' COMMENT 'Danh mục tin tức',
    tac_gia_id      INT             NULL     COMMENT 'ID tác giả nếu có',
    tac_gia_ten     VARCHAR(100)    NOT NULL DEFAULT 'KTSHOP News' COMMENT 'Tên tác giả',
    noi_bat         TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '1: Nổi bật | 0: Thường',
    luot_xem        INT             NOT NULL DEFAULT 0 COMMENT 'Số lượt xem',
    trang_thai      TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '1: Xuất bản | 0: Bản nháp / Ẩn',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tin_tuc_danh_muc (danh_muc),
    INDEX idx_tin_tuc_trang_thai (trang_thai),
    INDEX idx_tin_tuc_noi_bat (noi_bat),
    FOREIGN KEY (tac_gia_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng tin tức và bài viết công nghệ';

-- ============================================================
-- 9. BẢNG: wallet_transactions (Lịch sử biến động số dư ví)
-- ============================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id              INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id         INT             NOT NULL COMMENT 'Khóa ngoại liên kết bảng users',
    ma_giao_dich    VARCHAR(50)     NOT NULL UNIQUE COMMENT 'Mã giao dịch ví (VD: WALLET_1234567890)',
    loai_giao_dich  ENUM('nap_tien', 'thanh_toan_don_hang', 'hoan_tien', 'rut_tien') NOT NULL COMMENT 'Loại giao dịch ví',
    so_tien         DECIMAL(15,2)   NOT NULL COMMENT 'Số tiền giao dịch',
    so_du_truoc     DECIMAL(15,2)   NOT NULL COMMENT 'Số dư trước khi giao dịch',
    so_du_sau       DECIMAL(15,2)   NOT NULL COMMENT 'Số dư sau khi giao dịch',
    phuong_thuc     VARCHAR(50)     DEFAULT 'vietqr' COMMENT 'Phương thức (vietqr, tai_khoan, ...)',
    trang_thai      ENUM('cho_duyet', 'thanh_cong', 'that_bai') NOT NULL DEFAULT 'thanh_cong',
    ghi_chu         TEXT            NULL COMMENT 'Ghi chú giao dịch',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_wallet_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch sử biến động số dư ví';

-- ============================================================
-- 10. BẢNG: reviews (Đánh giá & Bình luận sản phẩm)
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
    id                  INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    laptop_id           INT             NOT NULL COMMENT 'Khóa ngoại liên kết laptop_Detail',
    user_id             INT             NOT NULL COMMENT 'Khóa ngoại liên kết users',
    order_id            INT             NULL COMMENT 'Khóa ngoại đơn hàng để xác minh đã mua hàng',
    so_sao              TINYINT         NOT NULL DEFAULT 5 COMMENT 'Số sao đánh giá (1-5)',
    tieu_de             VARCHAR(255)    NULL COMMENT 'Tiêu đề đánh giá ngắn',
    noi_dung            TEXT            NOT NULL COMMENT 'Nội dung nhận xét chi tiết',
    verified_purchase   TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '1: Đã mua hàng thực tế (Verified Purchase)',
    trang_thai          TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '1: Hiển thị | 0: Ẩn',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_reviews_laptop (laptop_id),
    INDEX idx_reviews_user (user_id),
    FOREIGN KEY (laptop_id) REFERENCES laptop_Detail(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Đánh giá và nhận xét sản phẩm laptop';

-- ============================================================
-- DỮ LIỆU MẪU (SEEDER)
-- ============================================================

-- 1. Dữ liệu nhãn hiệu
INSERT INTO nhan_Hieu (id, ten_NH, mo_ta) VALUES
(1, 'Dell', 'Thương hiệu laptop hàng đầu từ Mỹ, bền bỉ và đa dạng từ Inspiron, XPS đến Alienware'),
(2, 'HP', 'Hewlett-Packard - Thương hiệu uy tín với các dòng Pavilion, Envy, Spectre, OMEN và Victus'),
(3, 'Asus', 'Tiên phong công nghệ Đài Loan với Zenbook mỏng nhẹ, ROG & TUF Gaming đỉnh cao'),
(4, 'Lenovo', 'Hãng máy tính hàng đầu thế giới với huyền thoại ThinkPad doanh nhân và Legion Gaming'),
(5, 'Acer', 'Thương hiệu giá tốt cấu hình vượt trội với Nitro Gaming, Predator và Swift OLED'),
(6, 'Apple', 'MacBook Air và MacBook Pro với vi xử lý Apple Silicon M-series tối ưu hiệu năng và pin')
ON DUPLICATE KEY UPDATE ten_NH = VALUES(ten_NH), mo_ta = VALUES(mo_ta);

-- 2. Dữ liệu User mẫu (Mật khẩu: atv@shoplaptop.vn là 'password' | nhanvien & khach_hang là '12345678')
INSERT INTO users (ho_ten, email, mat_khau, so_dien_thoai, vai_tro, email_da_xac_minh, email_xac_minh_bat_buoc) VALUES
('Quản Trị Viên Cao Nhất', 'atv@shoplaptop.vn', '$2b$10$bKa0UloeETiInHYBv/t8sugFCQs8/0Cwdfey/rP21Ah6mv.W3Sb/2', NULL, 'qtv', 1, 0),
('Nhân Viên A',   'nhanvien@shoplaptop.vn', '$2b$10$L.oBBEembP9/A3JDiluD4O3/Ox2WiFdBYLU4Mhs70j8iKXALu4BHG', '0909000002', 'nhan_vien', 1, 0),
('Nguyễn Văn An', 'an.nguyen@gmail.com',   '$2b$10$L.oBBEembP9/A3JDiluD4O3/Ox2WiFdBYLU4Mhs70j8iKXALu4BHG', '0901234567', 'khach_hang', 1, 0)
ON DUPLICATE KEY UPDATE ho_ten = VALUES(ho_ten), mat_khau = VALUES(mat_khau), email_da_xac_minh = VALUES(email_da_xac_minh);


-- 3. Laptop mẫu thực tế đa dạng (36 sản phẩm)
INSERT INTO laptop_Detail (nhan_hieu_id, ten_laptop, gia_ban, gia_goc, cpu, ram, o_cung, man_hinh, card_do_hoa, he_dieu_hanh, pin, trong_luong, ket_noi, mau_sac, bao_hanh, mo_ta, so_luong_ton, luot_xem) VALUES
(1, 'Dell Inspiron 15 3520', 13990000, 15990000, 'Intel Core i5-1235U (10 nhân, 12 luồng, up to 4.4GHz)', '8GB DDR4 3200MHz', '512GB PCIe NVMe SSD', '15.6 inch FHD (1920x1080) 120Hz Anti-Glare WVA', 'Intel Iris Xe Graphics', 'Windows 11 Home bản quyền', '41Wh (3-cell)', 1.65, '2x USB 3.2 Gen 1, 1x USB 2.0, 1x HDMI 1.4, SD Card Reader, Jack 3.5mm, Wi-Fi 6', 'Đen carbon (Carbon Black)', 12, 'Dell Inspiron 15 3520 là chiếc laptop học tập - làm việc lý tưởng với màn hình 120Hz mượt mà, bàn phím số full-size tiện lợi cho kế toán, và thiết kế bản lề nâng công thái học gõ phím cực êm.', 25, 13),
(1, 'Dell XPS 13 Plus 9320', 45990000, 49990000, 'Intel Core i7-1360P (12 nhân, 16 luồng, up to 5.0GHz)', '16GB LPDDR5 6000MHz Onboard', '1TB PCIe Gen4 NVMe SSD', '13.4 inch 3.5K OLED (3456x2160) Touch 400 nits 100% DCI-P3 DisplayHDR 500', 'Intel Iris Xe Graphics', 'Windows 11 Pro 64-bit', '55Wh ExpressCharge', 1.23, '2x Thunderbolt 4 / USB-C (Power Delivery, DisplayPort), Wi-Fi 6E, Bluetooth 5.3', 'Bạc bạch kim (Platinum Silver)', 24, 'Dell XPS 13 Plus là kiệt tác công nghệ với bàn phím liền mạch không viền (zero-lattice), dãy phím chức năng cảm ứng điện dung và touchpad tàng hình phản hồi xúc giác dưới kính cường lực.', 10, 18),
(1, 'Dell Gaming G15 5530', 28490000, 31990000, 'Intel Core i7-13650HX (14 nhân, 20 luồng, up to 4.9GHz)', '16GB DDR5 4800MHz (2 khe rời)', '512GB SSD M.2 PCIe Gen 4', '15.6 inch FHD (1920x1080) 165Hz sRGB 100% G-Sync ComfortView Plus', 'NVIDIA GeForce RTX 4060 8GB GDDR6 (TGP 140W)', 'Windows 11 Home', '86Wh (6-cell)', 2.81, '1x HDMI 2.1, 3x USB 3.2 Gen 1, 1x USB-C 3.2 Gen 2 / DisplayPort, RJ-45 LAN, Jack 3.5mm', 'Xám bóng đêm (Dark Shadow Gray)', 12, 'Dell Gaming G15 5530 sở hữu thiết kế góc cạnh lấy cảm hứng từ phi thuyền không gian Alienware, hệ thống tản nhiệt buồng hơi kép và card đồ họa RTX 4060 max công suất 140W chiến mượt mọi tựa game AAA.', 15, 17),
(1, 'Dell Vostro 14 3430', 10990000, 12490000, 'Intel Core i3-1305U (5 nhân, 6 luồng, up to 4.5GHz)', '8GB DDR4 3200MHz', '256GB PCIe NVMe SSD', '14.0 inch FHD (1920x1080) WVA Chống chói 250 nits', 'Intel UHD Graphics', 'Windows 11 Home + Office Home & Student', '41Wh', 1.48, '1x USB-C 3.2, 1x USB 3.2, 1x USB 2.0, HDMI 1.4, RJ45 LAN, Khe SD, Audio Combo', 'Xám titan (Titan Grey)', 12, 'Dell Vostro 14 3430 nhỏ gọn nhẹ nhàng 1.48kg, tích hợp sẵn Windows 11 và Office bản quyền trọn đời, cổng mạng LAN RJ45 tiện lợi cho văn phòng và sinh viên.', 30, 10),
(1, 'Dell Latitude 7440', 33500000, 36000000, 'Intel Core i7-1365U vPro (10 nhân, 12 luồng, up to 5.2GHz)', '16GB LPDDR5 4800MHz', '512GB PCIe NVMe Class 35 SSD', '14.0 inch FHD+ (1920x1200) IPS 400 nits ComfortView Plus Cảm biến tiệm cận', 'Intel Iris Xe Graphics', 'Windows 11 Pro 64-bit bản quyền', '57Wh ExpressCharge', 1.33, '2x Thunderbolt 4, 2x USB 3.2 Gen 1, 1x HDMI 2.0, Smart Card Reader, Cảm biến vân tay', 'Nhôm xám khói (Aluminium Grey)', 36, 'Dell Latitude 7440 đạt chuẩn bảo mật doanh nghiệp cao cấp nhất thế giới với chip vPro, camera hồng ngoại nhận diện khuôn mặt IR, cảm biến tiệm cận tự khóa màn hình khi người dùng rời đi.', 12, 29),
(1, 'Dell Alienware m16 R2', 59990000, 64990000, 'Intel Core Ultra 9 185H (16 nhân, 22 luồng, up to 5.1GHz, AI Boost NPU)', '32GB DDR5 5600MHz', '1TB PCIe NVMe M.2 Gen4 SSD', '16.0 inch QHD+ (2560x1600) 240Hz 3ms 100% sRGB ComfortView Plus G-Sync', 'NVIDIA GeForce RTX 4070 8GB GDDR6 (140W TGP)', 'Windows 11 Home', '90Wh', 2.61, '1x Thunderbolt 4, 1x USB-C 3.2 Gen 2, 2x USB 3.2 Gen 1, HDMI 2.1, MicroSD, 2.5GbE LAN', 'Xám vũ trụ (Dark Metallic Moon)', 24, 'Dell Alienware m16 R2 thiết kế Stealth Mode mới tinh tế hơn, sở hữu vi xử lý AI Intel Core Ultra 9 kết hợp màn hình 240Hz sắc nét đưa trải nghiệm gaming và đồ họa 3D lên tầm cao mới.', 8, 29),
(2, 'HP Pavilion 15-eg3093TU', 16890000, 18590000, 'Intel Core i5-1335U (10 nhân, 12 luồng, up to 4.6GHz)', '16GB DDR4 3200MHz (2x8GB)', '512GB PCIe NVMe M.2 SSD', '15.6 inch FHD (1920x1080) IPS BrightView 250 nits', 'Intel Iris Xe Graphics', 'Windows 11 Home', '41Wh Li-ion', 1.74, '1x USB-C 10Gbps (USB Power Delivery, DisplayPort 1.4), 2x USB-A 5Gbps, 1x HDMI 2.1, Audio combo', 'Vàng kim ánh trăng (Warm Gold)', 12, 'HP Pavilion 15 mang vẻ đẹp thanh lịch với tông màu Warm Gold sang trọng, âm thanh B&O cao cấp và cấu hình Core i5 thế hệ 13 mượt mà cho mọi tác vụ công sở và học tập.', 22, 40),
(2, 'HP Spectre x360 14-ef2003TU (2-in-1)', 42990000, 46990000, 'Intel Core i7-1355U (10 nhân, 12 luồng, up to 5.0GHz)', '16GB LPDDR4x 4266MHz Onboard', '1TB PCIe NVMe TLC M.2 SSD', '13.5 inch 3K2K OLED (3000x2000) Touch xoay gập 360 độ kèm bút HP Rechargeable MPP2.0 Tilt Pen', 'Intel Iris Xe Graphics', 'Windows 11 Home', '66Wh (Sạc nhanh 50% trong 45 phút)', 1.36, '2x Thunderbolt 4, 1x USB-A 10Gbps, MicroSD, Jack 3.5mm, Wi-Fi 6E', 'Đen ánh đồng (Nightfall Black)', 24, 'HP Spectre x360 là tuyệt tác thiết kế vát góc kim cương (gem-cut), màn hình cảm ứng OLED tỷ lệ 3:2 rực rỡ và bản lề xoay 360 độ linh hoạt biến hóa thành tablet vẽ đồ họa chuyên nghiệp.', 10, 45),
(2, 'HP Victus 16-r0129TX', 25490000, 27990000, 'Intel Core i7-13700H (14 nhân, 20 luồng, up to 5.0GHz)', '16GB DDR5 5200MHz', '512GB PCIe Gen4 NVMe SSD', '16.1 inch FHD (1920x1080) 144Hz IPS viền siêu mỏng 300 nits', 'NVIDIA GeForce RTX 4050 6GB GDDR6', 'Windows 11 Home', '70Wh', 2.31, '1x USB-C DisplayPort/PD, 3x USB-A, HDMI 2.1, RJ-45 LAN, Jack tai nghe 3.5mm', 'Xám mica (Mica Silver)', 12, 'HP Victus 16 sở hữu màn hình rộng 16.1 inch 144Hz tần số quét cao, cấu hình Core i7 dòng H cực khỏe cùng card đồ họa RTX 4050 hỗ trợ DLSS 3 chiến game mượt mà không lo giật lag.', 18, 45),
(2, 'HP Envy 16-h1013TX', 48990000, 53990000, 'Intel Core i9-13900H (14 nhân, 20 luồng, up to 5.4GHz)', '32GB DDR5 5200MHz', '1TB PCIe NVMe Gen4 SSD', '16.0 inch 2.8K OLED (2880x1800) 120Hz 100% DCI-P3 500 nits cảm ứng', 'NVIDIA GeForce RTX 4060 8GB GDDR6 Studio Ready', 'Windows 11 Home', '83Wh', 2.34, '2x Thunderbolt 4, 2x USB-A 10Gbps, HDMI 2.1, Khe thẻ nhớ SD kích thước đầy đủ', 'Bạc tự nhiên (Natural Silver)', 24, 'HP Envy 16 là cỗ máy sáng tạo dành riêng cho nhà làm phim, đồ họa chuyên nghiệp với chip Core i9 khủng, màn hình OLED 2.8K 120Hz chuẩn màu điện ảnh và driver NVIDIA Studio tối ưu.', 7, 47),
(2, 'HP ProBook 450 G10', 18990000, 20990000, 'Intel Core i5-1335U (10 nhân, 12 luồng, up to 4.6GHz)', '16GB DDR4 3200MHz', '512GB PCIe NVMe SSD', '15.6 inch FHD IPS Chống lóa 250 nits', 'Intel Iris Xe Graphics', 'Windows 11 Pro 64-bit', '51Wh', 1.79, '2x USB-C 10Gbps, 2x USB-A 5Gbps, HDMI 2.1, RJ-45 LAN, Khe khóa Kensington', 'Bạc Pike (Pike Silver)', 24, 'HP ProBook 450 G10 đạt chuẩn độ bền quân đội Mỹ 19 bài kiểm tra khắt khe, bàn phím chống tràn nước và tích hợp hệ điều hành Windows 11 Pro bảo mật cao cấp.', 20, 15),
(2, 'HP 240 G9', 9890000, 11490000, 'Intel Core i3-1215U (6 nhân, 8 luồng, up to 4.4GHz)', '8GB DDR4 3200MHz', '256GB PCIe NVMe SSD', '14.0 inch FHD (1920x1080) Chống lóa 250 nits', 'Intel UHD Graphics', 'Windows 11 Home', '41Wh', 1.47, '1x USB-C, 2x USB-A, 1x HDMI 1.4b, 1x RJ-45 LAN, Audio jack', 'Xám đá (Asteroid Silver)', 12, 'HP 240 G9 là sự lựa chọn số 1 phân khúc dưới 10 triệu đồng: trọng lượng nhẹ 1.47kg, màn hình FHD sắc nét, chip Core i3 Gen 12 thế hệ mới mượt mà cho học online và văn phòng.', 35, 10),
(3, 'Asus ROG Strix SCAR 16 G634JZ', 79990000, 84990000, 'Intel Core i9-13980HX (24 nhân, 32 luồng, up to 5.6GHz)', '32GB DDR5 4800MHz', '1TB PCIe 4.0 NVMe M.2 SSD', '16.0 inch ROG Nebula HDR Mini LED 2.5K (2560x1600) 240Hz 3ms 1100 nits 100% DCI-P3', 'NVIDIA GeForce RTX 4080 12GB GDDR6 (TGP 175W Max)', 'Windows 11 Home', '90Wh', 2.5, '1x Thunderbolt 4, 1x USB 3.2 Gen 2 Type-C (PD/DP), 2x USB 3.2 Gen 2 Type-A, 2.5G LAN, HDMI 2.1', 'Đen Off Black Led RGB viền máy', 24, 'Asus ROG Strix SCAR 16 là cỗ máy thi đấu Esports đỉnh cao nhất với màn hình Mini LED 240Hz 1100 nits, tản nhiệt kim loại lỏng Conductonaut Extreme và card RTX 4080 công suất tối đa 175W.', 5, 19),
(3, 'Asus Zenbook 14 OLED UX3405MA', 32990000, 34990000, 'Intel Core Ultra 7 155H (16 nhân, 22 luồng, tích hợp Intel AI Boost NPU)', '32GB LPDDR5X 7467MHz', '1TB PCIe 4.0 NVMe SSD', '14.0 inch 3K (2880x1800) OLED 120Hz 0.2ms 100% DCI-P3 600 nits HDR', 'Intel Arc Graphics tích hợp', 'Windows 11 Home', '75Wh (Sử dụng liên tục lên đến 15 giờ)', 1.2, '2x Thunderbolt 4, 1x USB 3.2 Gen 1 Type-A, 1x HDMI 2.1 TMDS, Jack 3.5mm, Wi-Fi 6E', 'Xanh lam phong thủy (Ponder Blue)', 24, 'Asus Zenbook 14 OLED UX3405MA là AI Laptop chuẩn Intel Evo siêu nhẹ 1.2kg, màn hình 3K OLED 120Hz chuẩn màu siêu nét cùng thời lượng pin 75Wh ấn tượng vượt trội.', 14, 19),
(3, 'Asus TUF Gaming A15 FA507NU', 22990000, 25490000, 'AMD Ryzen 7 7735HS (8 nhân, 16 luồng, up to 4.75GHz)', '16GB DDR5 4800MHz', '512GB PCIe 4.0 NVMe SSD', '15.6 inch FHD (1920x1080) 144Hz 100% sRGB G-Sync MUX Switch', 'NVIDIA GeForce RTX 4050 6GB GDDR6 (140W Max)', 'Windows 11 Home', '90Wh', 2.2, '1x Type-C USB 4, 1x USB-C 3.2 Gen 2, 2x USB 3.2 Gen 1, HDMI 2.1, RJ45 LAN', 'Xám Jaeger (Jaeger Gray)', 24, 'Asus TUF Gaming A15 đạt chuẩn độ bền chuẩn quân đội MIL-STD-810H, trang bị pin 90Wh siêu khủng, MUX Switch kết hợp công nghệ NVIDIA Advanced Optimus giúp tối ưu khung hình cao nhất.', 19, 44),
(3, 'Asus Vivobook 15 OLED A1505VA', 17490000, 19490000, 'Intel Core i5-13500H (12 nhân, 16 luồng, up to 4.7GHz)', '16GB DDR4 3200MHz', '512GB PCIe 3.0 NVMe SSD', '15.6 inch FHD (1920x1080) OLED 600 nits 100% DCI-P3 chuẩn PANTONE', 'Intel Iris Xe Graphics', 'Windows 11 Home', '50Wh', 1.7, '1x USB-C 3.2 Gen 1, 2x USB 3.2 Gen 1 Type-A, 1x USB 2.0, HDMI 1.4, Audio Combo', 'Bạc Indie (Cool Silver)', 24, 'Asus Vivobook 15 OLED trang bị màn hình OLED rực rỡ với độ sáng 600 nits, chuẩn màu 100% DCI-P3 cùng CPU dòng H hiệu năng cao đáp ứng hoàn hảo nhu cầu chỉnh ảnh, thiết kế và giải trí điện ảnh.', 20, 48),
(3, 'Asus ROG Zephyrus G14 GA403UI', 54990000, 58990000, 'AMD Ryzen 9 8945HS (8 nhân, 16 luồng, tích hợp Ryzen AI 39 TOPS)', '32GB LPDDR5X 6400MHz', '1TB PCIe 4.0 NVMe SSD', '14.0 inch 3K (2880x1800) OLED 120Hz 0.2ms ROG Nebula Display G-Sync', 'NVIDIA GeForce RTX 4070 8GB GDDR6 (90W TGP)', 'Windows 11 Home', '73Wh', 1.5, '1x Type-C USB 4, 1x USB-C 3.2 Gen 2 (PD/DP), 2x USB-A 3.2, HDMI 2.1, Khe UHS-II MicroSD', 'Trắng bạch kim (Platinum White) dải Slash Lighting độc đáo', 24, 'Asus ROG Zephyrus G14 sở hữu thiết kế nhôm CNC nguyên khối với dải đèn LED Slash Lighting phong cách, màn hình OLED 3K 120Hz tuyệt đẹp và trọng lượng chỉ 1.5kg mang sức mạnh Gaming di động tối cao.', 8, 13),
(3, 'Asus Vivobook Go 14 E1404FA', 12490000, 14290000, 'AMD Ryzen 5 7520U (4 nhân, 8 luồng, up to 4.3GHz)', '16GB LPDDR5 5500MHz Onboard', '512GB PCIe 3.0 NVMe SSD', '14.0 inch FHD (1920x1080) Chống chói TÜV Rheinland bảo vệ mắt', 'AMD Radeon 610M Graphics', 'Windows 11 Home', '42Wh (Bản lề duỗi phẳng 180 độ)', 1.38, '1x USB-C 3.2, 1x USB-A 3.2, 1x USB 2.0, 1x HDMI 1.4, Jack 3.5mm', 'Đen hỗn mang (Mixed Black)', 24, 'Asus Vivobook Go 14 cực kỳ nhỏ gọn 1.38kg với cấu hình 16GB RAM LPDDR5 sẵn có, sạc nhanh 60% chỉ trong 49 phút và bản lề mở phẳng 180 độ dễ dàng chia sẻ nội dung trong lớp học.', 28, 36),
(4, 'Lenovo ThinkPad X1 Carbon Gen 11', 52990000, 57990000, 'Intel Core i7-1365U vPro (10 nhân, 12 luồng, up to 5.2GHz)', '32GB LPDDR5 6400MHz', '1TB SSD M.2 2280 PCIe Gen4 Performance', '14.0 inch 2.8K (2880x1800) OLED 400 nits 100% DCI-P3 DisplayHDR 500 True Black', 'Intel Iris Xe Graphics', 'Windows 11 Pro 64-bit bản quyền', '57Wh Rapid Charge (80% trong 60 phút)', 1.12, '2x Thunderbolt 4, 2x USB 3.2 Gen 1, HDMI 2.1, TrackPoint đỏ trứ danh, Vân tay nút nguồn', 'Đen nhung Carbon (Deep Black)', 36, 'Lenovo ThinkPad X1 Carbon Gen 11 là biểu tượng laptop doanh nhân thành đạt với trọng lượng siêu nhẹ 1.12kg nhờ sợi carbon gia cường, bàn phím gõ êm nhất thế giới và bảo hành 36 tháng Premier Support.', 8, 18),
(4, 'Lenovo Legion Pro 5 16IRX9', 45490000, 49990000, 'Intel Core i7-14700HX (20 nhân, 28 luồng, up to 5.5GHz)', '32GB DDR5 5600MHz (2x16GB)', '1TB SSD M.2 2280 PCIe 4.0 NVMe', '16.0 inch WQXGA (2560x1600) IPS 240Hz 500 nits 100% sRGB G-Sync Dolby Vision', 'NVIDIA GeForce RTX 4070 8GB GDDR6 (140W TGP, Legion Coldfront 5.0)', 'Windows 11 Home', '80Wh Super Rapid Charge Pro', 2.5, '2x USB-C 3.2 Gen 2 (PD 140W, DP 1.4), 4x USB-A 3.2 Gen 1, HDMI 2.1, RJ-45 Gigabit LAN', 'Xám Onyx (Onyx Grey)', 24, 'Lenovo Legion Pro 5 thống trị làng Gaming với CPU Core i7-14700HX 20 nhân khủng, màn hình 240Hz 500 nits đỉnh cao cùng hệ thống tản nhiệt Legion Coldfront 5.0 buồng hơi đồng mát lạnh.', 12, 38),
(4, 'Lenovo IdeaPad Slim 5 14IAH8', 15990000, 17990000, 'Intel Core i5-12450H (8 nhân, 12 luồng, up to 4.4GHz)', '16GB LPDDR5 4800MHz', '512GB SSD M.2 PCIe NVMe', '14.0 inch WUXGA (1920x1200) IPS 300 nits 100% sRGB tỷ lệ 16:10', 'Intel UHD Graphics', 'Windows 11 Home bản quyền', '56.6Wh', 1.46, '2x USB-C 3.2 (PD & DP), 2x USB 3.2 Gen 1, HDMI 1.4b, MicroSD reader, Jack 3.5mm', 'Xám mây (Cloud Grey) vỏ kim loại', 24, 'Lenovo IdeaPad Slim 5 sở hữu vỏ nhôm sang trọng mỏng 16.9mm, màn hình 16:10 hiển thị thêm nhiều dòng tài liệu cùng chip dòng H mạnh mẽ chạy đa nhiệm mượt mà.', 25, 34),
(4, 'Lenovo Yoga Slim 7 Pro 14IAP7', 26490000, 29990000, 'Intel Core i7-1260P (12 nhân, 16 luồng, up to 4.7GHz)', '16GB LPDDR5 4800MHz', '512GB SSD PCIe NVMe', '14.0 inch 2.8K (2880x1800) OLED 90Hz 100% DCI-P3 Dolby Vision 400 nits', 'Intel Iris Xe Graphics', 'Windows 11 Home', '61Wh', 1.32, '2x Thunderbolt 4, 1x USB 3.2 Gen 1 (Always On), Jack 3.5mm', 'Xám bão (Storm Grey)', 24, 'Lenovo Yoga Slim 7 Pro kết hợp vẻ đẹp tinh giản nguyên khối với màn hình OLED 2.8K 90Hz rực rỡ, âm thanh vòm Dolby Atmos sống động và webcam IR mở khóa khuôn mặt cực nhạy.', 11, 26),
(4, 'Lenovo LOQ 15IAX9', 18990000, 21490000, 'Intel Core i5-12450HX (8 nhân, 12 luồng, up to 4.4GHz)', '12GB DDR5 4800MHz', '512GB SSD M.2 PCIe Gen4', '15.6 inch FHD (1920x1080) 144Hz 100% sRGB G-Sync viền mỏng', 'NVIDIA GeForce RTX 3050 6GB GDDR6 (95W TGP)', 'Windows 11 Home', '60Wh', 2.38, '1x USB-C 3.2 (PD 140W), 3x USB-A 3.2, HDMI 2.1, RJ-45 LAN, Audio combo', 'Xám Luna (Luna Grey)', 24, 'Lenovo LOQ 15 mang DNA thiết kế từ dòng Legion danh tiếng với mức giá dễ tiếp cận, RAM DDR5 thế hệ mới, tản nhiệt khí động học buồng kín hạn chế bụi bẩn tối ưu.', 22, 26),
(4, 'Lenovo ThinkBook 14 G6+', 17290000, 19500000, 'AMD Ryzen 7 7730U (8 nhân, 16 luồng, up to 4.5GHz)', '16GB DDR4 3200MHz', '512GB PCIe NVMe SSD (2 khe M.2 nâng cấp)', '14.0 inch WUXGA (1920x1200) IPS 300 nits Anti-glare', 'AMD Radeon Graphics', 'Windows 11 Home', '60Wh', 1.38, '2x USB-C 3.2, 2x USB-A 3.2, 1x Hidden USB 2.0 cho chuột không dây, HDMI 2.1, RJ-45, 4-in-1 Card Reader', 'Xám 2 tông màu (Arctic Grey)', 24, 'Lenovo ThinkBook 14 G6+ được dân IT và coder yêu thích nhờ thiết kế vỏ kim loại 2 tông màu thời thượng, cổng kết nối đầy đủ có cả khe giấu receiver chuột không dây tiện lợi.', 16, 39),
(5, 'Acer Nitro 5 Tiger AN515-58-769J', 21490000, 24990000, 'Intel Core i7-12700H (14 nhân, 20 luồng, up to 4.7GHz)', '16GB DDR4 3200MHz (Nâng cấp tối đa 32GB)', '512GB PCIe NVMe SED SSD', '15.6 inch FHD (1920x1080) IPS 144Hz SlimBezel', 'NVIDIA GeForce RTX 3050Ti 4GB GDDR6', 'Windows 11 Home', '57.5Wh', 2.5, '1x Thunderbolt 4, 3x USB 3.2 Gen 2, HDMI 2.1, RJ45 Killer E2600 Ethernet', 'Đen Obsidian với đường cắt sắc sảo', 12, 'Acer Nitro 5 Tiger là dòng laptop Gaming quốc dân được trang bị 2 quạt làm mát công nghệ Acer CoolBoost, 4 khe thoát gió và phím tắt NitroSense chuyên dụng kiểm soát nhiệt độ tức thì.', 24, 28),
(5, 'Acer Predator Helios Neo 16 PHN16-71', 35990000, 39990000, 'Intel Core i7-13700HX (16 nhân, 24 luồng, up to 5.0GHz)', '16GB DDR5 4800MHz', '512GB PCIe NVMe SSD M.2', '16.0 inch WQXGA (2560x1600) 165Hz sRGB 100% G-Sync 500 nits', 'NVIDIA GeForce RTX 4060 8GB GDDR6 (140W TGP, quạt kim loại AeroBlade 3D thế hệ 5)', 'Windows 11 Home', '90Wh', 2.6, '2x Thunderbolt 4, 3x USB 3.2 Gen 2, HDMI 2.1, MicroSD, Killer Ethernet E2600', 'Đen Abyssal Black với mật mã bí ẩn Predator', 24, 'Acer Predator Helios Neo 16 sở hữu quạt tản nhiệt kim loại AeroBlade 3D độc quyền mỏng 0.08mm, keo tản nhiệt kim loại lỏng Liquid Metal và màn hình 16 inch 165Hz chuẩn màu đồ họa.', 9, 12),
(5, 'Acer Swift Go 14 SFG14-71-7463', 22990000, 25490000, 'Intel Core i7-13700H (14 nhân, 20 luồng, chip dòng H hiệu năng cao)', '16GB LPDDR5 4800MHz Onboard', '512GB PCIe Gen4 NVMe SSD', '14.0 inch 2.8K OLED (2880x1800) 90Hz 100% DCI-P3 500 nits True Black 500', 'Intel Iris Xe Graphics', 'Windows 11 Home', '65Wh', 1.25, '2x Thunderbolt 4, 2x USB 3.2 Gen 1, HDMI 2.1, MicroSD Card Reader, Jack 3.5mm', 'Bạc thuần khiết (Pure Silver) vỏ nhôm nguyên khối', 12, 'Acer Swift Go 14 gói gọn sức mạnh của chip hiệu năng cao Intel Core i7 dòng H trong thân máy nhôm siêu mỏng nhẹ chỉ 1.25kg cùng màn hình 2.8K OLED rực rỡ đến nghẹt thở.', 15, 33),
(5, 'Acer Aspire 5 A515-58M-56XG', 14490000, 16290000, 'Intel Core i5-1335U (10 nhân, 12 luồng, up to 4.6GHz)', '16GB LPDDR5 4800MHz', '512GB PCIe NVMe SSD', '15.6 inch FHD IPS Acer ComfyView chống lóa', 'Intel Iris Xe Graphics', 'Windows 11 Home', '50Wh', 1.7, '1x Thunderbolt 4 / USB-C, 2x USB 3.2 Gen 1, HDMI 2.1, Jack Audio 3.5mm, Wi-Fi 6E', 'Xám sắt (Steel Grey) nắp lưng nhôm', 12, 'Acer Aspire 5 là laptop văn phòng toàn diện với RAM LPDDR5 tốc độ cao, webcam 1080p sắc nét hỗ trợ lọc ồn AI PurifiedVoice và cổng Thunderbolt 4 cao cấp.', 30, 24),
(5, 'Acer Swift X 14 SFX14-71G', 32490000, 35990000, 'Intel Core i7-13700H (14 nhân, 20 luồng)', '16GB LPDDR5 4800MHz', '1TB PCIe Gen4 NVMe SSD', '14.5 inch 2.8K OLED (2880x1800) 120Hz 100% DCI-P3 Calman Verified', 'NVIDIA GeForce RTX 4050 6GB GDDR6 Studio Driver', 'Windows 11 Home', '76Wh', 1.55, '1x Thunderbolt 4, 2x USB 3.2 Gen 1, HDMI 2.1, MicroSD card reader, Jack 3.5mm', 'Xám thép (Steel Gray)', 24, 'Acer Swift X 14 là chiếc laptop nhỏ gọn chỉ 1.55kg nhưng chứa đựng card đồ họa rời RTX 4050 và màn hình 120Hz chuẩn màu Calman Verified, trợ thủ đắc lực của các nhà sáng tạo nội dung.', 10, 27),
(5, 'Acer Aspire 3 A315-59-381E', 9490000, 10990000, 'Intel Core i3-1215U (6 nhân, 8 luồng, up to 4.4GHz)', '8GB DDR4 3200MHz', '256GB PCIe NVMe SSD', '15.6 inch FHD (1920x1080) LED-backlit Acer BlueLightShield', 'Intel UHD Graphics', 'Windows 11 Home', '40Wh', 1.7, '3x USB 3.2 Gen 1, 1x HDMI 2.1, 1x RJ-45 LAN, Jack tai nghe 3.5mm', 'Bạc sáng (Pure Silver)', 12, 'Acer Aspire 3 nổi bật với mức giá chỉ hơn 9 triệu đồng, bàn phím số đầy đủ, màn hình rộng 15.6 inch công nghệ bảo vệ mắt BlueLightShield hoàn hảo cho học sinh và văn phòng nhẹ nhàng.', 35, 32),
(6, 'Apple MacBook Air 13 inch M2 (2022)', 24290000, 27990000, 'Apple M2 chip (8-core CPU với 4 nhân hiệu năng cao và 4 nhân tiết kiệm điện)', '8GB Unified Memory', '256GB SSD siêu tốc', '13.6 inch Liquid Retina (2560x1664) 500 nits True Tone dải màu P3', 'Apple 8-core GPU', 'macOS Sonoma', '52.6Wh Li-Po (Pin dùng tới 18 giờ liên tục)', 1.24, '2x Thunderbolt / USB 4, Cổng sạc MagSafe 3, Jack 3.5mm hỗ trợ tai nghe trở kháng cao', 'Xanh đen bóng đêm (Midnight)', 12, 'MacBook Air M2 tái định nghĩa dòng laptop mỏng nhẹ với thiết kế vuông vức thời thượng, độ mỏng chỉ 11.3mm, màn hình tai thỏ Liquid Retina sắc nét và thời lượng pin huyền thoại tới 18 giờ.', 25, 48),
(6, 'Apple MacBook Air 15 inch M3 (2024)', 37990000, 40990000, 'Apple M3 chip (8-core CPU, tiến trình 3nm đột phá)', '16GB Unified Memory', '512GB SSD', '15.3 inch Liquid Retina (2880x1864) 500 nits True Tone dải màu rộng P3', 'Apple 10-core GPU hỗ trợ Ray Tracing phần cứng', 'macOS Sonoma', '66.5Wh (Lên đến 18 giờ xem phim)', 1.51, '2x Thunderbolt / USB 4 (Hỗ trợ 2 màn hình ngoài khi gập máy), MagSafe 3, Jack 3.5mm', 'Vàng ánh sao (Starlight)', 12, 'MacBook Air 15 inch M3 mang đến không gian hiển thị rộng rãi, hệ thống 6 loa âm thanh vòm Spatial Audio sống động, chip M3 tiến trình 3nm hỗ trợ xuất 2 màn hình ngoài cực kỳ tiện ích cho công việc.', 15, 19),
(6, 'Apple MacBook Pro 14 inch M3 Pro (2023)', 49990000, 53990000, 'Apple M3 Pro chip (11-core CPU: 5 nhân hiệu năng cao + 6 nhân tiết kiệm điện)', '18GB Unified Memory', '512GB SSD siêu nhanh', '14.2 inch Liquid Retina XDR (3024x1964) ProMotion 120Hz 1600 nits HDR', 'Apple 14-core GPU với Dynamic Caching và Hardware-accelerated Ray Tracing', 'macOS Sonoma', '70Wh', 1.61, '3x Thunderbolt 4, HDMI, Khe cắm thẻ SDXC, Cổng sạc MagSafe 3, Jack 3.5mm', 'Đen không gian (Space Black) chống bám vân tay', 12, 'MacBook Pro 14 M3 Pro là cỗ máy chuyên nghiệp cho các kỹ sư lập trình, chuyên viên dựng phim và thiết kế với màn hình Liquid Retina XDR 120Hz độ tương phản 1.000.000:1 cùng màu Space Black ấn tượng.', 12, 12),
(6, 'Apple MacBook Pro 16 inch M3 Max (2023)', 89990000, 94990000, 'Apple M3 Max chip (16-core CPU: 12 nhân hiệu năng cao + 4 nhân tiết kiệm điện)', '36GB Unified Memory (Băng thông bộ nhớ 300GB/s)', '1TB SSD cực nhanh', '16.2 inch Liquid Retina XDR (3456x2234) ProMotion 120Hz Extreme Dynamic Range 1600 nits', 'Apple 40-core GPU khủng xử lý render 3D và video 8K ProRes thời gian thực', 'macOS Sonoma', '100Wh (Thời lượng pin lên đến 22 giờ liên tục)', 2.16, '3x Thunderbolt 4, Cổng HDMI hỗ trợ màn hình 8K, Khe cắm thẻ SDXC, MagSafe 3', 'Đen không gian (Space Black)', 12, 'Đỉnh cao máy trạm di động Apple MacBook Pro 16 M3 Max với 40-core GPU thách thức mọi máy bàn cấu hình nặng nhất, pin 100Wh dung lượng tối đa được phép mang lên máy bay và thời lượng 22 tiếng.', 6, 14),
(6, 'Apple MacBook Air 13 inch M3 (2024)', 29990000, 32490000, 'Apple M3 chip (8-core CPU)', '16GB Unified Memory', '256GB SSD', '13.6 inch Liquid Retina (2560x1664) 500 nits True Tone', 'Apple 8-core GPU', 'macOS Sonoma', '52.6Wh', 1.24, '2x Thunderbolt / USB 4, MagSafe 3, Jack 3.5mm, Wi-Fi 6E', 'Xám không gian (Space Gray)', 12, 'MacBook Air M3 bản 16GB RAM nâng cao hiệu suất làm việc đa nhiệm với vi xử lý thế hệ 3nm tân tiến, kết nối Wi-Fi 6E nhanh gấp đôi và thân máy nhôm tái chế 100% thân thiện môi trường.', 20, 27),
(6, 'Apple MacBook Pro 14 inch M3 (2023)', 38990000, 41990000, 'Apple M3 chip (8-core CPU)', '8GB Unified Memory', '512GB SSD', '14.2 inch Liquid Retina XDR 120Hz ProMotion 1000 nits SDR, 1600 nits HDR', 'Apple 10-core GPU', 'macOS Sonoma', '70Wh (Thời lượng pin lên tới 22 giờ)', 1.55, '2x Thunderbolt / USB 4, HDMI, SDXC, MagSafe 3, Jack 3.5mm', 'Bạc sang trọng (Silver)', 12, 'MacBook Pro 14 inch M3 kết hợp vẻ đẹp của màn hình đỉnh cao Liquid Retina XDR 120Hz ProMotion với mức giá dễ tiếp cận, thời lượng pin 22 giờ và cổng kết nối HDMI, khe SD thuận tiện.', 14, 32);

-- 4. Biến thể mẫu (72 cấu hình)
INSERT INTO laptop_variant (laptop_id, ten_variant, gia_ban, so_luong_ton) VALUES
(1, 'Bản 8GB RAM / 512GB SSD', 13990000, 15),
(1, 'Bản 16GB RAM / 512GB SSD', 15490000, 10),
(2, 'Bản 16GB RAM / 1TB SSD', 45990000, 6),
(2, 'Bản 32GB RAM / 2TB SSD', 52990000, 4),
(3, 'Bản RTX 4050 6GB / 16GB RAM', 24990000, 8),
(3, 'Bản RTX 4060 8GB / 16GB RAM', 28490000, 7),
(4, 'Bản 8GB RAM / 256GB SSD', 10990000, 18),
(4, 'Bản 16GB RAM / 512GB SSD', 12990000, 12),
(5, 'Bản Core i5 vPro / 16GB / 512GB', 27500000, 6),
(5, 'Bản Core i7 vPro / 16GB / 512GB', 33500000, 6),
(6, 'Bản RTX 4070 8GB / 32GB RAM / 1TB', 59990000, 5),
(6, 'Bản RTX 4080 12GB / 32GB RAM / 2TB', 72990000, 3),
(7, 'Bản 8GB RAM / 512GB SSD', 14990000, 12),
(7, 'Bản 16GB RAM / 512GB SSD', 16890000, 10),
(8, 'Bản 16GB RAM / 1TB SSD', 42990000, 6),
(8, 'Bản 32GB RAM / 2TB SSD', 49990000, 4),
(9, 'Bản RTX 4050 6GB / 16GB RAM', 25490000, 10),
(9, 'Bản RTX 4060 8GB / 16GB RAM', 28990000, 8),
(10, 'Bản 16GB RAM / RTX 4050', 39990000, 4),
(10, 'Bản 32GB RAM / RTX 4060', 48990000, 3),
(11, 'Bản 8GB RAM / 512GB SSD', 16990000, 10),
(11, 'Bản 16GB RAM / 512GB SSD', 18990000, 10),
(12, 'Bản 8GB RAM / 256GB SSD', 9890000, 20),
(12, 'Bản 8GB RAM / 512GB SSD', 10690000, 15),
(13, 'Bản RTX 4080 12GB / 32GB RAM', 79990000, 3),
(13, 'Bản RTX 4090 16GB / 64GB RAM', 99990000, 2),
(14, 'Bản Core Ultra 5 / 16GB RAM / 512GB', 26990000, 8),
(14, 'Bản Core Ultra 7 / 32GB RAM / 1TB', 32990000, 6),
(15, 'Bản 16GB RAM / 512GB SSD', 22990000, 11),
(15, 'Bản 16GB RAM / 1TB SSD', 24490000, 8),
(16, 'Bản Core i5-13500H / 16GB RAM', 17490000, 12),
(16, 'Bản Core i7-13700H / 16GB RAM', 20990000, 8),
(17, 'Bản RTX 4060 / 16GB RAM / 1TB', 46990000, 4),
(17, 'Bản RTX 4070 / 32GB RAM / 1TB', 54990000, 4),
(18, 'Bản 8GB RAM / 512GB SSD', 10990000, 14),
(18, 'Bản 16GB RAM / 512GB SSD', 12490000, 14),
(19, 'Bản 16GB RAM / 512GB SSD', 44990000, 4),
(19, 'Bản 32GB RAM / 1TB SSD', 52990000, 4),
(20, 'Bản RTX 4060 8GB / 16GB RAM / 512GB', 38990000, 6),
(20, 'Bản RTX 4070 8GB / 32GB RAM / 1TB', 45490000, 6),
(21, 'Bản Core i5-12450H / 16GB RAM', 15990000, 15),
(21, 'Bản Core i7-13620H / 16GB RAM', 18990000, 10),
(22, 'Bản 16GB RAM / 512GB SSD', 26490000, 6),
(22, 'Bản 16GB RAM / 1TB SSD', 28990000, 5),
(23, 'Bản RTX 3050 6GB / 12GB RAM', 18990000, 12),
(23, 'Bản RTX 4050 6GB / 16GB RAM', 22490000, 10),
(24, 'Bản Ryzen 5 7530U / 16GB RAM', 14990000, 8),
(24, 'Bản Ryzen 7 7730U / 16GB RAM', 17290000, 8),
(25, 'Bản 8GB RAM / 512GB SSD', 19990000, 14),
(25, 'Bản 16GB RAM / 512GB SSD', 21490000, 10),
(26, 'Bản RTX 4050 6GB / 16GB RAM', 31990000, 4),
(26, 'Bản RTX 4060 8GB / 16GB RAM', 35990000, 5),
(27, 'Bản Core i5-13500H / 16GB / 512GB', 18990000, 8),
(27, 'Bản Core i7-13700H / 16GB / 512GB', 22990000, 7),
(28, 'Bản 8GB RAM / 512GB SSD', 12990000, 15),
(28, 'Bản 16GB RAM / 512GB SSD', 14490000, 15),
(29, 'Bản RTX 3050 6GB / 16GB RAM', 26990000, 5),
(29, 'Bản RTX 4050 6GB / 16GB RAM', 32490000, 5),
(30, 'Bản 8GB RAM / 256GB SSD', 9490000, 20),
(30, 'Bản 8GB RAM / 512GB SSD', 10290000, 15),
(31, 'Bản 8GB RAM / 256GB SSD', 24290000, 15),
(31, 'Bản 16GB RAM / 512GB SSD', 31990000, 10),
(32, 'Bản 8GB RAM / 256GB SSD', 31990000, 8),
(32, 'Bản 16GB RAM / 512GB SSD', 37990000, 7),
(33, 'Bản 18GB RAM / 512GB SSD', 49990000, 7),
(33, 'Bản 36GB RAM / 1TB SSD', 62990000, 5),
(34, 'Bản 36GB RAM / 1TB SSD', 89990000, 3),
(34, 'Bản 48GB RAM / 1TB SSD', 99990000, 3),
(35, 'Bản 8GB RAM / 256GB SSD', 26990000, 10),
(35, 'Bản 16GB RAM / 256GB SSD', 29990000, 10),
(36, 'Bản 8GB RAM / 512GB SSD', 38990000, 8),
(36, 'Bản 16GB RAM / 512GB SSD', 43990000, 6);

-- 5. Hình ảnh laptop (72 ảnh chất lượng cao cục bộ)
INSERT INTO laptop_images (laptop_id, url_anh, alt_text, la_anh_chinh, thu_tu) VALUES
(1, '/uploads/dell-inspiron-15-main.jpg', 'Dell Inspiron 15 3520 - Ảnh chính', 1, 1),
(1, '/uploads/dell-xps-13.jpg', 'Dell Inspiron 15 3520 - Góc nhìn khác', 0, 2),
(2, '/uploads/dell-xps-13.jpg', 'Dell XPS 13 Plus 9320 - Ảnh chính', 1, 1),
(2, '/uploads/dell-inspiron-15-main.jpg', 'Dell XPS 13 Plus 9320 - Góc nhìn khác', 0, 2),
(3, '/uploads/dell-inspiron-15-main.jpg', 'Dell Gaming G15 5530 - Ảnh chính', 1, 1),
(3, '/uploads/dell-xps-13.jpg', 'Dell Gaming G15 5530 - Góc nhìn khác', 0, 2),
(4, '/uploads/dell-inspiron-15-main.jpg', 'Dell Vostro 14 3430 - Ảnh chính', 1, 1),
(4, '/uploads/dell-xps-13.jpg', 'Dell Vostro 14 3430 - Góc nhìn khác', 0, 2),
(5, '/uploads/dell-xps-13.jpg', 'Dell Latitude 7440 - Ảnh chính', 1, 1),
(5, '/uploads/dell-inspiron-15-main.jpg', 'Dell Latitude 7440 - Góc nhìn khác', 0, 2),
(6, '/uploads/dell-xps-13.jpg', 'Dell Alienware m16 R2 - Ảnh chính', 1, 1),
(6, '/uploads/dell-inspiron-15-main.jpg', 'Dell Alienware m16 R2 - Góc nhìn khác', 0, 2),
(7, '/uploads/hp-pavilion-15-main.jpg', 'HP Pavilion 15-eg3093TU - Ảnh chính', 1, 1),
(7, '/uploads/hp-spectre-x360.jpg', 'HP Pavilion 15-eg3093TU - Góc nhìn khác', 0, 2),
(8, '/uploads/hp-spectre-x360.jpg', 'HP Spectre x360 14-ef2003TU (2-in-1) - Ảnh chính', 1, 1),
(8, '/uploads/hp-pavilion-15-main.jpg', 'HP Spectre x360 14-ef2003TU (2-in-1) - Góc nhìn khác', 0, 2),
(9, '/uploads/hp-pavilion-15-main.jpg', 'HP Victus 16-r0129TX - Ảnh chính', 1, 1),
(9, '/uploads/hp-spectre-x360.jpg', 'HP Victus 16-r0129TX - Góc nhìn khác', 0, 2),
(10, '/uploads/hp-spectre-x360.jpg', 'HP Envy 16-h1013TX - Ảnh chính', 1, 1),
(10, '/uploads/hp-pavilion-15-main.jpg', 'HP Envy 16-h1013TX - Góc nhìn khác', 0, 2),
(11, '/uploads/hp-pavilion-15-main.jpg', 'HP ProBook 450 G10 - Ảnh chính', 1, 1),
(11, '/uploads/hp-spectre-x360.jpg', 'HP ProBook 450 G10 - Góc nhìn khác', 0, 2),
(12, '/uploads/hp-pavilion-15-main.jpg', 'HP 240 G9 - Ảnh chính', 1, 1),
(12, '/uploads/hp-spectre-x360.jpg', 'HP 240 G9 - Góc nhìn khác', 0, 2),
(13, '/uploads/asus-rog-g15-main.jpg', 'Asus ROG Strix SCAR 16 G634JZ - Ảnh chính', 1, 1),
(13, '/uploads/asus-zenbook-14.jpg', 'Asus ROG Strix SCAR 16 G634JZ - Góc nhìn khác', 0, 2),
(14, '/uploads/asus-zenbook-14.jpg', 'Asus Zenbook 14 OLED UX3405MA - Ảnh chính', 1, 1),
(14, '/uploads/asus-rog-g15-main.jpg', 'Asus Zenbook 14 OLED UX3405MA - Góc nhìn khác', 0, 2),
(15, '/uploads/asus-rog-g15-main.jpg', 'Asus TUF Gaming A15 FA507NU - Ảnh chính', 1, 1),
(15, '/uploads/asus-zenbook-14.jpg', 'Asus TUF Gaming A15 FA507NU - Góc nhìn khác', 0, 2),
(16, '/uploads/asus-zenbook-14.jpg', 'Asus Vivobook 15 OLED A1505VA - Ảnh chính', 1, 1),
(16, '/uploads/asus-rog-g15-main.jpg', 'Asus Vivobook 15 OLED A1505VA - Góc nhìn khác', 0, 2),
(17, '/uploads/asus-rog-g15-main.jpg', 'Asus ROG Zephyrus G14 GA403UI - Ảnh chính', 1, 1),
(17, '/uploads/asus-zenbook-14.jpg', 'Asus ROG Zephyrus G14 GA403UI - Góc nhìn khác', 0, 2),
(18, '/uploads/asus-zenbook-14.jpg', 'Asus Vivobook Go 14 E1404FA - Ảnh chính', 1, 1),
(18, '/uploads/asus-rog-g15-main.jpg', 'Asus Vivobook Go 14 E1404FA - Góc nhìn khác', 0, 2),
(19, '/uploads/lenovo-thinkpad-x1-main.jpg', 'Lenovo ThinkPad X1 Carbon Gen 11 - Ảnh chính', 1, 1),
(19, '/uploads/lenovo-legion-pro-5.jpg', 'Lenovo ThinkPad X1 Carbon Gen 11 - Góc nhìn khác', 0, 2),
(20, '/uploads/lenovo-legion-pro-5.jpg', 'Lenovo Legion Pro 5 16IRX9 - Ảnh chính', 1, 1),
(20, '/uploads/lenovo-thinkpad-x1-main.jpg', 'Lenovo Legion Pro 5 16IRX9 - Góc nhìn khác', 0, 2),
(21, '/uploads/lenovo-thinkpad-x1-main.jpg', 'Lenovo IdeaPad Slim 5 14IAH8 - Ảnh chính', 1, 1),
(21, '/uploads/lenovo-legion-pro-5.jpg', 'Lenovo IdeaPad Slim 5 14IAH8 - Góc nhìn khác', 0, 2),
(22, '/uploads/lenovo-thinkpad-x1-main.jpg', 'Lenovo Yoga Slim 7 Pro 14IAP7 - Ảnh chính', 1, 1),
(22, '/uploads/lenovo-legion-pro-5.jpg', 'Lenovo Yoga Slim 7 Pro 14IAP7 - Góc nhìn khác', 0, 2),
(23, '/uploads/lenovo-legion-pro-5.jpg', 'Lenovo LOQ 15IAX9 - Ảnh chính', 1, 1),
(23, '/uploads/lenovo-thinkpad-x1-main.jpg', 'Lenovo LOQ 15IAX9 - Góc nhìn khác', 0, 2),
(24, '/uploads/lenovo-thinkpad-x1-main.jpg', 'Lenovo ThinkBook 14 G6+ - Ảnh chính', 1, 1),
(24, '/uploads/lenovo-legion-pro-5.jpg', 'Lenovo ThinkBook 14 G6+ - Góc nhìn khác', 0, 2),
(25, '/uploads/acer-nitro-5-main.jpg', 'Acer Nitro 5 Tiger AN515-58-769J - Ảnh chính', 1, 1),
(25, '/uploads/acer-swift-go-14.jpg', 'Acer Nitro 5 Tiger AN515-58-769J - Góc nhìn khác', 0, 2),
(26, '/uploads/acer-nitro-5-main.jpg', 'Acer Predator Helios Neo 16 PHN16-71 - Ảnh chính', 1, 1),
(26, '/uploads/acer-swift-go-14.jpg', 'Acer Predator Helios Neo 16 PHN16-71 - Góc nhìn khác', 0, 2),
(27, '/uploads/acer-swift-go-14.jpg', 'Acer Swift Go 14 SFG14-71-7463 - Ảnh chính', 1, 1),
(27, '/uploads/acer-nitro-5-main.jpg', 'Acer Swift Go 14 SFG14-71-7463 - Góc nhìn khác', 0, 2),
(28, '/uploads/acer-swift-go-14.jpg', 'Acer Aspire 5 A515-58M-56XG - Ảnh chính', 1, 1),
(28, '/uploads/acer-nitro-5-main.jpg', 'Acer Aspire 5 A515-58M-56XG - Góc nhìn khác', 0, 2),
(29, '/uploads/acer-swift-go-14.jpg', 'Acer Swift X 14 SFX14-71G - Ảnh chính', 1, 1),
(29, '/uploads/acer-nitro-5-main.jpg', 'Acer Swift X 14 SFX14-71G - Góc nhìn khác', 0, 2),
(30, '/uploads/acer-swift-go-14.jpg', 'Acer Aspire 3 A315-59-381E - Ảnh chính', 1, 1),
(30, '/uploads/acer-nitro-5-main.jpg', 'Acer Aspire 3 A315-59-381E - Góc nhìn khác', 0, 2),
(31, '/uploads/macbook-air-m3-main.jpg', 'Apple MacBook Air 13 inch M2 (2022) - Ảnh chính', 1, 1),
(31, '/uploads/macbook-pro-16-m3.jpg', 'Apple MacBook Air 13 inch M2 (2022) - Góc nhìn khác', 0, 2),
(32, '/uploads/macbook-air-m3-main.jpg', 'Apple MacBook Air 15 inch M3 (2024) - Ảnh chính', 1, 1),
(32, '/uploads/macbook-pro-16-m3.jpg', 'Apple MacBook Air 15 inch M3 (2024) - Góc nhìn khác', 0, 2),
(33, '/uploads/macbook-pro-16-m3.jpg', 'Apple MacBook Pro 14 inch M3 Pro (2023) - Ảnh chính', 1, 1),
(33, '/uploads/macbook-air-m3-main.jpg', 'Apple MacBook Pro 14 inch M3 Pro (2023) - Góc nhìn khác', 0, 2),
(34, '/uploads/macbook-pro-16-m3.jpg', 'Apple MacBook Pro 16 inch M3 Max (2023) - Ảnh chính', 1, 1),
(34, '/uploads/macbook-air-m3-main.jpg', 'Apple MacBook Pro 16 inch M3 Max (2023) - Góc nhìn khác', 0, 2),
(35, '/uploads/macbook-air-m3-main.jpg', 'Apple MacBook Air 13 inch M3 (2024) - Ảnh chính', 1, 1),
(35, '/uploads/macbook-pro-16-m3.jpg', 'Apple MacBook Air 13 inch M3 (2024) - Góc nhìn khác', 0, 2),
(36, '/uploads/macbook-pro-16-m3.jpg', 'Apple MacBook Pro 14 inch M3 (2023) - Ảnh chính', 1, 1),
(36, '/uploads/macbook-air-m3-main.jpg', 'Apple MacBook Pro 14 inch M3 (2023) - Góc nhìn khác', 0, 2);

-- 6. Bài viết tin tức mẫu chất lượng cao
INSERT INTO tin_tuc (tieu_de, slug, tom_tat, noi_dung, hinh_anh, danh_muc, tac_gia_ten, noi_bat, luot_xem, trang_thai) VALUES
('Đánh giá chi tiết MacBook Pro M3 Max: Quái vật hiệu năng cho dân đồ họa và Render 3D', 'danh-gia-chi-tiet-macbook-pro-m3-max', 'Khám phá sức mạnh của vi xử lý Apple M3 Max tiến trình 3nm, GPU 40 nhân đỉnh cao, thời lượng pin 22 giờ liên tục và màn hình Liquid Retina XDR 1600 nits phá vỡ mọi giới hạn máy trạm di động.', '<h2>1. Thiết kế sang trọng với màu sắc Space Black</h2><p>MacBook Pro 16 inch M3 Max tiếp tục kế thừa phong cách thiết kế kim loại nguyên khối mạnh mẽ.</p>', '/uploads/macbook-pro-16-m3.jpg', 'Đánh giá Laptop', 'Đội ngũ KTSHOP', 1, 248, 1),
('Top 5 laptop gaming đáng mua nhất tầm giá 20 - 30 triệu đồng năm 2024', 'top-5-laptop-gaming-dang-mua-nhat-2024', 'Phân khúc laptop gaming từ 20 đến 30 triệu đồng đang nóng hơn bao giờ hết với sự xuất hiện của dòng card đồ họa RTX 4050 và RTX 4060 thế hệ Ada Lovelace.', '<h2>Top các mẫu laptop gaming nổi bật</h2><p>Asus TUF Gaming A15, Acer Nitro 5 Tiger, Lenovo LOQ 15, HP Victus 16 và Dell G15.</p>', '/uploads/asus-rog-g15-main.jpg', 'Tư vấn mua sắm', 'Chuyên gia KTSHOP', 1, 385, 1),
('Intel Core Ultra vs Apple M3: Cuộc chiến chip AI trên laptop mỏng nhẹ', 'intel-core-ultra-vs-apple-m3-cuoc-chien-chip-ai', 'So sánh chuyên sâu giữa nền tảng Intel Meteor Lake tích hợp NPU AI Boost thế hệ mới và vi xử lý Apple Silicon M3 3nm.', '<h2>Kỷ nguyên laptop trí tuệ nhân tạo</h2><p>So sánh kiến trúc NPU và tối ưu pin giữa Intel Core Ultra và Apple M3.</p>', '/uploads/dell-xps-13.jpg', 'Công nghệ', 'KTSHOP Tech Review', 1, 195, 1),
('Màn hình OLED trên laptop: Ưu nhược điểm và có thực sự đáng tiền?', 'man-hinh-oled-tren-laptop-uu-nhuoc-diem', 'Độ tương phản vô cực, màu đen tuyệt đối, độ chuẩn màu 100% DCI-P3 và tần số quét 120Hz trên các dòng Asus Zenbook và Acer Swift Go.', '<h2>Ưu nhược điểm của công nghệ OLED</h2><p>Độ sâu màu đen tuyệt đối và chuẩn màu điện ảnh.</p>', '/uploads/asus-zenbook-14.jpg', 'Công nghệ', 'Ban Biên Tập KTSHOP', 0, 142, 1),
('Bí quyết tăng thời lượng pin laptop Windows 11 lên thêm 30% hiệu quả', 'bi-quyet-tang-thoi-luong-pin-laptop-windows-11', 'Tổng hợp 6 phương pháp tinh chỉnh hệ điều hành Windows 11, kiểm soát tiến trình chạy ngầm, quản lý độ sáng và tần số quét Dynamic Refresh Rate.', '<h2>Mẹo tiết kiệm pin Windows 11</h2><p>Bật Energy Saver, Dynamic Refresh Rate và kiểm soát ứng dụng chạy ngầm.</p>', '/uploads/hp-spectre-x360.jpg', 'Mẹo & Thủ thuật', 'Kỹ Thuật Viên KTSHOP', 0, 210, 1),
('Bùng nổ siêu khuyến mãi mùa tựu trường: Giảm đến 5 triệu đồng và tặng balo cao cấp', 'khuyen-mai-laptop-mua-tuu-truong-giam-den-5-trieu', 'Chào đón năm học mới, KTSHOP tưng bừng khởi động chương trình ưu đãi trợ giá lớn nhất năm: giảm ngay đến 5.000.000₫ cho học sinh, sinh viên!', '<h2>Chương trình Cùng KTSHOP Vững Bước Tương Lai</h2><p>Ưu đãi trợ giá sinh viên học sinh lớn nhất năm tại KTSHOP.</p>', '/uploads/acer-nitro-5-main.jpg', 'Khuyến mãi', 'Ban Quản Trị KTSHOP', 1, 520, 1);
