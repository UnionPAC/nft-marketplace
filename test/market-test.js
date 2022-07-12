const { ethers } = require("hardhat");

describe("NFTMarketplace", function () {
  it("Should create and execute market sales", async function () {
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    const nftMarketplace = await NFTMarketplace.deploy();
    await nftMarketplace.deployed();

    let listPrice = await nftMarketplace.getListPrice();
    listPrice = listPrice.toString();
    console.log(listPrice);

    const auctionPrice = ethers.utils.parseUnits("1", "ether");

    // create two tokens
    await nftMarketplace.createToken(
      "https://www.mytokenlocation.com",
      auctionPrice,
      { value: listPrice }
    );
    await nftMarketplace.createToken(
      "https://www.mytokenlocation.com2",
      auctionPrice,
      { value: listPrice }
    );

    const [_, buyerAddress] = await ethers.getSigners();

    // execute sale of token to another user
    await nftMarketplace
      .connect(buyerAddress)
      .createMarketSale(1, { value: auctionPrice });
      console.log("Bought by: ", buyerAddress.address);

    // resell a token
    await nftMarketplace
      .connect(buyerAddress)
      .resellToken(1, auctionPrice, { value: listPrice });
      console.log("Sold by: ", buyerAddress.address)

    // query for and return the unsold items
    items = await nftMarketplace.getAvailableItems();
    items = await Promise.all(
      items.map(async (i) => {
        const tokenUri = await nftMarketplace.tokenURI(i.tokenId);
        let item = {
          price: i.price.toString(),
          tokenId: i.tokenId.toString(),
          seller: i.seller,
          owner: i.owner,
          tokenUri,
        };
        return item;
      })
    );
    console.log("items: ", items);
  });
});
