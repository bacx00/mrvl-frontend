import 'bootstrap/dist/css/bootstrap.min.css';
import NavBar from '../components/NavBar';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <NavBar />
      <div className="container mt-4">
        <Component {...pageProps} />
      </div>
    </>
  );
}

export default MyApp;