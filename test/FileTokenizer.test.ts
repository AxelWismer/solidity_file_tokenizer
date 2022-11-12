import {ethers, waffle} from 'hardhat';
import chai from 'chai';

import FileTokenArtifact from '../artifacts/contracts/FileTokenizer.sol/FileToken.json';
import {FileToken} from '../typechain/FileToken';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';

const {deployContract} = waffle;
const {expect, should} = chai;

describe('FileTokenizer Contract', () => {
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  let fileToken: FileToken;

  beforeEach(async () => {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    fileToken = (await deployContract(owner, FileTokenArtifact)) as FileToken;
  });

  const name = 'Sales report';
  const signature = '19ca4f27c55c6912f88cf47d1ef1e0c2f097456a50cb882b9b49e8a244dadb58';
  const name2 = 'Marketing report';
  const signature2 = 'cd03d7b1d7f7ca51873b0078d52f0bba08896375078e74b3d3b98814460d7eca';
  const name3 = 'IT report';
  const signature3 = '3d7d563d3f83b1745d5c2cec3ee8e7d5aea141f0013a9c66551b6d8a95f211d7';
  
  const signatureLengthError = 'The signature must be 64 characters long'
  describe('createFile', () => {
    
    it('should create a new file', async () => {
      const tx = fileToken.connect(addr1).createFile(name, signature);
      await expect(tx).to.not.be.reverted;

      const fileId = await fileToken.getFileId(signature);
      expect(fileId).to.equal(1);
      await expect(tx).to.emit(fileToken, 'NewFile').withArgs(1, name, signature);
    });
    it('The signature must be 64 characters long', async () => {
      const tx = fileToken.connect(addr1).createFile(name, 'too short');
      const tx2 = fileToken.connect(addr1).createFile(name, 'too long' + signature);
      await expect(tx).to.be.revertedWith(signatureLengthError);
      await expect(tx2).to.be.revertedWith(signatureLengthError);
    });
    it('The signature already exists', async () => {
      const tx = fileToken.connect(addr1).createFile(name, signature);
      const tx2 = fileToken.connect(addr1).createFile(name, signature);
      await expect(tx).to.not.be.reverted;
      await expect(tx2).to.be.revertedWith('The signature already exists');
    });
    it('should create multiple files from the same owner', async () => {
      const tx = fileToken.connect(addr1).createFile(name, signature);
      const tx2 = fileToken.connect(addr1).createFile(name2, signature2);
      await expect(tx).to.not.be.reverted;
      await expect(tx2).to.not.be.reverted;
      // Tx
      const fileId = await fileToken.getFileId(signature);
      expect(fileId).to.equal(1);
      await expect(tx).to.emit(fileToken, 'NewFile').withArgs(fileId, name, signature);
      // Tx2
      const fileId2 = await fileToken.getFileId(signature2);
      expect(fileId2).to.equal(2);
      await expect(tx2).to.emit(fileToken, 'NewFile').withArgs(fileId2, name2, signature2);
    });
    it('should create multiple files from different owners', async () => {
      const tx = fileToken.connect(addr1).createFile(name, signature);
      const tx2 = fileToken.connect(addr2).createFile(name2, signature2);
      await expect(tx).to.not.be.reverted;
      await expect(tx2).to.not.be.reverted;
      // Tx
      const fileId = await fileToken.getFileId(signature);
      expect(fileId).to.equal(1);
      await expect(tx).to.emit(fileToken, 'NewFile').withArgs(fileId, name, signature);
      // Tx2
      const fileId2 = await fileToken.getFileId(signature2);
      expect(fileId2).to.equal(2);
      await expect(tx2).to.emit(fileToken, 'NewFile').withArgs(fileId2, name2, signature2);
    });
  });
  describe('getFileId', () => {
    it('There is no file with that signature', async () => {
      const tx = fileToken.getFileId(signature);
      await expect(tx).to.be.revertedWith('There is no file with that signature');
    });
    it('The signature must be 64 characters long', async () => {
      const tx = fileToken.getFileId('too short');
      const tx2 = fileToken.getFileId('too long' + signature);
      await expect(tx).to.be.revertedWith(signatureLengthError);
      await expect(tx2).to.be.revertedWith(signatureLengthError);
    });
  });
  describe('getFileOwner', () => {
    it('should return the owners adress', async () => {
      await fileToken.connect(addr1).createFile(name, signature);
      const fileOwner = await fileToken.getFileOwner(1);
      expect(fileOwner).to.be.equal(await addr1.getAddress());
    });
    it('There is no file with that id', async () => {
      const tx = fileToken.getFileOwner(1);
      await expect(tx).to.be.revertedWith('There is no file with that id');
    });
    it('Invalid file id', async () => {
      const tx = fileToken.getFileOwner(0);
      await expect(tx).to.be.revertedWith('Invalid file id');
    });
  });
  describe('getFileOwnerBySignature', () => {
    it('should return the owners adress', async () => {
      await fileToken.connect(addr1).createFile(name, signature);
      const fileOwner = await fileToken.getFileOwnerBySignature(signature);
      expect(fileOwner).to.be.equal(await addr1.getAddress());
    });
    it('There is no file with that id', async () => {
      const tx = fileToken.getFileOwnerBySignature(signature);
      await expect(tx).to.be.revertedWith('There is no file with that signature');
    });
    it('The signature must be 64 characters long', async () => {
      const tx = fileToken.getFileOwnerBySignature('too short');
      const tx2 = fileToken.getFileOwnerBySignature('too long' + signature);
      await expect(tx).to.be.revertedWith(signatureLengthError);
      await expect(tx2).to.be.revertedWith(signatureLengthError);
    });
  });
  describe('getFilesByOwner', () => {
    it("should return the IDs of the owner's files", async () => {
      await fileToken.connect(addr1).createFile(name, signature);
      await fileToken.connect(addr2).createFile(name2, signature2);
      await fileToken.connect(addr1).createFile(name3, signature3);
      const fileIds = await fileToken.getFilesByOwner(await addr1.getAddress());
      const fileIds2 = await fileToken.getFilesByOwner(await addr2.getAddress());
      expect(fileIds.map(bn => bn.toNumber())).to.be.eql([1,3]);
      expect(fileIds2.map(bn => bn.toNumber())).to.be.eql([2]);
    });
    it('should return nothing for a wallet that does not own files', async () => {
      const fileIds = await fileToken.getFilesByOwner(await addr1.getAddress());
      expect(fileIds).to.be.eql([]);
    });
  });
});
