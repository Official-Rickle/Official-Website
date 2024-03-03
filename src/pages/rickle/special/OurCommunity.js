import React from "react";

import { Grid, Typography, Link } from "@mui/material";
export default function OurCommunity() {
  return (
    <React.Fragment>
      <Typography
        className="gradient-text"
        sx={{
          fontSize: { lg: "54px", md: "45px", xs: "34px" },
          textAlign: { xs: "center", md: "end" },
          my: { lg: 6, md: 4, xs: 3 }
        }}
      >
        OUR COMMUNITY
      </Typography>
      <Grid
        container
        justifyContent="center"
        alignContent="center"
        pr={{ xs: 0, md: "18px", lg: "30px" }}
        pb={{ xs: 5 }}
      >
        <Grid item xs={12} align="center">
          <iframe
            title="discord"
            src="https://discord.com/widget?id=897546129108008960&amp;theme=dark"
            width="350"
            height="74"
            style={{
              border: "none"
            }}
          />
        </Grid>

        <Grid item xs={12} align="center">
          <Link
            style={{
              "&:visited": {
                color: "black !important"
              },
              "&:focus": {
                color: "black !important"
              },
              "&:hover": {
                color: "black !important",
                fontWeight: "800 !important"
              },
              "&:active": {
                color: "black !important"
              },
              color: "black",
              textDecoration: "none",
              fontWeight: "600",
              padding: "3px 6px 3px 6px",
              marginTop: "13px",
              borderRadius: "6px",
              background:
                "linear-gradient(90deg, #851910 0%, #FB261E 52.53%, #E87465 100%)"
            }}
            href="https://discord.gg/rickle-897546129108008960"
          >
            Join Us
          </Link>
        </Grid>
      </Grid>
    </React.Fragment>
  );
}
