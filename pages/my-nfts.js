import { ethers } from "ethers";
import { useState, useEffect } from "react";
import axios from "axios";
import Web3Modal from "web3modal";
import { useRouter } from "next/router";
import Link from "next/link";

// contract address
import { nftmarketaddress } from "../config";

// abi
import NFTMarketplace from "../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json";

export default function MyNFTs() {
  // what state do we need to keep?
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    setLoading(true);
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = new ethers.Contract(
      nftmarketaddress,
      NFTMarketplace.abi,
      signer
    );

    const data = await contract.getMyNFTs();
    const items = await Promise.all(
      data.map(async (i) => {
        const tokenUri = await contract.tokenURI(i.tokenId);
        const meta = await axios.get(tokenUri);
        let price = ethers.utils.formatUnits(i.price.toString(), "ether");
        let item = {
          price,
          tokenId: i.tokenId.toNumber(),
          seller: i.seller,
          owner: i.owner,
          image: meta.data.image,
          tokenUri,
        };
        return item;
      })
    );
    setNfts(items);
    setLoading(false);
  };

  // (function) resell NFT
  const listNFT = (nft) => {
    router.push(`resell-nft?id=${nft.tokenId}&tokenURI=${nft.tokenURI}`);
  };

  if (!loading && !nfts.length) {
    return (
      <div className="flex flex-col items-center mt-20">
        <h3 className="text-xl font-semibold p-4">You don't own any NFTs yet 😢</h3>
        <p className="italic">
          Check out the{" "}
          <Link href="/">
            <a className="text-blue-500">homepage</a>
          </Link>{" "}
          to discover cool NFTs to purchase!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-10">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pt-4">
          {nfts.map((nft, i) => (
            <div
              key={i}
              className="border shadow rounded-lg overflow-hidden bg-slate-800"
            >
              <img src={nft.image} />

              <div className="p-4 flex flex-col">
                <p className="text-white">
                  <span className="italic mr-2 font-semibold">
                    Purchased for:
                  </span>{" "}
                  {nft.price} MATIC
                </p>
                {/* List NFT for sale button (resell) */}
                <button
                  className="mt-4 w-full bg-white text-black py-2 px-12 rounded italic"
                  onClick={() => listNFT(nft)}
                >
                  List NFT for sale
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
