import React from "react";

import { Grid, Link, Typography } from "@mui/material";

import RickleImage from "./../../assets/rickle_full_image.png";

function RickleFooter() {
  return (
    <>
      <Grid
        container
        sx={{ background: "#000000", py: 6, justifyContent: "center", px: 5 }}
      >
        <img
          src={RickleImage}
          alt=""
          style={{ width: "100%", maxWidth: 600, height: "auto" }}
        />
      </Grid>
      <Grid
        container
        sx={{ backgroundColor: "#BB1F16" }}
        justifyContent="center"
        py={1.5}
        px={2}
      >
        <Grid item gap={1} display={"flex"}>
          <Link
            sx={{ fontSize: "14px", fontWeight: "300", color: "white" }}
            href="https://www.rickletoken.com/ccpa-privacy-policy/"
            underline="none"
          >
            CCPA Privacy Policy (GDPR)
          </Link>
          <Typography
            sx={{ fontSize: "14px", fontWeight: "300", color: "white" }}
          >
            |
          </Typography>
          <Link
            sx={{ fontSize: "14px", fontWeight: "300", color: "white" }}
            href="https://www.rickletoken.com/data-privacy-policy-gdpr/"
            underline="none"
          >
            Data Privacy Policy (GDPR)
          </Link>
          <Typography
            sx={{ fontSize: "14px", fontWeight: "300", color: "white" }}
          >
            |
          </Typography>
          <Link
            sx={{ fontSize: "14px", fontWeight: "300", color: "white" }}
            href="https://www.rickletoken.com/terms-conditions/"
            underline="none"
          >
            Terms & Conditions
          </Link>
          <Typography
            sx={{ fontSize: "14px", fontWeight: "300", color: "white" }}
          >
            |
          </Typography>
          <Link
            sx={{ fontSize: "14px", fontWeight: "300", color: "white" }}
            href="https://www.rickletoken.com/privacy-policy-2/"
            underline="none"
          >
            Privacy Policy
          </Link>
        </Grid>
      </Grid>
      <Grid
        container
        sx={{ backgroundColor: "#BB1F16" }}
        justifyContent="center"
        py={0.5}
        px={2}
      >
        <Grid item gap={1} display={"flex"} pb={1.5}>
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: "300",
              color: "white",
              opacity: "0.7",
            }}
          >
            Rickle Token | Copyright &copy; 2022-2027 M.A.D. Computer Consulting LLC
            | All Rights Reserved
          </Typography>
        </Grid>
      </Grid>
    </>
  );
}

export default RickleFooter;
