import "../styles/globals.css";
import Link from "next/link";

function MyApp({ Component, pageProps }) {
  return (
    <div>
      <nav className="flex flex-col items-center">
        <h1 className="text-5xl font-bold pt-8 pb-4">Crossroads</h1>
        <p className="italic">
          An NFT marketplace built for the odd ones
        </p>
        <div className="py-6">
          <Link href="/">
            <a className="mr-6 text-blue-600">Home</a>
          </Link>
          <Link href="/create-item">
            <a className="mr-6 text-blue-600">Sell NFT</a>
          </Link>
          <Link href="/my-nfts">
            <a className="mr-6 text-blue-600">My NFTs</a>
          </Link>
          <Link href="/dashboard">
            <a className="mr-6 text-blue-600">Dashboard</a>
          </Link>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
