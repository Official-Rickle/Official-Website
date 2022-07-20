import React from "react";

import { Container, Grid, Typography } from "@mui/material";

import MultipleRickle from "./../../assets/multiple_rickle.png";

function TeamCommunity() {
  return (
    <Container>
      <Grid container>
        <Grid
          item
          md={8}
          display="flex"
          flexDirection={"column"}
          justifyContent="center"
        >
          <Typography
            sx={{
              fontSize: "50px",
              fontWeight: "400",
              letterSpacing: "1.4px",
              textAlign: { xs: "center", md: "inherit" },
              mt: { xs: 2, md: 0 },
            }}
          >
            Our Team
          </Typography>
          <Typography
            className="gradient-text"
            sx={{
              fontSize: "50px",
              fontWeight: "600",
              my: 2,
              mb: 4,
              letterSpacing: "2px",
              textAlign: { xs: "center", md: "inherit" },
            }}
          >
            The Community
          </Typography>
          <Typography
            sx={{
              fontSize: "25px",
              fontWeight: "400",
              lineHeight: "34px",
              pr: { xs: 3, md: "70px" },
              pl: { xs: 2, md: 0 },
              textAlign: { xs: "justify", md: "inherit" },
              mb: 5,
            }}
          >
            Rickle is a community built to bring decentralized finance to the
            common person. Rickle is a token used to reward our community and
            deployed “cross chain” on many of the other popular blockchain
            networks.
          </Typography>
        </Grid>
        <Grid item md={4} display={{ xs: "none", md: "block" }}>
          <img
            src={MultipleRickle}
            alt=""
            style={{ width: "100%", height: "auto" }}
          />
        </Grid>
      </Grid>
    </Container>
  );
}

export default TeamCommunity;
