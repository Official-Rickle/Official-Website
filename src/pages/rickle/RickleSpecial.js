import React from "react";

import { Grid, Typography } from "@mui/material";
import OurCommunity from "./special/OurCommunity";
import Rickle from "./../../assets/rickle.png";
import RickleImage from "./../../assets/rickle_full_image.png";
import BottomRadiusBlack from "./../../assets/bottom_radius.png";

export default function RickleSpecial() {
  return (
    <>
      <Grid
        container
        sx={{
          background: "#000000",
        }}
      >
        <Grid item md={6} xs={12} display={{ xs: "none", md: "block" }}>
          <img
            src={Rickle}
            alt=""
            style={{
              width: "100%",
              height: "auto",
            }}
          />
        </Grid>
        <Grid
          item
          md={6}
          xs={12}
          display={{ xs: "block", md: "none" }}
          px={3}
          pt={3}
        >
          <img
            src={RickleImage}
            alt=""
            style={{
              width: "100%",
              height: "auto",
            }}
          />
        </Grid>
        <Grid
          item
          md={6}
          xs={12}
          justifyContent={{ xs: "start", md: "right" }}
          pr={{ md: 6, xs: 0 }}
        >
          <Typography
            className="gradient-text"
            sx={{
              fontSize: { lg: "54px", md: "45px", xs: "34px" },
              textAlign: { xs: "center", md: "end" },
              my: { lg: 6, md: 4, xs: 3 },
            }}
          >
            WHAT MAKES RICKLE SPECIAL
          </Typography>
          <Typography
            sx={{
              textAlign: { xs: "justify", md: "end" },
              px: { xs: 3, md: 0 },
            }}
            color="white"
          >
            Rickle is able to provide a vehicle for people to learn about
            blockchain features like faucets, staking, wallets, NFT’s, smart
            contracts, and many other decentralized financial tools and terms.
            Through our relationship with Winston, Rickle is available to
            essentially anyone with an internet connection, these banking
            services which were previously unavailable to a large percent of the
            planet are now within reach. Rickle’s partnership with Winston
            allows us to provide innovative, next generation services and help
            build the future of decentralized finance.
          </Typography>
          <OurCommunity />
        </Grid>
        <RedDivider />
      </Grid>
      <BlackDivider />
    </>
  );
}
function RedDivider() {
  return (
    <div
      style={{
        height: "14px",
        width: "100%",
        background:
          "linear-gradient(90deg, #851910 0%, #FB261E 52.53%, #E87465 100%)",
      }}
    ></div>);
}
function BlackDivider() {
  return <Grid container>
    <img
      src={BottomRadiusBlack}
      alt=""
      style={{ width: "100%", height: "auto" }} />
  </Grid>;
}

