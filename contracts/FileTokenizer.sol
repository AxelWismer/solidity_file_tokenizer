// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./StringUtils.sol";

/// @title File tokenizer contract
/// @author Axel Wismer
/// @notice With this contract you can save the hash (unique and irreversible code) 
/// of your files to establish your authorship and be able to verify that the files 
/// have not been altered.
contract FileToken {
    using StringUtils for string;

    /*
     * Events
     */
    event NewFile(uint256 fileId, string name, string _signature);

    /*
     * Blockchain data
     */
    uint256 public fileCount = 0;
    mapping(string => uint256) signatureToFile;
    mapping(uint256 => address) fileToOwner;
    mapping(address => uint256) ownerFileCount;

    /*
     * Modifiers
     */
    modifier signatureLength(string memory _signature) {
        require(_signature.strlen() == 64, "The signature must be 64 characters long");
        _;
    }

    /*
     * Transaccions
     */
    function createFile(string memory _name, string memory _signature)
        public
        signatureLength(_signature)
        returns (uint256)
    {
        // Verify that the signature is unique
        require(signatureToFile[_signature] == 0, "The signature already exists");
        // Create indexes
        // Ids start counting from 1 to simplify the verification of existence
        fileCount += 1;
        signatureToFile[_signature] = fileCount;
        fileToOwner[fileCount] = msg.sender;
        ownerFileCount[msg.sender] += 1;
        // Create a new event that stores the file name and its signature together.
        emit NewFile(fileCount, _name, _signature);
        return fileCount;
    }

    /*
     * Queries
     */
    function getFileId(string memory _signature) public view signatureLength(_signature) returns (uint256) {
        uint256 id = signatureToFile[_signature];
        require(id > 0, "There is no file with that signature");
        return id;
    }

    function getFileOwner(uint256 _id) public view returns (address) {
        require(_id > 0, "Invalid file id");
        address owner = fileToOwner[_id];
        require(owner != address(0), "There is no file with that id");
        return owner;
    }

    function getFileOwnerBySignature(string memory _signature) public view returns (address) {
        return getFileOwner(getFileId(_signature));
    }

    function getFilesByOwner(address _owner) external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](ownerFileCount[_owner]);
        uint256 counter = 0;
        for (uint256 i = 1; i <= fileCount; i++) {
            if (fileToOwner[i] == _owner) {
                result[counter] = i;
                counter++;
            }
        }
        return result;
    }
}
