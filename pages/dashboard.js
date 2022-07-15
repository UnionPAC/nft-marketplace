import { ethers } from "ethers";
import { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import axios from "axios";
import Link from "next/link";

// contract address
import { nftmarketaddress } from "../config";

// abi
import NFTMarketplace from "../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json";

// The dashboard will allow users to view all of the items they have listed (contract method --> getCreatedNFTs)
export default function Dashboard() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);

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
    const data = await contract.getCreatedNFTs();
    console.log(data);

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
        };
        return item;
      })
    );
    setNfts(items);
    setLoading(false);
  };

  if (!loading && !nfts.length) {
    return (
      <div className="flex flex-col items-center mt-20">
        <h3 className="text-xl font-semibold p-4">
          You haven't created any NFTs yet 🙈
        </h3>
        <p className="italic">
          Create your first NFT{" "}
          <Link href="/create-item">
            <span className="text-blue-500">here</span>
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 flex flex-col items-center">
        <h2 className="text-2xl py-2 font-semibold mb-5">
          Dashboard: My Creations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pt-4 mx-6">
          {nfts.map((nft, i) => (
            <div key={i} className="border shadow rounded-xl overflow-hidden">
              <div style={{ maxWidth: "400px" }}>
                <img src={nft.image} style={{ height: "100%" }} />
              </div>

              <div className="bg-slate-800 p-4">
                <p className="text-lg text-white">
                  <span className="italic mr-3 font-semibold text-base">
                    List Price:
                  </span>
                  {nft.price} MATIC
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
