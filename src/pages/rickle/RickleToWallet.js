import React from "react";

import { ArrowForwardIos } from "@mui/icons-material";
import { Grid, Paper, Typography } from "@mui/material";

import Gradient from "./../../assets/gradient.png";
import PropTypes from "prop-types";

export default function RickleToWallet({ addIconToWallet }) {
  const [addError, setError] = React.useState(false);
  return (
    <Grid
      container
      sx={{ backgroundImage: `url(${Gradient})`, backgroundSize: "cover" }}
      flexDirection="column"
      justifyContent="center"
      py={2}
    >
      <Typography
        textAlign={"center"}
        sx={{ color: "white", fontSize: "30px", letterSpacing: "1.2px" }}
      >
        Add Rickle to Your Wallet...
      </Typography>
      <Grid container gap={2.5} justifyContent="center" py={2}>
        <Grid item md={3} xs={7} gap={1}>
          <Paper
            onClick={addIconToWallet.bind(this, "bsc")}
            elevation={0}
            sx={{
              borderRadius: "20px",
              py: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <Typography
              variant="subtitle2"
              textAlign={"center"}
              sx={{
                color: "#E2130D",
                letterSpacing: "2px",
              }}
            >
              ON BSC
            </Typography>
            <ArrowForwardIos
              sx={{ fontSize: "13px", pb: 0.3, ml: 1, color: "#E2130D" }}
            />
          </Paper>
        </Grid>
        <Grid item md={3} xs={7}>
          <Paper
            elevation={0}
            onClick={addIconToWallet.bind(this, "xdai")}
            sx={{
              borderRadius: "20px",
              py: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <Typography
              variant="subtitle2"
              textAlign={"center"}
              sx={{
                color: "#E2130D",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                letterSpacing: "2px",
              }}
            >
              ON XDAI
            </Typography>
            <ArrowForwardIos
              sx={{ fontSize: "13px", pb: 0.3, ml: 1, color: "#E2130D" }}
            />
          </Paper>
        </Grid>
        <Grid item md={3} xs={7}>
          <Paper
            elevation={0}
            onClick={() => addIconToWallet.bind(this, "matic") }
            sx={{
              borderRadius: "20px",
              py: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <Typography
              variant="subtitle2"
              textAlign={"center"}
              sx={{ color: "#E2130D", letterSpacing: "2px" }}
            >
              ON POLYGON
            </Typography>
            <ArrowForwardIos
              sx={{ fontSize: "13px", pb: 0.3, ml: 1, color: "#E2130D" }}
            />
          </Paper>
        </Grid>
        {!addError ? null : <Typography
          textAlign={"center"}
          sx={{ color: "white", fontSize: "30px", letterSpacing: "1.2px" }}
        >
          {addError}
        </Typography>}
      </Grid>
    </Grid>
  );
}

RickleToWallet.propTypes = {
  addIconToWallet: PropTypes.func,
};
