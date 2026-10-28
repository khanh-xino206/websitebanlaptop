import ErrorDisplay from './components/ErrorDisplay';

export const metadata = {
  title: '404 - Không tìm thấy trang | KTSHOP',
  description: 'Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển sang địa chỉ mới.',
};

export default function NotFound() {
  return <ErrorDisplay code={404} />;
}
