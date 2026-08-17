import './globals.css';

export const metadata = {
  title: 'MOVIN — 출퇴근 AI 브리핑',
  description: '출퇴근길 1분, 업계 동향을 카드로 읽는다',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
