import React from "react";

import { Button, Grid, Paper, TextField, Typography } from "@mui/material";

import GradientImage from "./../../assets/gradient_image.png";
import RickleBalloon from "./../../assets/rickle_balloon.png";

export default function ReceiveAirdrops() {
  return (
    <Grid
      container
      sx={{
        backgroundImage: `url(${GradientImage})`,
        backgroundSize: "cover",
      }}
      justifyContent="center"
      py={15}
    >
      <Grid display={"flex"} flexDirection="column" alignItems={"center"}>
        <img src={RickleBalloon} alt="" width={"165px"} />
        <Grid my={4}>
          <Typography
            textAlign={"center"}
            sx={{ fontSize: "38px", color: "white", lineHeight: "45px" }}
          >
            Enter Your Wallet Address
          </Typography>
          <Typography
            textAlign={"center"}
            sx={{ fontSize: "38px", color: "white", lineHeight: "45px" }}
          >
            to Receive Random Airdrops!
          </Typography>
        </Grid>
        <Typography
          textAlign={"center"}
          sx={{ fontSize: "20px", color: "white", fontWeight: "600" }}
        >
          WE’LL PERIODICALLY SEND FREE TOKENS TO YOUR WALLET!
        </Typography>
        <Paper
          elevation={0}
          sx={{
            width: "50%",
            background: "rgba(255, 255, 255, 0.73)",
            p: 5,
            mt: 6,
          }}
        >
          <form style={{ display: "flex", flexDirection: "column" }}>
            <TextField
              required
              sx={{
                background: "white",
                fontSize: "16px",
              }}
              placeholder="Enter Wallet Address"
              variant="outlined"
            />
            <Button
              type="submit"
              sx={{
                mt: 7,
                borderRadius: "25px",
                background:
                  "linear-gradient(90deg, #851910 0%, #FB261E 52.53%, #E87465 100%)",
              }}
              variant="contained"
              disableElevation
            >
              Send
            </Button>
          </form>
        </Paper>
      </Grid>
    </Grid>
  );
}
