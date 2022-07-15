import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";

// contract addy
import { nftmarketaddress } from "../config";

// abi
import NFTMarketplace from "../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json";

export default function Home() {
  // what state are we going to need?
  // 1. dispaly available nfts and set those nfts
  // 2. loading

  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    setLoading(true);
    // create generic provider and call our contract for available nfts
    const provider = new ethers.providers.JsonRpcProvider("https://rpc-mainnet.maticvigil.com");
    const contract = new ethers.Contract(
      nftmarketaddress,
      NFTMarketplace.abi,
      provider
    );
    const data = await contract.getAvailableItems();

    // map over returned items and format them in a more useable way
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
          // metadata
          name: meta.data.name,
          image: meta.data.image,
          description: meta.data.description,
        };
        return item;
      })
    );
    setNfts(items);
    setLoading(false);
  };

  const buyNFT = async (nft) => {
    setLoading(true);
    // use web3  provider to connect to user in order to sign transactions
    // get connection using web3modal connect
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      nftmarketaddress,
      NFTMarketplace.abi,
      signer
    );

    const price = ethers.utils.parseUnits(nft.price.toString(), "ether");
    const tx = await contract.createMarketSale(nft.tokenId, { value: price });
    await tx.wait();
    loadNFTs();
    setLoading(false);
  };

  // if not loading and there are no nft items, return 'No items in marketplace'
  if (!loading && !nfts.length) {
    return (
      <div className="flex flex-col items-center mt-20">
        <p className="text-xl font-semibold p-4">No items in marketplace 🙁</p>
        <p className="text-sm">
          Check back soon or{" "}
          <a className="italic text-blue-500" href="/create-nft">
            list an item
          </a>{" "}
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
              className="border shadow rounded-lg overflow-hidden bg-slate-800 flex flex-col justify-end"
            >
              <div style={{ maxWidth: "400px" }}>
                <img src={nft.image} style={{ height: "100%" }} />
              </div>

              <div className="p-4">
                <p
                  style={{ height: "50px" }}
                  className="text-2xl font-semibold text-white"
                >
                  {nft.name}
                </p>
                <div style={{ overflow: "hidden" }}>
                  <p className="text-white/90 text-sm">{nft.description}</p>
                </div>
              </div>
              <div className="p-4 ">
                <p className="text-white pb-2 text-base font-bold">Price</p>
                <p className="text-white italic">{nft.price} MATIC</p>

                <button
                  className="mt-4 w-full bg-white text-black py-2 px-12 rounded font-semibold"
                  onClick={() => buyNFT(nft)}
                >
                  Buy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
