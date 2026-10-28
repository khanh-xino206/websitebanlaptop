'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

const API = 'http://localhost:5000';
const API_ERROR_LABELS = {
    400: ['Dữ liệu chưa hợp lệ', 'Kiểm tra lại thông tin vừa nhập.'],
    401: ['Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại để tiếp tục.'],
    403: ['Không có quyền truy cập', 'Tài khoản hiện tại không được phép thực hiện thao tác này.'],
    404: ['Không tìm thấy dữ liệu', 'Nội dung bạn cần có thể đã bị xóa hoặc không còn tồn tại.'],
    409: ['Dữ liệu bị trùng hoặc xung đột', 'Hãy kiểm tra lại thông tin và thử lại.'],
    422: ['Không thể xử lý dữ liệu', 'Một số thông tin chưa đáp ứng yêu cầu.'],
    429: ['Bạn thao tác quá nhanh', 'Vui lòng đợi một chút rồi thử lại.'],
    500: ['Máy chủ gặp lỗi', 'Hệ thống chưa thể xử lý yêu cầu lúc này.'],
    502: ['Máy chủ tạm thời không phản hồi', 'Vui lòng thử lại sau ít phút.'],
    503: ['Dịch vụ tạm thời không khả dụng', 'Vui lòng thử lại sau ít phút.'],
};

const getApiErrorLabel = status => API_ERROR_LABELS[status]
    || (status >= 500 ? ['Lỗi máy chủ', 'Vui lòng thử lại sau ít phút.'] : ['Yêu cầu chưa hoàn tất', 'Vui lòng thử lại.']);

const readLocalCart = () => {
    try {
        const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
        return Array.isArray(storedCart) ? storedCart : [];
    } catch {
        return [];
    }
};

export const parseApiResponse = async (response) => {
    const body = await response.text();
    try {
        return body ? JSON.parse(body) : {};
    } catch {
        return { success: false, message: body || 'Phản hồi không hợp lệ từ máy chủ.' };
    }
};

const AppContext = createContext();

export function AppProvider({ children }) {
    const [user, setUser] = useState(null);
    const [cart, setCart] = useState([]);
    const [theme, setTheme] = useState('light'); // 'light' | 'dark'
    const [apiError, setApiError] = useState(null);
    const refreshRequestRef = useRef(null);
    const initializationStartedRef = useRef(false);
    const apiErrorIdRef = useRef(0);

    const reportApiError = useCallback(async response => {
        const [title, fallbackMessage] = getApiErrorLabel(response.status);
        let message = fallbackMessage;
        try {
            const body = await response.clone().json();
            if (typeof body.message === 'string' && body.message.trim()) message = body.message;
        } catch { }
        apiErrorIdRef.current += 1;
        setApiError({ id: apiErrorIdRef.current, status: response.status, title, message });
    }, []);

    const reportNetworkError = useCallback(() => {
        apiErrorIdRef.current += 1;
        setApiError({
            id: apiErrorIdRef.current,
            status: null,
            title: 'Không kết nối được máy chủ',
            message: 'Kiểm tra kết nối mạng hoặc thử lại sau.',
        });
    }, []);

    const dismissApiError = useCallback(() => setApiError(null), []);

    useEffect(() => {
        if (!apiError) return undefined;
        const timeoutId = window.setTimeout(() => setApiError(null), 7000);
        return () => window.clearTimeout(timeoutId);
    }, [apiError]);

    // ─── Apply theme lên body & favicon ─────────────────────────
    const applyFavicon = (mode) => {
        if (typeof document === 'undefined') return;
        let link = document.querySelector("link[rel*='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.type = 'image/svg+xml';
        link.href = mode === 'dark' ? '/moon-favicon.svg' : '/sun-favicon.svg';
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        queueMicrotask(() => setTheme(savedTheme));
        if (savedTheme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
        applyFavicon(savedTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            const next = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', next);
            if (next === 'dark') {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
            applyFavicon(next);
            return next;
        });
    }, []);

    const refreshAccessToken = useCallback(async (sessionUser) => {
        if (!sessionUser?.refreshToken) return null;
        if (refreshRequestRef.current) return refreshRequestRef.current;

        refreshRequestRef.current = (async () => {
            try {
                const response = await fetch(`${API}/api/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: sessionUser.refreshToken }),
                });
                const data = await parseApiResponse(response);
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('user');
                    setUser(null);
                    return null;
                }
                if (!response.ok || !data.success || !data.data?.accessToken) return null;

                let storedUser = sessionUser;
                try {
                    storedUser = JSON.parse(localStorage.getItem('user') || 'null') || sessionUser;
                } catch { }
                const updatedUser = { ...sessionUser, ...storedUser, accessToken: data.data.accessToken };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                return updatedUser;
            } catch {
                return null;
            } finally {
                refreshRequestRef.current = null;
            }
        })();

        return refreshRequestRef.current;
    }, []);

    const fetchWithAuth = useCallback(async (url, options = {}, sessionUser) => {
        let activeUser = sessionUser;
        try {
            const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
            if (storedUser?.refreshToken === sessionUser?.refreshToken) activeUser = storedUser;
        } catch { }

        const sendRequest = (token) => fetch(url, {
            ...options,
            headers: { ...options.headers, Authorization: `Bearer ${token}` },
        });
        let response;
        try {
            response = await sendRequest(activeUser?.accessToken);
        } catch (error) {
            reportNetworkError();
            throw error;
        }
        if (response.status === 401) {
            const refreshedUser = await refreshAccessToken(activeUser);
            if (refreshedUser) {
                try {
                    response = await sendRequest(refreshedUser.accessToken);
                } catch (error) {
                    reportNetworkError();
                    throw error;
                }
            }
        }
        if (!response.ok) await reportApiError(response);
        return response;
    }, [refreshAccessToken, reportApiError, reportNetworkError]);

    const apiFetch = useCallback((url, options = {}, sessionUser) => {
        let activeUser = sessionUser;
        if (!activeUser) {
            try {
                activeUser = JSON.parse(localStorage.getItem('user') || 'null');
            } catch { }
        }
        if (activeUser?.accessToken) return fetchWithAuth(url, options, activeUser);
        return fetch(url, options).then(async response => {
            if (!response.ok) await reportApiError(response);
            return response;
        }).catch(error => {
            reportNetworkError();
            throw error;
        });
    }, [fetchWithAuth, reportApiError, reportNetworkError]);

    // ─── Fetch Cart từ server ───────────────────────────────
    const fetchCart = useCallback(async (sessionUser) => {
        try {
            const res = await apiFetch(`${API}/api/cart`, {}, sessionUser);
            const data = await parseApiResponse(res);
            if (res.ok && data.success) {
                setCart(data.data.map(item => ({
                    laptop_id: item.laptop_id,
                    so_luong: item.so_luong,
                    ten_laptop: item.ten_laptop,
                    gia_ban: Number(item.gia_ban),
                    url_anh: item.url_anh
                })));
            } else {
                throw new Error(data.message || 'Không thể tải giỏ hàng.');
            }
        } catch (err) {
            console.error('Không thể kết nối server để lấy giỏ hàng:', err.message);
        }
    }, [apiFetch]);

    // ─── Load dữ liệu khởi tạo ─────────────────────────────
    useEffect(() => {
        if (initializationStartedRef.current) return;
        initializationStartedRef.current = true;

        const storedUser = localStorage.getItem('user');
        let parsedUser = null;
        if (storedUser) {
            try { parsedUser = JSON.parse(storedUser); } catch (e) { }
        }

        if (parsedUser && parsedUser.accessToken) {
            queueMicrotask(() => setUser(parsedUser));

            // Fetch profile mới nhất (cập nhật balance, thông tin cá nhân)
            apiFetch(`${API}/api/auth/me`, {}, parsedUser)
            .then(async res => ({ res, data: await parseApiResponse(res) }))
            .then(({ res, data }) => {
                if (res.ok && data.success) {
                    // Giữ lại prefs từ localStorage (defaultPayment, v.v.)
                    const localPrefs = JSON.parse(localStorage.getItem('userPrefs') || '{}');
                    const latestUser = JSON.parse(localStorage.getItem('user') || 'null') || parsedUser;
                    const newUser = {
                        ...parsedUser,
                        ...localPrefs,
                        ...data.data,
                        accessToken: latestUser.accessToken,
                        refreshToken: latestUser.refreshToken,
                        balance: Number(data.data.balance)
                    };
                    setUser(newUser);
                    localStorage.setItem('user', JSON.stringify(newUser));
                }
            })
            .catch(err => console.error('Không thể tải profile:', err.message));

            // Merge giỏ hàng local vào DB
            const localCart = readLocalCart();
            if (localCart.length > 0) {
                apiFetch(`${API}/api/cart/sync`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ cart: localCart })
                })
                .then(async res => ({ res, data: await parseApiResponse(res) }))
                .then(({ res, data }) => {
                    if (!res.ok || !data.success) throw new Error(data.message || 'Không thể đồng bộ giỏ hàng.');
                    localStorage.removeItem('cart');
                    const latestUser = JSON.parse(localStorage.getItem('user') || 'null') || parsedUser;
                    fetchCart(latestUser);
                })
                .catch(err => {
                    console.error('Không thể sync giỏ hàng:', err.message);
                    setCart(localCart);
                });
            } else {
                queueMicrotask(() => fetchCart(parsedUser));
            }
        } else {
            const localCart = readLocalCart();
            queueMicrotask(() => setCart(localCart));
        }
    }, [apiFetch, fetchCart]);

    // ─── Cập nhật preferences người dùng ───────────────────
    const updateUserPrefs = useCallback((prefs) => {
        setUser(prev => {
            if (!prev) return prev;
            const updated = { ...prev, ...prefs };
            localStorage.setItem('user', JSON.stringify(updated));
            // Lưu riêng prefs để merge khi fetch lại từ server
            const existingPrefs = JSON.parse(localStorage.getItem('userPrefs') || '{}');
            localStorage.setItem('userPrefs', JSON.stringify({ ...existingPrefs, ...prefs }));
            return updated;
        });
    }, []);

    // ─── Thêm vào giỏ hàng ─────────────────────────────────
    const addToCart = useCallback(async (product) => {
        if (user && user.accessToken) {
            try {
                const res = await apiFetch(`${API}/api/cart/update`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ laptop_id: product.id, so_luong: 1 })
                }, user);
                const data = await parseApiResponse(res);
                if (res.ok && data.success) fetchCart(user);
            } catch (err) {
                console.error('Không thể thêm vào giỏ:', err.message);
            }
        } else {
            setCart(prev => {
                const existing = prev.some(item => item.laptop_id === product.id);
                const newCart = existing
                    ? prev.map(item => item.laptop_id === product.id ? { ...item, so_luong: item.so_luong + 1 } : item)
                    : [...prev, {
                        laptop_id: product.id,
                        so_luong: 1,
                        ten_laptop: product.ten_laptop,
                        gia_ban: Number(product.gia_ban),
                        url_anh: product.url_anh
                    }];
                localStorage.setItem('cart', JSON.stringify(newCart));
                return newCart;
            });
        }
    }, [user, fetchCart, apiFetch]);

    // ─── Cập nhật số lượng / xoá sản phẩm ─────────────────
    const updateCart = useCallback(async (laptop_id, so_luong) => {
        if (user && user.accessToken) {
            try {
                const res = await apiFetch(`${API}/api/cart/update`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ laptop_id, so_luong })
                }, user);
                const data = await parseApiResponse(res);
                if (res.ok && data.success) fetchCart(user);
            } catch (err) {
                console.error('Không thể cập nhật giỏ:', err.message);
            }
        } else {
            setCart(prev => {
                let newCart = so_luong <= 0
                    ? prev.filter(i => i.laptop_id !== laptop_id)
                    : prev.map(i => i.laptop_id === laptop_id ? { ...i, so_luong } : i);
                localStorage.setItem('cart', JSON.stringify(newCart));
                return newCart;
            });
        }
    }, [user, fetchCart, apiFetch]);

    return (
        <AppContext.Provider value={{ user, setUser, cart, setCart, addToCart, updateCart, fetchCart, apiFetch, theme, toggleTheme, updateUserPrefs }}>
            {children}
            {apiError && <aside className={`api-error-toast toast-${apiError.status || 'net'}`} role="alert" aria-live="assertive">
                <div className="api-error-code">{apiError.status || 'NET'}</div>
                <div className="api-error-copy">
                    <strong>{apiError.title}</strong>
                    <span>{apiError.message}</span>
                </div>
                <div className="api-error-actions">
                    {apiError.status === 401 ? (
                        <Link href="/dang-nhap" className="api-error-action-btn" onClick={dismissApiError}>
                            Đăng nhập
                        </Link>
                    ) : (
                        <Link href={`/loi?code=${apiError.status || 'net'}`} className="api-error-action-btn" onClick={dismissApiError}>
                            Chi tiết
                        </Link>
                    )}
                    <button type="button" onClick={dismissApiError} aria-label="Đóng thông báo lỗi">×</button>
                </div>
            </aside>}
        </AppContext.Provider>
    );
}

export const useAppContext = () => useContext(AppContext);
