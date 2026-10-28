'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { parseApiResponse, useAppContext } from '../../context/AppContext';
import AdminSidebar from '../_components/AdminSidebar';

const API = 'http://localhost:5000';

const DEFAULT_ROLES = [
  { ma_role: 'qtv', ten_role: 'Quản trị viên cao nhất', quyen: ['products', 'orders', 'accounts', 'news', 'coupons', 'deposits'], is_system: 1 },
  { ma_role: 'admin', ten_role: 'Quản trị viên', quyen: ['products', 'orders', 'accounts', 'news', 'coupons', 'deposits'], is_system: 1 },
  { ma_role: 'nhan_su', ten_role: 'Nhân viên nhân sự', quyen: ['accounts'], is_system: 1 },
  { ma_role: 'nhan_vien_kho', ten_role: 'Nhân viên kho', quyen: ['products', 'orders', 'coupons'], is_system: 1 },
  { ma_role: 'nhan_vien', ten_role: 'Nhân viên', quyen: ['news'], is_system: 1 },
  { ma_role: 'khach_hang', ten_role: 'Khách hàng', quyen: [], is_system: 1 },
];

const PERMISSIONS = [
  { value: 'products', label: 'Quản lý sản phẩm', detail: 'Quản lý kho hàng, danh mục sản phẩm và đánh giá' },
  { value: 'coupons', label: 'Quản lý mã giảm giá', detail: 'Tạo mã voucher, thiết lập khuyến mãi và giới hạn sử dụng' },
  { value: 'orders', label: 'Quản lý đơn hàng', detail: 'Xem và xử lý đơn hàng, xuất hóa đơn, lịch sử giao dịch ví' },
  { value: 'deposits', label: 'Quản lý nạp tiền', detail: 'Xem yêu cầu nạp tiền, duyệt nạp tiền bằng Transaction và từ chối nạp tiền' },
  { value: 'accounts', label: 'Quản lý tài khoản', detail: 'Tạo tài khoản nhân viên, phân quyền và quản lý vai trò' },
  { value: 'news', label: 'Quản lý tin tức', detail: 'Đăng và chỉnh sửa bài viết tin tức' },
];

const emptyForm = {
  id: null,
  ho_ten: '',
  email: '',
  mat_khau: '',
  vai_tro: 'nhan_vien_kho',
  quyen: ['products', 'orders'],
};

export default function AccountManagementPage() {
  const router = useRouter();
  const { apiFetch } = useAppContext();
  const [actor, setActor] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [rolesList, setRolesList] = useState(DEFAULT_ROLES);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [createMode, setCreateMode] = useState('select_role'); // 'select_role' | 'new_role'
  const [newRoleData, setNewRoleData] = useState({ ten_role: '', ma_role: '', mo_ta: '' });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleSaving, setRoleSaving] = useState(false);
  const [error, setError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [notice, setNotice] = useState('');

  const isQtv = actor?.vai_tro === 'qtv';

  const roleNamesMap = Object.fromEntries(rolesList.map(r => [r.ma_role, r.ten_role]));

  // Lọc vai trò mà actor được quyền gán
  const availableRoles = isQtv
    ? rolesList
    : rolesList.filter(role => !['qtv', 'admin'].includes(role.ma_role));

  const fetchRoles = useCallback(async (currentActor) => {
    try {
      const res = await apiFetch(`${API}/api/admin/roles`, {}, currentActor);
      const resData = await parseApiResponse(res);
      if (res.ok && resData.success && Array.isArray(resData.data) && resData.data.length) {
        setRolesList(resData.data);
      }
    } catch {
      // Dùng fallback mặc định nếu chưa gọi được API
    }
  }, [apiFetch]);

  const fetchAccounts = useCallback(async (currentActor) => {
    try {
      const res = await apiFetch(`${API}/api/admin/view`, { method: 'POST' }, currentActor);
      const resData = await parseApiResponse(res);
      if (res.ok && resData.success) {
        setAccounts(resData.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || 'null');
      const role = stored?.vai_tro || stored?.role;
      if (!stored) {
        router.replace('/dang-nhap');
        return;
      }
      if (!['qtv', 'admin', 'nhan_su'].includes(role)) {
        router.replace('/admin/dashboard');
        return;
      }
      const act = { ...stored, vai_tro: role };
      setActor(act);
      fetchAccounts(act);
      fetchRoles(act);
    } catch {
      router.replace('/dang-nhap');
    }
  }, [router, fetchAccounts, fetchRoles]);

  const visibleAccounts = accounts.filter(account =>
    `${account.ho_ten} ${account.email} ${roleNamesMap[account.vai_tro] || account.vai_tro}`
      .toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))
  );

  const openCreate = () => {
    const defaultRole = isQtv ? 'admin' : 'nhan_vien_kho';
    const roleObj = rolesList.find(r => r.ma_role === defaultRole);
    setCreateMode('select_role');
    setNewRoleData({ ten_role: '', ma_role: '', mo_ta: '' });
    setForm({
      ...emptyForm,
      vai_tro: defaultRole,
      quyen: roleObj ? roleObj.quyen : ['products', 'orders'],
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = account => {
    const roleObj = rolesList.find(r => r.ma_role === account.vai_tro);
    const rolePermissions = roleObj ? roleObj.quyen : (account.quyen || []);
    setCreateMode('select_role');
    setForm({
      id: account.id,
      ho_ten: account.ho_ten,
      email: account.email,
      mat_khau: '',
      vai_tro: account.vai_tro,
      quyen: rolePermissions,
    });
    setError('');
    setIsModalOpen(true);
  };

  const changeRole = vai_tro => {
    const roleObj = rolesList.find(r => r.ma_role === vai_tro);
    setForm(current => ({
      ...current,
      vai_tro,
      quyen: roleObj ? roleObj.quyen : [],
    }));
  };

  const togglePermission = permission => {
    // Chỉ cho phép tích đổi quyền khi đang trong chế độ Tạo vai trò mới
    if (createMode !== 'new_role') return;
    setForm(current => ({
      ...current,
      quyen: current.quyen.includes(permission)
        ? current.quyen.filter(item => item !== permission)
        : [...current.quyen, permission],
    }));
  };

  const autoGenerateRoleKey = name => {
    const key = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    setNewRoleData(prev => ({ ...prev, ten_role: name, ma_role: key }));
  };

  const saveAccount = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const isEditing = Boolean(form.id);

      if (!isEditing && createMode === 'new_role') {
        if (!newRoleData.ten_role?.trim()) {
          throw new Error('Vui lòng nhập tên cho vai trò mới.');
        }
        if (!newRoleData.ma_role?.trim()) {
          throw new Error('Vui lòng nhập mã nhận diện cho vai trò mới.');
        }
      }

      const payload = isEditing
        ? {
            ho_ten: form.ho_ten,
            mat_khau: form.mat_khau || undefined,
            vai_tro: form.vai_tro,
          }
        : createMode === 'new_role'
        ? {
            ho_ten: form.ho_ten,
            email: form.email,
            mat_khau: form.mat_khau,
            new_role: newRoleData,
            quyen: form.quyen,
          }
        : {
            ho_ten: form.ho_ten,
            email: form.email,
            mat_khau: form.mat_khau,
            vai_tro: form.vai_tro,
          };

      const response = await apiFetch(
        isEditing ? `${API}/api/admin/${form.id}/edit` : `${API}/api/admin`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        actor
      );
      const data = await parseApiResponse(response);
      if (!response.ok || !data.success) throw new Error(data.message || 'Không thể lưu tài khoản.');
      
      setNotice(isEditing ? 'Đã cập nhật thông tin tài khoản!' : 'Đã tạo tài khoản mới thành công!');
      setIsModalOpen(false);
      await fetchAccounts(actor);
      await fetchRoles(actor);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Quản lý / Sửa quyền vai trò
  const openRoleManager = () => {
    setRoleError('');
    setEditingRole(null);
    setIsRoleModalOpen(true);
  };

  const selectRoleToEdit = role => {
    setRoleError('');
    setEditingRole({
      ...role,
      quyen: Array.isArray(role.quyen) ? [...role.quyen] : []
    });
  };

  const toggleRolePermission = permission => {
    if (!editingRole || editingRole.ma_role === 'qtv') return;
    setEditingRole(prev => ({
      ...prev,
      quyen: prev.quyen.includes(permission)
        ? prev.quyen.filter(p => p !== permission)
        : [...prev.quyen, permission]
    }));
  };

  const saveRoleEdit = async () => {
    if (!editingRole) return;
    setRoleSaving(true);
    setRoleError('');
    try {
      const response = await apiFetch(
        `${API}/api/admin/roles/${editingRole.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ten_role: editingRole.ten_role,
            quyen: editingRole.quyen,
            mo_ta: editingRole.mo_ta
          })
        },
        actor
      );
      const data = await parseApiResponse(response);
      if (!response.ok || !data.success) throw new Error(data.message || 'Không thể cập nhật quyền vai trò.');

      setNotice(`Đã cập nhật thành công quyền hạn cho vai trò "${editingRole.ten_role}"!`);
      setEditingRole(null);
      await fetchRoles(actor);
      await fetchAccounts(actor);
    } catch (err) {
      setRoleError(err.message);
    } finally {
      setRoleSaving(false);
    }
  };

  if (!actor) return <div className="account-loading">Đang kiểm tra quyền truy cập...</div>;

  return (
    <div className="account-admin">
      <AdminSidebar actor={actor} active="accounts" />

      <main className="account-main">
        <header className="account-topbar">
          <div>
            <span className="account-eyebrow">HỆ THỐNG / NHÂN SỰ</span>
            <h1>Quản lý tài khoản & Phân quyền</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="account-secondary-button"
              type="button"
              onClick={openRoleManager}
              title="Quản lý và điều chỉnh quyền của từng vai trò"
            >
              Sửa quyền vai trò
            </button>
            <button className="account-primary-button" type="button" onClick={openCreate}>
              Thêm tài khoản
            </button>
          </div>
        </header>

        <section className="account-intro">
          <div>
            <strong>{accounts.length}</strong>
            <span>Tài khoản trong phạm vi quản lý</span>
          </div>
          <p>
            {isQtv
              ? 'Quản trị viên cao nhất luôn sở hữu toàn bộ quyền hạn tối cao, có thể tạo và phân quyền vai trò.'
              : 'Nhân sự chỉ quản lý các tài khoản nhân viên theo vai trò được phân công.'}
          </p>
        </section>

        {notice && (
          <div className="account-notice" role="status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>
        )}
        {error && !isModalOpen && !isRoleModalOpen && (
          <div className="account-error" role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>
        )}

        <section className="account-table-section" aria-label="Danh sách tài khoản">
          <div className="account-table-toolbar">
            <h2>Danh sách tài khoản</h2>
            <label className="account-search">
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Tìm tên, email, vai trò..."
                aria-label="Tìm tài khoản"
              />
            </label>
          </div>
          <div className="account-table-scroll">
            <table className="account-table">
              <thead>
                <tr>
                  <th>NHÂN VIÊN</th>
                  <th>VAI TRÒ</th>
                  <th>QUYỀN CHỨC NĂNG</th>
                  <th>TRẠNG THÁI</th>
                  <th><span className="visually-hidden">Thao tác</span></th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td className="account-empty" colSpan="5">Đang tải danh sách...</td></tr> : null}
                {!loading && visibleAccounts.map(account => {
                  const roleObj = rolesList.find(r => r.ma_role === account.vai_tro);
                  const effectivePermissions = account.vai_tro === 'qtv'
                    ? PERMISSIONS.map(p => p.value)
                    : (roleObj?.quyen || account.quyen || []);

                  return (
                    <tr key={account.id}>
                      <td>
                        <div className="account-person">
                          <span className="account-row-avatar">{account.ho_ten?.slice(0, 1)}</span>
                          <span>
                            <strong>{account.ho_ten}</strong>
                            <small>{account.email}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`account-role role-${account.vai_tro}`}>
                          {roleNamesMap[account.vai_tro] || account.vai_tro}
                        </span>
                      </td>
                      <td>
                        <div className="account-permission-list">
                          {account.vai_tro === 'qtv' ? (
                            <span style={{ background: '#fef3c7', color: '#92400e', fontWeight: 700, border: '1px solid #fde68a' }}>
                              Toàn quyền tối cao
                            </span>
                          ) : effectivePermissions.length > 0 ? (
                            effectivePermissions.map(permission => (
                              <span key={permission}>
                                {PERMISSIONS.find(item => item.value === permission)?.label || permission}
                              </span>
                            ))
                          ) : (
                            <span className="permission-none">Chưa cấp quyền</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`account-status ${Number(account.trang_thai) === 0 ? 'inactive' : ''}`}>
                          <i />
                          {Number(account.trang_thai) === 0 ? 'Đã khóa' : 'Hoạt động'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="account-edit-button"
                          type="button"
                          onClick={() => openEdit(account)}
                          aria-label={`Sửa ${account.ho_ten}`}
                        >
                          Sửa
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!loading && visibleAccounts.length === 0 && (
                  <tr><td className="account-empty" colSpan="5">Không tìm thấy tài khoản phù hợp.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ─── MODAL TẠO & SỬA TÀI KHOẢN ─── */}
      {isModalOpen && (
        <div className="account-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setIsModalOpen(false); }}>
          <section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-modal-title">
            <header className="account-modal-header">
              <div>
                <span className="account-eyebrow">HỒ SƠ NHÂN SỰ</span>
                <h2 id="account-modal-title">{form.id ? 'Cập nhật tài khoản' : 'Tạo tài khoản mới'}</h2>
              </div>
              <button type="button" className="account-close" onClick={() => setIsModalOpen(false)} aria-label="Đóng">×</button>
            </header>

            <form onSubmit={saveAccount}>
              <div className="account-form-grid">
                <label className="account-field account-field-wide">
                  <span>Họ và tên</span>
                  <input
                    required
                    value={form.ho_ten}
                    onChange={event => setForm({ ...form, ho_ten: event.target.value })}
                    autoComplete="name"
                    placeholder="VD: Nguyễn Văn A"
                  />
                </label>

                <label className="account-field account-field-wide">
                  <span>Email đăng nhập</span>
                  <input
                    required
                    type="email"
                    value={form.email}
                    disabled={Boolean(form.id)}
                    onChange={event => setForm({ ...form, email: event.target.value })}
                    autoComplete="email"
                    placeholder="nhanvien@ktshop.vn"
                  />
                </label>

                <label className="account-field account-field-wide">
                  <span>{form.id ? 'Mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu khởi tạo'}</span>
                  <input
                    type="password"
                    required={!form.id}
                    minLength="8"
                    value={form.mat_khau}
                    onChange={event => setForm({ ...form, mat_khau: event.target.value })}
                    autoComplete="new-password"
                    placeholder="Tối thiểu 8 ký tự"
                  />
                  <small>Tối thiểu 8 ký tự an toàn.</small>
                </label>

                {/* Khi TẠO MỚI tài khoản: Cho phép CHỌN ROLE CÓ SẴN hoặc TẠO ROLE MỚI */}
                {!form.id && (
                  <div className="account-field account-field-wide" style={{ marginTop: '6px' }}>
                    <span style={{ marginBottom: '8px', display: 'block' }}>Thiết lập vai trò:</span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.86rem', fontWeight: 600 }}>
                        <input
                          type="radio"
                          name="create_role_mode"
                          checked={createMode === 'select_role'}
                          onChange={() => {
                            setCreateMode('select_role');
                            const defaultRole = isQtv ? 'admin' : 'nhan_vien_kho';
                            const roleObj = rolesList.find(r => r.ma_role === defaultRole);
                            setForm(prev => ({
                              ...prev,
                              vai_tro: defaultRole,
                              quyen: roleObj ? roleObj.quyen : ['products', 'orders']
                            }));
                          }}
                        />
                        Chọn vai trò có sẵn
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.86rem', fontWeight: 600 }}>
                        <input
                          type="radio"
                          name="create_role_mode"
                          checked={createMode === 'new_role'}
                          onChange={() => {
                            setCreateMode('new_role');
                            setForm(prev => ({ ...prev, quyen: ['products', 'orders'] }));
                          }}
                        />
                        Tạo vai trò mới & Cấp quyền
                      </label>
                    </div>
                  </div>
                )}

                {/* Chế độ 1: Chọn vai trò có sẵn (hoặc khi đang sửa tài khoản) */}
                {(form.id || createMode === 'select_role') && (
                  <label className="account-field account-field-wide">
                    <span>Chọn vai trò</span>
                    <select
                      value={form.vai_tro}
                      onChange={event => changeRole(event.target.value)}
                    >
                      {availableRoles.map(role => (
                        <option key={role.ma_role} value={role.ma_role}>
                          {role.ten_role}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {/* Chế độ 2: Tạo vai trò mới ngay trong form */}
                {!form.id && createMode === 'new_role' && (
                  <>
                    <label className="account-field">
                      <span>Tên vai trò mới <b style={{ color: '#ef4444' }}>*</b></span>
                      <input
                        required
                        value={newRoleData.ten_role}
                        onChange={e => autoGenerateRoleKey(e.target.value)}
                        placeholder="VD: Kỹ thuật viên bảo hành"
                      />
                    </label>
                    <label className="account-field">
                      <span>Mã vai trò (code) <b style={{ color: '#ef4444' }}>*</b></span>
                      <input
                        required
                        value={newRoleData.ma_role}
                        onChange={e => setNewRoleData({ ...newRoleData, ma_role: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                        placeholder="VD: ky_thuat_vien"
                      />
                    </label>
                  </>
                )}
              </div>

              {/* KHỐI QUYỀN HẠN: CHỈ SỬA ĐƯỢC KHI TẠO ROLE MỚI */}
              <div className="account-permissions-heading" style={{ marginTop: '20px' }}>
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Quyền chức năng
                    {createMode === 'new_role' && !form.id ? (
                      <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                        Được phép tích chọn quyền cho vai trò mới
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                        Cố định theo vai trò (chỉ sửa tại &quot;Sửa quyền vai trò&quot;)
                      </span>
                    )}
                  </h3>
                  <p>
                    {createMode === 'new_role' && !form.id
                      ? 'Chọn các quyền chức năng muốn cấp cho vai trò mới này.'
                      : 'Khi chọn vai trò có sẵn, quyền được khóa cố định theo vai trò. Để sửa quyền của vai trò này, hãy vào mục "Sửa quyền vai trò".'}
                  </p>
                </div>
                <span>{form.quyen.length}/{PERMISSIONS.length}</span>
              </div>

              <div className="account-permission-options">
                {PERMISSIONS.map(permission => {
                  const isChecked = form.vai_tro === 'qtv' || form.quyen.includes(permission.value);
                  const isLocked = form.id || createMode !== 'new_role';

                  return (
                    <label
                      className={`account-permission-option ${isLocked ? 'locked' : ''}`}
                      key={permission.value}
                      style={{
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        opacity: isLocked && !isChecked ? 0.6 : 1,
                        background: isChecked ? 'rgba(23, 107, 80, 0.05)' : undefined
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isLocked}
                        onChange={() => togglePermission(permission.value)}
                      />
                      <span>
                        <strong>{permission.label}</strong>
                        <small>{permission.detail}</small>
                      </span>
                    </label>
                  );
                })}
              </div>

              {error && <p className="account-error" role="alert" style={{ marginTop: '14px' }}>{error}</p>}

              <footer className="account-modal-actions">
                <button className="account-secondary-button" type="button" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button className="account-primary-button" type="submit" disabled={saving}>
                  {saving ? 'Đang lưu...' : form.id ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* ─── MODAL SỬA QUYỀN VAI TRÒ (ROLE MANAGEMENT) ─── */}
      {isRoleModalOpen && (
        <div className="account-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setIsRoleModalOpen(false); }}>
          <section className="account-modal" style={{ width: 'min(780px, 100%)' }} role="dialog" aria-modal="true" aria-labelledby="role-modal-title">
            <header className="account-modal-header">
              <div>
                <span className="account-eyebrow">HỆ THỐNG / VAI TRÒ</span>
                <h2 id="role-modal-title">Quản lý & Sửa quyền Vai trò</h2>
              </div>
              <button type="button" className="account-close" onClick={() => setIsRoleModalOpen(false)} aria-label="Đóng">×</button>
            </header>

            {roleError && <p className="account-error" role="alert" style={{ marginBottom: '16px' }}>{roleError}</p>}

            {!editingRole ? (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--admin-muted)', marginBottom: '16px' }}>
                  Danh sách vai trò và quyền hạn tương ứng trong hệ thống. Nhấp vào <strong>Sửa quyền</strong> để cập nhật phạm vi truy cập cho toàn bộ tài khoản thuộc vai trò đó.
                </p>

                <div style={{ display: 'grid', gap: '12px' }}>
                  {rolesList.map(r => (
                    <div
                      key={r.ma_role}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        border: '1px solid var(--admin-border)',
                        borderRadius: '6px',
                        background: 'var(--surface)',
                        gap: '12px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '0.95rem' }}>{r.ten_role}</strong>
                          <code style={{ fontSize: '0.74rem', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px' }}>
                            {r.ma_role}
                          </code>
                          {r.ma_role === 'qtv' && (
                            <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              Toàn quyền tối cao
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                          {r.ma_role === 'qtv' ? (
                            <span style={{ fontSize: '0.72rem', color: '#15803d' }}>Tất cả chức năng hiện tại và các tính năng mở rộng trong tương lai</span>
                          ) : (r.quyen || []).length > 0 ? (
                            (r.quyen || []).map(p => (
                              <span
                                key={p}
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: 'var(--bg)',
                                  border: '1px solid var(--border)'
                                }}
                              >
                                {PERMISSIONS.find(item => item.value === p)?.label || p}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--admin-muted)' }}>Không có quyền quản trị</span>
                          )}
                        </div>
                      </div>

                      {r.ma_role !== 'qtv' && (
                        <button
                          type="button"
                          className="account-edit-button"
                          onClick={() => selectRoleToEdit(r)}
                        >
                          Sửa quyền
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <footer className="account-modal-actions" style={{ marginTop: '24px' }}>
                  <button className="account-secondary-button" type="button" onClick={() => setIsRoleModalOpen(false)}>
                    Đóng
                  </button>
                </footer>
              </div>
            ) : (
              <div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: '6px', marginBottom: '18px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.92rem', color: '#166534' }}>
                    Chỉnh sửa quyền cho vai trò: <strong>{editingRole.ten_role}</strong> ({editingRole.ma_role})
                  </h3>
                  <small style={{ color: '#15803d' }}>
                    Thay đổi quyền tại đây sẽ tự động cập nhật ngay lập tức cho tất cả nhân viên thuộc vai trò này.
                  </small>
                </div>

                <label className="account-field" style={{ marginBottom: '16px' }}>
                  <span>Tên hiển thị vai trò</span>
                  <input
                    value={editingRole.ten_role}
                    onChange={e => setEditingRole({ ...editingRole, ten_role: e.target.value })}
                  />
                </label>

                <div className="account-permissions-heading">
                  <div>
                    <h3>Chọn quyền chức năng được cấp</h3>
                    <p>Tích chọn các quyền mà vai trò này được phép truy cập.</p>
                  </div>
                  <span>{editingRole.quyen.length}/{PERMISSIONS.length}</span>
                </div>

                <div className="account-permission-options">
                  {PERMISSIONS.map(permission => {
                    const isChecked = editingRole.quyen.includes(permission.value);
                    return (
                      <label
                        className="account-permission-option"
                        key={permission.value}
                        style={{ cursor: 'pointer', background: isChecked ? 'rgba(23, 107, 80, 0.05)' : undefined }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRolePermission(permission.value)}
                        />
                        <span>
                          <strong>{permission.label}</strong>
                          <small>{permission.detail}</small>
                        </span>
                      </label>
                    );
                  })}
                </div>

                <footer className="account-modal-actions" style={{ marginTop: '24px' }}>
                  <button className="account-secondary-button" type="button" onClick={() => setEditingRole(null)}>
                    Quay lại danh sách
                  </button>
                  <button className="account-primary-button" type="button" onClick={saveRoleEdit} disabled={roleSaving}>
                    {roleSaving ? 'Đang lưu quyền...' : 'Lưu quyền vai trò'}
                  </button>
                </footer>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}