import dynamic from 'next/dynamic';

const HomePage = dynamic(() => import('../components/LauncherForm'), {
  ssr: false,
});

export default HomePage;
