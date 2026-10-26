"use client"

import dynamic from "next/dynamic"

const Game = dynamic(() => import("./Game"), {
  ssr: false,
  loading: () => <div className="boot">Loading world…</div>,
})

export default function Loader() {
  return <Game />
}
