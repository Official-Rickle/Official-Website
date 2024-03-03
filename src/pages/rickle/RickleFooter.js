import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Grid, Link, Typography } from "@mui/material";

import RickleImage from "./../../assets/rickle_full_image.png";

function RickleFooter() {
  function scrollToTop() {
    document.body.scrollTop();
  }
  return (
    <React.Fragment>
      <Grid
        container
        sx={{ background: "#000000", py: 6, justifyContent: "center", px: 5 }}
      >
        <img
          src={RickleImage}
          alt=""
          style={{
            width: "100%",
            maxWidth: 600,
            height: "auto",
            animation: "spin 30s linear infinite"
          }}
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
            to="/terms-conditions"
            underline="none"
            component={RouterLink}
            onClick={() => scrollToTop()}
          >
            Terms & Conditions
          </Link>
          <Typography
            sx={{ fontSize: "14px", fontWeight: "300", color: "white" }}
          >
            |
          </Typography>

          <Typography
            sx={{ fontSize: "14px", fontWeight: "300", color: "white" }}
          >
            |
          </Typography>
          <Link
            sx={{ fontSize: "14px", fontWeight: "300", color: "white" }}
            to="/privacy-policy"
            underline="none"
            component={RouterLink}
            onClick={() => scrollToTop()}
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
              opacity: "0.7"
            }}
          >
            Rickle Token | Copyright &copy; 2022-2027 M.A.D. Computer Consulting
            LLC | All Rights Reserved
          </Typography>
        </Grid>
      </Grid>
    </React.Fragment>
  );
}

export default RickleFooter;
