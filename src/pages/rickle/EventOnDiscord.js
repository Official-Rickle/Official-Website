import React from "react";

import { Grid, Link, Paper, Typography } from "@mui/material";

import Gradient from "./../../assets/gradient.png";
import { ArrowForwardIos } from "@mui/icons-material";

export default function EventOnDiscord() {
  return (
    <>
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
          Meet the Team on Discord...
        </Typography>
        <Grid container gap={2.5} justifyContent="center" py={2}>
          <Grid item md={3} xs={9} sm={7} gap={1}>
            <Paper
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
              <Link
                href="https://discord.gg/rickletoken"
                underline="none"
                target="_blank"
                sx={{ display: "flex", alignItems: "center" }}
              >
                <Typography
                  variant="subtitle2"
                  textAlign={"center"}
                  sx={{
                    color: "#E2130D",
                    letterSpacing: "2px",
                  }}
                >
                  @dreamingrainbow#7732
                </Typography>
                <ArrowForwardIos
                  sx={{ fontSize: "13px", pb: 0.3, ml: 1, color: "#E2130D" }}
                />
              </Link>
            </Paper>
          </Grid>
          <Grid item md={3} xs={9} sm={7}>
            <Paper
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
              <Link
                href="https://discord.gg/rickletoken"
                underline="none"
                target="_blank"
                sx={{ display: "flex", alignItems: "center" }}
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
                  @jjkali#5121
                </Typography>
                <ArrowForwardIos
                  sx={{ fontSize: "13px", pb: 0.3, ml: 1, color: "#E2130D" }}
                />
              </Link>
            </Paper>
          </Grid>
          <Grid item md={3} xs={9} sm={7}>
            <Paper
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
              <Link
                href="https://discord.gg/rickletoken"
                underline="none"
                target="_blank"
                sx={{ display: "flex", alignItems: "center" }}
              >
                <Typography
                  variant="subtitle2"
                  textAlign={"center"}
                  sx={{ color: "#E2130D", letterSpacing: "2px" }}
                >
                  @Melkanea#5234
                </Typography>
                <ArrowForwardIos
                  sx={{ fontSize: "13px", pb: 0.3, ml: 1, color: "#E2130D" }}
                />
              </Link>
            </Paper>
          </Grid>
        </Grid>
      </Grid>
      <Grid
        container
        sx={{ backgroundColor: "#000000", py: 10 }}
        justifyContent="center"
      >
        <Grid
          mx={1}
          display={"flex"}
          flexDirection="column"
          sx={{ border: "1px solid white", p: 5, borderRadius: "19px" }}
        >
          <Typography
            sx={{
              color: "white",
              fontSize: "20px",
              fontWeight: "600",
              letterSpacing: "1px",
            }}
          >
            WEEKLY EVENTS ON DISCORD
          </Typography>
          <Grid mt={5}>
            <Typography
              sx={{
                color: "#EE8072",
                fontSize: "17px",
                fontWeight: "400",
                lineHeight: "20px",
              }}
            >
              TRIVIA MONDAY
            </Typography>
            <Typography
              sx={{
                color: "white",
                fontSize: "17px",
                fontWeight: "400",
                lineHeight: "20px",
              }}
            >
              Join us for Trivia on Discord. Correct answers = Rickle in your
              pocket!
            </Typography>
          </Grid>

          <Grid my={3}>
            <Typography
              sx={{
                color: "#C426A2",
                fontSize: "17px",
                fontWeight: "400",
                lineHeight: "20px",
              }}
            >
              EVENT COMING SOON
            </Typography>
            <Typography
              sx={{
                color: "white",
                fontSize: "17px",
                fontWeight: "400",
                lineHeight: "20px",
              }}
            >
              To be announced.
            </Typography>
          </Grid>
          <Grid>
            <Typography
              sx={{
                color: "#AC005F",
                fontSize: "17px",
                fontWeight: "400",
                lineHeight: "20px",
              }}
            >
              EVENT COMING SOON
            </Typography>
            <Typography
              sx={{
                color: "white",
                fontSize: "17px",
                fontWeight: "400",
                lineHeight: "20px",
              }}
            >
              To be announced.
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
