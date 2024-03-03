import React from "react";

import { Button, Grid, Link, Paper, Tooltip, Typography } from "@mui/material";
import { ethers } from "ethers";

import RickleLogo from "./../../assets/rickle_token_small.png";
import RickleGray from "./../../assets/rickle_gray.png";
import img1 from "./../../assets/1.svg";
import img2 from "./../../assets/2.svg";
import img3 from "./../../assets/3.svg";
import img4 from "./../../assets/4.svg";
import img5 from "./../../assets/5.svg";
import img6 from "./../../assets/6.svg";
import EtherScan from "./../../assets/etherscan.svg";
import Matic from "./../../assets/polygon.svg";
import Binance from "./../../assets/binance.svg";
import Gnosis from "./../../assets/gnosis.svg";
import RickleToWallet from "./RickleToWallet";
import CryptoSwapDex from "./../../assets/CryptoSwapDex.png";
import YieldFields from "./../../assets/YieldFields.jpg";
const tokenAddress = {
  eth: "0x0ff80a1708191c0da8aa600fa487f7ac81d7818c",
  bsc: "0xeca15e1bbff172d545dd6325f3bae7b737906737",
  xdai: "0x2dF5912439d2D14d04a7742346508505288eF367",
  matic: "0x9fDC23fe295104Ac55fef09363c56451D0E37CFA",
  harmony: "0x32EB48b083acCe94d994CE885d9AB295c081f884"
};

const chainParams = {
  eth: {
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
    },
    rpcUrls: ["https://mainnet.infura.io/v3/"],
    blockExplorerUrls: ["https://etherscan.io/"]
  },
  bsc: {
    chainId: ethers.utils.hexlify(56),
    chainName: "Binance Smart Chain - Mainnet",
    nativeCurrency: {
      name: "Binance coin (Smart chain)",
      symbol: "BNB",
      decimals: 18
    },
    rpcUrls: ["https://bsc-dataseed.binance.org/"],
    blockExplorerUrls: ["https://bscscan.com/"]
  },
  xdai: {
    chainId: ethers.utils.hexlify(100),
    chainName: "xDai",
    nativeCurrency: {
      name: "xDai",
      symbol: "xDAI",
      decimals: 18
    },
    rpcUrls: ["https://rpc.xdaichain.com/"],
    blockExplorerUrls: ["https://blockscout.com/"]
  },
  matic: {
    chainId: ethers.utils.hexlify(137),
    chainName: "Matic Mainnet",
    nativeCurrency: {
      name: "Matic",
      symbol: "MATIC",
      decimals: 18
    },
    rpcUrls: ["https://rpc-mainnet.maticvigil.com/"],
    blockExplorerUrls: ["https://polygonscan.com/"]
  },
  harmony: {
    chainId: ethers.utils.hexlify(1666600000),
    chainName: "Harmony One Mainnet",
    nativeCurrency: {
      name: "Harmony One",
      symbol: "ONE",
      decimals: 18
    },
    rpcUrls: ["https://api.harmony.one/"],
    blockExplorerUrls: ["https://explorer.harmony.one/"]
  }
};

const ethExchangeCoin = [
  {
    e: "PancakeSwap",
    img: img1,
    link:
      "https://pancakeswap.finance/swap?outputCurrency=0x0ff80a1708191c0da8aa600fa487f7ac81d7818c"
  },
  {
    e: "SushiSwap",
    img: img2,
    link:
      "https://app.sushi.com/swap?outputCurrency=0x0ff80a1708191c0da8aa600fa487f7ac81d7818c&chainId=1"
  },
  {
    e: "Matcha",
    img: img3,
    link:
      "https://matcha.xyz/markets/1/0x0ff80a1708191c0da8aa600fa487f7ac81d7818c/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
  },
  {
    e: "UniSwap",
    img: img4,
    link:
      "https://app.uniswap.org/#/swap?chain=mainnet&outputCurrency=0x0ff80a1708191c0da8aa600fa487f7ac81d7818c"
  },
  {
    e: "ParaSwap",
    img: img5,
    link:
      "https://app.paraswap.io/#/?network=ethereum&outputCurrency=0x0ff80a1708191c0da8aa600fa487f7ac81d7818c"
  },
  {
    e: "1Inch",
    img: img6,
    link:
      "https://app.1inch.io/#/1/swap/ETH/0x0ff80a1708191c0da8aa600fa487f7ac81d7818c"
  }
];
const bscExchangeCoin = [
  {
    e: "YieldFields",
    img: YieldFields,
    link:
      "https://yieldfields.finance/swap?outputCurrency=0xeCa15e1BbFF172D545Dd6325F3Bae7b737906737"
  },
  {
    e: "CryptoSwapDex",
    img: CryptoSwapDex,
    link:
      "https://cryptoswapdex.com/swap?outputCurrency=0xeCa15e1BbFF172D545Dd6325F3Bae7b737906737"
  },
  {
    e: "PancakeSwap",
    img: img1,
    link:
      "https://pancakeswap.finance/swap?outputCurrency=0xeCa15e1BbFF172D545Dd6325F3Bae7b737906737&chainId=56"
  },
  {
    e: "SushiSwap",
    img: img2,
    link:
      "https://app.sushi.com/swap?outputCurrency=0xeCa15e1BbFF172D545Dd6325F3Bae7b737906737&chainId=56"
  },
  {
    e: "Matcha",
    img: img3,
    link:
      "https://matcha.xyz/markets/56/0xeca15e1bbff172d545dd6325f3bae7b737906737"
  },
  {
    e: "1Inch",
    img: img6,
    link:
      "https://app.1inch.io/#/56/swap/BNB/0xeCa15e1BbFF172D545Dd6325F3Bae7b737906737"
  }
];

const rickleData = [
  {
    link:
      "https://etherscan.io/token/0x0ff80a1708191c0da8aa600fa487f7ac81d7818c",
    img: EtherScan,
    text: "EtherScan"
  },
  {
    link:
      "https://blockscout.com/xdai/mainnet/address/0x2dF5912439d2D14d04a7742346508505288eF367",
    img: Gnosis,
    text: "Gnosis"
  },
  {
    link:
      "https://polygonscan.com/token/0x9fDC23fe295104Ac55fef09363c56451D0E37CFA",
    img: Matic,
    text: "Polygon"
  },
  {
    link:
      "https://bscscan.com/token/0xeca15e1bbff172d545dd6325f3bae7b737906737",
    img: Binance,
    text: "Binance"
  },
  {
    link:
      "https://explorer.harmony.one/address/0x32EB48b083acCe94d994CE885d9AB295c081f884",
    img: Gnosis,
    text: "Harmony One"
  }
];

function IntroduceRickle() {
  const [addError, setError] = React.useState(false);
  const [copyText, setCopyText] = React.useState(null);

  const addIconToWallet = async (network = "eth") => {
    const tokenSymbol = "rkl";
    const tokenDecimals = 18;
    const tokenImage =
      "data:image/png;base64,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";

    let ethereum = window.ethereum;

    // console.log(window.ethereum.chainId);
    const addTokenImage = async () => {
      return await ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20", // Initially only supports ERC20, but eventually more!
          options: {
            address: tokenAddress[network.toLowerCase()], // The address that the token is at.
            symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: tokenDecimals, // The number of decimals in the token
            image: tokenImage // A string url of the token logo
          }
        }
      });
    };

    const addNetworkToWallet = async () => {
      return await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [chainParams[network.toLowerCase()]]
      });
    };

    const switchWalletNetork = async () => {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainParams[network.toLowerCase()].chainId }]
      });
    };

    try {
      await addNetworkToWallet();
    } catch (error) {
      if (ethereum.chainId === chainParams[network.toLowerCase()].chainId) {
        await addTokenImage();
      } else
        try {
          await switchWalletNetork();
          window.confirm("Add this icon to your wallet?")
            ? await addTokenImage()
            : console.log("Sorry Couldn't add the Icon.");
        } catch (error) {}
    }
    return [true, "Thanks for your interest!"];
  };

  return (
    <React.Fragment>
      <Grid
        container
        sx={{ backgroundColor: "#000000" }}
        pl={{ xs: 0, lg: 20 }}
        pb={10}
      >
        <Grid
          item
          sm={6}
          xs={12}
          display="flex"
          flexDirection={"column"}
          justifyContent={"center"}
        >
          <Typography
            textAlign={{ xs: "center", lg: "start" }}
            className="gradient-text"
            sx={{ letterSpacing: "2px", fontSize: { xs: "40px", lg: "50px" } }}
            mt={5}
            mx={{ xs: 1, lg: 0 }}
          >
            INTRODUCING RICKLE
          </Typography>
          <Typography
            my={{ xs: 5, lg: 8 }}
            textAlign={{ xs: "center", lg: "start" }}
            sx={{
              color: "white",
              fontSize: "38px",
              fontWeight: "400",
              letterSpacing: "1.4px"
            }}
          >
            Trade Rickle On Multiple Networks
          </Typography>
          <Typography
            my={4}
            sx={{
              color: "white",
              fontSize: "20px",
              lineHeight: "28px",
              textAlign: "justify"
            }}
            pl={{ xs: 2, lg: 0 }}
            pr={{ xs: 2, lg: 20 }}
          >
            Rickle has partnered with M.A.D. Computer Consulting LLC to utilize
            Winston, a first of its kind Blockchain AI, which makes trading
            crypto currency easier and lighter on the wallet.
          </Typography>
          <Typography
            sx={{
              color: "white",
              fontSize: "20px",
              lineHeight: "28px",
              textAlign: "justify"
            }}
            pl={{ xs: 2, lg: 0 }}
            pr={{ xs: 2, lg: 20 }}
          >
            Through our relationship with Winston, Rickle can be swapped on many
            networks throughvarious bridges that make it easier to move around
            to the networks you utilize.
          </Typography>
          <Typography
            my={4}
            mt={3.5}
            sx={{
              color: "white",
              fontSize: "20px",
              lineHeight: "28px",
              textAlign: "justify"
            }}
            pl={{ xs: 2, lg: 0 }}
            pr={{ xs: 2, lg: 20 }}
          >
            In the past, if you used the Ethereum network it only made sense to
            swap large amounts of crypto because high gas fees add up so
            quickly. Who wants $100 worth of crypto when the gas fees cost you
            another $50? Let’s be honest, it can be difficult to get started in
            crypto, especially on the salary of a minimum wage job. Sky high gas
            fees are a huge barrier as well.
          </Typography>
          <Typography
            sx={{
              color: "white",
              fontSize: "20px",
              lineHeight: "28px",
              textAlign: "justify"
            }}
            pl={{ xs: 2, lg: 0 }}
            pr={{ xs: 2, lg: 20 }}
          >
            Enter Winston, your personal assistant to all things blockchain.
            Winston, who you can find in Rickle’s Discord server can assist you
            with many blockchain related tasks. With Winston you can trade, buy,
            and sell crypto without gas fees if you stay within the Winston
            network or you can use Rickle on Ethereum, Gnosis, Polygon, Binance
            or Harmony One!
          </Typography>
        </Grid>
        <Grid item sm={6} xs={12} display={{ xs: "block", lg: "block" }}>
          <img src={RickleGray} alt="" width={"100%"} />

          <Grid
            container
            justifyContent="center"
            pl={{ xs: 2, lg: 0 }}
            pr={{ xs: 2, lg: 0 }}
            my={10}
          >
            <Button
              onClick={addIconToWallet.bind(this, "eth")}
              sx={{
                marginBottom: "96px",
                borderRadius: "20px",
                background:
                  "linear-gradient(90deg, #851910 0%, #FB261E 52.53%, #E87465 100%)"
              }}
              variant="contained"
            >
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: "400",
                  px: 1.5,
                  py: 0.2,
                  letterSpacing: "2.1px"
                }}
              >
                ADD RICKLE TO YOUR WALLET
              </Typography>
            </Button>
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 1,
                  m: 3
                }}
              >
                {Object.keys(tokenAddress).map((k, i) =>
                  <Grid item key={i} display="flex" alignItems="center">
                    <img
                      src={RickleLogo}
                      alt={chainParams[k].chainName}
                      width="30px"
                    />
                    <Tooltip
                      disableFocusListener
                      disableTouchListener
                      title={
                        copyText === tokenAddress[k]
                          ? "Copied"
                          : "Click to copy"
                      }
                      placement="top"
                    >
                      <Typography
                        sx={{
                          fontSize: "16px",
                          fontWeight: "200",
                          letterSpacing: "0.2px",
                          pl: 1.5,
                          cursor: "pointer"
                        }}
                        onClick={() => {
                          navigator.clipboard.writeText(tokenAddress[k]);
                          setCopyText(tokenAddress[k]);
                          // console.log(tokenAddress[k]);
                        }}
                        noWrap
                      >
                        {tokenAddress[k]}
                      </Typography>
                    </Tooltip>
                  </Grid>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <div
        style={{
          height: "14px",
          width: "100%",
          background:
            "linear-gradient(90deg, #851910 0%, #FB261E 52.53%, #E87465 100%)"
        }}
      />

      <Grid container sx={{ background: "#000000" }} justifyContent="center">
        <Typography
          textAlign={{ xs: "center", lg: "start" }}
          className="gradient-text"
          sx={{ letterSpacing: "2px", fontSize: { xs: "40px", lg: "50px" } }}
          mt={5}
          mx={{ xs: 1, lg: 0 }}
        >
          Rickle ON Decentralized Exchanges
        </Typography>
      </Grid>

      <EthereumDeFiExchanges />

      <RickleOnBlockExplorers />

      <BinanceDeFiExchanges />

      <RickleToWallet addIconToWallet={addIconToWallet.bind(this)} />
    </React.Fragment>
  );
}

export default IntroduceRickle;
function BinanceDeFiExchanges() {
  return <Grid container sx={{ background: "#000000" }} justifyContent="center">
    <Paper
      elevation={0}
      sx={{ my: 5, px: 2.2, border: "7px solid #C121A4" }}
    >
      <Grid
        item
        container
        gap={7}
        alignItems="center"
        justifyContent="center"
        align="center"
        p={3}
      >
        <Grid item xs={12}>
          <Typography variant="h3" color="red">
            Binance DeFi Exchanges
          </Typography>
        </Grid>

        {bscExchangeCoin.map((item, index) => <Grid item key={index} gap={7} alignItems="center" p={1.5}>
          <Grid item gap={2} alignContent="center">
            <a href={item.link} target="_blank" rel="noreferrer">
              <img
                src={item.img}
                alt=""
                width={"60px"}
                style={{ cursor: "pointer" }} />
            </a>
          </Grid>
          <Grid item gap={3} alignItems="center" p={3}>
            {item.e}
          </Grid>
        </Grid>
        )}
      </Grid>
    </Paper>
  </Grid>;
}

function RickleOnBlockExplorers() {
  return <Grid
    py={5}
    container
    sx={{ background: "#000000" }}
    justifyContent="center"
  >
    <Grid
      item
      md={8}
      container
      mx={1}
      py={2}
      justifyContent="center"
      sx={{ border: "1px solid white", borderRadius: "20px", p: 3 }}
    >
      <Grid item xs={12} textAlign="center">
        <Typography variant="h6" color="red">
          Rickle on DeFi Block Explorers
        </Typography>
      </Grid>

      {rickleData.map((item, index) => {
        return (
          <Grid
            key={index}
            item
            xs={12}
            md={6}
            sm={4}
            lg={2}
            py={{ xs: 1, lg: 0 }}
          >
            <Link
              href={item.link}
              underline="none"
              target="_blank"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <img src={item.img} alt="" width={"20px"} />
              <Typography sx={{ color: "white", ml: 1 }}>
                {item.text}
              </Typography>
            </Link>
          </Grid>
        );
      })}
    </Grid>
  </Grid>;
}

function EthereumDeFiExchanges() {
  return <Grid container sx={{ background: "#000000" }} justifyContent="center">
    <Paper
      elevation={0}
      sx={{ my: 5, px: 2.2, border: "7px solid #C121A4" }}
    >
      <Grid
        item
        container
        gap={7}
        alignItems="center"
        justifyContent="center"
        align="center"
        p={3}
      >
        <Grid item xs={12}>
          <Typography variant="h3" color="red">
            Ethereum DeFi Exchanges
          </Typography>
        </Grid>
        {ethExchangeCoin.map((item, index) => <Grid item key={index} gap={7} alignItems="center" p={1.5}>
          <Grid item gap={2} alignContent="center">
            <a href={item.link} target="_blank" rel="noreferrer">
              <img
                src={item.img}
                alt=""
                width={"60px"}
                style={{ cursor: "pointer" }} />
            </a>
          </Grid>
          <Grid item gap={3} alignItems="center" p={3}>
            {item.e}
          </Grid>
        </Grid>
        )}
      </Grid>
    </Paper>
  </Grid>;
}

