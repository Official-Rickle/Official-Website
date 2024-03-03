import React from "react";

import { ArrowForwardIos } from "@mui/icons-material";
import { Button, Container, Grid, Typography } from "@mui/material";

import MultipleRickle from "./../../assets/multiple_rickle.png";
import WhiteCurve from "./../../assets/white_black_curve.png";

export default function RickleForPeople() {
  return (
    <>
      <Container>
        <Grid container>
          <Grid
            item
            md={9}
            display="flex"
            flexDirection={"column"}
            justifyContent="center"
          >
            <Typography
              className="gradient-text"
              sx={{
                fontSize: "28px",
                letterSpacing: "2px",
                mt: { xs: 5, md: 0 },
                textAlign: { xs: "center", md: "inherit" },
              }}
            >
              RICKLE FOR THE PEOPLE
            </Typography>
            <Grid my={3}>
              <Typography
                sx={{
                  fontSize: "38px",
                  lineHeight: "45px",
                  letterSpacing: "1.4px",
                  textAlign: { xs: "center", md: "inherit" },
                }}
              >
                Cryptocurrency for the
              </Typography>
              <Typography
                sx={{
                  fontSize: "38px",
                  lineHeight: "45px",
                  letterSpacing: "1.4px",
                  textAlign: { xs: "center", md: "inherit" },
                }}
              >
                common person.
              </Typography>
            </Grid>
            <Typography
              //   px={{ xs: 3, md: 0 }}
              pl={{ xs: 3, md: 0 }}
              pr={{ xs: 3, md: 30 }}
              textAlign={{ xs: "justify", md: "inherit" }}
            >
              At Rickle, we believe that everyday people should have access to
              the same tools as the wealthy and the tech savvy. Our goal is to
              make blockchain as simple and accessible as possible. We will show
              you the exact steps to get you started in crypto and acquire
              Rickle. If you have any questions or need guidance, join our
              community and we’ll walk you through the process.
            </Typography>
            <Grid
              container
              gap={2}
              my={4}
              justifyContent={{ xs: "center", md: "start" }}
            >
              <Button
                sx={{
                  background:
                    "linear-gradient(90deg, #851910 0%, #FB261E 52.53%, #E87465 100%)",
                  borderRadius: "20px",
                  py: 1.3,
                  fontWeight: "400",
                  opacity: "0.5",
                }}
                href="https://www.rickletoken.com/#exchanges"
                target="_blank"
                variant="contained"
              >
                <Typography sx={{ fontSize: "14px", letterSpacing: "2.1px" }}>
                  TRADE RICKLE NOW
                </Typography>
                <ArrowForwardIos sx={{ fontSize: "15px", pb: 0.3, ml: 1.2 }} />
              </Button>
              <Button
                sx={{
                  borderRadius: "20px",
                  borderColor: "black",
                  color: "black",
                  fontSize: "14px",
                  fontWeight: "400",
                  letterSpacing: "2.1px",
                }}
                href="../Rickle-Whitepaper.pdf"
                target="_blank"
                variant="outlined"
              >
                READ THE WHITEPAPER
              </Button>
            </Grid>
          </Grid>
          <Grid item md={3} display={{ xs: "none", md: "block" }}>
            <img
              src={MultipleRickle}
              alt=""
              style={{ width: "100%", height: "auto" }}
            />
          </Grid>
        </Grid>
      </Container>
      <Grid container>
        <img src={WhiteCurve} alt="" width={"100%"} />
      </Grid>
    </>
  );
}
