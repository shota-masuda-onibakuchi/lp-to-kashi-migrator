import hre, { waffle, ethers } from "hardhat";
import { expect, use } from "chai";
import { defaultAbiCoder, keccak256, recoverAddress, toUtf8Bytes } from "ethers/lib/utils";
import { getBentoBoxApproveDigest, getDomainSeparator, signMasterContractApproval } from "./signature";
import { Wallet } from "ethers";
import { IERC20, MigratorTest, IUniswapV2Pair, BentoBoxV1, KashiPairMediumRiskV1 } from "../typechain";

use(require("chai-bignumber")());

describe("setMasterContractApproval", async function () {
    const BENTO_BOX_ADDR = "0xF5BCE5077908a1b7370B9ae04AdC565EBd643966";
    let wallet: Wallet;
    let other: Wallet;

    let weth: IERC20;
    let token0: IERC20;
    let token1: IERC20;
    let migrator: MigratorTest;
    let pair: IUniswapV2Pair;
    let kashi0: KashiPairMediumRiskV1;
    let kashi1: KashiPairMediumRiskV1;
    let bentoBox;
    let Migrator;
    let BentoBox;
    let chainId;
    before(async function () {
        ({ chainId } = await ethers.provider.getNetwork());
        [wallet, other] = waffle.provider.getWallets();
        Migrator = await ethers.getContractFactory("MigratorTest");
        BentoBox = await ethers.getContractFactory("BentoBoxV1");
        console.log("chainId :>> ", chainId);
        console.log("wallet :>> ", wallet.address);
    });
    beforeEach(async function () {
        migrator = (await Migrator.deploy(
            "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f", // UNI_V2_FACTORY
            "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
        )) as MigratorTest;
        bentoBox = await BentoBox.deploy("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2");
    });

    it("setMasterContractApproval", async function () {
        const nonce = 0;
        const approved = true;
        const masterContract = bentoBox.address;
        expect(await bentoBox.nonces(wallet.address)).to.eq(nonce);
        expect(await bentoBox.DOMAIN_SEPARATOR()).to.eq(getDomainSeparator("BentoBox V1", bentoBox.address, chainId));
        const { v, r, s } = await signMasterContractApproval(
            // keccak256(toUtf8Bytes("BentoBox V1")),
            "BentoBox V1",
            chainId,
            masterContract,
            wallet.address,
            approved,
            wallet,
            nonce,
        );
        const digest = getBentoBoxApproveDigest(
            "BentoBox V1",
            masterContract,
            chainId,
            approved,
            wallet.address,
            nonce,
        );
        try {
            await bentoBox.setMasterContractApproval(wallet.address, masterContract, approved, v, r, s);
        } catch (e) {}
        //0x33001896c150c015b80ae03ee0d3ece898b9aab8

        expect(recoverAddress(digest, { v, r, s })).to.eq(wallet.address);
    });
    // it("setMasterContractApproval", async function () {
    //     const nonce = 0;
    //     const approved = true;
    //     const masterContract = await bentoBox.masterContractOf(kashi0.address);
    //     expect(await bentoBox.masterContractOf(kashi1.address)).to.eq(masterContract);
    //     expect(await bentoBox.nonces(wallet.address)).to.eq(nonce);
    //     const { v, r, s } = await signMasterContractApproval(
    //         keccak256(toUtf8Bytes("BentoBox V1")),
    //         // "BentoBox V1",
    //         1,
    //         masterContract,
    //         wallet.address,
    //         approved,
    //         wallet,
    //         nonce,
    //     );
    //     expect(await bentoBox.setMasterContractApproval(wallet.address, masterContract, approved, v, r, s));
    // });
});
