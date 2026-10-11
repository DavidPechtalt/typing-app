import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Typing App" },
    { name: "description", content: "Typing app" },
  ];
}

export default function Home() {
  return <Welcome />;
}
