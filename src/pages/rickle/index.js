import React from "react";
import EventOnDiscord from "./EventOnDiscord";
import IntroduceRickle from "./IntroduceRickle";
import ReceiveAirdrops from "./ReceiveAirdrops";
import RickleFooter from "./RickleFooter";
import RickleForPeople from "./RickleForPeople";
import RickleSpecial from "./RickleSpecial";
import TeamCommunity from "./TeamCommunity";

export default function RickleMainPage() {
  return (
    <React.Fragment>
      <RickleSpecial />
      <RickleForPeople />
      <IntroduceRickle />
      <TeamCommunity />
      <EventOnDiscord />
      {/*<ReceiveAirdrops />*/}
      <RickleFooter />
    </React.Fragment>
  );
}
