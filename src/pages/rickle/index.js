import React from "react";
import EventOnDiscord from "./EventOnDiscord";
import IntroduceRickle from "./IntroduceRickle";
import ReceiveAirdrops from "./ReceiveAirdrops";
import RickleFooter from "./RickleFooter";
import RickleForPeople from "./RickleForPeople";
import RickleSpacial from "./RickleSpacial";
import TeamCommunity from "./TeamCommunity";

export default function RickleMainPage() {
  return (
    <>
      <RickleSpacial />
      <RickleForPeople />
      <IntroduceRickle />
      <TeamCommunity />
      <EventOnDiscord />
      <ReceiveAirdrops />
      <RickleFooter />
    </>
  );
}
