import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import axios from "axios";
import Web3Modal from "web3modal";

// contract addy
import { nftmarketaddress } from "../config";

// abi
import NFTMarketplace from "../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json";

export default function ResellNFT() {
  const [formInput, setFormInput] = useState({ price: "", image: "" });
  const router = useRouter();
  const { id, tokenURI } = router.query;
  const { image, price } = formInput;

  useEffect(() => {
    fetchNFT();
  }, [id]);

  const fetchNFT = async () => {
    if (!tokenURI) return;
    const meta = await axios.get(tokenURI);
    setFormInput({ ...state, image: meta.data.image });
  };

  const listNFTForSale = async () => {
    if (!price) return;
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const formattedPrice = ethers.utils.parseUnits(formInput.price, "ether");
    let contract = new ethers.Contract(
      nftmarketaddress,
      NFTMarketplace.abi,
      signer
    );
    let listPrice = await contract.getListPrice();
    listPrice = listPrice.toString();
    let tx = await contract.resellToken(id, formattedPrice, {
      value: listPrice,
    });
    await tx.wait();
    router.push("/");
  };

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input
          type="number"
          placeholder="Price in MATIC"
          className="mt-2 border rounded p-4"
          onChange={(e) =>
            setFormInput({ ...formInput, price: e.target.value })
          }
        />
        {image && <img src={image} className="rounded mt-4" width="350px" />}
        <button
          onClick={listNFTForSale}
          className="font-bold mt-4 bg-blue-400 text-white rounded p-4 shadow-lg"
        >
          List NFT
        </button>
      </div>
    </div>
  );
}
