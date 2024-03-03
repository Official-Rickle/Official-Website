import React from "react";

import {  Grid, Typography } from "@mui/material";
import RickleSpecial from "../rickle/RickleSpecial";

import MultipleRickle from "./../../assets/multiple_rickle.png";
import WhiteCurve from "./../../assets/white_black_curve.png";

export default function RickleForPeople() {
  return (
    <React.Fragment>
      <RickleSpecial />
      <Grid container p={3}>
        <Grid
          item
          md={8}
          display="flex"
          flexDirection={"column"}
          justifyContent="center"
          
        >
          <Typography
            className="gradient-text"
            sx={{
              fontSize: "20px",
              letterSpacing: "2px",
              mt: { xs: 5, md: 0 },
              textAlign: { xs: "center", md: "inherit" }
            }}
          >
            RICKLE FOR THE PEOPLE
          </Typography>
          <Grid m={3}>
            <Typography
              sx={{
                fontSize: "38px",
                lineHeight: "45px",
                letterSpacing: "1.4px",
                textAlign: { xs: "center", md: "inherit" }
              }}
            >
              Cryptocurrency for the common person.
            </Typography>
          </Grid>
        </Grid>
        <Grid item md={4} display={{ xs: "none", md: "block" }}>
          <img
            src={MultipleRickle}
            alt=""
            style={{ width: "100%", height: "auto" }}
          />
        </Grid>
      </Grid>
      <Grid container>
        <img src={WhiteCurve} alt="" width={"100%"} />
      </Grid>
    </React.Fragment>
  );
}
