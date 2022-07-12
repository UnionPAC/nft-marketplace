// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "hardhat/console.sol";

contract NFTMarketplace is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;

    uint256 listPrice = 0.025 ether;
    address payable owner;

    mapping(uint256 => MarketItem) private idToMarketItem;

    struct MarketItem {
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool isSold;
    }

    event MarketItemCreated(
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool isSold
    );

    constructor() ERC721("Crossroads Token", "CRT") {
        owner = payable(msg.sender);
    }

    // What are the functions we are going to need?
    // 1. Get the current list price
    function getListPrice() public view returns (uint256) {
        return listPrice;
    }

    // 2. Update the current list price
    function updateListPrice(uint256 _listPrice) public payable {
        require(owner == msg.sender, "Only owner can update the list price");
        listPrice = _listPrice;
    }

    // 3. Mint a token and list it in the marketplace
    function createToken(string memory tokenURI, uint256 price)
        public
        payable
        returns (uint256)
    {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        createMarketItem(newTokenId, price);
        return newTokenId;
    }

    function createMarketItem(uint256 tokenId, uint256 price) private {
        // require ...
        // price can't be zero
        // transaction value sent must equal the list price
        require(price > 0, "Price must be greater than zero");
        require(msg.value == listPrice, "Transaction must send the list price");

        // creating our market item
        idToMarketItem[tokenId] = MarketItem(
            tokenId,
            payable(msg.sender),
            payable(address(this)),
            price,
            false
        );

        // transfering ownership of token from seller to marketplace
        _transfer(msg.sender, address(this), tokenId);

        emit MarketItemCreated(
            tokenId,
            msg.sender,
            address(this),
            price,
            false
        );
    }

    // 4. Allow someone to resell a token they have purchased
    function resellToken(uint256 tokenId, uint256 price) public payable {
        // require ...
        // Only the item owner can resell the item
        // Transaction value must pass the list price
        require(
            idToMarketItem[tokenId].owner == msg.sender,
            "Only the item owner can call this function"
        );
        require(msg.value == listPrice, "Transcation must send the list price");

        // reset market item values
        idToMarketItem[tokenId].seller = payable(msg.sender);
        idToMarketItem[tokenId].owner = payable(address(this));
        idToMarketItem[tokenId].price = price;
        idToMarketItem[tokenId].isSold = false;

        // decrementing the total number of items sold
        _itemsSold.decrement();

        // transfering ownership of token from seller to marketplace
        _transfer(msg.sender, address(this), tokenId);
    }

    // 5. Create the sale of a marketplace item
    function createMarketSale(uint256 tokenId) public payable {
        uint256 price = idToMarketItem[tokenId].price;
        address seller = idToMarketItem[tokenId].seller;
        // require ...
        // transaction value must pass the price of the item (asking price)
        require(msg.value == price, "Submit asking price to complete purchase");
        idToMarketItem[tokenId].owner = payable(msg.sender);
        idToMarketItem[tokenId].isSold = true;
        // b/c there is no seller
        idToMarketItem[tokenId].seller = payable(address(0));
        _itemsSold.increment();
        // transfer NFT from marketplace to buyer
        _transfer(address(this), msg.sender, tokenId);
        // pay listing price
        payable(owner).transfer(listPrice);
        // transfer $ to seller
        payable(seller).transfer(msg.value);
    }

    // 6. Return all available (unsold) market items --> Homepage View
    function getAvailableItems() public view returns (MarketItem[] memory) {
        uint256 itemCount = _tokenIds.current();
        uint256 unsoldItemCount = _tokenIds.current() - _itemsSold.current();
        uint256 currentIndex = 0;

        MarketItem[] memory items = new MarketItem[](unsoldItemCount);

        for (uint256 i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].owner == address(this)) {
                uint256 currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    // 7. Return all items that ONLY a user has purchased (my tokens) --> My NFT's View
    function getMyNFTs() public view returns (MarketItem[] memory) {
        uint256 totalItemCount = _tokenIds.current();
        uint256 myItemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalItemCount; i++) {
            // if item is mine, add to item count
            if (idToMarketItem[i + 1].owner == msg.sender) {
                myItemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](myItemCount);

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                uint256 currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    // 8. Returns only items that a user has created/ listed (my creations) --> NFT's Created View
    function getCreatedNFTs() public view returns (MarketItem [] memory) {
        uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                uint currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex +=1;
            }
        }
        return items;
    }
}
