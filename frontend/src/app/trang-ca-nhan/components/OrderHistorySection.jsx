'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { parseApiResponse } from '../../context/AppContext';

// Cấu hình trạng thái giao nhận đơn hàng
const STATUS_CONFIG = {
  cho_xac_nhan: {
    label: 'Chờ xác nhận',
    color: '#d97706',
    bg: '#fef3c7',
    border: '#fde68a',
    badgeClass: 'status-pending',
    step: 1,
  },
  da_xac_nhan: {
    label: 'Đã xác nhận',
    color: '#2563eb',
    bg: '#dbeafe',
    border: '#bfdbfe',
    badgeClass: 'status-confirmed',
    step: 2,
  },
  dang_giao: {
    label: 'Đang giao hàng',
    color: '#7c3aed',
    bg: '#ede9fe',
    border: '#ddd6fe',
    badgeClass: 'status-shipping',
    step: 3,
  },
  da_giao: {
    label: 'Giao thành công',
    color: '#059669',
    bg: '#d1fae5',
    border: '#a7f3d0',
    badgeClass: 'status-delivered',
    step: 4,
  },
  da_huy: {
    label: 'Đã hủy',
    color: '#dc2626',
    bg: '#fee2e2',
    border: '#fecaca',
    badgeClass: 'status-cancelled',
    step: 0,
  },
  tra_hang: {
    label: 'Trả hàng / Hoàn tiền',
    color: '#ea580c',
    bg: '#ffedd5',
    border: '#fed7aa',
    badgeClass: 'status-returned',
    step: 0,
  },
};

// Cấu hình trạng thái thanh toán
const PAYMENT_STATUS_CONFIG = {
  chua_thanh_toan: {
    label: 'Chưa thanh toán',
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#fed7aa',
  },
  da_thanh_toan: {
    label: 'Đã thanh toán',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
  },
  hoan_tien: {
    label: 'Đã hoàn tiền',
    color: '#6366f1',
    bg: '#eef2ff',
    border: '#c7d2fe',
  },
};

// Cấu hình tên phương thức thanh toán
const PAYMENT_METHOD_NAMES = {
  tai_khoan: 'Số dư ví KTSHOP',
  momo: 'Ví MoMo',
  tien_mat: 'Tiền mặt khi nhận hàng (COD)',
  chuyen_khoan: 'Chuyển khoản ngân hàng',
  vnpay: 'Cổng thanh toán VNPay',
  zalopay: 'Ví ZaloPay',
  credit_card: 'Thẻ tín dụng / Ghi nợ',
};

// Định dạng tiền tệ VND
const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(amount) || 0);
};

// Định dạng ngày giờ
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function OrderHistorySection({ user, apiFetch, onRefreshUser }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Xem chi tiết đơn hàng
  const [detailModalOrder, setDetailModalOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Xác nhận hủy đơn hàng
  const [confirmCancelOrder, setConfirmCancelOrder] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Thông báo phản hồi
  const [feedback, setFeedback] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Tải danh sách đơn hàng
  const loadOrders = useCallback(async () => {
    if (!user || !user.accessToken) return;
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch('http://localhost:5000/api/orders/my-orders', {}, user);
      const result = await parseApiResponse(response);
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể tải lịch sử đơn hàng.');
      }
      setOrders(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải lịch sử đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, user]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Sao chép mã đơn hàng
  const handleCopyCode = (code, e) => {
    e?.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Mở modal chi tiết đơn hàng
  const handleOpenDetail = async (orderSummary) => {
    setDetailModalOrder(orderSummary);
    setDetailLoading(true);
    setDetailError('');
    try {
      const response = await apiFetch(`http://localhost:5000/api/orders/my-orders/${orderSummary.id}`, {}, user);
      const result = await parseApiResponse(response);
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể tải chi tiết đơn hàng.');
      }
      setDetailModalOrder(result.data);
    } catch (err) {
      setDetailError(err.message || 'Lỗi khi tải chi tiết đơn hàng.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Hủy đơn hàng
  const executeCancelOrder = async () => {
    if (!confirmCancelOrder) return;
    setCancelling(true);
    setFeedback(null);
    try {
      const response = await apiFetch(`http://localhost:5000/api/orders/my-orders/${confirmCancelOrder.id}/cancel`, {
        method: 'PUT',
      }, user);
      const result = await parseApiResponse(response);
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể hủy đơn hàng.');
      }

      setFeedback({
        type: 'success',
        message: result.message || 'Đã hủy đơn hàng thành công!',
      });
      setConfirmCancelOrder(null);
      if (detailModalOrder && detailModalOrder.id === confirmCancelOrder.id) {
        setDetailModalOrder(null);
      }

      // Tải lại danh sách đơn và cập nhật lại số dư ví nếu hoàn tiền
      await loadOrders();
      if (typeof onRefreshUser === 'function') {
        onRefreshUser();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Lỗi khi thực hiện hủy đơn hàng.',
      });
    } finally {
      setCancelling(false);
    }
  };

  // Tính số lượng đơn theo từng trạng thái
  const counts = useMemo(() => {
    const res = { all: orders.length };
    orders.forEach((o) => {
      const status = o.trang_thai_dh || 'cho_xac_nhan';
      res[status] = (res[status] || 0) + 1;
    });
    return res;
  }, [orders]);

  // Lọc và tìm kiếm đơn hàng
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Lọc theo trạng thái
      if (statusFilter !== 'all' && order.trang_thai_dh !== statusFilter) {
        return false;
      }
      // Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchCode = (order.ma_don_hang || '').toLowerCase().includes(query);
        const matchProducts = (order.danh_sach_sp || '').toLowerCase().includes(query);
        const matchReceiver = (order.ho_ten_nguoi_nhan || '').toLowerCase().includes(query);
        const matchPhone = (order.so_dien_thoai || '').includes(query);
        return matchCode || matchProducts || matchReceiver || matchPhone;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  // Bộ lọc trạng thái có sẵn
  const FILTER_TABS = [
    { key: 'all', label: 'Tất cả' },
    { key: 'cho_xac_nhan', label: 'Chờ xác nhận' },
    { key: 'da_xac_nhan', label: 'Đã xác nhận' },
    { key: 'dang_giao', label: 'Đang giao' },
    { key: 'da_giao', label: 'Đã giao' },
    { key: 'da_huy', label: 'Đã hủy' },
  ];

  return (
    <div className="order-history-section">
      {/* ── HEADER & STATS ── */}
      <div className="order-history-header">
        <div>
          <h2 className="profile-section-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            Lịch sử mua hàng
          </h2>
          <p className="profile-section-desc" style={{ marginBottom: 16 }}>
            Theo dõi tình trạng vận chuyển, xem chi tiết và quản lý các đơn hàng của bạn tại KTSHOP.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="order-stats-grid">
          <div className="order-stat-card">
            <span className="order-stat-num">{orders.length}</span>
            <span className="order-stat-label">Tổng đơn hàng</span>
          </div>
          <div className="order-stat-card">
            <span className="order-stat-num" style={{ color: '#d97706' }}>
              {(counts.cho_xac_nhan || 0) + (counts.da_xac_nhan || 0) + (counts.dang_giao || 0)}
            </span>
            <span className="order-stat-label">Đang xử lý / giao</span>
          </div>
          <div className="order-stat-card">
            <span className="order-stat-num" style={{ color: '#059669' }}>
              {counts.da_giao || 0}
            </span>
            <span className="order-stat-label">Hoàn tất</span>
          </div>
        </div>
      </div>

      {/* ── NOTIFICATIONS / FEEDBACK ── */}
      {feedback && (
        <div className={`order-feedback-alert ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}>
          <div className="feedback-icon">
            {feedback.type === 'success' ? '✓' : '!'}
          </div>
          <div className="feedback-text">{feedback.message}</div>
          <button type="button" className="feedback-close-btn" onClick={() => setFeedback(null)} aria-label="Đóng">
            ✕
          </button>
        </div>
      )}

      {/* ── CONTROLS: FILTER TABS & SEARCH ── */}
      <div className="order-controls-bar">
        {/* Status Filter Pills */}
        <div className="order-filter-pills" role="tablist">
          {FILTER_TABS.map((tab) => {
            const count = counts[tab.key] || 0;
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={`order-filter-pill ${isActive ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab.key)}
                role="tab"
                aria-selected={isActive}
              >
                <span>{tab.label}</span>
                {count > 0 && <span className="order-filter-count">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="order-search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="order-search-icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="order-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn, tên sản phẩm..."
          />
          {searchQuery && (
            <button
              type="button"
              className="order-search-clear"
              onClick={() => setSearchQuery('')}
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT LIST ── */}
      {loading ? (
        <div className="order-loading-box">
          <div className="profile-spinner" />
          <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Đang tải lịch sử đơn hàng...</p>
        </div>
      ) : error ? (
        <div className="order-error-box">
          <p style={{ color: '#dc2626', fontWeight: 600 }}>{error}</p>
          <button type="button" className="order-retry-btn" onClick={loadOrders}>
            Thử lại
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="order-empty-box">
          <div className="order-empty-icon-wrap">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          {orders.length === 0 ? (
            <>
              <h3 className="order-empty-title">Bạn chưa có đơn hàng nào</h3>
              <p className="order-empty-desc">
                Hàng ngàn laptop chính hãng giá ưu đãi cùng nhiều quà tặng hấp dẫn đang chờ bạn khám phá.
              </p>
              <Link href="/san-pham" className="order-primary-btn" style={{ textDecoration: 'none' }}>
                Khám phá sản phẩm ngay
              </Link>
            </>
          ) : (
            <>
              <h3 className="order-empty-title">Không tìm thấy đơn hàng phù hợp</h3>
              <p className="order-empty-desc">
                Không có đơn hàng nào khớp với bộ lọc hoặc từ khóa &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                className="order-secondary-btn"
                onClick={() => {
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
              >
                Đặt lại bộ lọc
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="order-cards-list">
          {filteredOrders.map((order) => {
            const statusInfo = STATUS_CONFIG[order.trang_thai_dh] || STATUS_CONFIG.cho_xac_nhan;
            const paymentStatusInfo = PAYMENT_STATUS_CONFIG[order.trang_thai_tt] || PAYMENT_STATUS_CONFIG.chua_thanh_toan;
            const canCancel = order.trang_thai_dh === 'cho_xac_nhan';

            return (
              <div key={order.id} className="order-card">
                {/* ── CARD TOP BAR ── */}
                <div className="order-card-header">
                  <div className="order-card-meta">
                    <span className="order-code-badge" onClick={(e) => handleCopyCode(order.ma_don_hang, e)} title="Nhấp để sao chép mã đơn">
                      #{order.ma_don_hang}
                      <span className="order-copy-icon">
                        {copiedCode === order.ma_don_hang ? 'Đã chép' : '📋'}
                      </span>
                    </span>
                    <span className="order-date-text">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }}>
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {formatDateTime(order.created_at)}
                    </span>
                  </div>

                  <div className="order-card-status-group">
                    {/* Payment badge */}
                    <span
                      className="order-payment-badge"
                      style={{
                        color: paymentStatusInfo.color,
                        background: paymentStatusInfo.bg,
                        borderColor: paymentStatusInfo.border,
                      }}
                    >
                      {paymentStatusInfo.label}
                    </span>

                    {/* Delivery status badge */}
                    <span
                      className={`order-status-badge ${statusInfo.badgeClass}`}
                      style={{
                        color: statusInfo.color,
                        background: statusInfo.bg,
                        borderColor: statusInfo.border,
                      }}
                    >
                      <span className="order-status-dot" style={{ backgroundColor: statusInfo.color }} />
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* ── CARD BODY ── */}
                <div className="order-card-body" onClick={() => handleOpenDetail(order)}>
                  {/* Thumbnail if available */}
                  <div className="order-thumb-wrap">
                    {order.anh_dai_dien ? (
                      <img src={order.anh_dai_dien} alt="Laptop" className="order-thumb-img" />
                    ) : (
                      <div className="order-thumb-placeholder">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Order info summary */}
                  <div className="order-summary-info">
                    <div className="order-product-names">
                      {order.danh_sach_sp || 'Laptop chính hãng KTSHOP'}
                    </div>

                    <div className="order-info-tags">
                      <span className="order-tag">
                        📦 {order.so_mat_hang || 1} sản phẩm
                      </span>
                      <span className="order-tag">
                        💳 {PAYMENT_METHOD_NAMES[order.phuong_thuc_tt] || 'Thanh toán trực tiếp'}
                      </span>
                    </div>

                    <div className="order-receiver-snippet">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>
                        Giao đến: <strong>{order.ho_ten_nguoi_nhan}</strong> ({order.so_dien_thoai}) &bull; {order.dia_chi_giao}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── CARD FOOTER ── */}
                <div className="order-card-footer">
                  <div className="order-total-block">
                    <span className="order-total-label">Tổng thanh toán:</span>
                    <span className="order-total-price">{formatVND(order.thanh_tien)}</span>
                  </div>

                  <div className="order-card-actions">
                    {canCancel && (
                      <button
                        type="button"
                        className="order-btn-cancel"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmCancelOrder(order);
                        }}
                      >
                        Hủy đơn
                      </button>
                    )}
                    <button
                      type="button"
                      className="order-btn-view"
                      onClick={() => handleOpenDetail(order)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: CHI TIẾT ĐƠN HÀNG ── */}
      {detailModalOrder && (
        <div className="order-modal-backdrop" onClick={() => setDetailModalOrder(null)}>
          <div className="order-modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            {/* Modal Header */}
            <div className="order-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 className="order-modal-title">Chi tiết đơn hàng #{detailModalOrder.ma_don_hang}</h3>
                  <button
                    type="button"
                    className="order-copy-btn-inline"
                    onClick={() => handleCopyCode(detailModalOrder.ma_don_hang)}
                    title="Sao chép mã"
                  >
                    {copiedCode === detailModalOrder.ma_don_hang ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
                <p className="order-modal-subtitle">
                  Ngày đặt hàng: {formatDateTime(detailModalOrder.created_at)}
                </p>
              </div>
              <button
                type="button"
                className="order-modal-close"
                onClick={() => setDetailModalOrder(null)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="order-modal-body">
              {detailLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <div className="profile-spinner" />
                  <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Đang tải thông tin chi tiết...</p>
                </div>
              ) : detailError ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#dc2626' }}>
                  <p>{detailError}</p>
                </div>
              ) : (
                <>
                  {/* Stepper / Timeline tiến độ đơn */}
                  <div className="order-timeline-wrap">
                    {detailModalOrder.trang_thai_dh === 'da_huy' ? (
                      <div className="order-cancelled-banner">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        <div>
                          <strong>Đơn hàng này đã bị hủy</strong>
                          <p style={{ margin: '2px 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                            Nếu bạn đã thanh toán bằng số dư KTSHOP, tiền đã được hoàn trả lại ví của bạn.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="order-stepper">
                        {[
                          { step: 1, label: 'Chờ xác nhận', desc: 'Đã nhận đơn' },
                          { step: 2, label: 'Đã xác nhận', desc: 'Shop chuẩn bị' },
                          { step: 3, label: 'Đang giao', desc: 'Shipper đang giao' },
                          { step: 4, label: 'Hoàn tất', desc: 'Giao thành công' },
                        ].map((s) => {
                          const currentStep = (STATUS_CONFIG[detailModalOrder.trang_thai_dh] || STATUS_CONFIG.cho_xac_nhan).step;
                          const isCompleted = currentStep >= s.step;
                          const isCurrent = currentStep === s.step;
                          return (
                            <div key={s.step} className={`order-step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                              <div className="order-step-circle">
                                {isCompleted && currentStep > s.step ? '✓' : s.step}
                              </div>
                              <div className="order-step-label">{s.label}</div>
                              <div className="order-step-desc">{s.desc}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Danh sách sản phẩm chi tiết */}
                  <div className="order-modal-section">
                    <h4 className="order-modal-section-title">
                      Danh sách sản phẩm ({detailModalOrder.items ? detailModalOrder.items.length : 1})
                    </h4>
                    <div className="order-items-list">
                      {detailModalOrder.items && detailModalOrder.items.length > 0 ? (
                        detailModalOrder.items.map((item) => (
                          <div key={item.id} className="order-item-row">
                            <div className="order-item-img-wrap">
                              {item.url_anh ? (
                                <img src={item.url_anh} alt={item.ten_laptop} className="order-item-img" />
                              ) : (
                                <div className="order-item-img-placeholder">Laptop</div>
                              )}
                            </div>
                            <div className="order-item-detail">
                              <Link
                                href={`/san-pham/${item.laptop_id}`}
                                className="order-item-name"
                                target="_blank"
                                title="Xem trang sản phẩm"
                              >
                                {item.ten_laptop}
                              </Link>
                              {item.serial_number && (
                                <div className="order-item-serial">
                                  Serial: <code>{item.serial_number}</code>
                                </div>
                              )}
                              <div className="order-item-price-qty">
                                <span className="order-item-price">{formatVND(item.gia_ban)}</span>
                                <span className="order-item-qty">x {item.so_luong}</span>
                              </div>
                            </div>
                            <div className="order-item-total">
                              {formatVND(item.thanh_tien)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="order-item-row">
                          <div className="order-item-detail">
                            <div className="order-item-name">{detailModalOrder.danh_sach_sp}</div>
                          </div>
                          <div className="order-item-total">{formatVND(detailModalOrder.tong_tien)}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2 Cột: Thông tin nhận hàng & Chi phí */}
                  <div className="order-modal-info-grid">
                    {/* Cột 1: Người nhận & Vận chuyển */}
                    <div className="order-modal-info-card">
                      <h4 className="order-modal-info-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        Địa chỉ nhận hàng
                      </h4>
                      <div className="order-info-line">
                        <span className="order-info-k">Người nhận:</span>
                        <span className="order-info-v"><strong>{detailModalOrder.ho_ten_nguoi_nhan}</strong></span>
                      </div>
                      <div className="order-info-line">
                        <span className="order-info-k">Số điện thoại:</span>
                        <span className="order-info-v">{detailModalOrder.so_dien_thoai}</span>
                      </div>
                      <div className="order-info-line">
                        <span className="order-info-k">Địa chỉ:</span>
                        <span className="order-info-v">{detailModalOrder.dia_chi_giao}</span>
                      </div>
                      {detailModalOrder.ghi_chu && (
                        <div className="order-info-line">
                          <span className="order-info-k">Ghi chú:</span>
                          <span className="order-info-v" style={{ fontStyle: 'italic' }}>{detailModalOrder.ghi_chu}</span>
                        </div>
                      )}
                    </div>

                    {/* Cột 2: Thanh toán & Bảng kê chi phí */}
                    <div className="order-modal-info-card">
                      <h4 className="order-modal-info-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="5" width="20" height="14" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                        Thanh toán & Chi phí
                      </h4>
                      <div className="order-info-line">
                        <span className="order-info-k">Hình thức:</span>
                        <span className="order-info-v">
                          <strong>{PAYMENT_METHOD_NAMES[detailModalOrder.phuong_thuc_tt] || 'Thanh toán trực tiếp'}</strong>
                        </span>
                      </div>
                      <div className="order-info-line">
                        <span className="order-info-k">Trạng thái:</span>
                        <span className="order-info-v">
                          <span
                            className="order-payment-pill"
                            style={{
                              color: (PAYMENT_STATUS_CONFIG[detailModalOrder.trang_thai_tt] || {}).color,
                              background: (PAYMENT_STATUS_CONFIG[detailModalOrder.trang_thai_tt] || {}).bg,
                            }}
                          >
                            {(PAYMENT_STATUS_CONFIG[detailModalOrder.trang_thai_tt] || {}).label || detailModalOrder.trang_thai_tt}
                          </span>
                        </span>
                      </div>

                      <div className="order-price-breakdown">
                        <div className="order-price-row">
                          <span>Tiền hàng:</span>
                          <span>{formatVND(detailModalOrder.tong_tien)}</span>
                        </div>
                        {Number(detailModalOrder.tien_giam) > 0 && (
                          <div className="order-price-row order-discount-row">
                            <span>Giảm giá coupon:</span>
                            <span>-{formatVND(detailModalOrder.tien_giam)}</span>
                          </div>
                        )}
                        <div className="order-price-row">
                          <span>Phí vận chuyển:</span>
                          <span>{Number(detailModalOrder.phi_van_chuyen) === 0 ? 'Miễn phí' : formatVND(detailModalOrder.phi_van_chuyen)}</span>
                        </div>
                        <div className="order-price-row order-final-row">
                          <span>Tổng thanh toán:</span>
                          <span className="order-final-amount">{formatVND(detailModalOrder.thanh_tien)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="order-modal-footer">
              {detailModalOrder && detailModalOrder.trang_thai_dh === 'cho_xac_nhan' && (
                <button
                  type="button"
                  className="order-btn-cancel-modal"
                  onClick={() => {
                    setConfirmCancelOrder(detailModalOrder);
                  }}
                >
                  Hủy đơn hàng
                </button>
              )}
              <button
                type="button"
                className="order-secondary-btn"
                style={{ marginLeft: 'auto' }}
                onClick={() => setDetailModalOrder(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL XÁC NHẬN HỦY ĐƠN ── */}
      {confirmCancelOrder && (
        <div className="order-modal-backdrop" onClick={() => !cancelling && setConfirmCancelOrder(null)}>
          <div className="order-confirm-card" onClick={(e) => e.stopPropagation()} role="alertdialog">
            <div className="order-confirm-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h3 className="order-confirm-title">Xác nhận hủy đơn hàng?</h3>
            <p className="order-confirm-desc">
              Bạn có chắc chắn muốn hủy đơn hàng <strong>#{confirmCancelOrder.ma_don_hang}</strong>?
            </p>

            {confirmCancelOrder.phuong_thuc_tt === 'tai_khoan' && confirmCancelOrder.trang_thai_tt === 'da_thanh_toan' ? (
              <div className="order-refund-notice">
                <span className="order-refund-notice-icon">💰</span>
                <div>
                  <strong>Hoàn tiền tự động:</strong> Số tiền <strong>{formatVND(confirmCancelOrder.thanh_tien)}</strong> sẽ được hoàn trả ngay lập tức vào số dư ví KTSHOP của bạn.
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '12px 0 0' }}>
                Thao tác này không thể hoàn tác sau khi xác nhận.
              </p>
            )}

            <div className="order-confirm-actions">
              <button
                type="button"
                className="order-secondary-btn"
                onClick={() => setConfirmCancelOrder(null)}
                disabled={cancelling}
              >
                Quay lại
              </button>
              <button
                type="button"
                className="order-danger-btn"
                onClick={executeCancelOrder}
                disabled={cancelling}
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
