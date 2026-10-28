'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { parseApiResponse, useAppContext } from '../../context/AppContext';
import AdminSidebar from '../_components/AdminSidebar';

const API = 'http://localhost:5000';

const formatCurrency = value =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value) || 0);

const formatDateTime = value => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
};

export default function AdminDepositsPage() {
  const router = useRouter();
  const { apiFetch } = useAppContext();

  const [actor, setActor] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Modal Approve
  const [approveTarget, setApproveTarget] = useState(null);
  const [approveBusy, setApproveBusy] = useState(false);

  // Modal Reject
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectBusy, setRejectBusy] = useState(false);

  // Kiểm tra quyền
  const role = actor?.vai_tro || actor?.role;
  const isQtv = role === 'qtv';
  const permissions = actor?.quyen || [];
  const canManageDeposits = isQtv || ['admin'].includes(role) || permissions.includes('deposits');

  // Lấy thông tin admin hiện tại
  useEffect(() => {
    let raw = null;
    if (typeof window !== 'undefined') {
      try {
        raw = JSON.parse(localStorage.getItem('user'));
      } catch {
        raw = null;
      }
    }
    if (!raw) {
      router.replace('/dang-nhap');
    } else {
      setActor(raw);
    }
  }, [router]);

  // Tải danh sách yêu cầu nạp tiền
  const loadDeposits = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      if (filterStatus !== 'all') queryParams.append('status', filterStatus);
      if (searchQuery.trim()) queryParams.append('q', searchQuery.trim());

      const res = await apiFetch(`${API}/api/admin/deposits?${queryParams.toString()}`, {}, actor);
      const data = await parseApiResponse(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể tải danh sách nạp tiền.');
      }
      setDeposits(data.data || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [actor, apiFetch, filterStatus, searchQuery]);

  useEffect(() => {
    if (actor && canManageDeposits) {
      loadDeposits();
    }
  }, [actor, canManageDeposits, loadDeposits]);

  // Thực hiện duyệt nạp tiền (Gọi backend với MySQL Transaction)
  const handleConfirmApprove = async () => {
    if (!approveTarget || approveBusy) return;
    setApproveBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await apiFetch(`${API}/api/admin/deposits/${approveTarget.id}/approve`, {
        method: 'POST',
      }, actor);
      const data = await parseApiResponse(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Lỗi khi duyệt nạp tiền.');
      }
      setNotice(data.message);
      setApproveTarget(null);
      loadDeposits();
    } catch (err) {
      setError(err.message);
    } finally {
      setApproveBusy(false);
    }
  };

  // Thực hiện từ chối yêu cầu nạp tiền
  const handleConfirmReject = async () => {
    if (!rejectTarget || rejectBusy) return;
    setRejectBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await apiFetch(`${API}/api/admin/deposits/${rejectTarget.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ly_do: rejectReason || 'Không nhận được tiền hoặc thông tin chuyển khoản không khớp' }),
      }, actor);
      const data = await parseApiResponse(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Lỗi khi từ chối yêu cầu.');
      }
      setNotice(data.message);
      setRejectTarget(null);
      setRejectReason('');
      loadDeposits();
    } catch (err) {
      setError(err.message);
    } finally {
      setRejectBusy(false);
    }
  };

  if (!actor) return <div className="account-loading">Đang kiểm tra quyền truy cập...</div>;

  if (!canManageDeposits) {
    return (
      <div className="account-admin">
        <AdminSidebar actor={actor} active="deposits" />
        <main className="account-main">
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <h2>Không có quyền truy cập</h2>
            <p>Tài khoản của bạn không được cấp quyền <strong>Quản lý nạp tiền</strong>.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="account-admin">
      <AdminSidebar actor={actor} active="deposits" />

      <main className="account-main">
        {/* Topbar */}
        <header className="account-topbar">
          <div>
            <span className="account-eyebrow">TÀI CHÍNH / VÍ TIỀN</span>
            <h1>Quản lý nạp tiền & Phê duyệt</h1>
          </div>
          <button 
            className="account-primary-button" 
            type="button" 
            onClick={loadDeposits} 
            disabled={loading}
          >
            {loading ? 'Đang tải...' : '🔄 Làm mới danh sách'}
          </button>
        </header>

        {notice && (
          <div style={{
            margin: '16px 0',
            padding: '12px 16px',
            background: '#ecfdf5',
            border: '1px solid #10b981',
            borderRadius: '8px',
            color: '#065f46',
            fontWeight: '600'
          }}>
            ✓ {notice}
          </div>
        )}

        {error && (
          <div style={{
            margin: '16px 0',
            padding: '12px 16px',
            background: '#fff3f1',
            border: '1px solid #f2c4bf',
            borderRadius: '8px',
            color: '#9b3428',
            fontWeight: '600'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── THỐNG KÊ NHANH (METRICS) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          margin: '20px 0'
        }}>
          <div style={{
            background: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid var(--border, #e5e7eb)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', fontWeight: '700' }}>
              Chờ duyệt
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d97706', marginTop: '6px' }}>
              {stats?.cho_duyet_count || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '4px' }}>
              Cần xử lý ngay
            </div>
          </div>

          <div style={{
            background: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid var(--border, #e5e7eb)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', fontWeight: '700' }}>
              Tổng tiền nạp thành công
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981', marginTop: '6px' }}>
              {formatCurrency(stats?.tong_tien_da_nap || 0)}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '4px' }}>
              {stats?.thanh_cong_count || 0} giao dịch hoàn tất
            </div>
          </div>

          <div style={{
            background: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid var(--border, #e5e7eb)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', fontWeight: '700' }}>
              Yêu cầu hôm nay
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#2563eb', marginTop: '6px' }}>
              {stats?.hom_nay_count || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#1d4ed8', marginTop: '4px' }}>
              Tính từ 00:00 hôm nay
            </div>
          </div>

          <div style={{
            background: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid var(--border, #e5e7eb)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', fontWeight: '700' }}>
              Đã từ chối
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ef4444', marginTop: '6px' }}>
              {stats?.that_bai_count || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '4px' }}>
              Sai cú pháp / Không nhận tiền
            </div>
          </div>
        </div>

        {/* ── BỘ LỌC & TÌM KIẾM ── */}
        <div style={{
          background: 'var(--surface, #ffffff)',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid var(--border, #e5e7eb)',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: 1 }}>
            <input
              type="text"
              placeholder="Tìm theo Mã GD, Tên khách hàng, Email, SĐT..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadDeposits()}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border, #d1d5db)',
                background: 'var(--input-bg, #ffffff)',
                color: 'var(--text, #111827)',
                minWidth: '280px',
                flex: 1,
                fontSize: '0.9rem'
              }}
            />
            <button
              type="button"
              onClick={loadDeposits}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid var(--primary, #176b50)',
                background: 'var(--primary, #176b50)',
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Tìm kiếm
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #6b7280)', fontWeight: '600' }}>Trạng thái:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border, #d1d5db)',
                background: 'var(--input-bg, #ffffff)',
                color: 'var(--text, #111827)',
                fontSize: '0.88rem',
                fontWeight: '600'
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="cho_duyet">⏳ Chờ duyệt ({stats?.cho_duyet_count || 0})</option>
              <option value="thanh_cong">✓ Thành công</option>
              <option value="that_bai">✕ Từ chối</option>
            </select>
          </div>
        </div>

        {/* ── BẢNG DANH SÁCH YÊU CẦU NẠP TIỀN ── */}
        <div style={{
          background: 'var(--surface, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--border, #e5e7eb)',
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
        }}>
          {deposits.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted, #9ca3af)' }}>
              <div style={{ fontSize: '42px', marginBottom: '8px' }}>📭</div>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>Không tìm thấy yêu cầu nạp tiền nào.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-deposit-table">
                <thead>
                  <tr>
                    <th>Mã giao dịch</th>
                    <th>Khách hàng</th>
                    <th style={{ textAlign: 'right' }}>Số tiền nạp</th>
                    <th>Phương thức</th>
                    <th>Thời gian tạo</th>
                    <th style={{ textAlign: 'center' }}>Trạng thái</th>
                    <th>Xử lý / Ghi chú</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map(deposit => {
                    const isPending = deposit.trang_thai === 'cho_duyet';
                    const isSuccess = deposit.trang_thai === 'thanh_cong';
                    return (
                      <tr 
                        key={deposit.id} 
                        className={isPending ? 'pending-row' : ''}
                      >
                        <td style={{ padding: '14px' }}>
                          <div className="admin-deposit-code">{deposit.ma_giao_dich}</div>
                          <div className="admin-deposit-sub" style={{ fontSize: '0.72rem', fontWeight: 'normal' }}>ID: #{deposit.id}</div>
                        </td>

                        <td style={{ padding: '14px' }}>
                          <div className="admin-deposit-user">{deposit.ho_ten}</div>
                          <div className="admin-deposit-sub" style={{ fontSize: '0.8rem' }}>{deposit.email}</div>
                          {deposit.so_dien_thoai && (
                            <div className="admin-deposit-sub" style={{ fontSize: '0.76rem' }}>SĐT: {deposit.so_dien_thoai}</div>
                          )}
                          <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '2px', fontWeight: '600' }}>
                            Số dư ví: <strong>{formatCurrency(deposit.so_du_hien_tai || 0)}</strong>
                          </div>
                        </td>

                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#10b981' }}>
                            +{formatCurrency(deposit.so_tien)}
                          </div>
                        </td>

                        <td style={{ padding: '14px' }}>
                          <span className="admin-deposit-method">
                            {deposit.phuong_thuc}
                          </span>
                        </td>

                        <td style={{ padding: '14px', fontSize: '0.82rem' }}>
                          <span className="admin-deposit-sub">{formatDateTime(deposit.created_at)}</span>
                        </td>

                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <span className={isPending ? 'admin-deposit-badge-pending' : isSuccess ? 'admin-deposit-badge-success' : 'admin-deposit-badge-failed'}>
                            {isPending ? '⏳ Chờ duyệt' : isSuccess ? '✓ Đã duyệt' : '✕ Từ chối'}
                          </span>
                        </td>

                        <td style={{ padding: '14px', fontSize: '0.82rem', maxWidth: '220px' }}>
                          {isSuccess && (
                            <div>
                              <div style={{ color: '#10b981', fontWeight: '600' }}>Duyệt bởi: {deposit.admin_duyet_ten || 'Admin'}</div>
                              <div className="admin-deposit-sub" style={{ fontSize: '0.75rem' }}>{formatDateTime(deposit.ngay_duyet)}</div>
                            </div>
                          )}
                          {!isSuccess && deposit.ghi_chu && (
                            <div className="admin-deposit-sub" style={{ overflowWrap: 'break-word' }}>
                              {deposit.ghi_chu}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          {isPending ? (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                type="button"
                                onClick={() => setApproveTarget(deposit)}
                                style={{
                                  background: '#10b981',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontWeight: '700',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer'
                                }}
                              >
                                ✓ Duyệt
                              </button>
                              <button
                                type="button"
                                onClick={() => { setRejectTarget(deposit); setRejectReason(''); }}
                                style={{
                                  background: '#ef4444',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  fontWeight: '700',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer'
                                }}
                              >
                                ✕ Từ chối
                              </button>
                            </div>
                          ) : (
                            <span className="admin-deposit-sub" style={{ fontSize: '0.8rem' }}>Hoàn tất</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── MODAL POPUP DUYỆT NẠP TIỀN (SỬ DỤNG TRANSACTION) ── */}
      {approveTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--surface, #ffffff)',
            color: 'var(--text, #111827)',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px 28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid var(--border, #e5e7eb)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', color: 'var(--text, #111827)', fontWeight: '800' }}>
              Xác nhận duyệt nạp tiền
            </h3>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted, #4b5563)', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              Hệ thống sẽ thực hiện <strong>Giao thức Transaction an toàn</strong>: khóa tài khoản, cộng số dư cho khách hàng và lưu lịch sử giao dịch.
            </p>

            <div style={{ background: 'var(--input-bg, #f9fafb)', borderRadius: '10px', padding: '16px', border: '1px solid var(--border, #e5e7eb)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted, #6b7280)' }}>Khách hàng:</span>
                <strong style={{ color: 'var(--text, #111827)' }}>{approveTarget.ho_ten} ({approveTarget.email})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted, #6b7280)' }}>Mã giao dịch:</span>
                <strong style={{ color: 'var(--text, #111827)' }}>{approveTarget.ma_giao_dich}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted, #6b7280)' }}>Số dư hiện tại:</span>
                <span style={{ fontWeight: '600', color: 'var(--text, #111827)' }}>{formatCurrency(approveTarget.so_du_hien_tai || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem' }}>
                <span style={{ color: '#10b981', fontWeight: '700' }}>Số tiền cộng vào ví:</span>
                <strong style={{ color: '#10b981', fontSize: '1.15rem' }}>+{formatCurrency(approveTarget.so_tien)}</strong>
              </div>
              <hr style={{ border: 'none', borderTop: '1px dashed var(--border, #d1d5db)', margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--text, #374151)', fontWeight: '700' }}>Số dư mới sau khi cộng:</span>
                <strong style={{ color: '#10b981', fontSize: '1.2rem' }}>
                  {formatCurrency((Number(approveTarget.so_du_hien_tai) || 0) + Number(approveTarget.so_tien))}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                disabled={approveBusy}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #d1d5db)',
                  background: 'var(--input-bg, #f3f4f6)',
                  color: 'var(--text, #374151)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={approveBusy}
                style={{
                  flex: 2,
                  padding: '11px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#10b981',
                  color: '#ffffff',
                  fontWeight: '700',
                  cursor: approveBusy ? 'wait' : 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                {approveBusy ? 'Đang xử lý Transaction...' : 'Xác nhận & Cộng tiền'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL POPUP TỪ CHỐI NẠP TIỀN ── */}
      {rejectTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--surface, #ffffff)',
            color: 'var(--text, #111827)',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px 28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid var(--border, #e5e7eb)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', color: '#ef4444', fontWeight: '800' }}>
              Từ chối yêu cầu nạp tiền
            </h3>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #4b5563)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Bạn đang từ chối giao dịch <strong style={{ color: 'var(--text, #111827)' }}>{rejectTarget.ma_giao_dich}</strong> ({formatCurrency(rejectTarget.so_tien)}) của <strong style={{ color: 'var(--text, #111827)' }}>{rejectTarget.ho_ten}</strong>.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text, #374151)', marginBottom: '6px' }}>
                Lý do từ chối (hiển thị cho khách hàng xem):
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="VD: Chưa nhận được tiền trong tài khoản MB Bank, hoặc sai mã giao dịch..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #d1d5db)',
                  background: 'var(--input-bg, #ffffff)',
                  color: 'var(--text, #111827)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                disabled={rejectBusy}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #d1d5db)',
                  background: 'var(--input-bg, #f3f4f6)',
                  color: 'var(--text, #374151)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejectBusy}
                style={{
                  flex: 2,
                  padding: '11px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontWeight: '700',
                  cursor: rejectBusy ? 'wait' : 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
              >
                {rejectBusy ? 'Đang cập nhật...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
