import { useState } from "react";
import { ethers } from "ethers";
import { create } from "ipfs-http-client";
import { useRouter } from "next/router";
import Web3Modal from "web3modal";

const client = create({ url: "https://ipfs.infura.io:5001/api/v0" });

// contract address
import { nftmarketaddress } from "../config";

// abi
import NFTMarketplace from "../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json";

// What do we need to do?
// 1. Have the user be able to upload and save files to IPFS
// 2. Have the user be able to create a new NFT
// 3. The user is able to set metadata and price of the item and list it for sale on the marketplace

// note: after the user creates and lists an item, they should be re-routed back to the main page to view all of the items for sale

export default function CreateItem() {
  // what state do we need to keep?
  // 1. a way to store the file url and set the file url
  // 2. a way to store the form input and set the form input
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, setFormInput] = useState({
    price: "",
    name: "",
    description: "",
  });

  const router = useRouter();

  const onChange = async (e) => {
    const file = e.target.files[0];
    try {
      const addedFile = await client.add(file, {
        progress: (prog) => console.log(`receiving ... ${prog}`),
      });
      const url = `https://ipfs.infura.io/ipfs/${addedFile.path}`;
      console.log(url);
      setFileUrl(url);
    } catch (error) {
      console.log(error);
    }
  };

  // create an item and save it to IPFS
  const uploadToIPFS = async () => {
    const { name, description, price } = formInput;
    // make sure no input field is left blank
    if (!name || !description || !price || !fileUrl) return;

    // upload metadata to IPFS first
    const data = JSON.stringify({
      name,
      description,
      image: fileUrl,
    });

    try {
      const addedFile = await client.add(data);
      const url = `https://ipfs.infura.io/ipfs/${addedFile.path}`;
      return url;
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  };

  // list the item for sale
  const listNFTForSale = async () => {
    // get a reference to the NFT metadata
    const url = await uploadToIPFS();

    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    // Create the NFT
    const price = ethers.utils.parseUnits(formInput.price, "ether");
    let contract = new ethers.Contract(
      nftmarketaddress,
      NFTMarketplace.abi,
      signer
    );
    let listPrice = await contract.getListPrice();
    listPrice = listPrice.toString();
    let tx = await contract.createToken(url, price, { value: listPrice });
    await tx.wait();

    // re-route back to homepage
    router.push("/");
  };

  // form structure ...

  // Name
  // Description
  // Price
  // Upload File
  // Image File Preview
  // Create NFT (button)

  return (
    <div className="flex flex-col items-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input
          type="text"
          name="Name"
          placeholder="Asset Name"
          className="mt-8 border rounded p-4"
          onChange={(e) => setFormInput({ ...formInput, name: e.target.value })}
        />
        <textarea
          name="Description"
          placeholder="Asset Description"
          className="mt-8 border rounded p-4"
          onChange={(e) =>
            setFormInput({ ...formInput, description: e.target.value })
          }
        ></textarea>
        <input
          name="Price"
          type="number"
          placeholder="Price (in MATIC)"
          className="mt-8 border rounded p-4"
          onChange={(e) =>
            setFormInput({ ...formInput, price: e.target.value })
          }
        />
        <input type="file" name="Asset" className="my-4" onChange={onChange} />
        {fileUrl && (
          <img src={fileUrl} width="350px" className="rounded mt-4 mx-auto" />
        )}
        <button
          onClick={listNFTForSale}
          className="font-bold mt-4 bg-blue-600 text-white rounded p-4 shadow-lg"
        >
          Create NFT
        </button>
      </div>
    </div>
  );
}
