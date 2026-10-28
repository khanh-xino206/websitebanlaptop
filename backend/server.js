const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Kết nối database MySQL (tự động chạy khi import)
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Cấu hình thư mục lưu file Upload ─────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Cấu hình Multer để lưu file vào đĩa
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, 'img-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, GIF)!'));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Tối đa 10MB
    fileFilter
});

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Phục vụ file tĩnh (Static Uploads) ────────────────────
app.use('/uploads', express.static(UPLOADS_DIR));


// ─── Route kiểm tra server ────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        message: '🚀 Server Shop Laptop đang chạy!',
        version: '1.0.0',
        database: process.env.DB_NAME,
    });
});

// ─── API Trang chủ (Lấy Nhãn hiệu & Sản phẩm tối ưu 2 queries) ─────────────
app.get('/api/home', async (req, res) => {
    try {
        // 1. Lấy danh sách nhãn hiệu đang hoạt động
        const [brands] = await db.query('SELECT * FROM nhan_Hieu WHERE trang_thai = 1 ORDER BY ten_NH');
        if (!brands.length) {
            return res.json({ success: true, data: [] });
        }

        // 2. Lấy tối đa 5 sản phẩm cho mỗi nhãn hiệu chỉ với 1 query duy nhất bằng Window Function
        const [rankedProducts] = await db.query(`
            SELECT * FROM (
                SELECT l.*, n.ten_NH, i.url_anh,
                       ROW_NUMBER() OVER (PARTITION BY l.nhan_hieu_id ORDER BY l.id DESC) as rn
                FROM laptop_Detail l
                JOIN nhan_Hieu n ON n.id = l.nhan_hieu_id
                LEFT JOIN (
                    SELECT laptop_id, url_anh
                    FROM (
                        SELECT laptop_id, url_anh,
                               ROW_NUMBER() OVER (PARTITION BY laptop_id ORDER BY la_anh_chinh DESC, thu_tu ASC, id ASC) as img_rn
                        FROM laptop_images
                    ) ranked_img
                    WHERE img_rn = 1
                ) i ON l.id = i.laptop_id
                WHERE l.trang_thai = 1 AND n.trang_thai = 1
            ) sub
            WHERE rn <= 5
        `);

        // Gom nhóm sản phẩm theo nhãn hiệu
        const brandProductsMap = new Map();
        for (const p of rankedProducts) {
            if (!brandProductsMap.has(p.nhan_hieu_id)) {
                brandProductsMap.set(p.nhan_hieu_id, []);
            }
            brandProductsMap.get(p.nhan_hieu_id).push(p);
        }

        const data = brands.map(brand => ({
            ...brand,
            products: brandProductsMap.get(brand.id) || []
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('Home API error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
});

// ─── API Trang sản phẩm với bộ lọc & nhu cầu sử dụng ───────
app.get('/api/san-pham/filters', async (req, res) => {
    try {
        const [brands] = await db.query('SELECT id, ten_NH FROM nhan_Hieu WHERE trang_thai = 1 ORDER BY ten_NH');
        const [prices] = await db.query('SELECT MIN(gia_ban) AS min_price, MAX(gia_ban) AS max_price FROM laptop_Detail WHERE trang_thai = 1');

        // Bộ lọc chuẩn hóa giúp trải nghiệm mượt mà, đầy đủ sản phẩm cho từng lựa chọn
        const cpus = [
            'Intel Core i3',
            'Intel Core i5',
            'Intel Core i7',
            'Intel Core i9',
            'Intel Core Ultra',
            'AMD Ryzen 5',
            'AMD Ryzen 7',
            'AMD Ryzen 9',
            'Apple M2',
            'Apple M3'
        ];

        const rams = [
            '8GB',
            '12GB',
            '16GB',
            '18GB',
            '32GB',
            '36GB'
        ];

        const disks = [
            '256GB',
            '512GB',
            '1TB'
        ];

        const colors = [
            'Bạc',
            'Đen',
            'Xám',
            'Trắng',
            'Vàng',
            'Xanh'
        ];

        const nhu_cau = [
            { id: 'van_phong', label: 'Văn phòng - Học tập' },
            { id: 'sinh_vien', label: 'Sinh viên - Giá tốt' },
            { id: 'gaming', label: 'Gaming - Đồ họa nặng' },
            { id: 'do_hoa', label: 'Thiết kế đồ họa - Kỹ thuật' },
            { id: 'mong_nhe', label: 'Mỏng nhẹ - Doanh nhân' }
        ];

        res.json({
            success: true,
            data: {
                brands,
                cpus,
                rams,
                disks,
                colors,
                nhu_cau,
                priceRange: { min: Number(prices[0]?.min_price || 0), max: Number(prices[0]?.max_price || 0) },
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
});

// ─── API So sánh thông số kỹ thuật Laptop (Tối đa 4 máy) ────
app.get('/api/san-pham/so-sanh', async (req, res) => {
    try {
        const rawIds = String(req.query.ids || '').split(',').map(id => Number(id.trim())).filter(id => Number.isInteger(id) && id > 0);
        if (rawIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ít nhất một mã sản phẩm cần so sánh.' });
        }
        const ids = [...new Set(rawIds)].slice(0, 4); // Tối đa 4 máy

        const [products] = await db.query(
            `SELECT l.*, n.ten_NH, i.url_anh
             FROM laptop_Detail l
             JOIN nhan_Hieu n ON n.id = l.nhan_hieu_id
             LEFT JOIN (
                 SELECT laptop_id, url_anh FROM (
                     SELECT laptop_id, url_anh,
                            ROW_NUMBER() OVER (PARTITION BY laptop_id ORDER BY la_anh_chinh DESC, thu_tu ASC, id ASC) as rn
                     FROM laptop_images
                 ) ranked_img WHERE rn = 1
             ) i ON l.id = i.laptop_id
             WHERE l.id IN (${ids.map(() => '?').join(',')}) AND l.trang_thai = 1`,
            ids
        );

        res.json({ success: true, data: products });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể so sánh sản phẩm.' });
    }
});

// ─── API Chi tiết sản phẩm & Gợi ý sản phẩm liên quan ────────
app.get('/api/san-pham/:id', async (req, res) => {
    try {
        const productId = Number(req.params.id);
        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({ success: false, message: 'Mã sản phẩm không hợp lệ.' });
        }

        const [products] = await db.query(
            `SELECT l.*, n.ten_NH
             FROM laptop_Detail l
             JOIN nhan_Hieu n ON n.id = l.nhan_hieu_id
             WHERE l.id = ? AND l.trang_thai = 1`,
            [productId]
        );
        if (!products.length) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm đang kinh doanh.' });

        const [images] = await db.query(
            'SELECT id, url_anh, alt_text, la_anh_chinh FROM laptop_images WHERE laptop_id = ? ORDER BY la_anh_chinh DESC, thu_tu, id',
            [productId]
        );
        await db.query('UPDATE laptop_Detail SET luot_xem = luot_xem + 1 WHERE id = ?', [productId]);

        // Đánh giá và số sao trung bình
        const [[ratingStats]] = await db.query(
            `SELECT COALESCE(AVG(so_sao), 5.0) AS avg_rating, COUNT(*) AS review_count
             FROM reviews WHERE laptop_id = ? AND trang_thai = 1`,
            [productId]
        );

        // Lấy 4 sản phẩm liên quan (cùng hãng, cùng nhu cầu hoặc cùng tầm giá ±4 triệu)
        const currentProd = products[0];
        const [relatedProducts] = await db.query(
            `SELECT l.id, l.ten_laptop, l.gia_ban, l.gia_goc, l.cpu, l.ram, l.nhu_cau, n.ten_NH, i.url_anh
             FROM laptop_Detail l
             JOIN nhan_Hieu n ON n.id = l.nhan_hieu_id
             LEFT JOIN (
                 SELECT laptop_id, url_anh FROM (
                     SELECT laptop_id, url_anh,
                            ROW_NUMBER() OVER (PARTITION BY laptop_id ORDER BY la_anh_chinh DESC, thu_tu ASC, id ASC) as rn
                     FROM laptop_images
                 ) r_img WHERE rn = 1
             ) i ON l.id = i.laptop_id
             WHERE l.trang_thai = 1 AND l.id != ? AND (l.nhan_hieu_id = ? OR l.nhu_cau = ? OR ABS(l.gia_ban - ?) <= 4000000)
             ORDER BY (l.nhan_hieu_id = ?) DESC, l.luot_xem DESC
             LIMIT 4`,
            [productId, currentProd.nhan_hieu_id, currentProd.nhu_cau || '', currentProd.gia_ban, currentProd.nhan_hieu_id]
        );

        res.json({
            success: true,
            data: {
                ...currentProd,
                luot_xem: Number(currentProd.luot_xem || 0) + 1,
                rating: Number(Number(ratingStats?.avg_rating || 5).toFixed(1)),
                review_count: Number(ratingStats?.review_count || 0),
                images,
                related_products: relatedProducts
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải chi tiết sản phẩm.' });
    }
});

// ─── API Đánh giá & Nhận xét sản phẩm ────────────────────────
app.get('/api/san-pham/:id/reviews', async (req, res) => {
    try {
        const productId = Number(req.params.id);
        const [reviews] = await db.query(
            `SELECT r.id, r.laptop_id, r.so_sao, r.tieu_de, r.noi_dung, r.verified_purchase, r.created_at,
                    u.ho_ten AS user_name, u.avatar AS user_avatar
             FROM reviews r
             JOIN users u ON u.id = r.user_id
             WHERE r.laptop_id = ? AND r.trang_thai = 1
             ORDER BY r.created_at DESC`,
            [productId]
        );

        const total = reviews.length;
        const avg = total > 0 ? (reviews.reduce((sum, r) => sum + r.so_sao, 0) / total) : 5.0;
        const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(r => { starCounts[r.so_sao] = (starCounts[r.so_sao] || 0) + 1; });

        res.json({
            success: true,
            data: {
                reviews,
                total,
                average: Number(avg.toFixed(1)),
                starCounts
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải đánh giá sản phẩm.' });
    }
});

// Gửi đánh giá sản phẩm (chỉ dành cho khách hàng đã mua và đơn đã giao)
app.post('/api/san-pham/:id/reviews', async (req, res) => {
    // Xác thực token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để đánh giá sản phẩm!' });

    let userId = null;
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const [users] = await db.query(
            `SELECT t.id, u.id as user_id FROM jsontoken t JOIN users u ON u.id = t.user_id
             WHERE t.user_id = ? AND t.access_token = ? AND t.blacklist = 0 AND t.revoke = 0 AND u.trang_thai = 1
             ORDER BY t.id DESC LIMIT 1`,
            [payload.id, token]
        );
        if (!users.length) return res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hạn.' });
        userId = users[0].user_id;
    } catch (e) {
        return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ.' });
    }

    try {
        const productId = Number(req.params.id);
        const { so_sao = 5, tieu_de, noi_dung } = req.body;
        const rating = Number(so_sao);

        if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(rating) || rating < 1 || rating > 5 || !noi_dung?.trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn số sao từ 1 đến 5 và viết nội dung nhận xét.' });
        }

        // Kiểm tra xem user này đã mua và đơn hàng ở trạng thái da_giao hay chưa
        const [orders] = await db.query(
            `SELECT o.id FROM \`order\` o
             JOIN order_detail od ON od.order_id = o.id
             WHERE o.user_id = ? AND od.laptop_id = ? AND o.trang_thai_dh = 'da_giao'
             ORDER BY o.id DESC LIMIT 1`,
            [userId, productId]
        );

        // Kiểm tra xem user này đã từng đánh giá sản phẩm này chưa (chống spam)
        const [existingReview] = await db.query('SELECT id FROM reviews WHERE laptop_id = ? AND user_id = ? LIMIT 1', [productId, userId]);
        if (existingReview.length > 0) {
            return res.status(400).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này rồi!' });
        }

        const verified = orders.length > 0 ? 1 : 0;

        const [result] = await db.query(
            `INSERT INTO reviews (laptop_id, user_id, order_id, so_sao, tieu_de, noi_dung, verified_purchase, trang_thai)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [productId, userId, orders.length > 0 ? orders[0].id : null, rating, String(tieu_de || '').trim() || null, noi_dung.trim(), verified]
        );

        res.status(201).json({
            success: true,
            message: verified ? 'Cảm ơn bạn đã đánh giá sản phẩm (Chứng nhận Đã mua hàng)!' : 'Đã gửi đánh giá sản phẩm thành công!',
            data: { id: result.insertId, verified }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể lưu đánh giá.' });
    }
});

// ─── API Tra cứu Bảo hành & Serial/IMEI trực tuyến ────────────
app.get('/api/bao-hanh/tra-cuu', async (req, res) => {
    try {
        const query = String(req.query.q || '').trim();
        if (!query) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập Mã đơn hàng, Số điện thoại hoặc Số Serial/IMEI để tra cứu.' });
        }

        const [rows] = await db.query(
            `SELECT o.ma_don_hang, o.ho_ten_nguoi_nhan, o.so_dien_thoai, o.trang_thai_dh, o.updated_at AS ngay_giao,
                    od.ten_laptop, od.laptop_id, od.serial_number, l.bao_hanh,
                    DATE_ADD(o.updated_at, INTERVAL COALESCE(l.bao_hanh, 12) MONTH) AS ngay_het_han,
                    CASE WHEN NOW() <= DATE_ADD(o.updated_at, INTERVAL COALESCE(l.bao_hanh, 12) MONTH) THEN 1 ELSE 0 END AS con_han,
                    DATEDIFF(DATE_ADD(o.updated_at, INTERVAL COALESCE(l.bao_hanh, 12) MONTH), NOW()) AS so_ngay_con_lai
             FROM \`order\` o
             JOIN order_detail od ON od.order_id = o.id
             JOIN laptop_Detail l ON l.id = od.laptop_id
             WHERE (o.ma_don_hang = ? OR o.so_dien_thoai = ? OR od.serial_number = ?)
               AND o.trang_thai_dh = 'da_giao'
             ORDER BY o.updated_at DESC`,
            [query, query, query]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin bảo hành máy đã giao với từ khóa trên. Vui lòng kiểm tra lại mã đơn hoặc số điện thoại.'
            });
        }

        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tra cứu bảo hành lúc này.' });
    }
});

// ─── API Tra cứu Đơn hàng công khai ─────────────────────────
app.get('/api/don-hang/tra-cuu', async (req, res) => {
    try {
        const query = String(req.query.q || '').trim();
        if (!query) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập Mã đơn hàng hoặc Số điện thoại để tra cứu.' });
        }

        const [orders] = await db.query(
            `SELECT id, ma_don_hang, ho_ten_nguoi_nhan, so_dien_thoai, dia_chi_giao, ghi_chu,
                    thanh_tien, phi_van_chuyen, tong_tien, phuong_thuc_tt, trang_thai_tt, trang_thai_dh, created_at, updated_at
             FROM \`order\`
             WHERE ma_don_hang = ? OR so_dien_thoai = ?
             ORDER BY id DESC LIMIT 5`,
            [query, query]
        );

        if (!orders.length) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng nào khớp với thông tin tra cứu trên.' });
        }

        for (let order of orders) {
            const [items] = await db.query(
                `SELECT od.*, l.ten_laptop, img.url_anh
                 FROM order_detail od
                 LEFT JOIN laptop_Detail l ON l.id = od.laptop_id
                 LEFT JOIN laptop_images img ON img.laptop_id = l.id AND img.la_anh_chinh = 1
                 WHERE od.order_id = ?`,
                [order.id]
            );
            order.items = items;
            if (order.so_dien_thoai && order.so_dien_thoai.length >= 7) {
                const s = order.so_dien_thoai;
                order.so_dien_thoai_masked = s.slice(0, 3) + '****' + s.slice(-3);
            } else {
                order.so_dien_thoai_masked = order.so_dien_thoai;
            }
        }

        res.json({ success: true, data: orders });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tra cứu đơn hàng lúc này.' });
    }
});

// ─── API Flash Sale ──────────────────────────────────────────
app.get('/api/flash-sale', async (req, res) => {
    try {
        const [products] = await db.query(
            `SELECT l.id, l.ten_laptop, l.gia_ban, l.gia_goc, l.cpu, l.ram, l.o_cung, l.card_do_hoa, l.so_luong_ton, l.nhu_cau,
                    nh.ten_NH AS thuong_hieu,
                    ROUND(((l.gia_goc - l.gia_ban) / l.gia_goc) * 100) AS discount_percent,
                    COALESCE(img.url_anh, '/uploads/dell-inspiron-15-main.jpg') AS url_anh
             FROM laptop_Detail l
             JOIN nhan_Hieu nh ON nh.id = l.nhan_hieu_id
             LEFT JOIN laptop_images img ON img.laptop_id = l.id AND img.la_anh_chinh = 1
             WHERE l.trang_thai = 1 AND l.gia_goc IS NOT NULL AND l.gia_goc > l.gia_ban
             ORDER BY discount_percent DESC, l.gia_ban ASC
             LIMIT 12`
        );
        res.json({ success: true, data: products });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách Flash Sale.' });
    }
});

// ─── API Gửi liên hệ ──────────────────────────────────────────
app.post('/api/lien-he', async (req, res) => {
    try {
        const { ho_ten, so_dien_thoai, email, chu_de, noi_dung } = req.body;
        if (!ho_ten || !so_dien_thoai || !noi_dung) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền họ tên, số điện thoại và nội dung tin nhắn!' });
        }
        res.json({
            success: true,
            message: 'Cảm ơn bạn đã gửi liên hệ! Chuyên viên tư vấn KTSHOP sẽ phản hồi lại cho bạn trong vòng 15 phút.'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể gửi liên hệ lúc này.' });
    }
});


// ─── API Mã giảm giá (Coupons) ────────────────────────────────
app.get('/api/coupons', async (req, res) => {
    try {
        const [coupons] = await db.query(
            `SELECT id, ma_coupon, mo_ta, loai_giam, gia_tri_giam, giam_toi_da, don_hang_toi_thieu, so_luong, da_su_dung, ngay_bat_dau, ngay_ket_thuc
             FROM coupon
             WHERE trang_thai = 1 AND ngay_bat_dau <= CURDATE() AND ngay_ket_thuc >= CURDATE() AND da_su_dung < so_luong
             ORDER BY gia_tri_giam DESC`
        );
        res.json({ success: true, data: coupons });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách mã giảm giá.' });
    }
});

app.post('/api/coupons/apply', async (req, res) => {
    try {
        const { code, tong_tien } = req.body;
        const totalAmount = Number(tong_tien);
        const couponCode = String(code || '').trim().toUpperCase();

        if (!couponCode || !Number.isFinite(totalAmount) || totalAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá hoặc giá trị đơn hàng không hợp lệ.' });
        }

        const [coupons] = await db.query(
            `SELECT * FROM coupon
             WHERE ma_coupon = ? AND trang_thai = 1 AND ngay_bat_dau <= CURDATE() AND ngay_ket_thuc >= CURDATE()`,
            [couponCode]
        );

        if (!coupons.length) {
            return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn.' });
        }

        const c = coupons[0];
        if (c.da_su_dung >= c.so_luong) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng.' });
        }
        if (totalAmount < Number(c.don_hang_toi_thieu)) {
            const minStr = new Intl.NumberFormat('vi-VN').format(c.don_hang_toi_thieu);
            return res.status(400).json({ success: false, message: `Mã chỉ áp dụng cho đơn hàng từ ${minStr}đ trở lên.` });
        }

        let tien_giam = 0;
        if (c.loai_giam === 'phan_tram') {
            const rawGiam = (totalAmount * Number(c.gia_tri_giam)) / 100;
            tien_giam = c.giam_toi_da ? Math.min(rawGiam, Number(c.giam_toi_da)) : rawGiam;
        } else {
            tien_giam = Math.min(totalAmount, Number(c.gia_tri_giam));
        }

        res.json({
            success: true,
            data: {
                id: c.id,
                ma_coupon: c.ma_coupon,
                mo_ta: c.mo_ta,
                loai_giam: c.loai_giam,
                gia_tri_giam: Number(c.gia_tri_giam),
                giam_toi_da: c.giam_toi_da ? Number(c.giam_toi_da) : null,
                don_hang_toi_thieu: Number(c.don_hang_toi_thieu),
                tien_giam: Math.round(tien_giam),
                thanh_tien_sau_giam: Math.max(0, totalAmount - Math.round(tien_giam))
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể áp dụng mã giảm giá.' });
    }
});

// ─── API Danh sách sản phẩm (Có phân trang, lọc & loại bỏ trùng ảnh) ─
app.get('/api/san-pham', async (req, res) => {
    try {
        const {
            q,
            brand,
            cpu,
            ram,
            o_cung,
            mau_sac,
            nhu_cau,
            gia_min,
            gia_max,
            sort,
            page = 1,
            limit = 15,
        } = req.query;

        const conditions = ['l.trang_thai = 1'];
        const params = [];

        // Hỗ trợ tìm kiếm từ khóa đa thông số
        const keyword = String(q || '').trim();
        if (keyword) {
            conditions.push('(l.ten_laptop LIKE ? OR n.ten_NH LIKE ? OR l.cpu LIKE ? OR l.nhu_cau LIKE ? OR l.card_do_hoa LIKE ? OR l.man_hinh LIKE ? OR l.mau_sac LIKE ?)');
            params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
        }

        // Hỗ trợ lọc theo thương hiệu (hỗ trợ cả ID, tên đầy đủ và tìm kiếm gần đúng)
        if (brand) {
            const rawBrands = String(brand).split(',').map(b => b.trim()).filter(Boolean);
            const numIds = [];
            const textNames = [];
            for (const b of rawBrands) {
                if (/^\d+$/.test(b)) numIds.push(Number(b));
                else textNames.push(b.toLowerCase());
            }

            const brandConds = [];
            if (numIds.length) {
                brandConds.push(`l.nhan_hieu_id IN (${numIds.map(() => '?').join(',')})`);
                params.push(...numIds);
            }
            if (textNames.length) {
                textNames.forEach(name => {
                    brandConds.push('(LOWER(n.ten_NH) = ? OR LOWER(n.ten_NH) LIKE ?)');
                    params.push(name, `%${name}%`);
                });
            }
            if (brandConds.length) {
                conditions.push(`(${brandConds.join(' OR ')})`);
            }
        }

        // Lọc CPU (hỗ trợ cả khớp chính xác và khớp một phần như Core i5, Ryzen 7, M3...)
        if (cpu) {
            const cpuArr = String(cpu).split(',').map(s => s.trim()).filter(Boolean);
            if (cpuArr.length > 0) {
                const cpuClauses = cpuArr.map(() => '(l.cpu = ? OR l.cpu LIKE ?)');
                conditions.push(`(${cpuClauses.join(' OR ')})`);
                cpuArr.forEach(val => {
                    params.push(val, `%${val}%`);
                });
            }
        }

        // Lọc RAM (hỗ trợ 8GB, 16GB, 32GB, Unified Memory...)
        if (ram) {
            const ramArr = String(ram).split(',').map(s => s.trim()).filter(Boolean);
            if (ramArr.length > 0) {
                const ramClauses = ramArr.map(() => '(l.ram = ? OR l.ram LIKE ?)');
                conditions.push(`(${ramClauses.join(' OR ')})`);
                ramArr.forEach(val => {
                    params.push(val, `%${val}%`);
                });
            }
        }

        // Lọc Ổ cứng (hỗ trợ 256GB, 512GB, 1TB...)
        if (o_cung) {
            const dArr = String(o_cung).split(',').map(s => s.trim()).filter(Boolean);
            if (dArr.length > 0) {
                const dClauses = dArr.map(() => '(l.o_cung = ? OR l.o_cung LIKE ?)');
                conditions.push(`(${dClauses.join(' OR ')})`);
                dArr.forEach(val => {
                    params.push(val, `%${val}%`);
                });
            }
        }

        // Lọc Màu sắc (hỗ trợ Bạc, Đen, Xám, Trắng, Vàng, Xanh...)
        if (mau_sac) {
            const cArr = String(mau_sac).split(',').map(s => s.trim()).filter(Boolean);
            if (cArr.length > 0) {
                const cClauses = cArr.map(() => '(l.mau_sac = ? OR l.mau_sac LIKE ?)');
                conditions.push(`(${cClauses.join(' OR ')})`);
                cArr.forEach(val => {
                    params.push(val, `%${val}%`);
                });
            }
        }

        // Lọc Nhu cầu (hỗ trợ gaming, do_hoa, mong_nhe, sinh_vien, van_phong)
        if (nhu_cau) {
            const reqArr = String(nhu_cau).split(',').map(s => s.trim()).filter(Boolean);
            if (reqArr.length > 0) {
                const reqClauses = reqArr.map(() => '(l.nhu_cau = ? OR l.nhu_cau LIKE ?)');
                conditions.push(`(${reqClauses.join(' OR ')})`);
                reqArr.forEach(val => {
                    params.push(val, `%${val}%`);
                });
            }
        }

        if (gia_min) { conditions.push('l.gia_ban >= ?'); params.push(Number(gia_min)); }
        if (gia_max) { conditions.push('l.gia_ban <= ?'); params.push(Number(gia_max)); }

        const where = conditions.join(' AND ');
        const offset = (Number(page) - 1) * Number(limit);

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total FROM laptop_Detail l JOIN nhan_Hieu n ON l.nhan_hieu_id = n.id WHERE ${where}`,
            params
        );

        let orderBy = 'l.created_at DESC';
        if (sort === 'price_asc') orderBy = 'l.gia_ban ASC';
        else if (sort === 'price_desc') orderBy = 'l.gia_ban DESC';
        else if (sort === 'views') orderBy = 'l.luot_xem DESC';

        // Lấy danh sách sản phẩm với ROW_NUMBER() để loại bỏ hoàn toàn Duplicate Row do nhiều ảnh chính
        const [products] = await db.query(
            `SELECT l.*, n.ten_NH, i.url_anh
             FROM laptop_Detail l
             JOIN nhan_Hieu n ON l.nhan_hieu_id = n.id
             LEFT JOIN (
                 SELECT laptop_id, url_anh FROM (
                     SELECT laptop_id, url_anh,
                            ROW_NUMBER() OVER (PARTITION BY laptop_id ORDER BY la_anh_chinh DESC, thu_tu ASC, id ASC) as rn
                     FROM laptop_images
                 ) ranked_img WHERE rn = 1
             ) i ON l.id = i.laptop_id
             WHERE ${where}
             ORDER BY ${orderBy}
             LIMIT ? OFFSET ?`,
            [...params, Number(limit), offset]
        );

        res.json({
            success: true,
            data: products,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
});

// ─── Authentication API ─────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-shop-laptop';
const smtpTransport = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
    : null;

const sendAuthCode = async (email, code, purpose) => {
    if (!smtpTransport) throw new Error('SMTP_NOT_CONFIGURED');
    const isReset = purpose === 'password_reset';
    const actionName = isReset ? 'Đặt lại mật khẩu' : 'Xác minh email tài khoản';
    const title = isReset ? 'Mã xác nhận đặt lại mật khẩu KTSHOP' : 'Mã xác minh tài khoản KTSHOP';
    const subject = `[KTSHOP] ${code} là mã xác nhận ${isReset ? 'đặt lại mật khẩu' : 'xác minh tài khoản'} của bạn`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 30px 10px;">
            <tr>
                <td align="center">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
                        <tr>
                            <td style="background: linear-gradient(135deg, #176b50 0%, #104e3b 100%); padding: 26px 24px; text-align: center;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: 2px;">KTSHOP</h1>
                                <p style="margin: 6px 0 0 0; color: #a7f3d0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Hệ Thống Laptop & Phụ Kiện Chính Hãng</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 32px 28px;">
                                <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #111827; font-weight: 700;">${actionName}</h2>
                                <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                                    Xin chào,<br>
                                    Bạn vừa có yêu cầu <strong>${actionName.toLowerCase()}</strong> cho tài khoản KTSHOP. Dưới đây là mã xác nhận (OTP) của bạn:
                                </p>
                                
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                                    <tr>
                                        <td align="center" style="background-color: #ecfdf5; border: 2px dashed #10b981; border-radius: 10px; padding: 20px;">
                                            <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #047857; display: block; margin-left: 10px;">${code}</span>
                                            <span style="display: block; margin-top: 8px; font-size: 12px; color: #065f46; font-weight: 500;">Hiệu lực trong 10 phút</span>
                                        </td>
                                    </tr>
                                </table>

                                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
                                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #92400e;">
                                        <strong>⚠️ Lưu ý:</strong> Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Nếu không tìm thấy email, vui lòng kiểm tra hộp thư <strong>Spam / Thư rác</strong>.
                                    </p>
                                </div>

                                <p style="margin: 16px 0 0 0; font-size: 13px; line-height: 1.5; color: #6b7280;">
                                    Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email để đảm bảo an toàn.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #f9fafb; padding: 18px 24px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                                <p style="margin: 0 0 4px 0;">Email gửi tự động từ hệ thống KTSHOP.</p>
                                <p style="margin: 0;">Hotline hỗ trợ: 1800 6868 | Email: support@ktshop.vn</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    await smtpTransport.sendMail({
        from: process.env.SMTP_FROM || `"KTSHOP" <${process.env.SMTP_USER}>`,
        to: email,
        subject: subject,
        text: `Mã xác nhận ${actionName.toLowerCase()} KTSHOP của bạn là: ${code}\nMã có hiệu lực trong 10 phút. Tuyệt đối không chia sẻ mã này với bất kỳ ai.\nNếu bạn không yêu cầu, vui lòng bỏ qua email này.`,
        html: htmlContent,
    });
};

const createAuthCode = async (userId, email, purpose) => {
    const [recentCodes] = await db.query(
        'SELECT id FROM email_auth_codes WHERE user_id = ? AND purpose = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND) LIMIT 1',
        [userId, purpose]
    );
    if (recentCodes.length) return { rateLimited: true };

    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);
    const [insertResult] = await db.query(
        'INSERT INTO email_auth_codes (user_id, purpose, code_hash, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
        [userId, purpose, codeHash]
    );
    try {
        await sendAuthCode(email, code, purpose);
    } catch (err) {
        await db.query(
            'UPDATE email_auth_codes SET used_at = NOW() WHERE id = ?',
            [insertResult.insertId]
        );
        throw err;
    }
    return { rateLimited: false };
};


// ─── Gửi Email thông báo xác nhận đơn hàng tự động ────────────
const sendOrderConfirmationEmail = async (email, orderInfo, items) => {
    if (!smtpTransport || !email) return;
    try {
        const itemsHtml = (items || []).map(item => `
            <tr>
                <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:14px;">${item.ten_laptop}</td>
                <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:14px;">${item.so_luong}</td>
                <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;color:#176b50;font-weight:600;">${new Intl.NumberFormat('vi-VN').format(item.thanh_tien)}đ</td>
            </tr>
        `).join('');

        const totalFormatted = new Intl.NumberFormat('vi-VN').format(orderInfo.thanh_tien);

        await smtpTransport.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject: `[KTSHOP] Xác nhận đơn hàng #${orderInfo.ma_don_hang}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#17221d;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#ffffff;">
                    <div style="background:#176b50;color:#ffffff;padding:24px;text-align:center;">
                        <h2 style="margin:0;font-size:22px;letter-spacing:1px;">KTSHOP LAPTOP</h2>
                        <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Xác nhận đặt hàng thành công</p>
                    </div>
                    <div style="padding:24px;">
                        <p style="font-size:15px;">Xin chào <strong>${orderInfo.ho_ten_nguoi_nhan}</strong>,</p>
                        <p style="font-size:14px;color:#4b5563;line-height:1.6;">Đơn hàng <strong>#${orderInfo.ma_don_hang}</strong> của bạn đã được ghi nhận trên hệ thống KTSHOP. Chúng tôi sẽ sớm liên hệ và tiến hành giao hàng.</p>
                        
                        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0;">
                            <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Địa chỉ giao hàng: <strong style="color:#111827;">${orderInfo.dia_chi_giao}</strong></p>
                            <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Số điện thoại: <strong style="color:#111827;">${orderInfo.so_dien_thoai}</strong></p>
                            <p style="margin:0;font-size:13px;color:#6b7280;">Phương thức: <strong style="color:#111827;">${orderInfo.phuong_thuc_tt === 'tien_mat' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản / Số dư ví'}</strong></p>
                        </div>

                        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                            <thead>
                                <tr style="background:#f3f4f6;color:#374151;font-size:13px;">
                                    <th style="padding:8px;text-align:left;">Sản phẩm</th>
                                    <th style="padding:8px;text-align:center;">SL</th>
                                    <th style="padding:8px;text-align:right;">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>${itemsHtml}</tbody>
                        </table>

                        <p style="text-align:right;font-size:16px;margin:16px 0 0;">
                            Tổng thanh toán: <span style="color:#e11d48;font-size:20px;font-weight:bold;">${totalFormatted}đ</span>
                        </p>
                    </div>
                    <div style="background:#f3f4f6;padding:16px;text-align:center;font-size:12px;color:#6b7280;">
                        Hotline hỗ trợ: 1800 6868 - 0988 888 888 | Email: support@ktshop.vn
                    </div>
                </div>
            `
        });
    } catch (err) {
        console.error('Không thể gửi email xác nhận đơn hàng:', err.message);
    }
};

app.post('/api/auth/register', async (req, res) => {
    try {
        const hoTen = String(req.body.ho_ten || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const matKhau = req.body.mat_khau;
        if (!hoTen || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof matKhau !== 'string' || matKhau.length < 8) {
            return res.status(400).json({ success: false, message: 'Nhập họ tên, email hợp lệ và mật khẩu tối thiểu 8 ký tự.' });
        }
        if (!smtpTransport) return res.status(503).json({ success: false, message: 'Chức năng xác minh email chưa được cấu hình SMTP.' });

        const [existing] = await db.query('SELECT id, email_da_xac_minh FROM users WHERE email = ?', [email]);
        if (existing.length && Number(existing[0].email_da_xac_minh) === 1) {
            return res.status(409).json({ success: false, message: 'Email đã được sử dụng. Hãy đăng nhập hoặc dùng chức năng quên mật khẩu.' });
        }

        let userId;
        const passwordHash = await bcrypt.hash(matKhau, 10);
        if (existing.length) {
            userId = existing[0].id;
            // Cập nhật họ tên, mật khẩu mới đã hash khi người dùng đăng ký lại tài khoản chưa xác minh (Sửa lỗi 2.3)
            await db.query(
                'UPDATE users SET ho_ten = ?, mat_khau = ?, email_xac_minh_bat_buoc = 1 WHERE id = ?',
                [hoTen, passwordHash, userId]
            );
        } else {
            const [result] = await db.query(
                'INSERT INTO users (ho_ten, email, mat_khau, email_da_xac_minh, email_xac_minh_bat_buoc) VALUES (?, ?, ?, 0, 1)',
                [hoTen, email, passwordHash]
            );
            userId = result.insertId;
        }

        const codeResult = await createAuthCode(userId, email, 'email_verification');
        if (codeResult.rateLimited) {
            return res.status(200).json({
                success: true,
                verificationRequired: true,
                rateLimited: true,
                email,
                message: 'Tài khoản chưa xác minh. Mã xác nhận đã được gửi trước đó vào email của bạn (vui lòng kiểm tra cả mục Spam).'
            });
        }
        res.status(201).json({ success: true, verificationRequired: true, email, message: 'Đã gửi mã xác nhận đến email của bạn. Vui lòng kiểm tra hộp thư (kể cả Spam).' });
    } catch (err) {
        console.error('Registration verification email could not be sent:', err.message);
        res.status(503).json({ success: false, message: 'Không gửi được mã xác nhận. Vui lòng thử đăng ký lại sau.' });
    }
});

app.post('/api/auth/register/resend', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: 'Vui lòng nhập email hợp lệ.' });
        if (!smtpTransport) return res.status(503).json({ success: false, message: 'Chức năng xác minh email chưa được cấu hình SMTP.' });
        const [users] = await db.query('SELECT id, email_da_xac_minh FROM users WHERE email = ? AND trang_thai = 1', [email]);
        if (users.length && Number(users[0].email_da_xac_minh) !== 1) {
            const result = await createAuthCode(users[0].id, email, 'email_verification');
            if (result.rateLimited) return res.status(429).json({ success: false, message: 'Mã xác nhận vừa được gửi. Vui lòng đợi 60 giây trước khi yêu cầu mã khác.' });
            return res.json({ success: true, message: 'Mã xác nhận mới đã được gửi tới email của bạn. Vui lòng kiểm tra cả mục Spam.' });
        }
        if (users.length && Number(users[0].email_da_xac_minh) === 1) {
            return res.status(400).json({ success: false, message: 'Email này đã được xác minh trước đó. Bạn có thể đăng nhập ngay.' });
        }
        res.json({ success: true, message: 'Nếu email này đã đăng ký nhưng chưa xác minh, mã xác nhận mới đã được gửi tới.' });
    } catch (err) {
        console.error('Registration code resend failed:', err.message);
        res.status(503).json({ success: false, message: 'Không gửi được mã xác nhận lúc này.' });
    }
});

app.post('/api/auth/register/update-info', async (req, res) => {
    try {
        const oldEmail = String(req.body.old_email || '').trim().toLowerCase();
        const hoTen = String(req.body.ho_ten || '').trim();
        const newEmail = String(req.body.email || '').trim().toLowerCase();
        const matKhau = req.body.mat_khau;

        if (!oldEmail || !hoTen || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập họ tên và địa chỉ email hợp lệ.' });
        }

        const [users] = await db.query('SELECT id, email_da_xac_minh FROM users WHERE email = ?', [oldEmail]);
        if (!users.length) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin đăng ký cần sửa.' });
        }
        if (Number(users[0].email_da_xac_minh) === 1) {
            return res.status(400).json({ success: false, message: 'Tài khoản này đã được xác minh trước đó. Bạn có thể đăng nhập ngay.' });
        }

        const userId = users[0].id;

        // If email changed, check if newEmail conflicts with an active verified account
        if (newEmail !== oldEmail) {
            const [conflict] = await db.query('SELECT id, email_da_xac_minh FROM users WHERE email = ? AND id != ?', [newEmail, userId]);
            if (conflict.length && Number(conflict[0].email_da_xac_minh) === 1) {
                return res.status(409).json({ success: false, message: 'Email mới đã được sử dụng bởi tài khoản khác.' });
            }
            if (conflict.length && Number(conflict[0].email_da_xac_minh) !== 1) {
                await db.query('DELETE FROM email_auth_codes WHERE user_id = ?', [conflict[0].id]);
                await db.query('DELETE FROM users WHERE id = ?', [conflict[0].id]);
            }
        }

        // Update user record
        if (matKhau && typeof matKhau === 'string' && matKhau.length >= 8) {
            const passwordHash = await bcrypt.hash(matKhau, 10);
            await db.query(
                'UPDATE users SET ho_ten = ?, email = ?, mat_khau = ?, email_xac_minh_bat_buoc = 1 WHERE id = ?',
                [hoTen, newEmail, passwordHash, userId]
            );
        } else {
            await db.query(
                'UPDATE users SET ho_ten = ?, email = ?, email_xac_minh_bat_buoc = 1 WHERE id = ?',
                [hoTen, newEmail, userId]
            );
        }

        const codeResult = await createAuthCode(userId, newEmail, 'email_verification');
        res.json({
            success: true,
            email: newEmail,
            ho_ten: hoTen,
            rateLimited: codeResult.rateLimited,
            message: codeResult.rateLimited
                ? 'Thông tin đã được cập nhật thành công. Mã xác nhận đã gửi trước đó vẫn còn hiệu lực.'
                : `Đã cập nhật thông tin và gửi mã xác nhận mới tới ${newEmail}. Vui lòng kiểm tra cả mục Spam.`
        });
    } catch (err) {
        console.error('Update registration info failed:', err.message);
        res.status(500).json({ success: false, message: 'Không thể cập nhật thông tin lúc này. Vui lòng thử lại.' });
    }
});

app.post('/api/auth/register/confirm', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) {
        return res.status(400).json({ success: false, message: 'Email hoặc mã 6 chữ số không hợp lệ.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [users] = await connection.query(
            'SELECT id, email_da_xac_minh FROM users WHERE email = ? AND trang_thai = 1 FOR UPDATE',
            [email]
        );
        if (!users.length) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Email hoặc mã xác nhận không hợp lệ.' });
        }
        if (Number(users[0].email_da_xac_minh) === 1) {
            await connection.rollback();
            return res.json({ success: true, message: 'Email đã được xác minh. Bạn có thể đăng nhập.' });
        }
        const [codes] = await connection.query(
            `SELECT id, code_hash, attempts FROM email_auth_codes
             WHERE user_id = ? AND purpose = 'email_verification' AND used_at IS NULL AND expires_at > NOW()
             ORDER BY id DESC LIMIT 5 FOR UPDATE`,
            [users[0].id]
        );
        if (!codes.length) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Mã xác nhận không tồn tại hoặc đã hết hạn (hiệu lực 10 phút). Hãy bấm gửi mã mới.' });
        }

        let matchedCode = null;
        for (const c of codes) {
            if (Number(c.attempts) < 5 && (await bcrypt.compare(code, c.code_hash))) {
                matchedCode = c;
                break;
            }
        }

        if (!matchedCode) {
            const latestCode = codes[0];
            const attempts = Number(latestCode.attempts) + 1;
            await connection.query(
                'UPDATE email_auth_codes SET attempts = ?, used_at = IF(? >= 5, NOW(), used_at) WHERE id = ?',
                [attempts, attempts, latestCode.id]
            );
            await connection.commit();
            return res.status(400).json({
                success: false,
                message: attempts >= 5
                    ? 'Mã đã bị khóa do nhập sai quá 5 lần. Vui lòng bấm gửi lại mã mới.'
                    : `Mã chưa chính xác. Bạn còn ${5 - attempts} lần thử.`
            });
        }

        await connection.query('UPDATE users SET email_da_xac_minh = 1 WHERE id = ?', [users[0].id]);
        await connection.query("UPDATE email_auth_codes SET used_at = NOW() WHERE user_id = ? AND purpose = 'email_verification' AND used_at IS NULL", [users[0].id]);
        await connection.commit();
        res.json({ success: true, message: 'Đăng ký hoàn tất! Email đã được xác minh, bạn có thể đăng nhập.' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể xác minh email lúc này.' });
    } finally {
        connection.release();
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, mat_khau } = req.body;
        if (!email || !mat_khau) return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu!' });

        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu!' });

        const user = users[0];

        // Kiểm tra xem tài khoản có bị khóa/ngừng hoạt động không (Sửa lỗi 2.4)
        if (Number(user.trang_thai) !== 1) {
            return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động!' });
        }

        // Check if user is blacklisted (if there's any active blacklist record for this user in jsontoken)
        const [blacklisted] = await db.query('SELECT id FROM jsontoken WHERE user_id = ? AND blacklist = 1 LIMIT 1', [user.id]);
        if (blacklisted.length > 0) {
            return res.status(403).json({ success: false, message: 'Tài khoản này có hành vi xấu, đã bị cấm đăng nhập!' });
        }

        const validPass = await bcrypt.compare(mat_khau, user.mat_khau);
        if (!validPass) return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu!' });
        if (user.vai_tro === 'khach_hang' && Number(user.email_xac_minh_bat_buoc) === 1 && Number(user.email_da_xac_minh) !== 1) {
            return res.status(403).json({ success: false, code: 'EMAIL_VERIFICATION_REQUIRED', message: 'Vui lòng xác minh email bằng mã trong thư trước khi đăng nhập.' });
        }

        const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

        // Vô hiệu hóa (revoke) tất cả các token cũ của user này trước khi tạo token mới (Đăng xuất khỏi các thiết bị khác)
        await db.query('UPDATE jsontoken SET `revoke` = 1 WHERE user_id = ? AND `revoke` = 0', [user.id]);

        await db.query(
            'INSERT INTO jsontoken (user_id, access_token, refresh_token_hash, blacklist, `revoke`) VALUES (?, ?, ?, 0, 0)',
            [user.id, accessToken, refreshTokenHash]
        );

        res.json({
            success: true,
            message: 'Đăng nhập thành công!',
            data: {
                id: user.id,
                ho_ten: user.ho_ten,
                email: user.email,
                role: user.vai_tro,
                vai_tro: user.vai_tro,
                quyen: parsePermissions(user.quyen, user.vai_tro),
                email_da_xac_minh: Number(user.email_da_xac_minh) === 1,
                balance: user.balance,
                accessToken,
                refreshToken
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
});

app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Thiếu refresh token!' });
        }

        let payload;
        try {
            payload = jwt.verify(refreshToken, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
        }

        // Kiểm tra token hợp lệ và tài khoản vẫn đang hoạt động u.trang_thai = 1 (Sửa lỗi 2.4)
        const [tokens] = await db.query(
            `SELECT t.id, t.refresh_token_hash, u.email
             FROM jsontoken t
             JOIN users u ON u.id = t.user_id
             WHERE t.user_id = ? AND t.blacklist = 0 AND t.revoke = 0 AND u.trang_thai = 1
             ORDER BY t.id DESC LIMIT 1`,
            [payload.id]
        );
        if (tokens.length === 0 || !(await bcrypt.compare(refreshToken, tokens[0].refresh_token_hash))) {
            return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa.' });
        }

        const accessToken = jwt.sign(
            { id: payload.id, email: tokens[0].email },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        await db.query('UPDATE jsontoken SET access_token = ? WHERE id = ?', [accessToken, tokens[0].id]);

        res.json({ success: true, data: { accessToken } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
});

// ─── Middleware Auth ────────────────────────────────────────
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập!' });

    jwt.verify(token, JWT_SECRET, async (err, user) => {
        if (err) {
            const status = err.name === 'TokenExpiredError' ? 401 : 403;
            return res.status(status).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
        }
        try {
            const [sessions] = await db.query(
                `SELECT t.id FROM jsontoken t
                 JOIN users u ON u.id = t.user_id
                 WHERE t.user_id = ? AND t.access_token = ? AND t.blacklist = 0 AND t.revoke = 0 AND u.trang_thai = 1
                 ORDER BY t.id DESC LIMIT 1`,
                [user.id, token]
            );
            if (!sessions.length) return res.status(401).json({ success: false, message: 'Phiên đăng nhập đã bị thu hồi hoặc tài khoản bị khóa.' });
            req.user = user;
            next();
        } catch (dbError) {
            console.error(dbError);
            res.status(500).json({ success: false, message: 'Không thể xác thực phiên đăng nhập.' });
        }
    });
};

// ─── API Upload file ảnh chung (Yêu cầu đăng nhập - Sửa lỗ hổng upload) ──
app.post('/api/upload', authenticateToken, (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn file ảnh để tải lên!' });
        }
        res.json({
            success: true,
            message: 'Tải file ảnh thành công!',
            data: {
                url: `/uploads/${req.file.filename}`,
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });
    });
});

// Đăng xuất an toàn: Yêu cầu xác thực token người dùng gửi lên (Sửa lỗi 2.1)
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            await db.query('UPDATE jsontoken SET `revoke` = 1 WHERE user_id = ? AND access_token = ?', [req.user.id, token]);
        } else {
            await db.query('UPDATE jsontoken SET `revoke` = 1 WHERE user_id = ?', [req.user.id]);
        }
        res.json({ success: true, message: 'Đăng xuất thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
});

// Đổi mật khẩu khi đang đăng nhập
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { mat_khau_cu, mat_khau_moi } = req.body;
        if (!mat_khau_cu || !mat_khau_moi || typeof mat_khau_moi !== 'string' || mat_khau_moi.length < 8) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới tối thiểu 8 ký tự.' });
        }

        const [users] = await db.query('SELECT id, mat_khau FROM users WHERE id = ?', [req.user.id]);
        if (!users.length) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });

        if (users[0].mat_khau) {
            const valid = await bcrypt.compare(mat_khau_cu, users[0].mat_khau);
            if (!valid) return res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác.' });
        }

        const newHash = await bcrypt.hash(mat_khau_moi, 10);
        await db.query('UPDATE users SET mat_khau = ? WHERE id = ?', [newHash, req.user.id]);

        // Thu hồi các token cũ để yêu cầu người dùng đăng nhập lại
        await db.query('UPDATE jsontoken SET `revoke` = 1 WHERE user_id = ?', [req.user.id]);

        res.json({ success: true, message: 'Đổi mật khẩu thành công! Vui lòng sử dụng mật khẩu mới cho các lần đăng nhập sau.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể đổi mật khẩu.' });
    }
});

const ADMIN_ROLES = new Set(['qtv', 'admin', 'nhan_su', 'nhan_vien_kho', 'nhan_vien']);
const ROLE_RANK = { qtv: 4, admin: 3, nhan_su: 2, nhan_vien_kho: 1, nhan_vien: 1, khach_hang: 0 };
const ACCOUNT_PERMISSIONS = ['products', 'orders', 'accounts', 'news', 'coupons', 'deposits', 'categories'];
const DEFAULT_PERMISSIONS = {
    qtv: ACCOUNT_PERMISSIONS,
    admin: ACCOUNT_PERMISSIONS,
    nhan_su: ['accounts'],
    nhan_vien_kho: ['products', 'orders', 'coupons', 'categories'],
    nhan_vien: ['news'],
    khach_hang: [],
};

const parsePermissions = (value, role) => {
    if (role === 'khach_hang') return [];
    if (role === 'qtv') return ACCOUNT_PERMISSIONS; // Quản trị viên cao nhất luôn sở hữu toàn bộ quyền hạn
    let permissions = value;
    if (typeof permissions === 'string') {
        try { permissions = JSON.parse(permissions); } catch { permissions = null; }
    }
    if (!Array.isArray(permissions)) return DEFAULT_PERMISSIONS[role] || [];
    return [...new Set(permissions.filter(permission => ACCOUNT_PERMISSIONS.includes(permission)))];
};

const loadAdminActor = async (req, res, next) => {
    try {
        const [users] = await db.query('SELECT id, ho_ten, vai_tro, quyen, trang_thai FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0 || Number(users[0].trang_thai) !== 1) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập chức năng quản trị.' });
        }
        const user = users[0];
        if (user.vai_tro === 'khach_hang') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập chức năng quản trị.' });
        }
        // Quản trị viên cao nhất (qtv) luôn luôn có toàn quyền, không cần cấp bất kỳ quyền nào
        let quyen = user.vai_tro === 'qtv' ? ACCOUNT_PERMISSIONS : parsePermissions(user.quyen, user.vai_tro);
        if (user.vai_tro !== 'qtv' && (!quyen || quyen.length === 0)) {
            const [roleRows] = await db.query('SELECT quyen FROM roles WHERE ma_role = ?', [user.vai_tro]);
            if (roleRows.length) {
                const raw = roleRows[0].quyen;
                const roleQuyen = typeof raw === 'string' ? JSON.parse(raw || '[]') : (raw || []);
                quyen = parsePermissions(roleQuyen, user.vai_tro);
            }
        }
        req.adminActor = { ...user, quyen };
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
};

const canManageRole = (actorRole, targetRole) => {
    if (actorRole === 'qtv') return targetRole !== 'qtv';
    const actorRank = ROLE_RANK[actorRole] ?? 1;
    const targetRank = ROLE_RANK[targetRole] ?? 1;
    return targetRank < actorRank;
};

const canAssignRole = (actorRole, targetRole) => {
    if (targetRole === 'qtv') return false; // Không ai được tự tạo hoặc gán thêm qtv
    if (actorRole === 'qtv') return true;  // qtv được gán bất kỳ role nào khác
    const actorRank = ROLE_RANK[actorRole] ?? 1;
    const targetRank = ROLE_RANK[targetRole] ?? 1;
    return targetRank < actorRank;
};

const accountManagementAccess = [authenticateToken, loadAdminActor];

const requireAdminPermission = permission => (req, res, next) => {
    // Quản trị viên cao nhất luôn luôn có toàn quyền cho dù update thêm bất cứ quyền nào
    if (req.adminActor?.vai_tro === 'qtv') {
        return next();
    }
    const hasPerm = req.adminActor?.quyen?.includes(permission) ||
        (permission === 'coupons' && (req.adminActor?.quyen?.includes('products') || req.adminActor?.vai_tro === 'admin')) ||
        (permission === 'deposits' && req.adminActor?.vai_tro === 'admin') ||
        (permission === 'categories' && (req.adminActor?.quyen?.includes('products') || req.adminActor?.vai_tro === 'admin'));
    if (!hasPerm) {
        const permissionNames = { products: 'sản phẩm', orders: 'đơn hàng', accounts: 'tài khoản', news: 'tin tức', coupons: 'mã giảm giá', deposits: 'nạp tiền', categories: 'danh mục' };
        return res.status(403).json({ success: false, message: `Tài khoản không được cấp quyền quản lý ${permissionNames[permission] || 'chức năng này'}.` });
    }
    next();
};

app.get('/api/admin/tong-quan', ...accountManagementAccess, async (req, res) => {
    try {
        const [[monthly]] = await db.query(`
            SELECT
                COALESCE(SUM(CASE WHEN created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                    AND created_at < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
                    AND trang_thai_tt = 'da_thanh_toan' AND trang_thai_dh NOT IN ('da_huy', 'tra_hang')
                    THEN thanh_tien ELSE 0 END), 0) AS revenue_this_month,
                COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
                    AND created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')
                    AND trang_thai_tt = 'da_thanh_toan' AND trang_thai_dh NOT IN ('da_huy', 'tra_hang')
                    THEN thanh_tien ELSE 0 END), 0) AS revenue_previous_month,
                COUNT(CASE WHEN created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                    AND created_at < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
                    AND trang_thai_dh <> 'da_huy' THEN 1 END) AS orders_this_month,
                COUNT(CASE WHEN created_at >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
                    AND created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')
                    AND trang_thai_dh <> 'da_huy' THEN 1 END) AS orders_previous_month
            FROM \`order\`
        `);
        const [[inventory]] = await db.query(`
            SELECT COUNT(*) AS active_products,
                   COUNT(CASE WHEN so_luong_ton <= 3 THEN 1 END) AS low_stock_products
            FROM laptop_Detail WHERE trang_thai = 1
        `);
        const [[customers]] = await db.query(`
            SELECT COUNT(*) AS active_customers,
                   COUNT(CASE WHEN created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                       AND created_at < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH) THEN 1 END) AS customers_this_month,
                   COUNT(CASE WHEN created_at >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
                       AND created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN 1 END) AS customers_previous_month
            FROM users WHERE vai_tro = 'khach_hang' AND trang_thai = 1
        `);
        const [recentOrders] = await db.query(`
            SELECT o.id, o.ma_don_hang, o.ho_ten_nguoi_nhan, o.thanh_tien,
                   o.trang_thai_dh, o.trang_thai_tt, o.created_at,
                   COUNT(od.id) AS item_count,
                   GROUP_CONCAT(od.ten_laptop ORDER BY od.id SEPARATOR ', ') AS product_names
            FROM \`order\` o
            LEFT JOIN order_detail od ON od.order_id = o.id
            GROUP BY o.id
            ORDER BY o.created_at DESC
            LIMIT 5
        `);

        const hasOrders = req.adminActor.quyen.includes('orders');
        const hasProducts = req.adminActor.quyen.includes('products');
        const hasAccounts = req.adminActor.quyen.includes('accounts');

        res.json({
            success: true,
            data: {
                stats: {
                    revenueThisMonth: hasOrders ? Number(monthly.revenue_this_month) : null,
                    revenuePreviousMonth: hasOrders ? Number(monthly.revenue_previous_month) : null,
                    ordersThisMonth: hasOrders ? Number(monthly.orders_this_month) : null,
                    ordersPreviousMonth: hasOrders ? Number(monthly.orders_previous_month) : null,
                    activeProducts: hasProducts ? Number(inventory.active_products) : null,
                    lowStockProducts: hasProducts ? Number(inventory.low_stock_products) : null,
                    activeCustomers: hasAccounts ? Number(customers.active_customers) : null,
                    customersThisMonth: hasAccounts ? Number(customers.customers_this_month) : null,
                    customersPreviousMonth: hasAccounts ? Number(customers.customers_previous_month) : null,
                },
                recentOrders: hasOrders ? recentOrders : [],
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải tổng quan hệ thống.' });
    }
});

app.get('/api/admin/san-pham', ...accountManagementAccess, requireAdminPermission('products'), async (req, res) => {
    try {
        const search = String(req.query.q || '').trim();
        const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
        const params = [];
        let where = '';
        if (search) {
            where = 'WHERE l.ten_laptop LIKE ? OR n.ten_NH LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }
        const [products] = await db.query(
            `SELECT l.id, l.ten_laptop, l.gia_ban, l.gia_goc, l.cpu, l.ram, l.o_cung,
                    l.so_luong_ton, l.trang_thai, l.updated_at, n.ten_NH, i.url_anh
             FROM laptop_Detail l
             JOIN nhan_Hieu n ON n.id = l.nhan_hieu_id
             LEFT JOIN (
                 SELECT laptop_id, url_anh FROM (
                     SELECT laptop_id, url_anh,
                            ROW_NUMBER() OVER (PARTITION BY laptop_id ORDER BY la_anh_chinh DESC, thu_tu ASC, id ASC) as rn
                     FROM laptop_images
                 ) ranked_img WHERE rn = 1
             ) i ON l.id = i.laptop_id
             ${where}
             ORDER BY l.updated_at DESC
             LIMIT ?`,
            [...params, limit]
        );
        res.json({ success: true, data: products });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách sản phẩm.' });
    }
});

app.get('/api/admin/san-pham/options', ...accountManagementAccess, requireAdminPermission('products'), async (req, res) => {
    try {
        const [brands] = await db.query('SELECT id, ten_NH FROM nhan_Hieu WHERE trang_thai = 1 ORDER BY ten_NH');
        res.json({ success: true, data: { brands } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách thương hiệu.' });
    }
});

app.get('/api/admin/san-pham/:id', ...accountManagementAccess, requireAdminPermission('products'), async (req, res) => {
    try {
        const productId = Number(req.params.id);
        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({ success: false, message: 'Mã sản phẩm không hợp lệ.' });
        }
        const [products] = await db.query(
            `SELECT l.*, n.ten_NH
             FROM laptop_Detail l
             JOIN nhan_Hieu n ON n.id = l.nhan_hieu_id
             WHERE l.id = ?`,
            [productId]
        );
        if (!products.length) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
        const [images] = await db.query(
            'SELECT id, url_anh, alt_text, la_anh_chinh FROM laptop_images WHERE laptop_id = ? ORDER BY la_anh_chinh DESC, thu_tu, id',
            [productId]
        );
        res.json({ success: true, data: { ...products[0], images } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải chi tiết sản phẩm.' });
    }
});

app.put('/api/admin/san-pham/:id', ...accountManagementAccess, requireAdminPermission('products'), async (req, res) => {
    try {
        const productId = Number(req.params.id);
        const {
            nhan_hieu_id,
            ten_laptop,
            nhu_cau = 'van_phong',
            gia_ban,
            gia_goc,
            cpu,
            ram,
            o_cung,
            man_hinh,
            card_do_hoa,
            he_dieu_hanh,
            pin,
            trong_luong,
            ket_noi,
            mau_sac,
            bao_hanh,
            mo_ta,
            so_luong_ton,
            trang_thai,
        } = req.body;
        const brandId = Number(nhan_hieu_id);
        const price = Number(gia_ban);
        const oldPrice = gia_goc === '' || gia_goc === null || gia_goc === undefined ? null : Number(gia_goc);
        const stock = Number(so_luong_ton);
        const warranty = Number(bao_hanh);
        const weight = trong_luong === '' || trong_luong === null || trong_luong === undefined ? null : Number(trong_luong);
        if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(brandId) || brandId <= 0
            || typeof ten_laptop !== 'string' || !ten_laptop.trim()
            || !Number.isFinite(price) || price < 0
            || (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice < 0))
            || !Number.isInteger(stock) || stock < 0
            || !Number.isInteger(warranty) || warranty < 0
            || (weight !== null && (!Number.isFinite(weight) || weight < 0))
            || ![0, 1, '0', '1'].includes(trang_thai)) {
            return res.status(400).json({ success: false, message: 'Kiểm tra lại tên, thương hiệu, giá, tồn kho và trạng thái sản phẩm.' });
        }
        const [brands] = await db.query('SELECT id FROM nhan_Hieu WHERE id = ? AND trang_thai = 1', [brandId]);
        if (!brands.length) return res.status(400).json({ success: false, message: 'Thương hiệu không tồn tại hoặc đã bị ẩn.' });
        const [result] = await db.query(
            `UPDATE laptop_Detail SET nhan_hieu_id = ?, ten_laptop = ?, nhu_cau = ?, gia_ban = ?, gia_goc = ?,
             cpu = ?, ram = ?, o_cung = ?, man_hinh = ?, card_do_hoa = ?, he_dieu_hanh = ?, pin = ?,
             trong_luong = ?, ket_noi = ?, mau_sac = ?, bao_hanh = ?, mo_ta = ?, so_luong_ton = ?, trang_thai = ?
             WHERE id = ?`,
            [brandId, ten_laptop.trim(), nhu_cau || 'van_phong', price, oldPrice, cpu || null, ram || null, o_cung || null, man_hinh || null,
                card_do_hoa || null, he_dieu_hanh || null, pin || null, weight, ket_noi || null, mau_sac || null,
                warranty, mo_ta || null, stock, Number(trang_thai), productId]
        );
        if (result.affectedRows === 0) {
            const [existing] = await db.query('SELECT id FROM laptop_Detail WHERE id = ?', [productId]);
            if (!existing.length) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
        }
        res.json({ success: true, message: 'Đã cập nhật sản phẩm.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể cập nhật sản phẩm.' });
    }
});

// Thêm mới sản phẩm Laptop (Admin) - Sửa lỗi 3.1
app.post('/api/admin/san-pham', ...accountManagementAccess, requireAdminPermission('products'), async (req, res) => {
    try {
        const {
            nhan_hieu_id,
            ten_laptop,
            nhu_cau = 'van_phong',
            gia_ban,
            gia_goc,
            cpu,
            ram,
            o_cung,
            man_hinh,
            card_do_hoa,
            he_dieu_hanh,
            pin,
            trong_luong,
            ket_noi,
            mau_sac,
            bao_hanh = 12,
            mo_ta,
            so_luong_ton = 10,
            trang_thai = 1,
            url_anh
        } = req.body;

        const brandId = Number(nhan_hieu_id);
        const price = Number(gia_ban);
        const oldPrice = gia_goc === '' || gia_goc === null || gia_goc === undefined ? null : Number(gia_goc);
        const stock = Number(so_luong_ton);
        const warranty = Number(bao_hanh);
        const weight = trong_luong === '' || trong_luong === null || trong_luong === undefined ? null : Number(trong_luong);

        if (!Number.isInteger(brandId) || brandId <= 0
            || typeof ten_laptop !== 'string' || !ten_laptop.trim()
            || !Number.isFinite(price) || price < 0
            || !Number.isInteger(stock) || stock < 0
            || !Number.isInteger(warranty) || warranty < 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng kiểm tra lại tên máy, thương hiệu, giá bán và số lượng tồn kho.' });
        }

        const [brands] = await db.query('SELECT id FROM nhan_Hieu WHERE id = ? AND trang_thai = 1', [brandId]);
        if (!brands.length) return res.status(400).json({ success: false, message: 'Thương hiệu không tồn tại hoặc đã bị ẩn.' });

        const [result] = await db.query(
            `INSERT INTO laptop_Detail (nhan_hieu_id, ten_laptop, nhu_cau, gia_ban, gia_goc, cpu, ram, o_cung, man_hinh, card_do_hoa, he_dieu_hanh, pin, trong_luong, ket_noi, mau_sac, bao_hanh, mo_ta, so_luong_ton, trang_thai)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [brandId, ten_laptop.trim(), nhu_cau || 'van_phong', price, oldPrice, cpu || null, ram || null, o_cung || null, man_hinh || null,
                card_do_hoa || null, he_dieu_hanh || null, pin || null, weight, ket_noi || null, mau_sac || null, warranty, mo_ta || null, stock, Number(trang_thai)]
        );

        const newProductId = result.insertId;

        // Nếu admin gửi kèm link ảnh đại diện
        if (url_anh && typeof url_anh === 'string' && url_anh.trim()) {
            await db.query(
                'INSERT INTO laptop_images (laptop_id, url_anh, alt_text, la_anh_chinh, thu_tu) VALUES (?, ?, ?, 1, 0)',
                [newProductId, url_anh.trim(), ten_laptop.trim()]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Thêm mới sản phẩm laptop thành công!',
            data: { id: newProductId }
        });
    } catch (err) {
        console.error('Create product error:', err);
        res.status(500).json({ success: false, message: 'Không thể thêm mới sản phẩm.' });
    }
});
// Bật/tắt trạng thái kinh doanh của sản phẩm (Admin)
app.put('/api/admin/san-pham/:id/toggle-status', ...accountManagementAccess, requireAdminPermission('products'), async (req, res) => {
    try {
        const productId = Number(req.params.id);
        const [products] = await db.query('SELECT id, trang_thai FROM laptop_Detail WHERE id = ?', [productId]);
        if (!products.length) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });

        const newStatus = Number(products[0].trang_thai) === 1 ? 0 : 1;
        await db.query('UPDATE laptop_Detail SET trang_thai = ? WHERE id = ?', [newStatus, productId]);

        res.json({
            success: true,
            message: newStatus === 1 ? 'Đã kích hoạt lại sản phẩm.' : 'Đã tạm ngừng kinh doanh sản phẩm.',
            data: { id: productId, trang_thai: newStatus }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể đổi trạng thái sản phẩm.' });
    }
});

// Xóa sản phẩm (Admin)
app.delete('/api/admin/san-pham/:id', ...accountManagementAccess, requireAdminPermission('products'), async (req, res) => {
    try {
        const productId = Number(req.params.id);
        const [orders] = await db.query('SELECT id FROM order_detail WHERE laptop_id = ? LIMIT 1', [productId]);
        if (orders.length > 0) {
            // Sản phẩm đã có đơn hàng thì chuyển sang ngừng kinh doanh để bảo toàn lịch sử hóa đơn
            await db.query('UPDATE laptop_Detail SET trang_thai = 0 WHERE id = ?', [productId]);
            return res.json({
                success: true,
                message: 'Sản phẩm đã có đơn hàng trong hệ thống. Đã chuyển trạng thái sang "Ngừng kinh doanh" thay vì xóa vĩnh viễn.'
            });
        }

        await db.query('DELETE FROM laptop_Detail WHERE id = ?', [productId]);
        res.json({ success: true, message: 'Đã xóa sản phẩm thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể xóa sản phẩm.' });
    }
});

// Upload ảnh sản phẩm (Admin)
app.post('/api/admin/san-pham/:id/images', ...accountManagementAccess, requireAdminPermission('products'), (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn file ảnh sản phẩm!' });
        }
        try {
            const productId = Number(req.params.id);
            if (!Number.isInteger(productId) || productId <= 0) {
                return res.status(400).json({ success: false, message: 'Mã sản phẩm không hợp lệ.' });
            }
            const [product] = await db.query('SELECT id, ten_laptop FROM laptop_Detail WHERE id = ?', [productId]);
            if (!product.length) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
            }

            const imageUrl = `/uploads/${req.file.filename}`;
            const altText = req.body.alt_text || product[0].ten_laptop;
            const isPrimary = (req.body.la_anh_chinh === '1' || req.body.la_anh_chinh === 1 || req.body.la_anh_chinh === true) ? 1 : 0;

            if (isPrimary) {
                await db.query('UPDATE laptop_images SET la_anh_chinh = 0 WHERE laptop_id = ?', [productId]);
            }

            const [result] = await db.query(
                'INSERT INTO laptop_images (laptop_id, url_anh, alt_text, la_anh_chinh, thu_tu) VALUES (?, ?, ?, ?, 0)',
                [productId, imageUrl, altText, isPrimary]
            );

            res.json({
                success: true,
                message: 'Tải ảnh sản phẩm thành công!',
                data: {
                    id: result.insertId,
                    laptop_id: productId,
                    url_anh: imageUrl,
                    alt_text: altText,
                    la_anh_chinh: isPrimary
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Không thể lưu ảnh sản phẩm.' });
        }
    });
});

// Xóa ảnh sản phẩm (Admin) - Tự động chọn ảnh thay thế làm ảnh chính nếu xóa ảnh chính (Sửa lỗi 3.3)
app.delete('/api/admin/san-pham/images/:imageId', ...accountManagementAccess, requireAdminPermission('products'), async (req, res) => {
    try {
        const imageId = Number(req.params.imageId);
        if (!Number.isInteger(imageId) || imageId <= 0) {
            return res.status(400).json({ success: false, message: 'Mã ảnh không hợp lệ.' });
        }
        const [images] = await db.query('SELECT id, laptop_id, url_anh, la_anh_chinh FROM laptop_images WHERE id = ?', [imageId]);
        if (!images.length) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy ảnh.' });
        }
        const img = images[0];
        await db.query('DELETE FROM laptop_images WHERE id = ?', [imageId]);

        if (img.url_anh && img.url_anh.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, img.url_anh);
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (e) { /* file unlink ignore */ }
            }
        }

        // Nếu bức ảnh vừa xóa là ảnh chính (la_anh_chinh = 1), tự động đưa 1 ảnh khác lên làm ảnh chính
        if (Number(img.la_anh_chinh) === 1) {
            const [remaining] = await db.query(
                'SELECT id FROM laptop_images WHERE laptop_id = ? ORDER BY thu_tu ASC, id ASC LIMIT 1',
                [img.laptop_id]
            );
            if (remaining.length > 0) {
                await db.query('UPDATE laptop_images SET la_anh_chinh = 1 WHERE id = ?', [remaining[0].id]);
            }
        }

        res.json({ success: true, message: 'Đã xóa ảnh sản phẩm.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Không thể xóa ảnh.' });
    }
});

// Đặt làm ảnh chính sản phẩm (Admin)
app.put('/api/admin/san-pham/images/:imageId/primary', ...accountManagementAccess, requireAdminPermission('products'), async (req, res) => {
    try {
        const imageId = Number(req.params.imageId);
        const [images] = await db.query('SELECT id, laptop_id FROM laptop_images WHERE id = ?', [imageId]);
        if (!images.length) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy ảnh.' });
        }
        await db.query('UPDATE laptop_images SET la_anh_chinh = 0 WHERE laptop_id = ?', [images[0].laptop_id]);
        await db.query('UPDATE laptop_images SET la_anh_chinh = 1 WHERE id = ?', [imageId]);
        res.json({ success: true, message: 'Đã đặt làm ảnh chính.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Không thể đặt ảnh chính.' });
    }
});

// ─── API Quản lý Danh mục & Thương hiệu (Admin) ──────────────
const getCategoriesHandler = async (req, res) => {
    try {
        // 1. Danh sách Thương hiệu / Hãng (nhan_Hieu) kèm số lượng sản phẩm
        const [brands] = await db.query(`
            SELECT n.id, n.ten_NH, n.logo, n.mo_ta, n.trang_thai, n.created_at, n.updated_at,
                   COUNT(l.id) AS so_san_pham
            FROM nhan_Hieu n
            LEFT JOIN laptop_Detail l ON l.nhan_hieu_id = n.id
            GROUP BY n.id
            ORDER BY n.ten_NH ASC
        `);

        // 2. Thống kê theo Nhu cầu laptop
        const [demands] = await db.query(`
            SELECT nhu_cau, COUNT(*) AS so_san_pham
            FROM laptop_Detail
            GROUP BY nhu_cau
        `);

        // 3. Thống kê theo Danh mục tin tức
        const [newsCategories] = await db.query(`
            SELECT danh_muc, COUNT(*) AS so_bai_viet
            FROM tin_tuc
            GROUP BY danh_muc
        `);

        const totalBrands = brands.length;
        const activeBrands = brands.filter(b => Number(b.trang_thai) === 1).length;
        const totalProducts = brands.reduce((acc, cur) => acc + Number(cur.so_san_pham || 0), 0);

        res.json({
            success: true,
            data: {
                brands,
                demands,
                newsCategories,
                stats: {
                    totalBrands,
                    activeBrands,
                    inactiveBrands: totalBrands - activeBrands,
                    totalProducts
                }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách danh mục.' });
    }
};

const createCategoryHandler = async (req, res) => {
    try {
        const { ten_NH, logo, hinh_anh, mo_ta, trang_thai = 1 } = req.body;
        const name = String(ten_NH || '').trim();
        if (!name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên danh mục / thương hiệu.' });
        }
        const [existing] = await db.query('SELECT id FROM nhan_Hieu WHERE LOWER(ten_NH) = LOWER(?)', [name]);
        if (existing.length) {
            return res.status(409).json({ success: false, message: `Danh mục / thương hiệu "${name}" đã tồn tại.` });
        }
        const logoVal = String(logo || hinh_anh || '').trim() || null;
        const [result] = await db.query(
            'INSERT INTO nhan_Hieu (ten_NH, logo, mo_ta, trang_thai) VALUES (?, ?, ?, ?)',
            [name, logoVal, mo_ta?.trim() || null, Number(trang_thai)]
        );
        res.status(201).json({
            success: true,
            message: 'Đã thêm danh mục mới thành công!',
            data: { id: result.insertId, ten_NH: name }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể thêm danh mục.' });
    }
};

const updateCategoryHandler = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'Mã danh mục không hợp lệ.' });
        }
        const { ten_NH, logo, hinh_anh, mo_ta, trang_thai = 1 } = req.body;
        const name = String(ten_NH || '').trim();
        if (!name) return res.status(400).json({ success: false, message: 'Vui lòng nhập tên danh mục.' });

        const [existing] = await db.query('SELECT id FROM nhan_Hieu WHERE LOWER(ten_NH) = LOWER(?) AND id <> ?', [name, id]);
        if (existing.length) {
            return res.status(409).json({ success: false, message: `Tên danh mục "${name}" đã được sử dụng bởi danh mục khác.` });
        }

        const logoVal = String(logo || hinh_anh || '').trim() || null;
        await db.query(
            'UPDATE nhan_Hieu SET ten_NH = ?, logo = ?, mo_ta = ?, trang_thai = ? WHERE id = ?',
            [name, logoVal, mo_ta?.trim() || null, Number(trang_thai), id]
        );
        res.json({ success: true, message: 'Đã cập nhật danh mục thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể cập nhật danh mục.' });
    }
};

const toggleCategoryStatusHandler = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [brands] = await db.query('SELECT id, trang_thai FROM nhan_Hieu WHERE id = ?', [id]);
        if (!brands.length) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục.' });
        const newStatus = Number(brands[0].trang_thai) === 1 ? 0 : 1;
        await db.query('UPDATE nhan_Hieu SET trang_thai = ? WHERE id = ?', [newStatus, id]);
        res.json({
            success: true,
            message: newStatus === 1 ? 'Đã kích hoạt danh mục.' : 'Đã tạm ẩn danh mục.',
            data: { id, trang_thai: newStatus }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server khi đổi trạng thái!' });
    }
};

const deleteCategoryHandler = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [laptops] = await db.query('SELECT COUNT(*) AS count FROM laptop_Detail WHERE nhan_hieu_id = ?', [id]);
        if (laptops[0]?.count > 0) {
            return res.status(400).json({
                success: false,
                message: `Danh mục này đang liên kết với ${laptops[0].count} sản phẩm trong kho. Bạn nên tạm ẩn danh mục thay vì xóa để tránh lỗi dữ liệu sản phẩm.`
            });
        }
        const [result] = await db.query('DELETE FROM nhan_Hieu WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục cần xóa.' });
        }
        res.json({ success: true, message: 'Đã xóa danh mục thành công.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể xóa danh mục.' });
    }
};

// Route Upload Logo Danh mục
app.post('/api/admin/danh-muc/upload-logo', ...accountManagementAccess, requireAdminPermission('categories'), (req, res) => {
    upload.single('logo')(req, res, async (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message });
        if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng chọn file logo / ảnh danh mục!' });
        const url = `/uploads/${req.file.filename}`;
        res.json({ success: true, message: 'Tải logo thành công!', data: { url } });
    });
});

// Endpoint aliases: /api/admin/danh-muc và /api/admin/nhan-hieu
app.get('/api/admin/danh-muc', ...accountManagementAccess, requireAdminPermission('categories'), getCategoriesHandler);
app.post('/api/admin/danh-muc', ...accountManagementAccess, requireAdminPermission('categories'), createCategoryHandler);
app.put('/api/admin/danh-muc/:id', ...accountManagementAccess, requireAdminPermission('categories'), updateCategoryHandler);
app.put('/api/admin/danh-muc/:id/toggle-status', ...accountManagementAccess, requireAdminPermission('categories'), toggleCategoryStatusHandler);
app.delete('/api/admin/danh-muc/:id', ...accountManagementAccess, requireAdminPermission('categories'), deleteCategoryHandler);

app.get('/api/admin/nhan-hieu', ...accountManagementAccess, requireAdminPermission('categories'), async (req, res) => {
    try {
        const [brands] = await db.query(`
            SELECT n.*, COUNT(l.id) AS so_san_pham
            FROM nhan_Hieu n
            LEFT JOIN laptop_Detail l ON l.nhan_hieu_id = n.id
            GROUP BY n.id
            ORDER BY n.ten_NH ASC
        `);
        res.json({ success: true, data: brands });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách thương hiệu.' });
    }
});
app.post('/api/admin/nhan-hieu', ...accountManagementAccess, requireAdminPermission('categories'), createCategoryHandler);
app.put('/api/admin/nhan-hieu/:id', ...accountManagementAccess, requireAdminPermission('categories'), updateCategoryHandler);
app.put('/api/admin/nhan-hieu/:id/toggle-status', ...accountManagementAccess, requireAdminPermission('categories'), toggleCategoryStatusHandler);
app.delete('/api/admin/nhan-hieu/:id', ...accountManagementAccess, requireAdminPermission('categories'), deleteCategoryHandler);

// ─── API Quản lý Mã giảm giá (Admin) ─────────────────────────
app.get('/api/admin/coupons', ...accountManagementAccess, requireAdminPermission('coupons'), async (req, res) => {
    try {
        const { q, status } = req.query;
        const conditions = [];
        const params = [];

        if (q && String(q).trim()) {
            conditions.push('(ma_coupon LIKE ? OR mo_ta LIKE ?)');
            const kw = `%${String(q).trim()}%`;
            params.push(kw, kw);
        }

        if (status === 'active') {
            conditions.push('trang_thai = 1 AND ngay_bat_dau <= CURDATE() AND ngay_ket_thuc >= CURDATE() AND da_su_dung < so_luong');
        } else if (status === 'disabled') {
            conditions.push('trang_thai = 0');
        } else if (status === 'expired') {
            conditions.push('(ngay_ket_thuc < CURDATE() OR da_su_dung >= so_luong)');
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const [coupons] = await db.query(`SELECT * FROM coupon ${whereClause} ORDER BY id DESC`, params);

        const [[stats]] = await db.query(`
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(CASE WHEN trang_thai = 1 AND ngay_bat_dau <= CURDATE() AND ngay_ket_thuc >= CURDATE() AND da_su_dung < so_luong THEN 1 ELSE 0 END), 0) AS active_count,
                COALESCE(SUM(da_su_dung), 0) AS total_used,
                COALESCE(SUM(CASE WHEN trang_thai = 0 OR ngay_ket_thuc < CURDATE() OR da_su_dung >= so_luong THEN 1 ELSE 0 END), 0) AS inactive_or_expired
            FROM coupon
        `);

        res.json({
            success: true,
            data: coupons,
            stats: {
                total: Number(stats?.total || 0),
                active: Number(stats?.active_count || 0),
                used: Number(stats?.total_used || 0),
                inactive_or_expired: Number(stats?.inactive_or_expired || 0)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải mã giảm giá.' });
    }
});

app.post('/api/admin/coupons', ...accountManagementAccess, requireAdminPermission('coupons'), async (req, res) => {
    try {
        const { ma_coupon, mo_ta, loai_giam = 'so_tien', gia_tri_giam, giam_toi_da, don_hang_toi_thieu = 0, so_luong = 100, ngay_bat_dau, ngay_ket_thuc, trang_thai = 1 } = req.body;
        if (!ma_coupon?.trim() || !gia_tri_giam || !ngay_bat_dau || !ngay_ket_thuc) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đủ mã coupon, giá trị giảm và ngày hiệu lực.' });
        }
        if (new Date(ngay_ket_thuc) < new Date(ngay_bat_dau)) {
            return res.status(400).json({ success: false, message: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.' });
        }
        if (loai_giam === 'phan_tram' && (Number(gia_tri_giam) <= 0 || Number(gia_tri_giam) > 100)) {
            return res.status(400).json({ success: false, message: 'Phần trăm giảm giá phải nằm trong khoảng từ 1% đến 100%.' });
        }
        if (loai_giam === 'so_tien' && Number(gia_tri_giam) <= 0) {
            return res.status(400).json({ success: false, message: 'Giá trị tiền giảm phải lớn hơn 0.' });
        }

        const cleanCode = ma_coupon.trim().toUpperCase().replace(/\s+/g, '');
        const [existing] = await db.query('SELECT id FROM coupon WHERE ma_coupon = ?', [cleanCode]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Mã giảm giá này đã tồn tại trong hệ thống.' });
        }
        const [result] = await db.query(
            `INSERT INTO coupon (ma_coupon, mo_ta, loai_giam, gia_tri_giam, giam_toi_da, don_hang_toi_thieu, so_luong, da_su_dung, ngay_bat_dau, ngay_ket_thuc, trang_thai)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
            [cleanCode, mo_ta ? mo_ta.trim() : null, loai_giam, Number(gia_tri_giam), (loai_giam === 'phan_tram' && giam_toi_da) ? Number(giam_toi_da) : null, Number(don_hang_toi_thieu), Number(so_luong), ngay_bat_dau, ngay_ket_thuc, Number(trang_thai)]
        );
        res.status(201).json({ success: true, message: 'Tạo mã giảm giá thành công!', data: { id: result.insertId } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tạo mã giảm giá.' });
    }
});

app.put('/api/admin/coupons/:id', ...accountManagementAccess, requireAdminPermission('coupons'), async (req, res) => {
    try {
        const couponId = Number(req.params.id);
        if (!Number.isInteger(couponId) || couponId <= 0) {
            return res.status(400).json({ success: false, message: 'Mã coupon không hợp lệ.' });
        }
        const { ma_coupon, mo_ta, loai_giam = 'so_tien', gia_tri_giam, giam_toi_da, don_hang_toi_thieu = 0, so_luong = 100, ngay_bat_dau, ngay_ket_thuc, trang_thai = 1 } = req.body;
        if (!ma_coupon?.trim() || !gia_tri_giam || !ngay_bat_dau || !ngay_ket_thuc) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đủ mã coupon, giá trị giảm và ngày hiệu lực.' });
        }
        if (new Date(ngay_ket_thuc) < new Date(ngay_bat_dau)) {
            return res.status(400).json({ success: false, message: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.' });
        }
        if (loai_giam === 'phan_tram' && (Number(gia_tri_giam) <= 0 || Number(gia_tri_giam) > 100)) {
            return res.status(400).json({ success: false, message: 'Phần trăm giảm giá phải nằm trong khoảng từ 1% đến 100%.' });
        }
        if (loai_giam === 'so_tien' && Number(gia_tri_giam) <= 0) {
            return res.status(400).json({ success: false, message: 'Giá trị tiền giảm phải lớn hơn 0.' });
        }

        const cleanCode = ma_coupon.trim().toUpperCase().replace(/\s+/g, '');
        const [existing] = await db.query('SELECT id FROM coupon WHERE ma_coupon = ? AND id <> ?', [cleanCode, couponId]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Mã giảm giá này đã được sử dụng bởi coupon khác.' });
        }

        const [result] = await db.query(
            `UPDATE coupon
             SET ma_coupon = ?, mo_ta = ?, loai_giam = ?, gia_tri_giam = ?, giam_toi_da = ?,
                 don_hang_toi_thieu = ?, so_luong = ?, ngay_bat_dau = ?, ngay_ket_thuc = ?, trang_thai = ?
             WHERE id = ?`,
            [cleanCode, mo_ta ? mo_ta.trim() : null, loai_giam, Number(gia_tri_giam), (loai_giam === 'phan_tram' && giam_toi_da) ? Number(giam_toi_da) : null, Number(don_hang_toi_thieu), Number(so_luong), ngay_bat_dau, ngay_ket_thuc, Number(trang_thai), couponId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá.' });
        }
        res.json({ success: true, message: 'Cập nhật mã giảm giá thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể cập nhật mã giảm giá.' });
    }
});

app.put('/api/admin/coupons/:id/toggle-status', ...accountManagementAccess, requireAdminPermission('coupons'), async (req, res) => {
    try {
        const couponId = Number(req.params.id);
        const [coupons] = await db.query('SELECT id, trang_thai FROM coupon WHERE id = ?', [couponId]);
        if (!coupons.length) return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá.' });

        const nextStatus = Number(coupons[0].trang_thai) === 1 ? 0 : 1;
        await db.query('UPDATE coupon SET trang_thai = ? WHERE id = ?', [nextStatus, couponId]);
        res.json({
            success: true,
            message: nextStatus === 1 ? 'Đã kích hoạt mã giảm giá.' : 'Đã tạm ẩn mã giảm giá.',
            data: { id: couponId, trang_thai: nextStatus }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể thay đổi trạng thái mã giảm giá.' });
    }
});

app.delete('/api/admin/coupons/:id', ...accountManagementAccess, requireAdminPermission('coupons'), async (req, res) => {
    try {
        const couponId = Number(req.params.id);
        const [orders] = await db.query('SELECT COUNT(*) AS cnt FROM `order` WHERE coupon_id = ?', [couponId]);
        if (orders[0]?.cnt > 0) {
            return res.status(400).json({
                success: false,
                message: `Mã này đã được áp dụng trong ${orders[0].cnt} đơn hàng. Để đảm bảo tính toàn vẹn dữ liệu đơn hàng, bạn chỉ nên tạm ẩn mã thay vì xóa hẳn.`
            });
        }
        const [result] = await db.query('DELETE FROM coupon WHERE id = ?', [couponId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá cần xóa.' });
        }
        res.json({ success: true, message: 'Đã xóa mã giảm giá thành công.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể xóa mã giảm giá.' });
    }
});

// ─── API Quản lý & Kiểm duyệt Đánh giá (Admin) ───────────────
app.get('/api/admin/reviews', ...accountManagementAccess, requireAdminPermission('products'), async (req, res) => {
    try {
        const { q, rating, status, page = 1, limit = 50 } = req.query;
        const conditions = [];
        const params = [];

        if (q && String(q).trim()) {
            conditions.push('(r.noi_dung LIKE ? OR r.tieu_de LIKE ? OR l.ten_laptop LIKE ? OR u.ho_ten LIKE ?)');
            const kw = `%${String(q).trim()}%`;
            params.push(kw, kw, kw, kw);
        }
        if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
            conditions.push('r.so_sao = ?');
            params.push(Number(rating));
        }
        if (status !== undefined && status !== '' && status !== 'all') {
            conditions.push('r.trang_thai = ?');
            params.push(Number(status));
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (Number(page) - 1) * Number(limit);

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total
             FROM reviews r
             JOIN laptop_Detail l ON l.id = r.laptop_id
             JOIN users u ON u.id = r.user_id
             ${where}`,
            params
        );

        const [reviews] = await db.query(
            `SELECT r.*, l.ten_laptop, u.ho_ten, u.email, u.avatar
             FROM reviews r
             JOIN laptop_Detail l ON l.id = r.laptop_id
             JOIN users u ON u.id = r.user_id
             ${where}
             ORDER BY r.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, Number(limit), offset]
        );

        res.json({
            success: true,
            data: reviews,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách đánh giá.' });
    }
});

app.put('/api/admin/reviews/:id/toggle-status', ...accountManagementAccess, requireAdminPermission('products'), async (req, res) => {
    try {
        const reviewId = Number(req.params.id);
        const [reviews] = await db.query('SELECT id, trang_thai FROM reviews WHERE id = ?', [reviewId]);
        if (!reviews.length) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá.' });

        const nextStatus = Number(reviews[0].trang_thai) === 1 ? 0 : 1;
        await db.query('UPDATE reviews SET trang_thai = ? WHERE id = ?', [nextStatus, reviewId]);
        res.json({
            success: true,
            message: nextStatus === 1 ? 'Đã kích hoạt hiển thị đánh giá.' : 'Đã ẩn đánh giá.',
            data: { id: reviewId, trang_thai: nextStatus }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể thay đổi trạng thái đánh giá.' });
    }
});

app.delete('/api/admin/reviews/:id', ...accountManagementAccess, requireAdminPermission('products'), async (req, res) => {
    try {
        const reviewId = Number(req.params.id);
        await db.query('DELETE FROM reviews WHERE id = ?', [reviewId]);
        res.json({ success: true, message: 'Đã xóa đánh giá thành công.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể xóa đánh giá.' });
    }
});

app.get('/api/admin/don-hang', ...accountManagementAccess, requireAdminPermission('orders'), async (req, res) => {
    try {
        const search = String(req.query.q || '').trim();
        const status = String(req.query.status || '').trim();
        const validStatuses = ['cho_xac_nhan', 'da_xac_nhan', 'dang_giao', 'da_giao', 'da_huy', 'tra_hang'];
        const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
        const conditions = [];
        const params = [];
        if (search) {
            conditions.push('(o.ma_don_hang LIKE ? OR o.ho_ten_nguoi_nhan LIKE ? OR o.so_dien_thoai LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (validStatuses.includes(status)) {
            conditions.push('o.trang_thai_dh = ?');
            params.push(status);
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const [orders] = await db.query(
            `SELECT o.id, o.ma_don_hang, o.ho_ten_nguoi_nhan, o.so_dien_thoai,
                    o.dia_chi_giao, o.thanh_tien, o.phuong_thuc_tt, o.trang_thai_tt,
                    o.trang_thai_dh, o.created_at, COUNT(od.id) AS so_mat_hang
             FROM \`order\` o
             LEFT JOIN order_detail od ON od.order_id = o.id
             ${where}
             GROUP BY o.id
             ORDER BY o.created_at DESC
             LIMIT ?`,
            [...params, limit]
        );
        res.json({ success: true, data: orders });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách đơn hàng.' });
    }
});

app.get('/api/admin/don-hang/options', ...accountManagementAccess, requireAdminPermission('orders'), async (req, res) => {
    try {
        const [customers] = await db.query(
            "SELECT id, ho_ten, email, so_dien_thoai, dia_chi FROM users WHERE vai_tro = 'khach_hang' AND trang_thai = 1 ORDER BY ho_ten"
        );
        const [products] = await db.query(
            `SELECT l.id, l.ten_laptop, l.gia_ban, l.so_luong_ton, n.ten_NH
             FROM laptop_Detail l JOIN nhan_Hieu n ON n.id = l.nhan_hieu_id
             WHERE l.trang_thai = 1 ORDER BY l.ten_laptop`
        );
        res.json({ success: true, data: { customers, products } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách khách hàng và sản phẩm.' });
    }
});

app.get('/api/admin/don-hang/:id', ...accountManagementAccess, requireAdminPermission('orders'), async (req, res) => {
    try {
        const orderId = Number(req.params.id);
        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({ success: false, message: 'Mã đơn hàng không hợp lệ.' });
        }
        const [orders] = await db.query('SELECT * FROM `order` WHERE id = ?', [orderId]);
        if (!orders.length) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
        const [items] = await db.query(
            'SELECT laptop_id, ten_laptop, gia_ban, so_luong, thanh_tien FROM order_detail WHERE order_id = ?',
            [orderId]
        );
        res.json({ success: true, data: { ...orders[0], items } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải chi tiết đơn hàng.' });
    }
});

const prepareOrderItems = async (connection, items, checkStock = true) => {
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
        throw new Error('Vui lòng chọn từ 1 đến 50 mặt hàng cho đơn.');
    }
    const quantities = new Map();
    for (const item of items) {
        const productId = Number(item.laptop_id);
        const quantity = Number(item.so_luong);
        if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity <= 0 || quantity > 1000) {
            throw new Error('Sản phẩm hoặc số lượng không hợp lệ.');
        }
        quantities.set(productId, (quantities.get(productId) || 0) + quantity);
    }

    const normalizedItems = [];
    for (const [productId, quantity] of quantities) {
        const [products] = await connection.query(
            'SELECT id, ten_laptop, gia_ban, so_luong_ton, trang_thai FROM laptop_Detail WHERE id = ? FOR UPDATE',
            [productId]
        );
        if (!products.length || Number(products[0].trang_thai) !== 1) {
            throw new Error(`Sản phẩm mã ${productId} không tồn tại hoặc đã ngừng kinh doanh.`);
        }
        const product = products[0];
        if (checkStock && Number(product.so_luong_ton) < quantity) {
            throw new Error(`Sản phẩm "${product.ten_laptop}" trong kho chỉ còn ${product.so_luong_ton} máy.`);
        }
        normalizedItems.push({
            laptop_id: product.id,
            ten_laptop: product.ten_laptop,
            gia_ban: Number(product.gia_ban),
            so_luong: quantity,
            thanh_tien: Number(product.gia_ban) * quantity,
        });
    }
    return normalizedItems;
};

app.post('/api/admin/don-hang', ...accountManagementAccess, requireAdminPermission('orders'), async (req, res) => {
    const { user_id, ho_ten_nguoi_nhan, so_dien_thoai, dia_chi_giao, items, phi_van_chuyen = 30000, phuong_thuc_tt = 'tien_mat', trang_thai_tt = 'chua_thanh_toan', trang_thai_dh = 'cho_xac_nhan', ghi_chu = '' } = req.body;
    const customerId = Number(user_id);
    const shippingFee = Number(phi_van_chuyen);
    const paymentMethods = ['tien_mat', 'chuyen_khoan', 'vnpay', 'momo', 'zalopay'];
    const paymentStatuses = ['chua_thanh_toan', 'da_thanh_toan', 'hoan_tien'];
    const orderStatuses = ['cho_xac_nhan', 'da_xac_nhan', 'dang_giao', 'da_giao', 'da_huy', 'tra_hang'];
    if (!Number.isInteger(customerId) || customerId <= 0 || !ho_ten_nguoi_nhan?.trim() || !so_dien_thoai?.trim() || !dia_chi_giao?.trim()
        || !Number.isFinite(shippingFee) || shippingFee < 0 || !paymentMethods.includes(phuong_thuc_tt)
        || !paymentStatuses.includes(trang_thai_tt) || !orderStatuses.includes(trang_thai_dh)) {
        return res.status(400).json({ success: false, message: 'Vui lòng kiểm tra thông tin khách hàng, giao hàng và thanh toán.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [customers] = await connection.query("SELECT id FROM users WHERE id = ? AND vai_tro = 'khach_hang' AND trang_thai = 1", [customerId]);
        if (!customers.length) throw new Error('Không tìm thấy khách hàng đang hoạt động.');
        const orderItems = await prepareOrderItems(connection, items, true);
        const subtotal = orderItems.reduce((total, item) => total + item.thanh_tien, 0);
        const orderCode = `DH${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
        const [result] = await connection.query(
            `INSERT INTO \`order\` (user_id, ma_don_hang, ho_ten_nguoi_nhan, so_dien_thoai, dia_chi_giao,
             tong_tien, phi_van_chuyen, thanh_tien, phuong_thuc_tt, trang_thai_tt, trang_thai_dh, ghi_chu)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [customerId, orderCode, ho_ten_nguoi_nhan.trim(), so_dien_thoai.trim(), dia_chi_giao.trim(), subtotal, shippingFee, subtotal + shippingFee, phuong_thuc_tt, trang_thai_tt, trang_thai_dh, String(ghi_chu).trim() || null]
        );
        for (const item of orderItems) {
            const serialNumber = 'KT-' + String(result.insertId).padStart(4, '0') + '-' + String(item.laptop_id).padStart(3, '0') + '-' + Math.floor(Math.random() * 9000 + 1000);
            await connection.query(
                'INSERT INTO order_detail (order_id, laptop_id, ten_laptop, gia_ban, so_luong, thanh_tien, serial_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [result.insertId, item.laptop_id, item.ten_laptop, item.gia_ban, item.so_luong, item.thanh_tien, serialNumber]
            );
            // Trừ tồn kho khi Admin tạo đơn (Sửa lỗi 1.3)
            await connection.query('UPDATE laptop_Detail SET so_luong_ton = so_luong_ton - ? WHERE id = ?', [item.so_luong, item.laptop_id]);
        }
        await connection.commit();
        res.status(201).json({ success: true, data: { id: result.insertId, ma_don_hang: orderCode } });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        const clientError = /Không tìm thấy|không hợp lệ|Vui lòng chọn|chỉ còn/.test(err.message);
        res.status(clientError ? 400 : 500).json({ success: false, message: clientError ? err.message : 'Không thể tạo đơn hàng.' });
    } finally {
        connection.release();
    }
});

app.put('/api/admin/don-hang/:id', ...accountManagementAccess, requireAdminPermission('orders'), async (req, res) => {
    const orderId = Number(req.params.id);
    const { user_id, ho_ten_nguoi_nhan, so_dien_thoai, dia_chi_giao, items, phi_van_chuyen = 30000, phuong_thuc_tt, trang_thai_tt, trang_thai_dh, ghi_chu = '' } = req.body;
    const customerId = Number(user_id);
    const shippingFee = Number(phi_van_chuyen);
    const paymentMethods = ['tien_mat', 'chuyen_khoan', 'vnpay', 'momo', 'zalopay'];
    const paymentStatuses = ['chua_thanh_toan', 'da_thanh_toan', 'hoan_tien'];
    const orderStatuses = ['cho_xac_nhan', 'da_xac_nhan', 'dang_giao', 'da_giao', 'da_huy', 'tra_hang'];
    if (!Number.isInteger(orderId) || orderId <= 0 || !Number.isInteger(customerId) || customerId <= 0
        || !ho_ten_nguoi_nhan?.trim() || !so_dien_thoai?.trim() || !dia_chi_giao?.trim()
        || !Number.isFinite(shippingFee) || shippingFee < 0 || !paymentMethods.includes(phuong_thuc_tt)
        || !paymentStatuses.includes(trang_thai_tt) || !orderStatuses.includes(trang_thai_dh)) {
        return res.status(400).json({ success: false, message: 'Thông tin đơn hàng không hợp lệ.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [orders] = await connection.query('SELECT * FROM `order` WHERE id = ? FOR UPDATE', [orderId]);
        if (!orders.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
        }
        const [customers] = await connection.query("SELECT id FROM users WHERE id = ? AND vai_tro = 'khach_hang' AND trang_thai = 1", [customerId]);
        if (!customers.length) throw new Error('Không tìm thấy khách hàng đang hoạt động.');

        // Hoàn lại tồn kho cho các item cũ trước khi cập nhật & giữ serial_number cũ
        const [oldItems] = await connection.query('SELECT laptop_id, so_luong, serial_number FROM order_detail WHERE order_id = ?', [orderId]);
        const oldSerialMap = new Map();
        for (const oi of oldItems) {
            if (oi.serial_number && !oldSerialMap.has(oi.laptop_id)) {
                oldSerialMap.set(oi.laptop_id, oi.serial_number);
            }
        }
        if (!['da_huy', 'tra_hang'].includes(orders[0].trang_thai_dh)) {
            for (const oldItem of oldItems) {
                await connection.query('UPDATE laptop_Detail SET so_luong_ton = so_luong_ton + ? WHERE id = ?', [oldItem.so_luong, oldItem.laptop_id]);
            }
        }

        const orderItems = await prepareOrderItems(connection, items, !['da_huy', 'tra_hang'].includes(trang_thai_dh));
        const subtotal = orderItems.reduce((total, item) => total + item.thanh_tien, 0);
        const discount = Number(orders[0].tien_giam || 0);
        const finalTotal = Math.max(0, subtotal - discount + shippingFee);
        await connection.query(
            `UPDATE \`order\` SET user_id = ?, ho_ten_nguoi_nhan = ?, so_dien_thoai = ?, dia_chi_giao = ?,
             tong_tien = ?, phi_van_chuyen = ?, thanh_tien = ?, phuong_thuc_tt = ?, trang_thai_tt = ?, trang_thai_dh = ?, ghi_chu = ?
             WHERE id = ?`,
            [customerId, ho_ten_nguoi_nhan.trim(), so_dien_thoai.trim(), dia_chi_giao.trim(), subtotal, shippingFee, finalTotal, phuong_thuc_tt, trang_thai_tt, trang_thai_dh, String(ghi_chu).trim() || null, orderId]
        );
        await connection.query('DELETE FROM order_detail WHERE order_id = ?', [orderId]);
        for (const item of orderItems) {
            const serialNumber = oldSerialMap.get(item.laptop_id)
                || ('KT-' + String(orderId).padStart(4, '0') + '-' + String(item.laptop_id).padStart(3, '0') + '-' + Math.floor(Math.random() * 9000 + 1000));
            await connection.query(
                'INSERT INTO order_detail (order_id, laptop_id, ten_laptop, gia_ban, so_luong, thanh_tien, serial_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [orderId, item.laptop_id, item.ten_laptop, item.gia_ban, item.so_luong, item.thanh_tien, serialNumber]
            );
            if (!['da_huy', 'tra_hang'].includes(trang_thai_dh)) {
                await connection.query('UPDATE laptop_Detail SET so_luong_ton = so_luong_ton - ? WHERE id = ?', [item.so_luong, item.laptop_id]);
            }
        }
        await connection.commit();
        res.json({ success: true, message: 'Đã cập nhật đơn hàng.' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        const clientError = /Không tìm thấy|không hợp lệ|Vui lòng chọn|chỉ còn/.test(err.message);
        res.status(clientError ? 400 : 500).json({ success: false, message: clientError ? err.message : 'Không thể cập nhật đơn hàng.' });
    } finally {
        connection.release();
    }
});

app.delete('/api/admin/don-hang/:id', ...accountManagementAccess, requireAdminPermission('orders'), async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const orderId = Number(req.params.id);
        if (!Number.isInteger(orderId) || orderId <= 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Mã đơn hàng không hợp lệ.' });
        }
        const [orders] = await connection.query('SELECT id, trang_thai_dh, trang_thai_tt FROM `order` WHERE id = ? FOR UPDATE', [orderId]);
        if (!orders.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
        }
        if (orders[0].trang_thai_tt === 'da_thanh_toan') {
            await connection.rollback();
            return res.status(409).json({ success: false, message: 'Không thể xóa đơn đã thanh toán; hãy xử lý hoàn tiền hoặc hủy đơn trước.' });
        }

        // Hoàn lại tồn kho nếu đơn chưa ở trạng thái da_huy hoặc tra_hang
        if (!['da_huy', 'tra_hang'].includes(orders[0].trang_thai_dh)) {
            const [items] = await connection.query('SELECT laptop_id, so_luong FROM order_detail WHERE order_id = ?', [orderId]);
            for (const item of items) {
                await connection.query('UPDATE laptop_Detail SET so_luong_ton = so_luong_ton + ? WHERE id = ?', [item.so_luong, item.laptop_id]);
            }
        }

        await connection.query('DELETE FROM order_detail WHERE order_id = ?', [orderId]);
        await connection.query('DELETE FROM `order` WHERE id = ?', [orderId]);
        await connection.commit();
        res.json({ success: true, message: 'Đã xóa đơn hàng.' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể xóa đơn hàng.' });
    } finally {
        connection.release();
    }
});

// Cập nhật trạng thái đơn hàng (Admin) - Hoàn lại tồn kho & tiền ví nếu hủy đơn / trả hàng
app.put('/api/admin/don-hang/:id/status', ...accountManagementAccess, requireAdminPermission('orders'), async (req, res) => {
    const orderId = Number(req.params.id);
    const { trang_thai_dh } = req.body;
    const validStatuses = ['cho_xac_nhan', 'da_xac_nhan', 'dang_giao', 'da_giao', 'da_huy', 'tra_hang'];
    if (!Number.isInteger(orderId) || orderId <= 0 || !validStatuses.includes(trang_thai_dh)) {
        return res.status(400).json({ success: false, message: 'Mã đơn hàng hoặc trạng thái không hợp lệ.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [orders] = await connection.query('SELECT * FROM `order` WHERE id = ? FOR UPDATE', [orderId]);
        if (!orders.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
        }
        const currentOrder = orders[0];

        // Chặn đổi trạng thái nếu đơn hàng đã hủy hoặc trả hàng
        if (['da_huy', 'tra_hang'].includes(currentOrder.trang_thai_dh)) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Đơn hàng đã hủy hoặc trả hàng không thể chuyển sang trạng thái khác.' });
        }

        // Nếu trạng thái chuyển sang da_huy hoặc tra_hang: Hoàn lại tồn kho, coupon & hoàn tiền nếu đã thanh toán
        if (['da_huy', 'tra_hang'].includes(trang_thai_dh)) {
            // Hoàn lại lượt sử dụng mã giảm giá nếu có
            if (currentOrder.coupon_id) {
                await connection.query('UPDATE coupon SET da_su_dung = GREATEST(0, da_su_dung - 1) WHERE id = ?', [currentOrder.coupon_id]);
            }

            const [items] = await connection.query('SELECT laptop_id, so_luong FROM order_detail WHERE order_id = ?', [orderId]);
            for (const item of items) {
                await connection.query('UPDATE laptop_Detail SET so_luong_ton = so_luong_ton + ? WHERE id = ?', [item.so_luong, item.laptop_id]);
            }

            // Nếu đơn đã thanh toán: hoàn lại tiền vào ví người dùng
            if (currentOrder.trang_thai_tt === 'da_thanh_toan') {
                const [users] = await connection.query('SELECT balance FROM users WHERE id = ? FOR UPDATE', [currentOrder.user_id]);
                if (users.length > 0) {
                    const oldBal = Number(users[0].balance);
                    const newBal = oldBal + Number(currentOrder.thanh_tien);
                    await connection.query('UPDATE users SET balance = ? WHERE id = ?', [newBal, currentOrder.user_id]);
                    const reason = trang_thai_dh === 'tra_hang'
                        ? `Hoàn tiền do trả hàng đơn hàng ${currentOrder.ma_don_hang}`
                        : `Hoàn tiền do hủy đơn hàng ${currentOrder.ma_don_hang}`;
                    await connection.query(
                        `INSERT INTO wallet_transactions (user_id, ma_giao_dich, loai_giao_dich, so_tien, so_du_truoc, so_du_sau, phuong_thuc, trang_thai, ghi_chu)
                         VALUES (?, ?, 'hoan_tien', ?, ?, ?, 'hoan_tien', 'thanh_cong', ?)`,
                        [currentOrder.user_id, 'REF_' + Date.now(), currentOrder.thanh_tien, oldBal, newBal, reason]
                    );
                    await connection.query("UPDATE `order` SET trang_thai_tt = 'hoan_tien' WHERE id = ?", [orderId]);
                }
            }
        }

        await connection.query(
            `UPDATE \`order\`
             SET trang_thai_dh = ?,
                 trang_thai_tt = IF(? = 'da_giao', 'da_thanh_toan', trang_thai_tt)
             WHERE id = ?`,
            [trang_thai_dh, trang_thai_dh, orderId]
        );
        await connection.commit();
        res.json({ success: true, message: 'Đã cập nhật trạng thái đơn hàng thành công.' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể cập nhật trạng thái đơn hàng.' });
    } finally {
        connection.release();
    }
});

// Cập nhật trạng thái thanh toán đơn hàng (Admin)
app.put('/api/admin/don-hang/:id/payment-status', ...accountManagementAccess, requireAdminPermission('orders'), async (req, res) => {
    const orderId = Number(req.params.id);
    const { trang_thai_tt } = req.body;
    const validPaymentStatuses = ['chua_thanh_toan', 'da_thanh_toan', 'hoan_tien'];
    if (!Number.isInteger(orderId) || orderId <= 0 || !validPaymentStatuses.includes(trang_thai_tt)) {
        return res.status(400).json({ success: false, message: 'Mã đơn hàng hoặc trạng thái thanh toán không hợp lệ.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [orders] = await connection.query('SELECT * FROM `order` WHERE id = ? FOR UPDATE', [orderId]);
        if (!orders.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
        }

        await connection.query('UPDATE `order` SET trang_thai_tt = ? WHERE id = ?', [trang_thai_tt, orderId]);
        await connection.commit();
        res.json({ success: true, message: 'Đã cập nhật trạng thái thanh toán thành công.', data: { trang_thai_tt } });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể cập nhật trạng thái thanh toán đơn hàng.' });
    } finally {
        connection.release();
    }
});

// ─── API Xuất Hóa Đơn Bán Hàng (In PDF / Chi tiết hóa đơn) ──
app.get('/api/admin/don-hang/:id/invoice', ...accountManagementAccess, requireAdminPermission('orders'), async (req, res) => {
    try {
        const orderId = Number(req.params.id);
        const [orders] = await db.query(
            `SELECT o.*, u.ho_ten AS customer_name, u.email AS customer_email
             FROM \`order\` o
             LEFT JOIN users u ON u.id = o.user_id
             WHERE o.id = ?`,
            [orderId]
        );
        if (!orders.length) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });

        const [items] = await db.query(
            `SELECT od.*, l.cpu, l.ram, l.o_cung, l.card_do_hoa, l.bao_hanh, n.ten_NH
             FROM order_detail od
             LEFT JOIN laptop_Detail l ON l.id = od.laptop_id
             LEFT JOIN nhan_Hieu n ON n.id = l.nhan_hieu_id
             WHERE od.order_id = ?`,
            [orderId]
        );

        res.json({
            success: true,
            data: {
                shop: {
                    name: 'KTSHOP - HỆ THỐNG LAPTOP CHÍNH HÃNG',
                    address: 'Tầng 5, Tòa nhà KTSHOP Tower, 123 Cầu Giấy, Hà Nội',
                    phone: '1800 6868 - 0988 888 888',
                    email: 'support@ktshop.vn',
                    website: 'http://localhost:3000'
                },
                order: orders[0],
                items
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể xuất dữ liệu hóa đơn.' });
    }
});

// ─── API Báo cáo & Thống kê Doanh thu (Chart) ───────────────
app.get('/api/admin/thong-ke/doanh-thu-chart', ...accountManagementAccess, requireAdminPermission('orders'), async (req, res) => {
    try {
        const days = Math.min(Math.max(Number(req.query.days) || 7, 7), 30);
        const [rows] = await db.query(
            `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
                    COALESCE(SUM(CASE WHEN trang_thai_tt = 'da_thanh_toan' AND trang_thai_dh NOT IN ('da_huy', 'tra_hang') THEN thanh_tien ELSE 0 END), 0) AS revenue,
                    COUNT(CASE WHEN trang_thai_dh <> 'da_huy' THEN 1 END) AS orders
             FROM \`order\`
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
             ORDER BY date ASC`,
            [days]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải biểu đồ doanh thu.' });
    }
});

// ─── API Top sản phẩm bán chạy & Tồn kho nhiều ─────────────
app.get('/api/admin/thong-ke/top-san-pham', ...accountManagementAccess, requireAdminPermission('orders'), async (req, res) => {
    try {
        // Top 5 bán chạy nhất
        const [bestSellers] = await db.query(`
            SELECT od.laptop_id, od.ten_laptop,
                   SUM(od.so_luong) AS tong_da_ban,
                   SUM(od.thanh_tien) AS tong_doanh_thu,
                   l.so_luong_ton, l.gia_ban, i.url_anh
            FROM order_detail od
            JOIN \`order\` o ON o.id = od.order_id
            JOIN laptop_Detail l ON l.id = od.laptop_id
            LEFT JOIN (
                SELECT laptop_id, url_anh FROM (
                    SELECT laptop_id, url_anh,
                           ROW_NUMBER() OVER (PARTITION BY laptop_id ORDER BY la_anh_chinh DESC, thu_tu ASC, id ASC) as rn
                    FROM laptop_images
                ) r_img WHERE rn = 1
            ) i ON l.id = i.laptop_id
            WHERE o.trang_thai_dh NOT IN ('da_huy', 'tra_hang')
            GROUP BY od.laptop_id, od.ten_laptop, l.so_luong_ton, l.gia_ban, i.url_anh
            ORDER BY tong_da_ban DESC
            LIMIT 5
        `);

        // Top sản phẩm xem nhiều nhưng tồn kho còn nhiều
        const [slowMovers] = await db.query(`
            SELECT l.id, l.ten_laptop, l.gia_ban, l.so_luong_ton, l.luot_xem, n.ten_NH, i.url_anh
            FROM laptop_Detail l
            JOIN nhan_Hieu n ON n.id = l.nhan_hieu_id
            LEFT JOIN (
                SELECT laptop_id, url_anh FROM (
                    SELECT laptop_id, url_anh,
                           ROW_NUMBER() OVER (PARTITION BY laptop_id ORDER BY la_anh_chinh DESC, thu_tu ASC, id ASC) as rn
                    FROM laptop_images
                ) r_img WHERE rn = 1
            ) i ON l.id = i.laptop_id
            WHERE l.trang_thai = 1 AND l.so_luong_ton >= 5
            ORDER BY l.luot_xem DESC, l.so_luong_ton DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                best_sellers: bestSellers,
                slow_movers: slowMovers
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải thống kê sản phẩm.' });
    }
});

// ─── API Quản lý Vai trò (Roles) & Tài khoản ──────────────────
app.get('/api/admin/roles', ...accountManagementAccess, async (req, res) => {
    try {
        const [roles] = await db.query('SELECT * FROM roles ORDER BY is_system DESC, id ASC');
        const formatted = roles.map(r => ({
            ...r,
            quyen: typeof r.quyen === 'string' ? JSON.parse(r.quyen || '[]') : (r.quyen || [])
        }));
        res.json({ success: true, data: formatted });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách vai trò.' });
    }
});

app.post('/api/admin/roles', ...accountManagementAccess, requireAdminPermission('accounts'), async (req, res) => {
    try {
        const { ma_role, ten_role, quyen, mo_ta } = req.body;
        if (!ten_role?.trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên vai trò.' });
        }
        let cleanKey = String(ma_role || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        if (!cleanKey) {
            cleanKey = 'role_' + Date.now();
        }
        if (cleanKey === 'qtv') {
            return res.status(403).json({ success: false, message: 'Không thể tạo thêm vai trò quản trị viên cao nhất.' });
        }
        const [existing] = await db.query('SELECT id FROM roles WHERE ma_role = ?', [cleanKey]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: `Mã vai trò "${cleanKey}" đã tồn tại.` });
        }
        const validPermissions = Array.isArray(quyen) ? quyen.filter(p => ACCOUNT_PERMISSIONS.includes(p)) : [];
        const [result] = await db.query(
            'INSERT INTO roles (ma_role, ten_role, quyen, mo_ta, is_system) VALUES (?, ?, ?, ?, 0)',
            [cleanKey, ten_role.trim(), JSON.stringify(validPermissions), mo_ta?.trim() || null]
        );
        res.status(201).json({
            success: true,
            message: 'Tạo vai trò mới thành công!',
            data: { id: result.insertId, ma_role: cleanKey, ten_role: ten_role.trim(), quyen: validPermissions }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tạo vai trò mới.' });
    }
});

// Chỉnh sửa quyền của vai trò (Phần sửa role)
app.put('/api/admin/roles/:id', ...accountManagementAccess, requireAdminPermission('accounts'), async (req, res) => {
    try {
        const roleId = Number(req.params.id);
        const { ten_role, quyen, mo_ta } = req.body;
        const [roles] = await db.query('SELECT * FROM roles WHERE id = ?', [roleId]);
        if (!roles.length) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy vai trò.' });
        }
        const role = roles[0];
        // Quản trị viên cao nhất luôn toàn quyền, không thể sửa đổi
        if (role.ma_role === 'qtv') {
            return res.status(403).json({ success: false, message: 'Quản trị viên cao nhất luôn sở hữu toàn bộ quyền hạn, không thể sửa đổi.' });
        }
        const validPermissions = Array.isArray(quyen) ? quyen.filter(p => ACCOUNT_PERMISSIONS.includes(p)) : [];
        await db.query(
            'UPDATE roles SET ten_role = ?, quyen = ?, mo_ta = ? WHERE id = ?',
            [ten_role?.trim() || role.ten_role, JSON.stringify(validPermissions), mo_ta !== undefined ? mo_ta : role.mo_ta, roleId]
        );
        // Đồng bộ quyền mới cho tất cả các tài khoản đang thuộc vai trò này
        await db.query(
            'UPDATE users SET quyen = ? WHERE vai_tro = ?',
            [JSON.stringify(validPermissions), role.ma_role]
        );
        res.json({ success: true, message: 'Đã cập nhật quyền cho vai trò và đồng bộ tới các tài khoản liên quan!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể cập nhật vai trò.' });
    }
});

app.post('/api/admin/view', ...accountManagementAccess, requireAdminPermission('accounts'), async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, ho_ten, email, so_dien_thoai, vai_tro, quyen, trang_thai, balance, created_at FROM users ORDER BY created_at DESC'
        );
        const manageableUsers = users
            .filter(user => req.adminActor.vai_tro === 'qtv' || canManageRole(req.adminActor.vai_tro, user.vai_tro))
            .map(user => ({ ...user, quyen: parsePermissions(user.quyen, user.vai_tro) }));
        res.json({ success: true, data: manageableUsers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách tài khoản.' });
    }
});

app.post('/api/admin', ...accountManagementAccess, requireAdminPermission('accounts'), async (req, res) => {
    try {
        const { ho_ten, email, mat_khau, vai_tro, quyen, new_role } = req.body;
        if (!ho_ten?.trim() || !email?.trim() || !mat_khau || mat_khau.length < 8) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên, email và mật khẩu tối thiểu 8 ký tự.' });
        }

        let assignedRole = vai_tro;
        let assignedPermissions = [];

        // Trường hợp Tạo role mới ngay khi tạo tài khoản
        if (new_role && new_role.ten_role?.trim()) {
            let cleanKey = String(new_role.ma_role || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
            if (!cleanKey) cleanKey = 'role_' + Date.now();
            if (cleanKey === 'qtv') {
                return res.status(403).json({ success: false, message: 'Không thể tạo thêm vai trò quản trị viên cao nhất.' });
            }

            const [existRole] = await db.query('SELECT id FROM roles WHERE ma_role = ?', [cleanKey]);
            if (existRole.length > 0) {
                return res.status(409).json({ success: false, message: `Mã vai trò "${cleanKey}" đã tồn tại.` });
            }

            assignedPermissions = Array.isArray(quyen) ? quyen.filter(p => ACCOUNT_PERMISSIONS.includes(p)) : [];
            await db.query(
                'INSERT INTO roles (ma_role, ten_role, quyen, mo_ta, is_system) VALUES (?, ?, ?, ?, 0)',
                [cleanKey, new_role.ten_role.trim(), JSON.stringify(assignedPermissions), new_role.mo_ta || null]
            );
            assignedRole = cleanKey;
        } else {
            // Khi chọn role đã có: quyền lấy theo role đã có trong DB, không được sửa trừ khi vào sửa role
            if (assignedRole === 'qtv') {
                assignedPermissions = ACCOUNT_PERMISSIONS;
            } else {
                const [roleRows] = await db.query('SELECT quyen FROM roles WHERE ma_role = ?', [assignedRole]);
                if (roleRows.length) {
                    const raw = roleRows[0].quyen;
                    assignedPermissions = typeof raw === 'string' ? JSON.parse(raw || '[]') : (raw || []);
                } else {
                    assignedPermissions = DEFAULT_PERMISSIONS[assignedRole] || [];
                }
            }
        }

        if (!canAssignRole(req.adminActor.vai_tro, assignedRole)) {
            return res.status(403).json({ success: false, message: 'Bạn không được phép gán role này.' });
        }
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
        if (existing.length) return res.status(409).json({ success: false, message: 'Email đã được sử dụng.' });

        const passwordHash = await bcrypt.hash(mat_khau, 10);
        const [result] = await db.query(
            'INSERT INTO users (ho_ten, email, mat_khau, vai_tro, quyen, email_da_xac_minh, trang_thai) VALUES (?, ?, ?, ?, ?, 1, 1)',
            [ho_ten.trim(), email.trim(), passwordHash, assignedRole, JSON.stringify(assignedPermissions)]
        );
        res.status(201).json({ success: true, message: 'Tạo tài khoản thành công!', data: { id: result.insertId, vai_tro: assignedRole } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tạo tài khoản.' });
    }
});

app.post('/api/admin/:id/edit', ...accountManagementAccess, requireAdminPermission('accounts'), async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const { ho_ten, mat_khau, vai_tro } = req.body;
        if (!Number.isInteger(userId) || userId <= 0 || !ho_ten?.trim()) {
            return res.status(400).json({ success: false, message: 'Thông tin tài khoản không hợp lệ.' });
        }
        if (mat_khau && mat_khau.length < 8) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 8 ký tự.' });
        }
        const [targets] = await db.query('SELECT id, vai_tro FROM users WHERE id = ?', [userId]);
        if (!targets.length) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
        const targetRole = targets[0].vai_tro;

        // Chặn chỉnh sửa hoặc hạ cấp tài khoản qtv (Sửa lỗi 2)
        if (targetRole === 'qtv') {
            return res.status(403).json({ success: false, message: 'Không được phép chỉnh sửa hoặc hạ cấp tài khoản Quản trị viên cao nhất (qtv).' });
        }

        if (userId === req.adminActor.id || !canManageRole(req.adminActor.vai_tro, targetRole)) {
            return res.status(403).json({ success: false, message: 'Bạn không được phép sửa tài khoản này.' });
        }
        const nextRole = vai_tro || targetRole;
        if (!canManageRole(req.adminActor.vai_tro, targetRole) || !canAssignRole(req.adminActor.vai_tro, nextRole)) {
            return res.status(403).json({ success: false, message: 'Bạn không được phép gán role này.' });
        }

        // Quyền của tài khoản lấy tự động theo vai trò đã chọn (chỉ sửa quyền khi vào phần sửa role)
        let permissions = [];
        if (nextRole === 'qtv') {
            permissions = ACCOUNT_PERMISSIONS;
        } else {
            const [roleRows] = await db.query('SELECT quyen FROM roles WHERE ma_role = ?', [nextRole]);
            if (roleRows.length) {
                const raw = roleRows[0].quyen;
                permissions = typeof raw === 'string' ? JSON.parse(raw || '[]') : (raw || []);
            } else {
                permissions = DEFAULT_PERMISSIONS[nextRole] || [];
            }
        }

        const updates = [ho_ten.trim(), nextRole, JSON.stringify(permissions)];
        let sql = 'UPDATE users SET ho_ten = ?, vai_tro = ?, quyen = ?';
        if (mat_khau) {
            sql += ', mat_khau = ?';
            updates.push(await bcrypt.hash(mat_khau, 10));
        }
        sql += ' WHERE id = ?';
        updates.push(userId);
        await db.query(sql, updates);

        // Thu hồi token để tài khoản nhận vai trò/quyền mới ngay lập tức
        await db.query('UPDATE jsontoken SET `revoke` = 1 WHERE user_id = ?', [userId]);

        res.json({ success: true, message: 'Đã cập nhật tài khoản.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể cập nhật tài khoản.' });
    }
});

// Khóa / Mở khóa tài khoản (Admin)
app.put('/api/admin/tai-khoan/:id/toggle-status', ...accountManagementAccess, requireAdminPermission('accounts'), async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (userId === req.adminActor.id) {
            return res.status(400).json({ success: false, message: 'Không thể tự khóa tài khoản của chính mình.' });
        }
        const [targets] = await db.query('SELECT id, vai_tro, trang_thai FROM users WHERE id = ?', [userId]);
        if (!targets.length) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });

        // Không cho phép khóa tài khoản qtv (Sửa lỗi 2)
        if (targets[0].vai_tro === 'qtv') {
            return res.status(403).json({ success: false, message: 'Không được phép khóa tài khoản Quản trị viên cấp cao (qtv).' });
        }

        if (!canManageRole(req.adminActor.vai_tro, targets[0].vai_tro)) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền quản lý tài khoản cấp bậc này.' });
        }

        const nextStatus = Number(targets[0].trang_thai) === 1 ? 0 : 1;
        await db.query('UPDATE users SET trang_thai = ? WHERE id = ?', [nextStatus, userId]);
        if (nextStatus === 0) {
            // Khi khóa tài khoản: thu hồi mọi phiên đăng nhập
            await db.query('UPDATE jsontoken SET `revoke` = 1 WHERE user_id = ?', [userId]);
        }

        res.json({
            success: true,
            message: nextStatus === 1 ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản thành công.',
            data: { id: userId, trang_thai: nextStatus }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể thay đổi trạng thái tài khoản.' });
    }
});

// ─── API User Profile ───────────────────────────────────────
app.post('/api/auth/email-verification/request', authenticateToken, async (req, res) => {
    try {
        if (!smtpTransport) return res.status(503).json({ success: false, message: 'Chức năng gửi email chưa được cấu hình SMTP.' });
        const [users] = await db.query('SELECT id, email, email_da_xac_minh FROM users WHERE id = ? AND trang_thai = 1', [req.user.id]);
        if (!users.length) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
        if (Number(users[0].email_da_xac_minh) === 1) return res.json({ success: true, verified: true, message: 'Email này đã được xác minh.' });
        const result = await createAuthCode(users[0].id, users[0].email, 'email_verification');
        if (result.rateLimited) return res.status(429).json({ success: false, message: 'Vui lòng đợi 60 giây trước khi gửi mã mới.' });
        res.json({ success: true, message: 'Đã gửi mã xác minh tới email của bạn.' });
    } catch (err) {
        console.error('Verification email could not be sent:', err.message);
        res.status(503).json({ success: false, message: 'Không gửi được email lúc này. Vui lòng thử lại sau.' });
    }
});

app.post('/api/auth/email-verification/confirm', authenticateToken, async (req, res) => {
    const code = String(req.body.code || '').trim();
    if (!/^\d{6}$/.test(code)) return res.status(400).json({ success: false, message: 'Mã xác nhận phải gồm 6 chữ số.' });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [codes] = await connection.query(
            `SELECT id, code_hash, attempts FROM email_auth_codes
             WHERE user_id = ? AND purpose = 'email_verification' AND used_at IS NULL AND expires_at > NOW()
             ORDER BY id DESC LIMIT 5 FOR UPDATE`,
            [req.user.id]
        );
        if (!codes.length) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Mã xác nhận không tồn tại hoặc đã hết hạn (hiệu lực 10 phút).' });
        }

        let matchedCode = null;
        for (const c of codes) {
            if (Number(c.attempts) < 5 && (await bcrypt.compare(code, c.code_hash))) {
                matchedCode = c;
                break;
            }
        }

        if (!matchedCode) {
            const latestCode = codes[0];
            const attempts = Number(latestCode.attempts) + 1;
            await connection.query(
                'UPDATE email_auth_codes SET attempts = ?, used_at = IF(? >= 5, NOW(), used_at) WHERE id = ?',
                [attempts, attempts, latestCode.id]
            );
            await connection.commit();
            return res.status(400).json({
                success: false,
                message: attempts >= 5
                    ? 'Mã đã bị khóa do nhập sai quá số lần cho phép. Vui lòng bấm gửi lại mã.'
                    : `Mã xác nhận không đúng. Còn ${5 - attempts} lần thử.`
            });
        }

        await connection.query('UPDATE users SET email_da_xac_minh = 1 WHERE id = ?', [req.user.id]);
        await connection.query("UPDATE email_auth_codes SET used_at = NOW() WHERE user_id = ? AND purpose = 'email_verification' AND used_at IS NULL", [req.user.id]);
        await connection.commit();
        res.json({ success: true, message: 'Email đã được xác minh thành công!' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể xác minh email lúc này.' });
    } finally {
        connection.release();
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, ho_ten, email, email_da_xac_minh, so_dien_thoai, dia_chi, avatar, balance, vai_tro, quyen FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: { ...users[0], quyen: parsePermissions(users[0].quyen, users[0].vai_tro) } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
});

app.put('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const { ho_ten, so_dien_thoai, dia_chi, avatar } = req.body;
        if (![ho_ten, so_dien_thoai, dia_chi].every(value => typeof value === 'string' && value.trim())) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ!' });
        }

        if (avatar && typeof avatar === 'string') {
            await db.query(
                'UPDATE users SET ho_ten = ?, so_dien_thoai = ?, dia_chi = ?, avatar = ? WHERE id = ?',
                [ho_ten.trim(), so_dien_thoai.trim(), dia_chi.trim(), avatar.trim(), req.user.id]
            );
        } else {
            await db.query(
                'UPDATE users SET ho_ten = ?, so_dien_thoai = ?, dia_chi = ? WHERE id = ?',
                [ho_ten.trim(), so_dien_thoai.trim(), dia_chi.trim(), req.user.id]
            );
        }

        const [users] = await db.query('SELECT id, ho_ten, email, email_da_xac_minh, so_dien_thoai, dia_chi, avatar, balance, vai_tro, quyen FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản!' });
        res.json({ success: true, data: { ...users[0], quyen: parsePermissions(users[0].quyen, users[0].vai_tro) } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
});

// Upload avatar riêng biệt dạng multipart/form-data
app.post('/api/auth/avatar', authenticateToken, (req, res) => {
    upload.single('avatar')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn file ảnh để làm đại diện!' });
        }
        try {
            const avatarUrl = `/uploads/${req.file.filename}`;
            await db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, req.user.id]);
            const [users] = await db.query('SELECT id, ho_ten, email, email_da_xac_minh, so_dien_thoai, dia_chi, avatar, balance, vai_tro, quyen FROM users WHERE id = ?', [req.user.id]);
            if (users.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản!' });
            res.json({
                success: true,
                message: 'Cập nhật ảnh đại diện thành công!',
                data: { ...users[0], quyen: parsePermissions(users[0].quyen, users[0].vai_tro) }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Lỗi server khi lưu avatar!' });
        }
    });
});

app.post('/api/auth/password-reset/request', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ email hợp lệ.' });
        }
        if (!smtpTransport) {
            return res.status(503).json({ success: false, message: 'Chức năng gửi email chưa được cấu hình SMTP.' });
        }
        const [users] = await db.query('SELECT id, email, trang_thai FROM users WHERE email = ?', [email]);
        if (!users.length) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy email này trong hệ thống tài khoản.' });
        }
        if (Number(users[0].trang_thai) !== 1) {
            return res.status(403).json({ success: false, message: 'Tài khoản này đang bị khóa hoặc tạm ngưng hoạt động.' });
        }
        try {
            const result = await createAuthCode(users[0].id, users[0].email, 'password_reset');
            if (result.rateLimited) {
                return res.status(429).json({ success: false, message: 'Mã xác nhận vừa được gửi. Vui lòng đợi 60 giây trước khi yêu cầu mã khác.' });
            }
        } catch (err) {
            console.error('Password reset email could not be sent:', err.message);
            return res.status(503).json({ success: false, message: 'Không thể gửi email lúc này. Vui lòng thử lại sau.' });
        }
        res.json({ success: true, message: 'Mã xác nhận đã được gửi tới email của bạn (vui lòng kiểm tra cả mục Spam / Thư rác).' });
    } catch (err) {
        console.error('Password reset email could not be sent:', err.message);
        res.status(503).json({ success: false, message: 'Không gửi được email lúc này. Vui lòng thử lại sau.' });
    }
});

app.post('/api/auth/password-reset/confirm', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();
    const password = req.body.mat_khau;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code) || typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ success: false, message: 'Email, mã 6 số hoặc mật khẩu mới không hợp lệ (mật khẩu tối thiểu 8 ký tự).' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [users] = await connection.query('SELECT id FROM users WHERE email = ? AND trang_thai = 1 FOR UPDATE', [email]);
        if (!users.length) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Email hoặc mã xác nhận không hợp lệ.' });
        }
        const userId = users[0].id;
        const [codes] = await connection.query(
            `SELECT id, code_hash, attempts FROM email_auth_codes
             WHERE user_id = ? AND purpose = 'password_reset' AND used_at IS NULL AND expires_at > NOW()
             ORDER BY id DESC LIMIT 5 FOR UPDATE`,
            [userId]
        );
        if (!codes.length) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Mã xác nhận không tồn tại hoặc đã hết hạn (hiệu lực 10 phút).' });
        }

        let matchedCode = null;
        for (const c of codes) {
            if (Number(c.attempts) < 5 && (await bcrypt.compare(code, c.code_hash))) {
                matchedCode = c;
                break;
            }
        }

        if (!matchedCode) {
            const latestCode = codes[0];
            const attempts = Number(latestCode.attempts) + 1;
            await connection.query(
                'UPDATE email_auth_codes SET attempts = ?, used_at = IF(? >= 5, NOW(), used_at) WHERE id = ?',
                [attempts, attempts, latestCode.id]
            );
            await connection.commit();
            return res.status(400).json({
                success: false,
                message: attempts >= 5
                    ? 'Mã đã bị khóa do nhập sai quá số lần cho phép. Vui lòng yêu cầu mã mới.'
                    : `Mã xác nhận không đúng. Còn ${5 - attempts} lần thử.`
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        await connection.query('UPDATE users SET mat_khau = ? WHERE id = ?', [passwordHash, userId]);
        await connection.query('UPDATE jsontoken SET `revoke` = 1 WHERE user_id = ?', [userId]);
        await connection.query("UPDATE email_auth_codes SET used_at = NOW() WHERE user_id = ? AND purpose = 'password_reset' AND used_at IS NULL", [userId]);
        await connection.commit();
        res.json({ success: true, message: 'Đã đổi mật khẩu thành công! Vui lòng đăng nhập lại.' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể đổi mật khẩu lúc này.' });
    } finally {
        connection.release();
    }
});

// ─── API Cart ───────────────────────────────────────────────
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const [carts] = await db.query('SELECT id FROM cart WHERE user_id = ?', [req.user.id]);
        if (carts.length === 0) return res.json({ success: true, data: [] });

        const [items] = await db.query(`
            SELECT ci.id, ci.laptop_id, ci.so_luong, l.ten_laptop, l.gia_ban, i.url_anh 
            FROM cart_items ci
            JOIN laptop_Detail l ON ci.laptop_id = l.id
            LEFT JOIN (
                SELECT laptop_id, url_anh FROM (
                    SELECT laptop_id, url_anh,
                           ROW_NUMBER() OVER (PARTITION BY laptop_id ORDER BY la_anh_chinh DESC, thu_tu ASC, id ASC) as rn
                    FROM laptop_images
                ) ranked_img WHERE rn = 1
            ) i ON l.id = i.laptop_id
            WHERE ci.cart_id = ?
        `, [carts[0].id]);

        res.json({ success: true, data: items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
});

// ─── API Đồng bộ giỏ hàng (Sửa lỗi 3.2: kiểm tra số lượng và không cộng dồn vô lý) ─
app.post('/api/cart/sync', authenticateToken, async (req, res) => {
    try {
        const { cart } = req.body; // Array of { laptop_id, so_luong }
        if (!cart || !Array.isArray(cart)) return res.status(400).json({ success: false, message: 'Dữ liệu giỏ hàng không hợp lệ.' });

        let [carts] = await db.query('SELECT id FROM cart WHERE user_id = ?', [req.user.id]);
        let cartId;
        if (carts.length === 0) {
            const [result] = await db.query('INSERT INTO cart (user_id) VALUES (?)', [req.user.id]);
            cartId = result.insertId;
        } else {
            cartId = carts[0].id;
        }

        // Đồng bộ giỏ hàng an toàn: Kiểm tra sản phẩm tồn tại và giới hạn số lượng hợp lệ từ 1 đến 99
        for (let item of cart) {
            const pId = Number(item.laptop_id);
            const qty = Math.min(Math.max(Number(item.so_luong) || 1, 1), 99);
            if (!Number.isInteger(pId) || pId <= 0) continue;

            // Kiểm tra xem sản phẩm có đang kinh doanh không
            const [laptops] = await db.query('SELECT id, trang_thai FROM laptop_Detail WHERE id = ?', [pId]);
            if (!laptops.length || Number(laptops[0].trang_thai) !== 1) continue;

            const [existing] = await db.query('SELECT id, so_luong FROM cart_items WHERE cart_id = ? AND laptop_id = ?', [cartId, pId]);
            if (existing.length > 0) {
                // Đặt theo số lượng lớn hơn giữa client và server (tối đa 99), tránh nhân bản số lượng mỗi lần F5
                const targetQty = Math.min(Math.max(Number(existing[0].so_luong), qty), 99);
                await db.query('UPDATE cart_items SET so_luong = ? WHERE id = ?', [targetQty, existing[0].id]);
            } else {
                await db.query('INSERT INTO cart_items (cart_id, laptop_id, so_luong) VALUES (?, ?, ?)', [cartId, pId, qty]);
            }
        }
        res.json({ success: true, message: 'Đồng bộ giỏ hàng thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
});

app.post('/api/cart/update', authenticateToken, async (req, res) => {
    try {
        const { laptop_id, so_luong } = req.body;
        const pId = Number(laptop_id);
        const qty = Number(so_luong);
        if (!Number.isInteger(pId) || pId <= 0) {
            return res.status(400).json({ success: false, message: 'Mã sản phẩm không hợp lệ.' });
        }

        let [carts] = await db.query('SELECT id FROM cart WHERE user_id = ?', [req.user.id]);
        if (carts.length === 0) {
            const [result] = await db.query('INSERT INTO cart (user_id) VALUES (?)', [req.user.id]);
            carts = [{ id: result.insertId }];
        }
        const cartId = carts[0].id;

        if (qty <= 0) {
            await db.query('DELETE FROM cart_items WHERE cart_id = ? AND laptop_id = ?', [cartId, pId]);
        } else {
            const safeQty = Math.min(qty, 99);
            const [existing] = await db.query('SELECT id FROM cart_items WHERE cart_id = ? AND laptop_id = ?', [cartId, pId]);
            if (existing.length > 0) {
                await db.query('UPDATE cart_items SET so_luong = ? WHERE id = ?', [safeQty, existing[0].id]);
            } else {
                await db.query('INSERT INTO cart_items (cart_id, laptop_id, so_luong) VALUES (?, ?, ?)', [cartId, pId, safeQty]);
            }
        }
        res.json({ success: true, message: 'Cập nhật giỏ hàng thành công.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
});

// ─── API Đặt hàng & Thanh toán (Sửa triệt để các lỗi 1.1 -> 1.7) ─
app.post('/api/order/checkout', async (req, res) => {
    // 1. Xác thực Token nghiêm ngặt nếu có (Sửa lỗi 1.7)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userId = null;

    if (token) {
        try {
            const payload = jwt.verify(token, JWT_SECRET);
            const [validTokens] = await db.query(
                `SELECT t.id, u.id AS user_id, u.trang_thai, u.balance
                 FROM jsontoken t
                 JOIN users u ON u.id = t.user_id
                 WHERE t.user_id = ? AND t.access_token = ? AND t.blacklist = 0 AND t.revoke = 0 AND u.trang_thai = 1
                 ORDER BY t.id DESC LIMIT 1`,
                [payload.id, token]
            );
            if (!validTokens.length) {
                return res.status(401).json({ success: false, message: 'Phiên đăng nhập đã bị thu hồi hoặc tài khoản bị khóa.' });
            }
            userId = validTokens[0].user_id;
        } catch (e) {
            return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
        }
    }

    const { ho_ten, so_dien_thoai, dia_chi, items, payment_method, coupon_code, ghi_chu } = req.body;
    if (!ho_ten?.trim() || !so_dien_thoai?.trim() || !dia_chi?.trim() || !payment_method) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đủ họ tên, số điện thoại, địa chỉ và phương thức thanh toán.' });
    }

    // 2. Kiểm tra danh sách mặt hàng và validate số lượng dương (Sửa lỗi 1.1 & 1.5)
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Giỏ hàng của bạn đang trống.' });
    }

    const itemMap = new Map();
    for (const rawItem of items) {
        const pId = Number(rawItem.laptop_id);
        const qty = Number(rawItem.so_luong);
        if (!Number.isInteger(pId) || pId <= 0 || !Number.isInteger(qty) || qty <= 0 || qty > 100) {
            return res.status(400).json({ success: false, message: 'Sản phẩm hoặc số lượng đặt mua không hợp lệ.' });
        }
        itemMap.set(pId, (itemMap.get(pId) || 0) + qty);
    }

    // 3. Thực hiện toàn bộ quy trình đặt hàng bên trong DATABASE TRANSACTION (Sửa lỗi 1.2)
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 4. Kiểm tra tồn kho & khóa dòng dữ liệu với FOR UPDATE (Sửa lỗi 1.3)
        let tong_tien = 0;
        const orderItems = [];
        for (const [pId, qty] of itemMap) {
            const [laptops] = await connection.query(
                'SELECT id, ten_laptop, gia_ban, so_luong_ton, trang_thai FROM laptop_Detail WHERE id = ? FOR UPDATE',
                [pId]
            );
            if (!laptops.length || Number(laptops[0].trang_thai) !== 1) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: `Sản phẩm mã #${pId} không tồn tại hoặc đã ngừng kinh doanh.` });
            }
            const laptop = laptops[0];
            if (Number(laptop.so_luong_ton) < qty) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm "${laptop.ten_laptop}" trong kho chỉ còn ${laptop.so_luong_ton} máy (bạn yêu cầu ${qty} máy).`
                });
            }
            const thanh_tien = Number(laptop.gia_ban) * qty;
            tong_tien += thanh_tien;
            orderItems.push({
                laptop_id: laptop.id,
                ten_laptop: laptop.ten_laptop,
                gia_ban: Number(laptop.gia_ban),
                so_luong: qty,
                thanh_tien
            });
        }

        if (orderItems.length === 0 || tong_tien <= 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Đơn hàng không có sản phẩm hợp lệ.' });
        }

        // 5. Xử lý Mã giảm giá (Coupon)
        let couponId = null;
        let tien_giam = 0;
        let applied_coupon_code = null;
        if (coupon_code) {
            const cleanCode = String(coupon_code).trim().toUpperCase();
            const [coupons] = await connection.query(
                `SELECT * FROM coupon
                 WHERE ma_coupon = ? AND trang_thai = 1 AND ngay_bat_dau <= CURDATE() AND ngay_ket_thuc >= CURDATE()
                 FOR UPDATE`,
                [cleanCode]
            );
            if (!coupons.length) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn.' });
            }
            const c = coupons[0];
            if (c.da_su_dung >= c.so_luong) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng.' });
            }
            if (tong_tien < Number(c.don_hang_toi_thieu)) {
                await connection.rollback();
                const minFormatted = new Intl.NumberFormat('vi-VN').format(c.don_hang_toi_thieu);
                return res.status(400).json({ success: false, message: `Mã giảm giá yêu cầu đơn hàng từ ${minFormatted}đ trở lên.` });
            }

            couponId = c.id;
            applied_coupon_code = c.ma_coupon;
            if (c.loai_giam === 'phan_tram') {
                const raw = (tong_tien * Number(c.gia_tri_giam)) / 100;
                tien_giam = c.giam_toi_da ? Math.min(raw, Number(c.giam_toi_da)) : raw;
            } else {
                tien_giam = Math.min(tong_tien, Number(c.gia_tri_giam));
            }
            await connection.query('UPDATE coupon SET da_su_dung = da_su_dung + 1 WHERE id = ?', [c.id]);
        }

        const phi_van_chuyen = tong_tien >= 20000000 ? 0 : 30000; // Miễn phí ship đơn từ 20 triệu
        const thanh_tien_cuoi = Math.max(0, tong_tien - tien_giam + phi_van_chuyen);

        // 6. Xử lý thanh toán bằng Số dư tài khoản (Ví) với FOR UPDATE chống Race Condition (Sửa lỗi 1.4)
        if (payment_method === 'tai_khoan') {
            if (!userId) {
                await connection.rollback();
                return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để sử dụng số dư tài khoản.' });
            }
            const [users] = await connection.query(
                'SELECT id, balance, trang_thai FROM users WHERE id = ? FOR UPDATE',
                [userId]
            );
            if (!users.length || Number(users[0].trang_thai) !== 1) {
                await connection.rollback();
                return res.status(403).json({ success: false, message: 'Tài khoản không hợp lệ hoặc đã bị khóa.' });
            }
            const currentBalance = Number(users[0].balance);
            if (currentBalance < thanh_tien_cuoi) {
                await connection.rollback();
                const diffStr = new Intl.NumberFormat('vi-VN').format(thanh_tien_cuoi - currentBalance);
                return res.status(400).json({
                    success: false,
                    message: `Số dư ví không đủ (còn thiếu ${diffStr}đ). Vui lòng nạp thêm tiền hoặc chọn phương thức khác.`
                });
            }
            // Trừ tiền số dư
            const newBalance = currentBalance - thanh_tien_cuoi;
            await connection.query('UPDATE users SET balance = ? WHERE id = ?', [newBalance, userId]);

            // Ghi nhận biến động số dư ví
            await connection.query(
                `INSERT INTO wallet_transactions (user_id, ma_giao_dich, loai_giao_dich, so_tien, so_du_truoc, so_du_sau, phuong_thuc, trang_thai, ghi_chu)
                 VALUES (?, ?, 'thanh_toan', ?, ?, ?, 'tai_khoan', 'thanh_cong', ?)`,
                [userId, 'PAY_' + Date.now(), thanh_tien_cuoi, currentBalance, newBalance, 'Thanh toán đơn hàng KTSHOP']
            );
        }

        // 7. Trừ số lượng tồn kho tự động (Sửa lỗi 1.3)
        for (const oi of orderItems) {
            await connection.query(
                'UPDATE laptop_Detail SET so_luong_ton = so_luong_ton - ? WHERE id = ?',
                [oi.so_luong, oi.laptop_id]
            );
        }

        // 8. Quản lý tài khoản khách mua hàng
        let orderUserId = userId;
        if (!orderUserId) {
            const cleanPhone = so_dien_thoai.trim();
            const guestEmail = 'guest_' + cleanPhone.replace(/\D/g, '') + '@guest.ktshop.vn';
            const [guest] = await connection.query('SELECT id FROM users WHERE email = ? OR so_dien_thoai = ? LIMIT 1', [guestEmail, cleanPhone]);
            if (guest.length > 0) {
                orderUserId = guest[0].id;
            } else {
                const [insertUser] = await connection.query(
                    'INSERT INTO users (ho_ten, email, mat_khau, so_dien_thoai, dia_chi, vai_tro, email_da_xac_minh, trang_thai) VALUES (?, ?, ?, ?, ?, ?, 1, 1)',
                    [ho_ten.trim(), guestEmail, '', cleanPhone, dia_chi.trim(), 'khach_hang']
                );
                orderUserId = insertUser.insertId;
            }
        }

        // 9. Gán chính xác phương thức thanh toán (Sửa lỗi 1.6)
        let phuong_thuc_save = 'tien_mat';
        if (payment_method === 'tai_khoan' || payment_method === 'chuyen_khoan' || payment_method === 'credit_card') {
            phuong_thuc_save = 'chuyen_khoan';
        } else if (['vnpay', 'momo', 'zalopay'].includes(payment_method)) {
            phuong_thuc_save = payment_method;
        } else if (payment_method === 'tien_mat' || payment_method === 'cod') {
            phuong_thuc_save = 'tien_mat';
        }

        const ma_don_hang = 'DH' + Date.now() + Math.floor(Math.random() * 900 + 100);
        const trang_thai_tt = (payment_method === 'tai_khoan') ? 'da_thanh_toan' : 'chua_thanh_toan';

        // 10. Tạo bản ghi đơn hàng chính
        const [orderResult] = await connection.query(
            `INSERT INTO \`order\` (user_id, coupon_id, ma_don_hang, ho_ten_nguoi_nhan, so_dien_thoai, dia_chi_giao,
                                    tong_tien, tien_giam, phi_van_chuyen, thanh_tien, phuong_thuc_tt, trang_thai_tt, trang_thai_dh, ghi_chu)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'cho_xac_nhan', ?)`,
            [orderUserId, couponId, ma_don_hang, ho_ten.trim(), so_dien_thoai.trim(), dia_chi.trim(),
                tong_tien, tien_giam, phi_van_chuyen, thanh_tien_cuoi, phuong_thuc_save, trang_thai_tt,
                payment_method === 'tai_khoan' ? 'Thanh toán bằng số dư tài khoản' : (ghi_chu || null)]
        );

        const orderId = orderResult.insertId;

        // 11. Lưu chi tiết đơn hàng kèm Serial/IMEI
        for (let oi of orderItems) {
            const serialNumber = 'KT-' + String(orderId).padStart(4, '0') + '-' + String(oi.laptop_id).padStart(3, '0') + '-' + Math.floor(Math.random() * 9000 + 1000);
            await connection.query(
                `INSERT INTO order_detail (order_id, laptop_id, ten_laptop, gia_ban, so_luong, thanh_tien, serial_number)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [orderId, oi.laptop_id, oi.ten_laptop, oi.gia_ban, oi.so_luong, oi.thanh_tien, serialNumber]
            );
        }

        // 12. Xóa giỏ hàng nếu đã đăng nhập
        if (userId) {
            const [carts] = await connection.query('SELECT id FROM cart WHERE user_id = ?', [userId]);
            if (carts.length > 0) {
                await connection.query('DELETE FROM cart_items WHERE cart_id = ?', [carts[0].id]);
            }
        }

        await connection.commit();

        // 13. Gửi email xác nhận đơn hàng tự động cho khách (chạy nền không block phản hồi)
        let customerEmail = req.body.email ? String(req.body.email).trim() : null;
        if (!customerEmail && orderUserId) {
            db.query('SELECT email FROM users WHERE id = ?', [orderUserId])
                .then(([uRows]) => {
                    if (uRows.length && uRows[0].email && !uRows[0].email.endsWith('@guest.ktshop.vn')) {
                        sendOrderConfirmationEmail(uRows[0].email, {
                            ma_don_hang,
                            ho_ten_nguoi_nhan: ho_ten.trim(),
                            dia_chi_giao: dia_chi.trim(),
                            so_dien_thoai: so_dien_thoai.trim(),
                            thanh_tien: thanh_tien_cuoi,
                            phuong_thuc_tt: phuong_thuc_save
                        }, orderItems);
                    }
                })
                .catch(err => console.error('Lỗi lấy email gửi xác nhận đơn:', err.message));
        } else if (customerEmail && !customerEmail.endsWith('@guest.ktshop.vn')) {
            sendOrderConfirmationEmail(customerEmail, {
                ma_don_hang,
                ho_ten_nguoi_nhan: ho_ten.trim(),
                dia_chi_giao: dia_chi.trim(),
                so_dien_thoai: so_dien_thoai.trim(),
                thanh_tien: thanh_tien_cuoi,
                phuong_thuc_tt: phuong_thuc_save
            }, orderItems).catch(err => console.error('Lỗi gửi email xác nhận đơn:', err.message));
        }

        // 14. Tự động sinh mã VietQR nếu chọn chuyển khoản ngân hàng
        let vietqr_info = null;
        if (payment_method === 'chuyen_khoan') {
            vietqr_info = {
                bank_id: 'MB',
                account_no: '0345678999',
                account_name: 'KTSHOP LAPTOP CHINH HANG',
                amount: thanh_tien_cuoi,
                description: ma_don_hang,
                qr_url: `https://img.vietqr.io/image/MB-0345678999-compact.png?amount=${thanh_tien_cuoi}&addInfo=${ma_don_hang}&accountName=KTSHOP%20LAPTOP%20CHINH%20HANG`
            };
        }

        res.json({
            success: true,
            message: 'Đặt hàng thành công!',
            order: {
                id: orderId,
                ma_don_hang,
                ma_coupon: applied_coupon_code,
                tong_tien,
                tien_giam,
                phi_van_chuyen,
                thanh_tien: thanh_tien_cuoi,
                phuong_thuc_tt: phuong_thuc_save,
                trang_thai_tt,
                vietqr_info
            }
        });
    } catch (err) {
        await connection.rollback();
        console.error('Checkout error:', err);
        res.status(500).json({ success: false, message: 'Không thể hoàn tất đặt hàng. Vui lòng thử lại sau.' });
    } finally {
        connection.release();
    }
});

// ─── API Lịch sử Đơn hàng & Tự Hủy Đơn cho Khách hàng ───────
app.get('/api/orders/my-orders', authenticateToken, async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT o.id, o.ma_don_hang, o.ho_ten_nguoi_nhan, o.so_dien_thoai, o.dia_chi_giao,
                    o.tong_tien, o.tien_giam, o.phi_van_chuyen, o.thanh_tien,
                    o.phuong_thuc_tt, o.trang_thai_tt, o.trang_thai_dh, o.created_at,
                    COUNT(od.id) AS so_mat_hang,
                    GROUP_CONCAT(od.ten_laptop ORDER BY od.id SEPARATOR ', ') AS danh_sach_sp,
                    (
                        SELECT li.url_anh
                        FROM order_detail od2
                        JOIN laptop_images li ON li.laptop_id = od2.laptop_id
                        WHERE od2.order_id = o.id
                        ORDER BY li.la_anh_chinh DESC, li.thu_tu ASC, li.id ASC
                        LIMIT 1
                    ) AS anh_dai_dien
             FROM \`order\` o
             LEFT JOIN order_detail od ON od.order_id = o.id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );
        res.json({ success: true, data: orders });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải lịch sử đơn hàng.' });
    }
});

app.get('/api/orders/my-orders/:id', authenticateToken, async (req, res) => {
    try {
        const orderId = Number(req.params.id);
        const [orders] = await db.query(
            'SELECT * FROM `order` WHERE id = ? AND user_id = ?',
            [orderId, req.user.id]
        );
        if (!orders.length) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });

        const [items] = await db.query(
            `SELECT od.*, i.url_anh
             FROM order_detail od
             LEFT JOIN (
                 SELECT laptop_id, url_anh FROM (
                     SELECT laptop_id, url_anh,
                            ROW_NUMBER() OVER (PARTITION BY laptop_id ORDER BY la_anh_chinh DESC, thu_tu ASC, id ASC) as rn
                     FROM laptop_images
                 ) r_img WHERE rn = 1
             ) i ON od.laptop_id = i.laptop_id
             WHERE od.order_id = ?`,
            [orderId]
        );

        res.json({ success: true, data: { ...orders[0], items } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải chi tiết đơn hàng.' });
    }
});

// Khách hàng tự bấm hủy đơn khi đơn đang ở trạng thái cho_xac_nhan
app.put('/api/orders/my-orders/:id/cancel', authenticateToken, async (req, res) => {
    const orderId = Number(req.params.id);
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [orders] = await connection.query(
            'SELECT * FROM `order` WHERE id = ? AND user_id = ? FOR UPDATE',
            [orderId, req.user.id]
        );
        if (!orders.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
        }
        const order = orders[0];
        if (order.trang_thai_dh !== 'cho_xac_nhan') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể hủy đơn hàng khi đơn đang ở trạng thái "Chờ xác nhận". Đơn đang xử lý hoặc đang giao vui lòng liên hệ hotline hỗ trợ.'
            });
        }

        // Hoàn lại số lượng tồn kho cho các sản phẩm
        const [items] = await connection.query('SELECT laptop_id, so_luong FROM order_detail WHERE order_id = ?', [orderId]);
        for (const item of items) {
            await connection.query('UPDATE laptop_Detail SET so_luong_ton = so_luong_ton + ? WHERE id = ?', [item.so_luong, item.laptop_id]);
        }

        // Hoàn lại lượt sử dụng mã giảm giá nếu có
        if (order.coupon_id) {
            await connection.query('UPDATE coupon SET da_su_dung = GREATEST(0, da_su_dung - 1) WHERE id = ?', [order.coupon_id]);
        }

        // Nếu đã thanh toán: hoàn tiền trực tiếp vào số dư ví
        let refunded = false;
        if (order.trang_thai_tt === 'da_thanh_toan') {
            const [users] = await connection.query('SELECT balance FROM users WHERE id = ? FOR UPDATE', [req.user.id]);
            const oldBal = Number(users[0]?.balance || 0);
            const refundAmount = Number(order.thanh_tien);
            const newBal = oldBal + refundAmount;

            await connection.query('UPDATE users SET balance = ? WHERE id = ?', [newBal, req.user.id]);
            await connection.query(
                `INSERT INTO wallet_transactions (user_id, ma_giao_dich, loai_giao_dich, so_tien, so_du_truoc, so_du_sau, phuong_thuc, trang_thai, ghi_chu)
                 VALUES (?, ?, 'hoan_tien', ?, ?, ?, 'hoan_tien', 'thanh_cong', ?)`,
                [req.user.id, 'REF_' + Date.now(), refundAmount, oldBal, newBal, `Hoàn tiền hủy đơn ${order.ma_don_hang}`]
            );
            refunded = true;
        }

        await connection.query(
            "UPDATE `order` SET trang_thai_dh = 'da_huy', trang_thai_tt = IF(trang_thai_tt = 'da_thanh_toan', 'hoan_tien', trang_thai_tt) WHERE id = ?",
            [orderId]
        );

        await connection.commit();
        res.json({
            success: true,
            message: refunded ? 'Đã hủy đơn hàng thành công và hoàn tiền vào số dư ví của bạn!' : 'Đã hủy đơn hàng thành công!'
        });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể hủy đơn hàng.' });
    } finally {
        connection.release();
    }
});

// ─── API Ví Tiền & Lịch sử Biến động Số dư ──────────────────
app.get('/api/wallet/info', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, ho_ten, email, balance FROM users WHERE id = ?', [req.user.id]);
        if (!users.length) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        res.json({
            success: true,
            data: {
                balance: Number(users[0].balance || 0),
                bank_info: {
                    bank_id: 'MB',
                    bank_name: 'Ngân hàng Quân Đội (MB Bank)',
                    account_no: '0345678999',
                    account_name: 'KTSHOP LAPTOP CHINH HANG',
                    transfer_syntax: `NAP ${users[0].id}`
                }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải thông tin ví.' });
    }
});

app.get('/api/wallet/history', authenticateToken, async (req, res) => {
    try {
        const [transactions] = await db.query(
            'SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        res.json({ success: true, data: transactions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải lịch sử giao dịch ví.' });
    }
});

// Yêu cầu nạp tiền vào ví (tạo giao dịch chờ duyệt & sinh mã QR VietQR)
app.post('/api/wallet/deposit', authenticateToken, async (req, res) => {
    try {
        const amount = Number(req.body.so_tien);
        if (!Number.isFinite(amount) || amount < 10000 || amount > 100000000) {
            return res.status(400).json({ success: false, message: 'Số tiền nạp tối thiểu là 10.000đ và tối đa là 100.000.000đ.' });
        }

        const [users] = await db.query('SELECT id, ho_ten, email, balance FROM users WHERE id = ?', [req.user.id]);
        if (!users.length) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
        const currentBalance = Number(users[0].balance || 0);

        const transactionCode = `NAP${req.user.id}_${Date.now()}`;
        const phuongThuc = String(req.body.phuong_thuc || 'vietqr').toLowerCase();
        const ghiChu = req.body.ghi_chu ? String(req.body.ghi_chu).trim() : 'Nạp tiền vào ví KTSHOP qua chuyển khoản';

        // Tạo bản ghi giao dịch nạp tiền ở trạng thái 'cho_duyet'
        const [result] = await db.query(
            `INSERT INTO wallet_transactions 
             (user_id, ma_giao_dich, loai_giao_dich, so_tien, so_du_truoc, so_du_sau, phuong_thuc, trang_thai, ghi_chu)
             VALUES (?, ?, 'nap_tien', ?, ?, ?, ?, 'cho_duyet', ?)`,
            [req.user.id, transactionCode, amount, currentBalance, currentBalance, phuongThuc, ghiChu]
        );

        const qrUrl = `https://img.vietqr.io/image/MB-0345678999-compact.png?amount=${amount}&addInfo=${transactionCode}&accountName=KTSHOP%20LAPTOP%20CHINH%20HANG`;

        res.status(201).json({
            success: true,
            message: 'Đã tạo yêu cầu nạp tiền thành công! Vui lòng chuyển khoản theo thông tin để được duyệt nạp.',
            data: {
                id: result.insertId,
                ma_giao_dich: transactionCode,
                so_tien: amount,
                qr_url: qrUrl,
                bank_name: 'Ngân hàng Quân Đội (MB Bank)',
                account_no: '0345678999',
                account_name: 'KTSHOP LAPTOP CHINH HANG',
                syntax: transactionCode,
                trang_thai: 'cho_duyet',
                created_at: new Date()
            }
        });
    } catch (err) {
        console.error('Wallet deposit request error:', err);
        res.status(500).json({ success: false, message: 'Không thể tạo yêu cầu nạp tiền.' });
    }
});

// ─── API Nạp tiền ngay (Demo thanh toán trực tiếp - Database Transaction) ──
app.post('/api/wallet/deposit/demo', authenticateToken, async (req, res) => {
    const amount = Number(req.body.so_tien);
    if (!Number.isFinite(amount) || amount < 10000 || amount > 100000000) {
        return res.status(400).json({ success: false, message: 'Số tiền nạp tối thiểu là 10.000đ và tối đa là 100.000.000đ.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Khóa dòng tài khoản người dùng để cộng tiền an toàn (FOR UPDATE)
        const [users] = await connection.query('SELECT id, balance FROM users WHERE id = ? FOR UPDATE', [req.user.id]);
        if (!users.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
        }

        const currentBalance = Number(users[0].balance || 0);
        const newBalance = currentBalance + amount;
        const transactionCode = `DEMO_NAP${req.user.id}_${Date.now()}`;
        const phuongThuc = String(req.body.phuong_thuc || 'demo').toLowerCase();
        const ghiChu = req.body.ghi_chu ? String(req.body.ghi_chu).trim() : 'Nạp tiền ngay (Demo thanh toán trực tiếp)';

        // 1. Cập nhật số dư người dùng
        await connection.query('UPDATE users SET balance = ? WHERE id = ?', [newBalance, req.user.id]);

        // 2. Tạo bản ghi giao dịch thành công ngay lập tức
        const [result] = await connection.query(
            `INSERT INTO wallet_transactions 
             (user_id, ma_giao_dich, loai_giao_dich, so_tien, so_du_truoc, so_du_sau, phuong_thuc, trang_thai, ghi_chu, ngay_duyet)
             VALUES (?, ?, 'nap_tien', ?, ?, ?, ?, 'thanh_cong', ?, NOW())`,
            [req.user.id, transactionCode, amount, currentBalance, newBalance, phuongThuc, ghiChu]
        );

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Nạp tiền vào tài khoản thành công!',
            data: {
                id: result.insertId,
                ma_giao_dich: transactionCode,
                so_tien: amount,
                so_du_truoc: currentBalance,
                so_du_moi: newBalance,
                phuong_thuc: phuongThuc,
                trang_thai: 'thanh_cong',
                created_at: new Date()
            }
        });
    } catch (err) {
        await connection.rollback();
        console.error('Wallet demo deposit error:', err);
        res.status(500).json({ success: false, message: 'Không thể xử lý nạp tiền demo.' });
    } finally {
        connection.release();
    }
});

// Xác nhận nạp tiền ngay cho một lệnh nạp đang chờ duyệt (Demo)
app.post('/api/wallet/deposit/:id/demo-confirm', authenticateToken, async (req, res) => {
    const depositId = Number(req.params.id);
    if (!Number.isInteger(depositId) || depositId <= 0) {
        return res.status(400).json({ success: false, message: 'Mã giao dịch không hợp lệ.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [txRows] = await connection.query(
            'SELECT * FROM wallet_transactions WHERE id = ? AND user_id = ? FOR UPDATE',
            [depositId, req.user.id]
        );
        if (!txRows.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch nạp tiền.' });
        }
        const tx = txRows[0];
        if (tx.trang_thai !== 'cho_duyet') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: `Giao dịch này đã ở trạng thái "${tx.trang_thai}".` });
        }

        const [userRows] = await connection.query(
            'SELECT id, balance FROM users WHERE id = ? FOR UPDATE',
            [req.user.id]
        );
        const currentBalance = Number(userRows[0].balance || 0);
        const depositAmount = Number(tx.so_tien);
        const newBalance = currentBalance + depositAmount;

        await connection.query('UPDATE users SET balance = ? WHERE id = ?', [newBalance, req.user.id]);
        await connection.query(
            `UPDATE wallet_transactions 
             SET trang_thai = 'thanh_cong', so_du_truoc = ?, so_du_sau = ?, ngay_duyet = NOW(), ghi_chu = CONCAT(ghi_chu, ' [Đã duyệt demo]')
             WHERE id = ?`,
            [currentBalance, newBalance, depositId]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Đã xác nhận nạp tiền thành công!',
            data: {
                id: depositId,
                ma_giao_dich: tx.ma_giao_dich,
                so_tien: depositAmount,
                so_du_truoc: currentBalance,
                so_du_moi: newBalance,
                phuong_thuc: tx.phuong_thuc,
                trang_thai: 'thanh_cong',
                created_at: tx.created_at
            }
        });
    } catch (err) {
        await connection.rollback();
        console.error('Demo confirm deposit error:', err);
        res.status(500).json({ success: false, message: 'Lỗi xác nhận nạp tiền demo.' });
    } finally {
        connection.release();
    }
});

// ─── Quản lý Duyệt Nạp tiền cho Quản trị viên (Transactions) ──
app.get('/api/admin/deposits', ...accountManagementAccess, requireAdminPermission('deposits'), async (req, res) => {
    try {
        const { q, status, page = 1, limit = 50 } = req.query;
        const conditions = ["wt.loai_giao_dich = 'nap_tien'"];
        const params = [];

        if (q && String(q).trim()) {
            conditions.push('(wt.ma_giao_dich LIKE ? OR u.ho_ten LIKE ? OR u.email LIKE ? OR u.so_dien_thoai LIKE ?)');
            const kw = `%${String(q).trim()}%`;
            params.push(kw, kw, kw, kw);
        }

        if (status && String(status).trim() && status !== 'all') {
            conditions.push('wt.trang_thai = ?');
            params.push(String(status).trim());
        }

        const where = `WHERE ${conditions.join(' AND ')}`;
        const offset = (Number(page) - 1) * Number(limit);

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total
             FROM wallet_transactions wt
             JOIN users u ON u.id = wt.user_id
             ${where}`,
            params
        );

        const [deposits] = await db.query(
            `SELECT wt.*, 
                    u.ho_ten, u.email, u.so_dien_thoai, u.balance AS so_du_hien_tai,
                    admin_u.ho_ten AS admin_duyet_ten
             FROM wallet_transactions wt
             JOIN users u ON u.id = wt.user_id
             LEFT JOIN users admin_u ON admin_u.id = wt.admin_id
             ${where}
             ORDER BY 
                CASE WHEN wt.trang_thai = 'cho_duyet' THEN 1 ELSE 2 END ASC,
                wt.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, Number(limit), offset]
        );

        // Thống kê nhanh danh sách nạp
        const [[stats]] = await db.query(`
            SELECT
                COALESCE(SUM(CASE WHEN trang_thai = 'cho_duyet' THEN 1 ELSE 0 END), 0) AS cho_duyet_count,
                COALESCE(SUM(CASE WHEN trang_thai = 'thanh_cong' THEN 1 ELSE 0 END), 0) AS thanh_cong_count,
                COALESCE(SUM(CASE WHEN trang_thai = 'that_bai' THEN 1 ELSE 0 END), 0) AS that_bai_count,
                COALESCE(SUM(CASE WHEN trang_thai = 'thanh_cong' THEN so_tien ELSE 0 END), 0) AS tong_tien_da_nap,
                COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END), 0) AS hom_nay_count
            FROM wallet_transactions
            WHERE loai_giao_dich = 'nap_tien'
        `);

        res.json({
            success: true,
            data: deposits,
            stats,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (err) {
        console.error('Fetch deposits error:', err);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách yêu cầu nạp tiền.' });
    }
});

// Duyệt nạp tiền cho khách hàng (Sử dụng MySQL Transaction an toàn)
app.post('/api/admin/deposits/:id/approve', ...accountManagementAccess, requireAdminPermission('deposits'), async (req, res) => {
    const depositId = req.params.id;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Khóa và lấy bản ghi giao dịch nạp tiền
        const [txList] = await connection.query(
            'SELECT * FROM wallet_transactions WHERE id = ? FOR UPDATE',
            [depositId]
        );
        if (!txList.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu nạp tiền.' });
        }

        const tx = txList[0];
        if (tx.trang_thai !== 'cho_duyet') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Yêu cầu này đã ở trạng thái "${tx.trang_thai === 'thanh_cong' ? 'Đã thành công' : 'Đã từ chối'}", không thể duyệt lại.`
            });
        }

        // 2. Khóa dòng người dùng để cập nhật số dư an toàn
        const [userList] = await connection.query(
            'SELECT id, ho_ten, email, balance FROM users WHERE id = ? FOR UPDATE',
            [tx.user_id]
        );
        if (!userList.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng tương ứng.' });
        }

        const user = userList[0];
        const soDuTruoc = Number(user.balance || 0);
        const soTienNap = Number(tx.so_tien);
        const soDuSau = soDuTruoc + soTienNap;

        // 3. Cộng tiền vào tài khoản khách hàng
        await connection.query(
            'UPDATE users SET balance = balance + ? WHERE id = ?',
            [soTienNap, user.id]
        );

        // 4. Cập nhật trạng thái giao dịch
        await connection.query(
            `UPDATE wallet_transactions 
             SET trang_thai = 'thanh_cong', 
                 so_du_truoc = ?, 
                 so_du_sau = ?, 
                 admin_id = ?, 
                 ngay_duyet = NOW(), 
                 updated_at = NOW() 
             WHERE id = ?`,
            [soDuTruoc, soDuSau, req.user.id, tx.id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: `Xác nhận nạp thành công ${new Intl.NumberFormat('vi-VN').format(soTienNap)}đ cho khách hàng ${user.ho_ten}.`,
            data: {
                id: tx.id,
                ma_giao_dich: tx.ma_giao_dich,
                so_tien: soTienNap,
                so_du_sau: soDuSau
            }
        });
    } catch (err) {
        await connection.rollback();
        console.error('Approve deposit transaction error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi duyệt giao dịch nạp tiền.' });
    } finally {
        connection.release();
    }
});

// Từ chối yêu cầu nạp tiền (Sử dụng MySQL Transaction an toàn)
app.post('/api/admin/deposits/:id/reject', ...accountManagementAccess, requireAdminPermission('deposits'), async (req, res) => {
    const depositId = req.params.id;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [txList] = await connection.query(
            'SELECT * FROM wallet_transactions WHERE id = ? FOR UPDATE',
            [depositId]
        );
        if (!txList.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu nạp tiền.' });
        }

        const tx = txList[0];
        if (tx.trang_thai !== 'cho_duyet') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Yêu cầu này đã ở trạng thái "${tx.trang_thai === 'thanh_cong' ? 'Đã duyệt' : 'Đã từ chối'}".`
            });
        }

        const lyDo = String(req.body.ly_do || 'Chưa nhận được thanh toán hoặc sai thông tin chuyển khoản').trim();
        const updatedGhiChu = tx.ghi_chu ? `${tx.ghi_chu} | Từ chối: ${lyDo}` : `Từ chối: ${lyDo}`;

        await connection.query(
            `UPDATE wallet_transactions 
             SET trang_thai = 'that_bai', 
                 admin_id = ?, 
                 ngay_duyet = NOW(), 
                 ghi_chu = ?, 
                 updated_at = NOW() 
             WHERE id = ?`,
            [req.user.id, updatedGhiChu, tx.id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Đã từ chối yêu cầu nạp tiền thành công.',
            data: { id: tx.id }
        });
    } catch (err) {
        await connection.rollback();
        console.error('Reject deposit transaction error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi từ chối giao dịch.' });
    } finally {
        connection.release();
    }
});

// ─── Quản lý Nạp ví & Lịch sử giao dịch Ví cho Admin ──────────
app.get('/api/admin/wallet-transactions', ...accountManagementAccess, async (req, res) => {
    try {
        if (!req.adminActor.quyen.includes('orders') && !req.adminActor.quyen.includes('accounts')) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền xem lịch sử giao dịch ví.' });
        }

        const { q, type, status, page = 1, limit = 50 } = req.query;
        const conditions = [];
        const params = [];

        if (q && String(q).trim()) {
            conditions.push('(wt.ma_giao_dich LIKE ? OR u.ho_ten LIKE ? OR u.email LIKE ? OR u.so_dien_thoai LIKE ?)');
            const kw = `%${String(q).trim()}%`;
            params.push(kw, kw, kw, kw);
        }

        if (type && String(type).trim() && type !== 'all') {
            conditions.push('wt.loai_giao_dich = ?');
            params.push(String(type).trim());
        }

        if (status && String(status).trim() && status !== 'all') {
            conditions.push('wt.trang_thai = ?');
            params.push(String(status).trim());
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (Number(page) - 1) * Number(limit);

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total
             FROM wallet_transactions wt
             JOIN users u ON u.id = wt.user_id
             ${where}`,
            params
        );

        const [transactions] = await db.query(
            `SELECT wt.*, u.ho_ten, u.email, u.so_dien_thoai, u.balance AS so_du_hien_tai
             FROM wallet_transactions wt
             JOIN users u ON u.id = wt.user_id
             ${where}
             ORDER BY wt.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, Number(limit), offset]
        );

        // Thống kê nhanh tổng tiền nạp, tổng thanh toán và hoàn tiền
        const [[summary]] = await db.query(`
            SELECT
                COALESCE(SUM(CASE WHEN loai_giao_dich = 'nap_tien' AND trang_thai = 'thanh_cong' THEN so_tien ELSE 0 END), 0) AS tong_nap,
                COALESCE(SUM(CASE WHEN loai_giao_dich = 'thanh_toan' AND trang_thai = 'thanh_cong' THEN so_tien ELSE 0 END), 0) AS tong_chi,
                COALESCE(SUM(CASE WHEN loai_giao_dich = 'hoan_tien' AND trang_thai = 'thanh_cong' THEN so_tien ELSE 0 END), 0) AS tong_hoan
            FROM wallet_transactions
        `);

        res.json({
            success: true,
            data: transactions,
            summary,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải lịch sử giao dịch ví của khách hàng.' });
    }
});

// ─── API Tin tức công khai (Public News) ──────────────────────
app.get('/api/tin-tuc/danh-muc', async (req, res) => {
    try {
        const [categories] = await db.query(`
            SELECT danh_muc, COUNT(*) AS count
            FROM tin_tuc
            WHERE trang_thai = 1
            GROUP BY danh_muc
            ORDER BY count DESC
        `);
        res.json({ success: true, data: categories });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải danh mục tin tức.' });
    }
});

app.get('/api/tin-tuc/noi-bat', async (req, res) => {
    try {
        const [articles] = await db.query(`
            SELECT id, tieu_de, slug, tom_tat, hinh_anh, danh_muc, tac_gia_ten, luot_xem, created_at
            FROM tin_tuc
            WHERE trang_thai = 1 AND noi_bat = 1
            ORDER BY created_at DESC
            LIMIT 5
        `);
        res.json({ success: true, data: articles });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
});

app.get('/api/tin-tuc', async (req, res) => {
    try {
        const {
            q,
            category,
            sort,
            page = 1,
            limit = 9
        } = req.query;

        const conditions = ['trang_thai = 1'];
        const params = [];

        const keyword = String(q || '').trim();
        if (keyword) {
            conditions.push('(tieu_de LIKE ? OR tom_tat LIKE ?)');
            params.push(`%${keyword}%`, `%${keyword}%`);
        }

        const cat = String(category || '').trim();
        if (cat && cat !== 'all' && cat !== 'Tất cả') {
            conditions.push('danh_muc = ?');
            params.push(cat);
        }

        if (featured === '1') {
            conditions.push('noi_bat = 1');
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (Number(page) - 1) * Number(limit);

        const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM tin_tuc ${where}`, params);

        let orderBy = 'created_at DESC';
        if (sort === 'views') orderBy = 'luot_xem DESC';
        else if (sort === 'oldest') orderBy = 'created_at ASC';

        const [articles] = await db.query(
            `SELECT id, tieu_de, slug, tom_tat, hinh_anh, danh_muc, tac_gia_ten, noi_bat, luot_xem, created_at
             FROM tin_tuc
             ${where}
             ORDER BY ${orderBy}
             LIMIT ? OFFSET ?`,
            [...params, Number(limit), offset]
        );

        res.json({
            success: true,
            data: articles,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách bài viết.' });
    }
});

app.get('/api/tin-tuc/:identifier', async (req, res) => {
    try {
        const identifier = req.params.identifier;
        let query = 'SELECT * FROM tin_tuc WHERE trang_thai = 1 AND (slug = ? OR id = ?)';
        const paramId = Number(identifier) || -1;
        const [articles] = await db.query(query, [identifier, paramId]);

        if (!articles.length) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
        }

        const article = articles[0];
        // Tăng lượt xem
        await db.query('UPDATE tin_tuc SET luot_xem = luot_xem + 1 WHERE id = ?', [article.id]);
        article.luot_xem = Number(article.luot_xem || 0) + 1;

        // Lấy bài viết liên quan (ưu tiên cùng danh mục, nếu thiếu lấy thêm các bài viết mới khác)
        let [related] = await db.query(`
            SELECT id, tieu_de, slug, tom_tat, hinh_anh, danh_muc, tac_gia_ten, created_at, luot_xem
            FROM tin_tuc
            WHERE trang_thai = 1 AND id != ? AND danh_muc = ?
            ORDER BY created_at DESC
            LIMIT 3
        `, [article.id, article.danh_muc]);

        if (related.length < 3) {
            const excludeIds = [article.id, ...related.map(r => r.id)];
            const [more] = await db.query(`
                SELECT id, tieu_de, slug, tom_tat, hinh_anh, danh_muc, tac_gia_ten, created_at, luot_xem
                FROM tin_tuc
                WHERE trang_thai = 1 AND id NOT IN (${excludeIds.map(() => '?').join(',')})
                ORDER BY created_at DESC
                LIMIT ?
            `, [...excludeIds, 3 - related.length]);
            related = [...related, ...more];
        }

        res.json({
            success: true,
            data: {
                ...article,
                tin_lien_quan: related
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải chi tiết bài viết.' });
    }
});

// ─── API Quản lý Tin tức (Admin News Management) ──────────────
const generateSlug = (str) => {
    if (!str) return 'tin-tuc-' + Date.now();
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

app.get('/api/admin/tin-tuc', ...accountManagementAccess, requireAdminPermission('news'), async (req, res) => {
    try {
        const { q, category, status, page = 1, limit = 50 } = req.query;
        const conditions = [];
        const params = [];

        if (q && String(q).trim()) {
            conditions.push('(tieu_de LIKE ? OR tom_tat LIKE ?)');
            params.push(`%${String(q).trim()}%`, `%${String(q).trim()}%`);
        }
        if (category && category !== 'all') {
            conditions.push('danh_muc = ?');
            params.push(category);
        }
        if (status !== undefined && status !== '' && status !== 'all') {
            conditions.push('trang_thai = ?');
            params.push(Number(status));
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (Number(page) - 1) * Number(limit);

        const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM tin_tuc ${where}`, params);
        const [articles] = await db.query(
            `SELECT id, tieu_de, slug, tom_tat, hinh_anh, danh_muc, tac_gia_ten, noi_bat, luot_xem, trang_thai, created_at, updated_at
             FROM tin_tuc
             ${where}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, Number(limit), offset]
        );

        res.json({
            success: true,
            data: articles,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tải danh sách bài viết quản trị.' });
    }
});

app.get('/api/admin/tin-tuc/:id', ...accountManagementAccess, requireAdminPermission('news'), async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [articles] = await db.query('SELECT * FROM tin_tuc WHERE id = ?', [id]);
        if (!articles.length) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
        res.json({ success: true, data: articles[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
});

app.post('/api/admin/tin-tuc', ...accountManagementAccess, requireAdminPermission('news'), async (req, res) => {
    try {
        const { tieu_de, slug, tom_tat, noi_dung, hinh_anh, danh_muc, tac_gia_ten, noi_bat, trang_thai } = req.body;
        if (!tieu_de || !String(tieu_de).trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tiêu đề bài viết.' });
        }
        if (!noi_dung || !String(noi_dung).trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung bài viết.' });
        }

        let finalSlug = slug ? generateSlug(slug) : generateSlug(tieu_de);
        const [existing] = await db.query('SELECT id FROM tin_tuc WHERE slug = ?', [finalSlug]);
        if (existing.length > 0) {
            finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
        }

        const [result] = await db.query(`
            INSERT INTO tin_tuc (
                tieu_de, slug, tom_tat, noi_dung, hinh_anh, danh_muc,
                tac_gia_id, tac_gia_ten, noi_bat, trang_thai
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            String(tieu_de).trim(),
            finalSlug,
            String(tom_tat || '').trim(),
            String(noi_dung).trim(),
            hinh_anh || '/uploads/macbook-pro-16-m3.jpg',
            danh_muc || 'Công nghệ',
            req.adminActor.id,
            tac_gia_ten || req.adminActor.ho_ten || 'KTSHOP News',
            Number(noi_bat) === 1 ? 1 : 0,
            trang_thai !== undefined ? Number(trang_thai) : 1
        ]);

        res.json({
            success: true,
            message: 'Đăng bài viết mới thành công!',
            data: { id: result.insertId, slug: finalSlug }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể tạo bài viết mới.' });
    }
});

app.put('/api/admin/tin-tuc/:id', ...accountManagementAccess, requireAdminPermission('news'), async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { tieu_de, slug, tom_tat, noi_dung, hinh_anh, danh_muc, tac_gia_ten, noi_bat, trang_thai } = req.body;

        const [existing] = await db.query('SELECT id, slug FROM tin_tuc WHERE id = ?', [id]);
        if (!existing.length) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });

        let finalSlug = slug ? generateSlug(slug) : existing[0].slug;
        if (finalSlug !== existing[0].slug) {
            const [check] = await db.query('SELECT id FROM tin_tuc WHERE slug = ? AND id != ?', [finalSlug, id]);
            if (check.length > 0) finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
        }

        await db.query(`
            UPDATE tin_tuc SET
                tieu_de = ?,
                slug = ?,
                tom_tat = ?,
                noi_dung = ?,
                hinh_anh = ?,
                danh_muc = ?,
                tac_gia_ten = ?,
                noi_bat = ?,
                trang_thai = ?
            WHERE id = ?
        `, [
            String(tieu_de).trim(),
            finalSlug,
            String(tom_tat || '').trim(),
            String(noi_dung).trim(),
            hinh_anh,
            danh_muc,
            tac_gia_ten,
            Number(noi_bat) === 1 ? 1 : 0,
            Number(trang_thai),
            id
        ]);

        res.json({ success: true, message: 'Cập nhật bài viết thành công!', data: { id, slug: finalSlug } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể cập nhật bài viết.' });
    }
});

app.delete('/api/admin/tin-tuc/:id', ...accountManagementAccess, requireAdminPermission('news'), async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [existing] = await db.query('SELECT id FROM tin_tuc WHERE id = ?', [id]);
        if (!existing.length) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });

        await db.query('DELETE FROM tin_tuc WHERE id = ?', [id]);
        res.json({ success: true, message: 'Đã xóa bài viết thành công.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể xóa bài viết.' });
    }
});

app.put('/api/admin/tin-tuc/:id/toggle-status', ...accountManagementAccess, requireAdminPermission('news'), async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [existing] = await db.query('SELECT id, trang_thai FROM tin_tuc WHERE id = ?', [id]);
        if (!existing.length) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });

        const newStatus = existing[0].trang_thai === 1 ? 0 : 1;
        await db.query('UPDATE tin_tuc SET trang_thai = ? WHERE id = ?', [newStatus, id]);
        res.json({ success: true, message: newStatus === 1 ? 'Đã xuất bản bài viết.' : 'Đã chuyển thành bản nháp.', data: { trang_thai: newStatus } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể đổi trạng thái bài viết.' });
    }
});

app.put('/api/admin/tin-tuc/:id/toggle-featured', ...accountManagementAccess, requireAdminPermission('news'), async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [existing] = await db.query('SELECT id, noi_bat FROM tin_tuc WHERE id = ?', [id]);
        if (!existing.length) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });

        const newFeatured = existing[0].noi_bat === 1 ? 0 : 1;
        await db.query('UPDATE tin_tuc SET noi_bat = ? WHERE id = ?', [newFeatured, id]);
        res.json({ success: true, message: newFeatured === 1 ? 'Đã ghim nổi bật.' : 'Đã bỏ ghim nổi bật.', data: { noi_bat: newFeatured } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể cập nhật ghim bài viết.' });
    }
});

// ─── Khởi động server ─────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});
